export interface FieldDef {
  name: string;
  type: "string" | "number" | "integer" | "boolean" | "array" | "object" | "null";
  required: boolean;
  children?: FieldDef[];
  items?: FieldDef;
}

export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: JsonSchema | Record<string, never>;
  [key: string]: unknown;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  example_output?: Record<string, unknown>;
  json_schema?: JsonSchema;
  created_at: string;
  updated_at: string;
}

export interface TransformResult {
  template_id: string;
  template_name: string;
  output: unknown;
  success: boolean;
  error?: string;
  duration_ms: number;
}

export interface HistoryEntry {
  id: string;
  inputs: string[];
  results: TransformResult[];
  created_at: string;
}

export type Page = "transform" | "templates" | "history" | "settings";
