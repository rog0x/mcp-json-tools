import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parse } from "csv-parse/sync";

export function registerCsvToJson(server: McpServer): void {
  server.tool(
    "csv_to_json",
    "Convert CSV text to a JSON array of objects. Supports custom delimiters, header row detection, and automatic type casting.",
    {
      csv: z.string().describe("The CSV text to convert"),
      hasHeaders: z
        .boolean()
        .optional()
        .describe(
          "Whether the first row contains column headers (default: true)"
        ),
      delimiter: z
        .string()
        .optional()
        .describe("Column delimiter character (default: ','"),
      castTypes: z
        .boolean()
        .optional()
        .describe(
          "Automatically cast numeric and boolean values from strings (default: false)"
        ),
    },
    async ({ csv, hasHeaders, delimiter, castTypes }) => {
      try {
        const useHeaders = hasHeaders !== false;
        const delim = delimiter || ",";
        const shouldCast = castTypes === true;

        const records = parse(csv, {
          columns: useHeaders ? true : undefined,
          delimiter: delim,
          trim: true,
          skip_empty_lines: true,
          cast: shouldCast
            ? (value: string) => {
                if (value === "") return value;
                if (value.toLowerCase() === "true") return true;
                if (value.toLowerCase() === "false") return false;
                const num = Number(value);
                if (!isNaN(num) && value.trim() !== "") return num;
                return value;
              }
            : undefined,
        }) as unknown[];

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(records, null, 2),
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
              text: `Error converting CSV to JSON: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
