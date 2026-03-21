
# mcp-json-tools

An MCP (Model Context Protocol) server that provides JSON and data manipulation tools for AI agents. Designed for use with Claude Code, Claude Desktop, and any MCP-compatible client.

## Tools

| Tool | Description |
|------|-------------|
| `json_validate` | Validate JSON data against a JSON Schema, returning detailed errors with paths |
| `json_diff` | Compare two JSON objects, showing additions, removals, and changes with paths |
| `json_transform` | Transform JSON with pick, rename, flatten, and unflatten operations |
| `csv_to_json` | Convert CSV text to a JSON array with configurable headers, delimiters, and type casting |
| `json_to_csv` | Convert a JSON array of objects to CSV text |
| `yaml_to_json` | Convert YAML text to JSON |
| `json_to_yaml` | Convert JSON text to YAML |

## Installation

```bash
npm install
npm run build
```

## Usage with Claude Code

```bash
claude mcp add json-tools -- node D:/products/mcp-servers/mcp-json-tools/dist/index.js
```

## Usage with Claude Desktop

Add the following to your Claude Desktop configuration file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "json-tools": {
      "command": "node",
      "args": ["D:/products/mcp-servers/mcp-json-tools/dist/index.js"]
    }
  }
}
```

## Tool Details

### json_validate

Validate JSON data against a JSON Schema. Returns a `valid` boolean and an array of errors, each with the field path, message, and schema keyword that failed.

**Parameters:**
- `data` (string) — JSON data to validate
- `schema` (string) — JSON Schema to validate against

### json_diff

Compare two JSON objects and produce a structured diff. Each difference includes the dot-notation path, the type of change (added, removed, or changed), and the old/new values.

**Parameters:**
- `original` (string) — Original JSON object
- `modified` (string) — Modified JSON object

### json_transform

Apply transformations to JSON data. Supports four operations:

- **pick** — Extract specific fields by dot-notation paths
- **rename** — Rename top-level keys using a mapping object
- **flatten** — Flatten nested objects into dot-separated keys
- **unflatten** — Restore dot-separated keys into nested objects

**Parameters:**
- `data` (string) — JSON data to transform
- `operation` (string) — One of: pick, rename, flatten, unflatten
- `fields` (string[]) — For pick: field paths to extract
- `mapping` (object) — For rename: old-to-new key mapping
- `separator` (string) — For flatten/unflatten: separator character (default: ".")

### csv_to_json

Parse CSV text into a JSON array of objects.

**Parameters:**
- `csv` (string) — CSV text to convert
- `hasHeaders` (boolean) — Whether the first row is headers (default: true)
- `delimiter` (string) — Column delimiter (default: ",")
- `castTypes` (boolean) — Auto-cast numbers and booleans (default: false)

### json_to_csv

Convert a JSON array of objects to CSV text. Headers are derived from the union of all object keys.

**Parameters:**
- `data` (string) — JSON array to convert
- `delimiter` (string) — Column delimiter (default: ",")
- `includeHeaders` (boolean) — Include header row (default: true)

### yaml_to_json / json_to_yaml

Convert between YAML and JSON formats.

**Parameters:**
- `yamlText` / `jsonText` (string) — Text to convert
- `indent` (number) — Indentation spaces (default: 2)

## License

MIT
