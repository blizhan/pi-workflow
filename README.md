# pi-workflow

**Workflow orchestration for Pi subagents.**

`pi-workflow` turns multi-subagent work into explicit workflows that Pi can run, inspect, and adapt.

Start with built-in workflows for verified research and evidence-backed review. Other workflow shapes are deferred until stronger task-fit evidence exists.

## Try this first

After installation, ask Pi naturally:

```text
Deep research this repo and summarize the architecture tradeoffs.
```

```text
Review the current diff from multiple angles.
```

```text
Deep review this change and challenge any findings before the final report.
```

## Installation

```bash
pi install npm:pi-workflow
```

## How workflows work

A workflow is a sequence of stages. Users can ask for workflows in natural language; each workflow is backed by a definition file that describes the stage graph.

Stage order controls scheduling, but a plain later `task` does **not** automatically receive prior outputs. Workflow definitions must explicitly pass prior results through `foreach.from` or `reduce.from`.

![Workflow stage types](./docs/assets/readme-stage-types.png)

| Stage | Use it for | Runtime shape |
|---|---|---|
| `task` | One focused step | one prompt -> one subagent |
| `parallel` | Static fan-out | fixed task list -> multiple subagents, bounded concurrency |
| `foreach` | Dynamic fan-out | read an array from prior JSON output -> one subagent task per item |
| `reduce` | Fan-in / synthesis | selected prior stage context -> one subagent |
| `transform` | Deterministic local post-processing | selected prior structured outputs -> directory-local `.mjs` helper -> structured output |

`reduce` is not an automatic merge function. In the diagrams, **Supervisor** means the workflow runtime that gathers prior subagent outputs and passes bounded source context into a reduce subagent. It is not a user-defined agent.

A minimal workflow definition looks like:

```json
{
  "schemaVersion": 1,
  "agent": "researcher",
  "readOnly": true,
  "tools": ["read", "grep", "find", "ls", "web_search", "fetch_content"],
  "workflow": {
    "stages": [
      {
        "id": "plan",
        "type": "task",
        "output": {
          "format": "json",
          "contract": { "requiredPaths": ["$.questions"] }
        },
        "prompt": "Plan the research questions."
      },
      {
        "id": "research",
        "type": "foreach",
        "from": { "stage": "plan", "path": "$.questions", "mode": "concat" },
        "maxConcurrency": 4,
        "each": { "prompt": "Research this question: ${item}" }
      },
      {
        "id": "summary",
        "type": "reduce",
        "from": ["plan", "research"],
        "prompt": "Use Source Stage Context to synthesize the answer."
      }
    ]
  }
}
```

## Built-in workflows

The package includes built-in workflow definitions in [`workflows/`](./workflows/). The concrete task is supplied at runtime. When the parent agent needs a deterministic starting point, `/workflow recommend "<request>"` scores workflow metadata and returns an explicit workflow name to validate/run.

| Workflow | Shape | Use when |
|---|---|---|
| `deep-research` | task -> foreach -> reduce -> foreach -> transform -> reduce | Source-backed research, claim verification, deterministic evidence gating, citations, or follow-up suggestions. |
| `deep-review` | task -> foreach -> foreach -> reduce | Panel-style review where findings should be challenged before final synthesis. |

Other workflow shapes such as migration planning, implementation batches, best-of-N fixes, revise loops, and decision debates are intentionally deferred until stronger task-fit evidence exists.

### `deep-research` at a glance

![Deep research workflow](./docs/assets/readme-deep-research.png)

```json
{
  "name": "deep-research",
  "workflow": {
    "stages": [
      { "id": "plan", "type": "task" },
      {
        "id": "research-questions",
        "type": "foreach",
        "from": { "stage": "plan", "path": "$.researchQuestions" }
      },
      {
        "id": "normalize-claims",
        "type": "reduce",
        "from": ["plan", "research-questions"]
      },
      {
        "id": "verify-claims",
        "type": "foreach",
        "from": { "stage": "normalize-claims", "path": "$.claimsForVerification" }
      },
      {
        "id": "audit-claims",
        "type": "transform",
        "from": "verify-claims",
        "helper": "./helpers/claim-evidence-gate.mjs"
      },
      {
        "id": "final",
        "type": "reduce",
        "from": ["plan", "research-questions", "normalize-claims", "audit-claims"]
      }
    ]
  }
}
```

The snippet above is intentionally abbreviated. Runnable workflow definitions also declare prompts, output contracts, source policies, tools, runtime limits, and continuation behavior.

> **Continuation status:** continuation is currently a documented/experimental workflow-level control-policy field, not a task/stage type. The parser preserves it in workflow definitions, but the compiler/runtime do not yet execute follow-up rounds automatically. Treat any `nextWorkflow`/continuation output as a parent-facing suggestion until bounded continuation support is implemented.

JSON outputs are validated with `output.contract` (for example `requiredPaths`, array bounds, and string length caps). To give models a shape hint without duplicating validation rules inline, use `output.template` for small one-off shapes or `output.templateRef` for reusable templates. `templateRef` supports internal refs such as `#/outputTemplates/final` and relative JSON files such as `./templates.json#/final` inside workflow bundles.

## Create or customize workflows with `workflow-guide`

`pi-workflow` includes a `workflow-guide` skill for creating custom workflow definitions.

Use it when you want to adapt a built-in workflow or create a project-specific workflow. The guide starts from existing workflows when possible, applies the stage-first rules, checks `foreach.from` / `reduce.from` data dependencies, handles tool ceilings and worktree policy, and validates the workflow definition before handoff.

Project workflow definitions should be saved under:

```text
.pi/workflows/<name>.json
```

Examples:

```text
Use workflow-guide to create a workflow for weekly release readiness.
It should inspect the repo, check docs/tests risk, and produce a final checklist.
```

```text
Use workflow-guide to customize deep-review for frontend accessibility and UX review.
Save it as .pi/workflows/frontend-review.json.
```

```text
Use workflow-guide to review this workflow definition and fix any invalid stage dependencies:
.pi/workflows/my-workflow.json
```

```text
Use workflow-guide to create a bounded implementation workflow for this repo.
Ask before dependency installs, long validation, or broad edits.
```

Then validate and run:

```text
/workflow validate .pi/workflows/frontend-review.json
/workflow run frontend-review "Review the current diff for accessibility and UX regressions."
```

The most important authoring rule: stage order only controls scheduling. It does not automatically pass prior output into later `task` stages. Use `foreach.from` for dynamic fan-out and `reduce.from` for source-context fan-in.

## Commands

User-facing command surface:

```text
/workflow                # open the workflow board
/workflow <run-id>       # open the board focused on a run
/workflow help
```

For read-only terminal inspection of an existing run, use the CLI instead of launching a workflow:

```bash
pi-workflow inspect workflow_mq224pi8_775e71
pi-workflow inspect workflow_mq224pi8_775e71 --failures
pi-workflow inspect workflow_mq224pi8_775e71 --results
pi-workflow inspect workflow_mq224pi8_775e71 --json
```

<details>
<summary>Agent-facing/internal commands</summary>

These commands remain available for orchestration, workflow authoring, and debugging:

```text
/workflow validate <workflow-name-or-path>
/workflow roles
/workflow agents
/workflow recommend "<request>"
/workflow list
/workflow show <workflow-name>
/workflow run <workflow-name-or-path> "<task>"
/workflow delegate ...
/workflow status
/workflow show <run-id>
/workflow view [run-id]
/workflow logs <run-id> [task-id] [lines]
/workflow continue <run-id>
/workflow wait <run-id> [timeout-ms]
```

</details>

## Safety notes

- `/workflow` is an orchestrator, not an OS sandbox.
- Agent-declared tools are the authority ceiling; workflow definitions can only narrow them.
- `readOnly: true` is enforced through tool filtering, not filesystem isolation.
- Review workflows should remain read-only unless a workflow explicitly documents managed-worktree mutation.
- Mutation-capable tasks should normally use managed worktrees in git repositories.
- In non-git workspaces, write-capable workflows with `worktreePolicy: "off"` mutate the live directory.
- No backend fallback exists: the resolved backend/strategy is fixed per run.

## Detailed docs

- [`docs/workflow-authoring.md`](./docs/workflow-authoring.md) — how to create/review stage-first workflow definitions; use this as the main authoring guide.
- [`docs/usage-reference.md`](./docs/usage-reference.md) — detailed command, schema, runtime, output, role, worktree, and safety reference.
- [`docs/ab-execution-test-strategy.md`](./docs/ab-execution-test-strategy.md) — local A/B validation method and prepared test inventory.
- [`docs/ab-execution-results.md`](./docs/ab-execution-results.md) — corrected workflow-vs-baseline A/B evaluation summary.
- [`workflows/README.md`](./workflows/README.md) — bundled workflow notes.
- [`docs/readme-image-plan.md`](./docs/readme-image-plan.md) — README diagram slots and copy guidance.
