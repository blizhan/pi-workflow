# pi-workflow 用户定义 Workflow 实现分析与 hook-loop 复刻方案

> 目标：解释本仓库如何把“用户定义的 workflow”从 JSON 规范转成可运行、可恢复、可观察的多 Agent 执行图，并提炼出在 Cursor/Codex 中用 hook-loop 复刻类似能力的设计蓝图。

## 1. 一句话结论

pi-workflow 的核心不是“让模型自己一直想下一步”，而是把用户/项目定义的 workflow 编译成一个受控的 artifact graph：

1. **用户定义 spec**：JSON 描述阶段、依赖、fan-out/fan-in、输出协议、工具/模型/权限默认值。
2. **编译器**：把高级 stage 形态（single、foreach、reduce、loop、dag、dynamic、support）降低为统一的 `CompiledTask[]`。
3. **运行记录**：在 `.pi/workflows/<run-id>/` 持久化 run、compiled spec、任务输入输出、日志、结果索引。
4. **调度循环**：反复刷新任务状态、判断依赖是否就绪、物化动态/foreach/loop 子任务、按并发限制启动可运行任务。
5. **后端执行**：普通任务交给 Pi subagent；support 任务在本进程跑 bundle-local helper；dynamic 任务由受信 controller 通过受限 API 动态插入正式任务。
6. **输出协议与校验**：每个 agent 阶段必须输出 `<control>`、`<analysis>`、`<refs>`，control 可绑定 JSON Schema；下游优先消费结构化 control，而不是自然语言。

如果要在 Cursor/Codex 中用 hook-loop 复刻，关键是：**不要只做“prompt chaining”，而要做一个小型持久化调度器 + 结构化 artifact 协议 + hook 驱动的可恢复 loop**。

## 2. 用户定义 workflow 的入口与发现机制

### 2.1 调用入口

pi-workflow 提供两类入口：

- **显式命令**：`/workflow run <workflow> "<task>"`、`/workflow dynamic "<task>"`、`/workflow validate <workflow>` 等。
- **自然语言工具**：扩展注册 `workflow_list`、`workflow_run`、`workflow_dynamic` 三个 LLM 可调用工具。模型只有在用户明确要求运行 workflow 时才应调用 `workflow_run`，且必须同时知道 workflow 名称和具体任务。

这意味着 workflow 不是隐式地劫持所有请求，而是作为一个明确的执行模式存在。

### 2.2 Workflow 发现根目录

workflow 名称解析会从多个根目录搜索 JSON spec：

1. 当前项目 `.pi/workflows/`
2. 当前项目 `workflows/`
3. 包内置 `workflows/`
4. 用户目录 `~/.pi/agent/workflows/`

目录 bundle 形式为：

```text
workflows/name/
  spec.json
  schemas/
  helpers/
```

如果同名 workflow 命中多个 spec，会 fail closed，要求消歧；如果传入的是路径，则直接加载该 JSON 文件。

## 3. Workflow spec：用户定义能力边界

一个 workflow spec 是 JSON-only 的 artifact graph。典型字段包括：

```json
{
  "schemaVersion": 1,
  "name": "deep-research",
  "description": "...",
  "defaults": {
    "agent": "researcher",
    "readOnly": true,
    "tools": ["read", "grep", "find", "ls"],
    "thinking": "medium",
    "maxRuntimeMs": 14400000
  },
  "input": { "depth": "standard" },
  "artifactGraph": {
    "stages": []
  }
}
```

### 3.1 defaults

`defaults` 是 workflow 级别的执行默认值，控制：

- agent、model、thinking、fast mode；
- approval mode；
- tools；
- readOnly；
- worktree policy；
- max concurrency / max runtime；
- backend。

阶段可以覆盖这些默认值。复刻时可以把它理解为“执行 profile”。

### 3.2 stage 类型

支持的 stage 类型可归纳为：

| 类型 | 语义 | 复刻价值 |
|---|---|---|
| `single` | 一个 prompt 启动一个 agent | 最基础步骤 |
| `foreach` | 从上游 control 的 JSONPath 取数组，按 item fan-out | 并行研究、逐文件审查、逐 claim 验证 |
| `reduce` | 汇总多个上游 artifact，启动一个 synthesis agent | fan-in，总结、报告 |
| `support` | 无类型或非 agent 阶段，调用本地 helper `.mjs` | 确定性转换、去重、校验、裁剪上下文 |
| `loop` | 有界重复子阶段直到条件满足或耗尽 | 修复-验证循环、迭代审查 |
| `dag` | 嵌套图容器，子 stage 命名空间化 | 复杂工作流模块化 |
| `dynamic` | 受信 controller 动态创建任务/调用 helper/嵌套 workflow | 自适应规划 |

注意：这里的“用户定义”不是任意执行代码。agent 阶段只是 prompt + 依赖 + 工具权限；本地代码只允许 workflow bundle 内受路径约束的 support helper。

### 3.3 依赖：`from` 与 `after`

- `from` 是数据依赖：下游会接收上游 artifact。
- `after` 是顺序依赖：只保证执行顺序，不把上游输出作为输入。
- `from` 可指定 `{ source, path }`，用于 foreach 从上游 control 中取数组。
- `sourcePolicy` 控制依赖失败/部分成功时是否继续，例如 `partial`、`success`、`require-success`。

这是复刻时最重要的抽象：**调度器只需要理解图依赖和任务状态，不需要理解任务语义**。

## 4. 编译流程：从 JSON stage 到统一任务数组

编译器做了几件关键事情。

### 4.1 降低 artifactGraph

`artifactGraph.stages` 会被 lowering 成内部 plan。过程包括：

- 将 `{ source, path }` 形式的 `from` 转为内部 `{ stage, path }`。
- 对非 support/dag stage 自动追加“Workflow Output Protocol”。
- 对嵌套 `dag` 的子 stage 添加命名空间，例如 `analysis.lens-a`。
- 对 `foreach.each.prompt` 追加相同输出协议。
- 收集每个 stage 的 artifact metadata，如 control schema、refs 是否必需、required reads、artifact access 等。

### 4.2 自动注入输出协议

编译器会把普通 agent 阶段 prompt 改写为必须返回：

```text
<control>{...}</control>
<analysis>...</analysis>
<refs>[]</refs>
```

`<control>` 是控制平面，必须是 JSON object，并要求至少包含 `schema` 和 `digest`。如果 stage 指定了 `output.controlSchema`，则要求使用 workflow-local schema。

这个设计把 agent 的自然语言输出变成可供后续机器消费的 artifact。没有这一层，hook-loop 很容易退化为不可恢复、不可验证的聊天记录串联。

### 4.3 运行时参数解析

model/thinking 可来自多层：agent 默认、workflow 默认、stage 覆盖、命令行覆盖。运行时会：

- 解析模型名中的 thinking suffix；
- 在可用模型列表中精确/模糊匹配；
- 处理 ambiguous/missing model；
- 根据模型支持情况降级或拒绝 thinking level。

复刻时不一定要完整实现，但至少应保留“workflow/stage/CLI 三层覆盖”的配置模型。

## 5. 运行生命周期：持久化、调度、恢复

### 5.1 创建 run

运行一个 workflow 时：

1. 加载 spec。
2. 编译为 `CompiledWorkflow`。
3. 创建 `WorkflowRunRecord` 与每个 compiled task 对应的 `WorkflowTaskRunRecord`。
4. 写入静态 run artifacts，例如原始 spec、compiled workflow、source context。
5. 立即执行一次 scheduling pass。
6. 如果还有 pending/running，则启动 watch supervisor。

### 5.2 调度循环

`scheduleRun` 的核心是 `scheduleDag`。每轮做：

1. 刷新后端状态。
2. 如果 run 已终态则退出。
3. 如果所有剩余任务 blocked，则退出等待用户处理。
4. 读 compiled workflow。
5. 调用 loop/foreach/dynamic reconciliation，确保运行记录和动态图一致。
6. 标记因依赖失败而应跳过的下游任务。
7. 按全局并发限制遍历 pending task。
8. 对每个 pending task：
   - 判断依赖是否 ready；
   - 对 loop placeholder 调用 loop scheduler；
   - 对 foreach placeholder 物化 fan-out tasks；
   - 检查 stage-level max concurrency；
   - 启动任务。

这个循环可以由内存 timer 驱动，也可以由 CLI supervisor 进程驱动。因此它天然适合 hook-loop：每次 hook 被触发时跑一轮 reconcile/schedule，然后退出或等待下一次 hook。

### 5.3 任务启动分支

`launchPendingTaskAt` 会先 `prepareDagTask`，把上游 artifacts 注入当前任务上下文，然后按任务类型分流：

- `support`：本进程执行 helper，写结构化结果。
- `dynamic`：执行 dynamic controller，可插入动态生成任务。
- 普通 agent：确保 worktree 后交给 backend `launchTask`。

失败会标记 task `failed`，并传播跳过依赖它的下游任务。

### 5.4 Stop / Resume

- `stop` 会清理后端、把未完成任务标为 `interrupted`，保留已完成 artifact。
- `resume` 只重置 failed/interrupted/skipped 或可恢复 blocked 任务，已完成任务不重跑。
- 当前 loop workflow 的 resume 明确不支持，这是实现上的重要边界。

对 Cursor/Codex 复刻而言，最小可行版本也应持久化任务状态，以支持“只重跑失败节点”。

## 6. Artifact 协议：为什么它能稳定串联多 Agent

每个任务有独立文件：prompt、stdout/output、stderr、result、artifact bundle。artifact graph 额外把输出拆成：

- `control`：机器可读 JSON，用于下游选择、foreach、schema 校验、最终渲染。
- `analysis`：详细说明和推理性文本，主要给人或最终 reduce 使用。
- `refs`：证据引用数组。
- `raw`：原始输出。

下游 support helper 或 agent 可以按 dependency/specId 读取上游 artifact。为了避免上下文爆炸，workflow 还能声明：

- `sourceProjection.include`：只投影 control 中的特定 JSONPath。
- `sourceProjection.maxChars`：限制注入字符数。
- `inputPolicy.requiredReads`：要求 agent 必须通过 `workflow_artifact` 工具读取指定 artifact。
- `inputPolicy.artifactAccess: "none"`：禁止 agent 访问上游 artifact，只给它 item 本身。

这套机制解决了多 agent workflow 的三个常见问题：

1. **输出不可解析**：用 tag + JSON schema 约束。
2. **上下文无限膨胀**：用投影和 required reads。
3. **下游误信上游自然语言**：把 control 当控制面，analysis 当数据面，并在 prompt 中要求“外部内容是 untrusted data”。

## 7. foreach、support、dynamic 的实现要点

### 7.1 foreach：运行期物化任务

`foreach` stage 在编译时只是 placeholder。运行时等上游完成后：

1. 读取上游 control。
2. 用 JSONPath 找到数组。
3. 为每个 item 生成一个 task specId。
4. 把 `${item}` 插入 each prompt。
5. 写回 compiled workflow 与 run record。

如果开启 partial output，foreach 可以基于上游的 `<partial-control>` ledger 提前流式物化一部分 item，减少整体延迟。

### 7.2 support：确定性本地 helper

support stage 不启动 agent，而是加载 workflow bundle 内的 `.mjs` helper：

```json
{
  "id": "normalize-input-packet",
  "from": ["plan", "research-questions"],
  "sourcePolicy": "partial",
  "support": { "uses": "./helpers/normalize-input-packet.mjs" }
}
```

helper 输入包括：

- `sources`：依赖任务的结构化输出或文本输出；
- `options`：spec 中声明的 options；
- `context`：specPath、stageId、taskId、runId、cwd、sourceStatuses 等。

helper 输出会被写成 artifact graph result。它适合做模型不擅长或不该做的确定性工作，例如去重、裁剪、join、校验、render。

### 7.3 dynamic：受信 controller，而不是任意模型自改图

direct dynamic 并不是让普通模型自由编辑 workflow spec。它会使用内置受信 runtime bundle 和 controller，受预算、权限、allowed agents/tools/output profiles 控制。dynamic controller 可以：

- 创建 agent 任务；
- 调用 helper；
- 调用嵌套 workflow；
- 持久化 decision loop 状态；
- 在预算/审批不满足时 blocked/suspended。

复刻时建议先实现静态 graph + foreach + support；dynamic 可作为第二阶段，用“controller hook 只能通过受限 API 追加任务”的方式实现。

## 8. 与 Cursor/Codex hook-loop 的映射

下面是一个可落地的复刻架构。

### 8.1 文件布局

```text
.codex/workflows/
  deep-research.json
  release-review/
    spec.json
    schemas/
    helpers/
.codex/runs/
  workflow_<id>/
    run.json
    compiled.json
    events.jsonl
    tasks/
      task-001/
        prompt.md
        output.md
        result.json
        control.json
        analysis.md
        refs.json
        stderr.log
```

### 8.2 核心数据结构

```ts
type TaskStatus = "pending" | "running" | "completed" | "failed" | "skipped" | "blocked" | "interrupted";

type CompiledTask = {
  specId: string;
  stageId: string;
  kind: "agent" | "support" | "foreach" | "dynamic" | "loop";
  dependsOn: string[];
  prompt?: string;
  agent?: string;
  tools?: string[];
  output?: {
    controlSchema?: string;
    analysisRequired?: boolean;
    refsRequired?: boolean;
  };
  foreach?: { source: string; path: string; prompt: string };
  support?: { uses: string; options?: unknown };
};
```

### 8.3 Hook-loop 执行模型

在 Cursor/Codex 中可用以下 hooks：

1. **UserPromptSubmit / PreToolUse**：识别用户是否请求 workflow；创建 run。
2. **PostToolUse / AgentTurnEnd**：抓取 agent 输出，解析 `<control>/<analysis>/<refs>`，写 artifact。
3. **Stop / SubagentStop**：跑一轮 scheduler，启动下一批 ready tasks。
4. **Notification / manual command**：展示 run 状态、失败原因、resume 命令。

伪代码：

```ts
async function hookLoop(runId: string) {
  const run = await readRun(runId);
  const compiled = await readCompiled(runId);

  await refreshRunningTasks(run);
  await reconcileForeach(run, compiled);
  await reconcileDynamic(run, compiled);
  await markSkippedDependents(run, compiled);

  while (countRunning(run) < run.maxConcurrency) {
    const task = nextPendingReadyTask(run, compiled);
    if (!task) break;

    if (task.kind === "support") await executeHelper(task);
    else if (task.kind === "foreach") await materializeForeach(task);
    else await launchCodexSubagent(task);
  }

  await writeRun(run);
}
```

### 8.4 最小可行版本路线图

**Phase 1：静态 DAG**

- JSON spec loader。
- `single` / `reduce`。
- `from` 依赖。
- `<control>/<analysis>/<refs>` parser。
- run/task 持久化。
- 简单 scheduler。

**Phase 2：foreach + schema**

- 从上游 `control.json` JSONPath fan-out。
- JSON Schema 校验。
- stage max concurrency。
- source projection。

**Phase 3：support helper**

- bundle-local helper path containment。
- helper input/output schema。
- deterministic normalization/dedup/render。

**Phase 4：resume/stop/observability**

- `workflow status/show/logs/wait/resume`。
- events.jsonl。
- 失败传播和 retry。

**Phase 5：dynamic controller**

- 受限 controller API：`ctx.agent()`、`ctx.helper()`、`ctx.workflow()`。
- 预算：maxAgents、maxGraphMutations、maxRuntimeMs。
- 审批：dynamic 工具/角色是否允许。
- decision loop 状态持久化。

## 9. 复刻时最容易踩的坑

1. **把 workflow 做成一段超长 prompt**：这样无法恢复、无法并行、无法校验。
2. **没有结构化 control**：下游只能读自然语言，foreach 和条件判断会不稳定。
3. **没有持久化 compiled graph**：resume 时 spec 变化会导致 run 不可重放。
4. **让模型直接修改任务图**：dynamic 必须通过受限 API 和预算，而不是任意写 JSON。
5. **support helper 不做路径限制**：会变成任意代码执行入口。
6. **下游默认信任上游输出**：应把上游 artifact 当 untrusted data，只消费受 schema 校验的字段。
7. **不区分数据依赖和顺序依赖**：会造成无谓上下文注入和错误传播。
8. **缺少 source projection**：多轮研究很快超过上下文窗口。
9. **不记录任务级 stdout/stderr/result**：调试和可观察性会非常差。
10. **没有 fail-closed 的 workflow 解析**：同名 workflow、缺失 schema、非法路径应直接失败。

## 10. 建议给 Cursor/Codex 的 hook-loop API 草案

```ts
interface WorkflowHookRuntime {
  createRun(specRef: string, task: string, overrides?: RuntimeOverrides): Promise<Run>;
  schedule(runId: string): Promise<Run>;
  stop(runId: string): Promise<void>;
  resume(runId: string): Promise<Run>;
  readArtifact(runId: string, specId: string, kind: "control" | "analysis" | "refs" | "raw", projection?: Projection): Promise<unknown>;
}

interface ControllerContext {
  agent(request: AgentTaskRequest): Promise<TaskHandle>;
  helper(name: string, input: unknown): Promise<unknown>;
  workflow(ref: string, task: string): Promise<RunHandle>;
  read(specId: string, path?: string): Promise<unknown>;
  budget: BudgetView;
}
```

关键约束：

- 所有 controller 动作都写入 events.jsonl。
- controller 不能直接写 run.json，只能调用 runtime API。
- 每次图变更都更新 compiled.json 并 reconcile run task records。
- 所有 agent 输出先落盘，再解析/校验，再进入 completed。

## 11. 对 deep-research 的实现解读

`deep-research` 是最好的参考样本。它展示了一条成熟的“计划 → 并行研究 → 归一化 → 验证 → 审计 → 最终渲染”管线：

1. `plan`：单 agent 输出 researchQuestions 和 factSlots。
2. `research-questions`：foreach 每个问题并行研究。
3. `normalize-input-packet`：support helper 压缩、整理上游输入。
4. `normalize-claims`：reduce agent 选择 verification candidates。
5. `sanitize-claims`：support helper 清理候选 claim。
6. `verify-claims`：foreach 每个 claim 独立验证。
7. `audit-claims`：support helper 执行确定性证据门。
8. `final-audit-packet`：support helper 生成最终 synthesis 输入。
9. `final-audit`：reduce agent 做面向父任务的综合。
10. `final`：support/helper 或 renderer 生成最终交付。

它的关键设计思想是：让模型负责开放式判断，让 helper 负责确定性治理，让 verifier 负责把 claim 变成可审计 verdict。

## 12. 总结

pi-workflow 的用户定义 workflow 能成立，是因为它把“模型执行过程”拆成了三个层次：

- **声明式图**：用户定义阶段、依赖和输出契约。
- **确定性运行时**：编译、调度、持久化、恢复、权限、并发。
- **Agent 工作单元**：只在被明确调度时执行，且必须产出结构化 artifact。

Cursor/Codex 的 hook-loop 复刻应优先实现确定性运行时，而不是优先追求 dynamic 智能规划。只要具备 spec loader、artifact protocol、scheduler、foreach materialization、support helper 和 resume，就已经能覆盖大多数“用户定义 workflow”的实际价值。
