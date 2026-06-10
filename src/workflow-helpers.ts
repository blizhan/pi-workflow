import { realpath, stat } from "node:fs/promises";
import { isAbsolute, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { WorkflowValidationError } from "./types.js";

export interface WorkflowHelperContext {
  specPath: string;
  originalSpecPath?: string;
  workflowRoot?: string;
  stageId?: string;
  taskId?: string;
  runId?: string;
  cwd: string;
}

export interface WorkflowHelperInput {
  sources: Record<string, unknown>;
  options?: Record<string, unknown>;
  context: WorkflowHelperContext;
}

export type WorkflowHelper = (input: WorkflowHelperInput) => unknown | Promise<unknown>;

export interface ResolvedWorkflowHelper {
  ref: string;
  path: string;
}

export async function resolveWorkflowHelperRef(ref: string, specPath: string): Promise<ResolvedWorkflowHelper> {
  const issues = validateHelperRef(ref);
  if (issues.length > 0) throw new WorkflowValidationError(issues);

  const specDirectory = await realpath(resolve(specPath, ".."));
  const candidate = resolve(specDirectory, ref);
  const candidateRealpath = await realpath(candidate).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new WorkflowValidationError([{ path: ref, message: "helper file not found" }]);
    }
    throw error;
  });

  if (!isPathInside(candidateRealpath, specDirectory)) {
    throw new WorkflowValidationError([{ path: ref, message: "helper path must stay inside the workflow directory" }]);
  }
  if (!candidateRealpath.endsWith(".mjs")) {
    throw new WorkflowValidationError([{ path: ref, message: "helper must be a relative .mjs file" }]);
  }
  if (!(await stat(candidateRealpath)).isFile()) {
    throw new WorkflowValidationError([{ path: ref, message: "helper must be a file" }]);
  }

  return { ref, path: candidateRealpath };
}

export async function loadWorkflowHelper(ref: string, specPath: string): Promise<WorkflowHelper> {
  const resolved = await resolveWorkflowHelperRef(ref, specPath);
  const imported = await import(pathToFileURL(resolved.path).href);
  if (typeof imported.default !== "function") {
    throw new WorkflowValidationError([{ path: ref, message: "helper must default-export a function" }]);
  }
  return imported.default as WorkflowHelper;
}

function validateHelperRef(ref: string): Array<{ path: string; message: string }> {
  const issues: Array<{ path: string; message: string }> = [];
  if (typeof ref !== "string" || ref.trim() === "") {
    return [{ path: "$helper", message: "helper must be a non-empty string" }];
  }
  if (!ref.startsWith("./")) {
    issues.push({ path: ref, message: "helper must be a directory-local relative path starting with ./" });
  }
  if (isAbsolute(ref) || ref.startsWith("~/") || ref.includes("://") || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(ref)) {
    issues.push({ path: ref, message: "helper must not be absolute, home-relative, or protocol-based" });
  }
  if (ref.split(/[\\/]+/).includes("..")) {
    issues.push({ path: ref, message: "helper must not contain parent-directory segments" });
  }
  if (!ref.endsWith(".mjs")) {
    issues.push({ path: ref, message: "helper must be a relative .mjs file" });
  }
  return issues;
}

function isPathInside(child: string, parent: string): boolean {
  const normalizedParent = parent.endsWith(sep) ? parent : `${parent}${sep}`;
  return child === parent || child.startsWith(normalizedParent);
}
