import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import YAML from "yaml";

export function registerYamlJson(server: McpServer): void {
  server.tool(
    "yaml_to_json",
    "Convert YAML text to a JSON string.",
    {
      yamlText: z.string().describe("The YAML text to convert to JSON"),
      indent: z
        .number()
        .optional()
        .describe("JSON indentation spaces (default: 2)"),
    },
    async ({ yamlText, indent }) => {
      try {
        const parsed = YAML.parse(yamlText);
        const spaces = indent ?? 2;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(parsed, null, spaces),
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
              text: `Error converting YAML to JSON: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "json_to_yaml",
    "Convert a JSON string to YAML text.",
    {
      jsonText: z.string().describe("The JSON text to convert to YAML"),
      indent: z
        .number()
        .optional()
        .describe("YAML indentation spaces (default: 2)"),
    },
    async ({ jsonText, indent }) => {
      try {
        const parsed = JSON.parse(jsonText);
        const spaces = indent ?? 2;

        return {
          content: [
            {
              type: "text" as const,
              text: YAML.stringify(parsed, { indent: spaces }),
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
              text: `Error converting JSON to YAML: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
