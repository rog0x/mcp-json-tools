import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import Ajv, { ErrorObject } from "ajv";

interface ValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    keyword: string;
    params: Record<string, unknown>;
  }>;
}

function validateJsonAgainstSchema(
  data: unknown,
  schema: Record<string, unknown>
): ValidationResult {
  const ajv = new Ajv({ allErrors: true, verbose: true });
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = (validate.errors || []).map((err: ErrorObject) => ({
    path: err.instancePath || "/",
    message: err.message || "Unknown validation error",
    keyword: err.keyword,
    params: err.params as Record<string, unknown>,
  }));

  return { valid: false, errors };
}

export function registerJsonValidator(server: McpServer): void {
  server.tool(
    "json_validate",
    "Validate a JSON object against a JSON Schema. Returns whether the data is valid and a list of errors with their paths.",
    {
      data: z.string().describe("The JSON data to validate (as a JSON string)"),
      schema: z
        .string()
        .describe("The JSON Schema to validate against (as a JSON string)"),
    },
    async ({ data, schema }) => {
      try {
        const parsedData = JSON.parse(data);
        const parsedSchema = JSON.parse(schema);

        const result = validateJsonAgainstSchema(parsedData, parsedSchema);

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
              text: JSON.stringify(
                {
                  valid: false,
                  errors: [
                    {
                      path: "/",
                      message: `Parse error: ${message}`,
                      keyword: "parse",
                      params: {},
                    },
                  ],
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
