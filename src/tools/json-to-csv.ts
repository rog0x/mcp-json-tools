import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

function escapeCell(value: string, delimiter: string): string {
  if (
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function registerJsonToCsv(server: McpServer): void {
  server.tool(
    "json_to_csv",
    "Convert a JSON array of objects to CSV text. Automatically extracts headers from object keys.",
    {
      data: z
        .string()
        .describe("The JSON array to convert (as a JSON string)"),
      delimiter: z
        .string()
        .optional()
        .describe("Column delimiter character (default: ',')"),
      includeHeaders: z
        .boolean()
        .optional()
        .describe("Whether to include a header row (default: true)"),
    },
    async ({ data, delimiter, includeHeaders }) => {
      try {
        const parsed = JSON.parse(data);

        if (!Array.isArray(parsed)) {
          throw new Error("Input must be a JSON array");
        }

        if (parsed.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "",
              },
            ],
          };
        }

        const delim = delimiter || ",";
        const withHeaders = includeHeaders !== false;

        const headerSet = new Set<string>();
        for (const row of parsed) {
          if (typeof row === "object" && row !== null && !Array.isArray(row)) {
            for (const key of Object.keys(row as Record<string, unknown>)) {
              headerSet.add(key);
            }
          }
        }
        const headers = Array.from(headerSet);

        const lines: string[] = [];

        if (withHeaders) {
          lines.push(
            headers.map((h) => escapeCell(h, delim)).join(delim)
          );
        }

        for (const row of parsed) {
          if (typeof row === "object" && row !== null && !Array.isArray(row)) {
            const record = row as Record<string, unknown>;
            const cells = headers.map((h) =>
              escapeCell(toCsvValue(record[h]), delim)
            );
            lines.push(cells.join(delim));
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: lines.join("\n"),
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
              text: `Error converting JSON to CSV: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
