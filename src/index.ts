#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerJsonValidator } from "./tools/json-validator.js";
import { registerJsonDiff } from "./tools/json-diff.js";
import { registerJsonTransform } from "./tools/json-transform.js";
import { registerCsvToJson } from "./tools/csv-to-json.js";
import { registerJsonToCsv } from "./tools/json-to-csv.js";
import { registerYamlJson } from "./tools/yaml-json.js";

async function main(): Promise<void> {
  const server = new McpServer({
    name: "mcp-json-tools",
    version: "1.0.0",
  });

  registerJsonValidator(server);
  registerJsonDiff(server);
  registerJsonTransform(server);
  registerCsvToJson(server);
  registerJsonToCsv(server);
  registerYamlJson(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
