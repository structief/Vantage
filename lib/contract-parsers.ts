/**
 * Parsers for contract and schema files displayed in the Contracts tab.
 * Best-effort extraction for UI visualisation; no full validation.
 */

import YAML from "yaml";

// ─── OpenAPI (contracts/api) ─────────────────────────────────────────────────

export interface OpenApiParameter {
  name: string;
  required: boolean;
  type: string;
  description?: string;
}

export interface OpenApiSchemaField {
  name: string;
  type: string;
  description?: string;
}

export interface OpenApiStatusCode {
  code: string;
  description: string;
}

export interface OpenApiEndpoint {
  method: string;
  path: string;
  summary?: string;
  description?: string;
  requestParameters: OpenApiParameter[];
  responseFields: OpenApiSchemaField[];
  statusCodes: OpenApiStatusCode[];
}

function schemaFieldsFromObject(obj: Record<string, unknown> | undefined): OpenApiSchemaField[] {
  if (!obj || typeof obj !== "object" || !("properties" in obj)) return [];
  const props = obj.properties as Record<string, unknown> | undefined;
  if (!props) return [];
  return Object.entries(props).map(([name, prop]) => {
    const p = prop as Record<string, unknown>;
    let type = "unknown";
    if (typeof p.type === "string") type = p.type;
    else if (Array.isArray(p.type)) type = (p.type as string[]).join(" | ");
    return { name, type, description: p.description as string | undefined };
  });
}

export function parseOpenApi(content: string, filename: string): OpenApiEndpoint[] | null {
  let doc: Record<string, unknown>;
  try {
    const parsed = content.trim().startsWith("{") ? JSON.parse(content) : YAML.parse(content);
    if (!parsed || typeof parsed !== "object") return null;
    doc = parsed;
  } catch {
    return null;
  }

  const paths = doc.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths || typeof paths !== "object") return [];

  const endpoints: OpenApiEndpoint[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    const methods = ["get", "post", "put", "patch", "delete"] as const;

    for (const method of methods) {
      const op = pathItem[method] as Record<string, unknown> | undefined;
      if (!op || typeof op !== "object") continue;

      const params: OpenApiParameter[] = [];
      const paramList = (op.parameters as unknown[]) ?? [];
      for (const p of paramList) {
        if (p && typeof p === "object" && "name" in p) {
          const pm = p as Record<string, unknown>;
          params.push({
            name: String(pm.name),
            required: pm.required === true,
            type: (pm.schema as Record<string, unknown>)?.type as string ?? "string",
            description: pm.description as string | undefined,
          });
        }
      }

      const requestBody = op.requestBody as Record<string, unknown> | undefined;
      if (requestBody?.content) {
        const jsonContent = (requestBody.content as Record<string, unknown>)?.["application/json"];
        const schema = (jsonContent as Record<string, unknown>)?.schema as Record<string, unknown> | undefined;
        if (schema?.properties) {
          const required = new Set((schema.required as string[]) ?? []);
          for (const [name, prop] of Object.entries(schema.properties as Record<string, unknown>)) {
            const p = prop as Record<string, unknown>;
            let type = "unknown";
            if (typeof p.type === "string") type = p.type;
            params.push({
              name,
              required: required.has(name),
              type,
              description: p.description as string | undefined,
            });
          }
        }
      }

      const statusCodes: OpenApiStatusCode[] = [];
      const responses = op.responses as Record<string, unknown> | undefined;
      if (responses) {
        for (const [code, resp] of Object.entries(responses)) {
          if (resp && typeof resp === "object" && "description" in resp) {
            statusCodes.push({
              code,
              description: (resp as Record<string, unknown>).description as string ?? "",
            });
          }
        }
      }

      let responseFields: OpenApiSchemaField[] = [];
      const okResp = responses?.["200"] as Record<string, unknown> | undefined;
      if (okResp?.content) {
        const jsonContent = (okResp.content as Record<string, unknown>)?.["application/json"];
        const schema = (jsonContent as Record<string, unknown>)?.schema as Record<string, unknown> | undefined;
        responseFields = schemaFieldsFromObject(schema);
      }

      endpoints.push({
        method: method.toUpperCase(),
        path,
        summary: op.summary as string | undefined,
        description: op.description as string | undefined,
        requestParameters: params,
        responseFields,
        statusCodes,
      });
    }
  }

  return endpoints;
}

// ─── JSON Schema (contracts/data) ───────────────────────────────────────────

export interface JsonSchemaProperty {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface JsonSchemaDefinition {
  name: string;
  title?: string;
  description?: string;
  properties: JsonSchemaProperty[];
}

export function parseJsonSchema(content: string, _filename: string): JsonSchemaDefinition[] | null {
  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(content);
  } catch {
    return null;
  }

  const definitions =
    (doc.definitions as Record<string, unknown>) ??
    (doc.$defs as Record<string, unknown>);

  if (!definitions || typeof definitions !== "object") return [];

  const result: JsonSchemaDefinition[] = [];

  for (const [name, def] of Object.entries(definitions)) {
    if (!def || typeof def !== "object") continue;

    const d = def as Record<string, unknown>;
    const props = d.properties as Record<string, unknown> | undefined;
    const required = new Set((d.required as string[]) ?? []);

    const properties: JsonSchemaProperty[] = props
      ? Object.entries(props).map(([propName, prop]) => {
          const p = prop as Record<string, unknown>;
          let type = "unknown";
          if (typeof p.type === "string") type = p.type;
          else if (Array.isArray(p.type)) type = (p.type as string[]).join(" | ");
          return {
            name: propName,
            type,
            required: required.has(propName),
            description: p.description as string | undefined,
          };
        })
      : [];

    result.push({
      name,
      title: d.title as string | undefined,
      description: d.description as string | undefined,
      properties,
    });
  }

  return result;
}

// ─── Prisma schema (data-model) ──────────────────────────────────────────────

export interface PrismaField {
  name: string;
  type: string;
  modifiers: string[];
}

export interface PrismaModel {
  name: string;
  fields: PrismaField[];
}

export function parsePrismaSchema(content: string, _filename: string): PrismaModel[] | null {
  const models: PrismaModel[] = [];
  const modelBlock =
    /model\s+(\w+)\s*\{([^}]*)\}/gs;

  let match: RegExpExecArray | null;
  while ((match = modelBlock.exec(content)) !== null) {
    const modelName = match[1];
    const body = match[2];

    const fields: PrismaField[] = [];
    const lines = body.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) continue;

      const fieldMatch = trimmed.match(/^(\w+)\s+([\w\[\]?.]+)(?:\s+([\s\S]*))?$/);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1];
      const fieldType = fieldMatch[2];
      const rest = (fieldMatch[3] ?? "").trim();
      const modifiers = rest
        .split(/\s+/)
        .filter((m) => m.startsWith("@") || m === "?");

      fields.push({ name: fieldName, type: fieldType, modifiers });
    }

    models.push({ name: modelName, fields });
  }

  return models;
}
