import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { diff } from "json-diff";

interface DiffEntry {
  path: string;
  type: "added" | "removed" | "changed";
  oldValue?: unknown;
  newValue?: unknown;
}

function flattenDiff(
  obj: unknown,
  basePath: string = ""
): DiffEntry[] {
  const entries: DiffEntry[] = [];

  if (obj === undefined || obj === null) {
    return entries;
  }

  if (typeof obj !== "object") {
    return entries;
  }

  const record = obj as Record<string, unknown>;

  for (const key of Object.keys(record)) {
    const value = record[key];

    if (key.endsWith("__added")) {
      const cleanKey = key.replace(/__added$/, "");
      const path = basePath ? `${basePath}.${cleanKey}` : cleanKey;
      entries.push({ path, type: "added", newValue: value });
    } else if (key.endsWith("__deleted")) {
      const cleanKey = key.replace(/__deleted$/, "");
      const path = basePath ? `${basePath}.${cleanKey}` : cleanKey;
      entries.push({ path, type: "removed", oldValue: value });
    } else if (
      typeof value === "object" &&
      value !== null &&
      "__old" in (value as Record<string, unknown>) &&
      "__new" in (value as Record<string, unknown>)
    ) {
      const path = basePath ? `${basePath}.${key}` : key;
      const typedValue = value as { __old: unknown; __new: unknown };
      entries.push({
        path,
        type: "changed",
        oldValue: typedValue.__old,
        newValue: typedValue.__new,
      });
    } else if (Array.isArray(value)) {
      const path = basePath ? `${basePath}.${key}` : key;
      for (let i = 0; i < value.length; i++) {
        const item = value[i] as unknown;
        if (Array.isArray(item) && item.length === 2) {
          const marker = item[0] as string;
          if (marker === "+") {
            entries.push({
              path: `${path}[${i}]`,
              type: "added",
              newValue: item[1],
            });
          } else if (marker === "-") {
            entries.push({
              path: `${path}[${i}]`,
              type: "removed",
              oldValue: item[1],
            });
          } else if (marker === "~") {
            entries.push(...flattenDiff(item[1], `${path}[${i}]`));
          }
        }
      }
    } else if (typeof value === "object" && value !== null) {
      const path = basePath ? `${basePath}.${key}` : key;
      entries.push(...flattenDiff(value, path));
    }
  }

  return entries;
}

export function registerJsonDiff(server: McpServer): void {
  server.tool(
    "json_diff",
    "Compare two JSON objects and show additions, removals, and changes with their paths.",
    {
      original: z
        .string()
        .describe("The original JSON object (as a JSON string)"),
      modified: z
        .string()
        .describe("The modified JSON object (as a JSON string)"),
    },
    async ({ original, modified }) => {
      try {
        const obj1 = JSON.parse(original);
        const obj2 = JSON.parse(modified);

        const rawDiff = diff(obj1, obj2);

        if (!rawDiff) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  { identical: true, differences: [] },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const differences = flattenDiff(rawDiff);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  identical: differences.length === 0,
                  differences,
                },
                null,
                2
              ),
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
              text: `Error comparing JSON: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
