import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object" || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

function pickFields(
  data: unknown,
  fields: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const value = getNestedValue(data, field);
    if (value !== undefined) {
      result[field] = value;
    }
  }
  return result;
}

function renameFields(
  data: Record<string, unknown>,
  mapping: Readonly<Record<string, string>>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = mapping[key] || key;
    result[newKey] = value;
  }
  return result;
}

function flattenObject(
  obj: unknown,
  prefix: string = "",
  separator: string = "."
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (obj === null || obj === undefined || typeof obj !== "object") {
    return result;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const newKey = prefix ? `${prefix}${separator}${i}` : String(i);
      const val = obj[i];
      if (typeof val === "object" && val !== null) {
        Object.assign(result, flattenObject(val, newKey, separator));
      } else {
        result[newKey] = val;
      }
    }
    return result;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const newKey = prefix ? `${prefix}${separator}${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey, separator));
    } else if (Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey, separator));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

function unflattenObject(
  obj: Record<string, unknown>,
  separator: string = "."
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split(separator);
    setNestedValue(result, parts.join("."), value);
  }
  return result;
}

export function registerJsonTransform(server: McpServer): void {
  server.tool(
    "json_transform",
    "Apply transformations to a JSON object: pick specific fields, rename keys, flatten nested objects, or unflatten dot-notation keys.",
    {
      data: z.string().describe("The JSON data to transform (as a JSON string)"),
      operation: z
        .enum(["pick", "rename", "flatten", "unflatten"])
        .describe("The transformation operation to apply"),
      fields: z
        .array(z.string())
        .optional()
        .describe(
          "For 'pick': array of field paths to extract (supports dot notation like 'user.name')"
        ),
      mapping: z
        .record(z.string(), z.string())
        .optional()
        .describe(
          "For 'rename': object mapping old key names to new key names"
        ),
      separator: z
        .string()
        .optional()
        .describe(
          "For 'flatten'/'unflatten': separator character (default: '.')"
        ),
    },
    async ({ data, operation, fields, mapping, separator }) => {
      try {
        const parsed = JSON.parse(data);
        let result: unknown;
        const sep = separator || ".";

        switch (operation) {
          case "pick": {
            if (!fields || fields.length === 0) {
              throw new Error(
                "The 'fields' parameter is required for the 'pick' operation"
              );
            }
            if (Array.isArray(parsed)) {
              result = parsed.map((item: unknown) => pickFields(item, fields));
            } else {
              result = pickFields(parsed, fields);
            }
            break;
          }
          case "rename": {
            if (!mapping || Object.keys(mapping).length === 0) {
              throw new Error(
                "The 'mapping' parameter is required for the 'rename' operation"
              );
            }
            if (Array.isArray(parsed)) {
              result = parsed.map((item: unknown) =>
                renameFields(item as Record<string, unknown>, mapping)
              );
            } else {
              result = renameFields(
                parsed as Record<string, unknown>,
                mapping
              );
            }
            break;
          }
          case "flatten": {
            if (Array.isArray(parsed)) {
              result = parsed.map((item: unknown) =>
                flattenObject(item, "", sep)
              );
            } else {
              result = flattenObject(parsed, "", sep);
            }
            break;
          }
          case "unflatten": {
            if (Array.isArray(parsed)) {
              result = parsed.map((item: unknown) =>
                unflattenObject(item as Record<string, unknown>, sep)
              );
            } else {
              result = unflattenObject(
                parsed as Record<string, unknown>,
                sep
              );
            }
            break;
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error transforming JSON: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
