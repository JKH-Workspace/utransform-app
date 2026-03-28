import { invoke } from "@tauri-apps/api/core";
import type { Template, TransformResult, HistoryEntry } from "./types";

export async function listTemplates(): Promise<Template[]> {
  return invoke("list_templates");
}

export async function getTemplate(id: string): Promise<Template> {
  return invoke("get_template", { id });
}

export async function createTemplate(
  name: string,
  description: string,
  jsonSchema: Record<string, unknown>
): Promise<Template> {
  return invoke("create_template", {
    name,
    description,
    json_schema: jsonSchema,
  });
}

export async function updateTemplate(
  id: string,
  name: string,
  description: string,
  jsonSchema: Record<string, unknown>
): Promise<Template> {
  return invoke("update_template", {
    id,
    name,
    description,
    json_schema: jsonSchema,
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  return invoke("delete_template", { id });
}

export async function runTransform(
  inputs: string[],
  templateIds: string[]
): Promise<TransformResult[]> {
  return invoke("run_transform", {
    inputs,
    template_ids: templateIds,
  });
}

export async function getClaudePath(): Promise<string> {
  return invoke("get_claude_path");
}

export async function setClaudePath(claudePath: string): Promise<void> {
  return invoke("set_claude_path", { claude_path: claudePath });
}

export async function detectClaudePaths(): Promise<string[]> {
  return invoke("detect_claude_paths");
}

export async function listHistory(): Promise<HistoryEntry[]> {
  return invoke("list_history");
}

export async function deleteHistory(id: string): Promise<void> {
  return invoke("delete_history", { id });
}

export async function clearHistory(): Promise<void> {
  return invoke("clear_history");
}
