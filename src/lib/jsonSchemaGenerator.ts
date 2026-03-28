import type { FieldDef, JsonSchema } from "./types";

export function fieldsToSchema(fields: FieldDef[]): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const field of fields) {
    properties[field.name] = fieldToSchema(field);
    if (field.required) {
      required.push(field.name);
    }
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function fieldToSchema(field: FieldDef): JsonSchema {
  switch (field.type) {
    case "object": {
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      for (const child of field.children ?? []) {
        properties[child.name] = fieldToSchema(child);
        if (child.required) {
          required.push(child.name);
        }
      }
      return {
        type: "object",
        properties,
        required,
        additionalProperties: false,
      };
    }
    case "array": {
      const items = field.items ? fieldToSchema(field.items) : {};
      return { type: "array", items };
    }
    default:
      return { type: field.type };
  }
}

export function schemaToFields(schema: JsonSchema): FieldDef[] {
  if (schema.type !== "object" || !schema.properties) return [];

  const required = schema.required ?? [];

  return Object.entries(schema.properties).map(([name, prop]) => {
    const s = prop as JsonSchema;
    const field: FieldDef = {
      name,
      type: (s.type as FieldDef["type"]) ?? "string",
      required: required.includes(name),
    };

    if (s.type === "object" && s.properties) {
      field.children = schemaToFields(s);
    }

    if (s.type === "array" && s.items) {
      const items = s.items as JsonSchema;
      field.items = {
        name: "item",
        type: (items.type as FieldDef["type"]) ?? "string",
        required: false,
      };
      if (items.type === "object" && items.properties) {
        field.items.children = schemaToFields(items);
      }
    }

    return field;
  });
}

export function validateSchema(schema: unknown): string | null {
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    return "JSON Schema는 객체여야 합니다";
  }

  const s = schema as Record<string, unknown>;

  if (s.type !== "object") {
    return "최상위 type은 \"object\"여야 합니다";
  }

  if (typeof s.properties !== "object" || s.properties === null) {
    return "properties가 필요합니다";
  }

  if (Object.keys(s.properties as object).length === 0) {
    return "최소 1개 이상의 필드가 필요합니다";
  }

  return null;
}
