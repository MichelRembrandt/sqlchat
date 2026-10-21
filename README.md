# sqlchatcli

A command-line chat interface for querying a SQLite database in plain English. You ask a question, an AI agent generates SQL via a tool call with Zod schema validation, asks you to approve the query before execution, and reports the results as a table.

The same database is also exposed as an [MCP](https://modelcontextprotocol.io/) server over HTTP, so external MCP clients (Claude Code, Claude Desktop, IDE agents, …) can query it with their own model.

## How it works

1. You type a question at the `Chat >` prompt.
2. An AI agent powered by Vercel AI SDK (`ai`) is provided schema context from the `knowledge_table` ([knowledge_db.ts](src/db/knowledge_db.ts)).
3. The agent calls the `generateSql` tool (defined with Zod parameters) to propose a SQL query ([agent_tool_generateSql.ts](src/agent/agent_tool_generateSql.ts)).
4. The tool execution presents the proposed query and requests human-in-the-loop confirmation before running against local SQLite ([app_db.ts](src/db/app_db.ts)).
5. On approval, the query results are printed directly as a table and summarized by the agent.

The LLM backend is provider-agnostic via Vercel AI SDK: it connects to local OpenAI-compatible servers (Ollama, LM Studio) or Google Gemini API ([aiclient.ts](src/agent/aiclient.ts)).

The MCP server ([src/mcp/](src/mcp/)) does not use this LLM backend: the connecting MCP client brings its own model and calls the server's tools directly.

## Requirements

- Node.js 18+ (uses ES modules)
- An OpenAI-compatible LLM endpoint (CLI only; not needed for the MCP server):
  - a local model server such as [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.com/), or
  - a Gemini API key

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your values:

   ```bash
   cp .env.template .env
   ```

   | Variable | Description | Default |
   | --- | --- | --- |
   | `LLM_PROVIDER` | `local` (any OpenAI-compatible server) or `gemini` | `local` |
   | `LLM_API_KEY` | API key for your endpoint. For local servers any non-empty string works. | — |
   | `LLM_API_URL` | Base URL of the local OpenAI-compatible endpoint (ignored when `LLM_PROVIDER=gemini`) | `http://localhost:11434/v1` |
   | `LLM_MODEL` | Model name to request from the endpoint | — |
   | `GEMINI_API_KEY` | API key for Gemini (used when `LLM_PROVIDER=gemini`) | — |
   | `DB_NAME` | Name of the knowledge database; it is stored as `assets/<DB_NAME>_app.db`. Required. | — |
   | `PORT` | Port the MCP HTTP server listens on | `3000` |

3. Build and run the CLI from project root:

   ```bash
   npm run build
   npm run start
   ```

   During development you can use `npm run dev` instead, which runs the TypeScript sources directly via `tsx`.

## MCP server

Start the MCP server (Streamable HTTP transport):

```bash
npm run mcp
```

It listens on `http://127.0.0.1:<PORT>/sqlchat` (localhost only) and seeds the `knowledge_table` on startup if it is empty. The server is stateless: each POST request gets a fresh server and transport.

It exposes two tools:

| Tool | Input | Description |
| --- | --- | --- |
| `knowledge_table` | — | Returns the data dictionary: every table and column, its type, and its meaning. Clients should call this first so generated SQL matches the schema. |
| `run_query` | `query` (string) | Runs a raw SQL query against `assets/app.db` and returns the rows as JSON. |

To connect from Claude Code, for example:

```bash
claude mcp add --transport http sqlchat http://127.0.0.1:3000/sqlchat
```

## CLI usage

```
🤖 Data Chat CLI initialized. Type "exit" or "q" to quit.

Chat > which products are discontinued?

Thinking...

Proposed SQL Query:
"SELECT product_name FROM products WHERE discontinued_date <= date('now');"

? Do you want to execute this query against your database? (Y/n)

Executing query...

┌─────────┬────────────────────────────┐
│ (index) │        product_name        │
├─────────┼────────────────────────────┤
│    0    │  'Ceramic Coffee Mug'      │
└─────────┴────────────────────────────┘

🤖 The discontinued product in the warehouse database is the Ceramic Coffee Mug.
```

Type `exit` or `q` to quit.

## Database

The app reads and writes local SQLite files in `assets/`, which are gitignored — they're never committed, so each environment brings its own data.

1. **Data database.** [app_db.ts](src/db/app_db.ts) opens `assets/app.db` via `better-sqlite3`, creating and seeding the `products`/`stock_movements` tables if they are empty.
2. **Knowledge database.** [knowledge_db.ts](src/db/knowledge_db.ts) opens `assets/<DB_NAME>_app.db`, which holds the `knowledge_table` — a data dictionary describing the schema for the agent and MCP clients.
3. **Seed the knowledge table** ([seed_knowledge_db.ts](src/utils/seed_knowledge_db.ts)).

## Project structure

| File | Purpose |
| --- | --- |
| `src/index.ts` | CLI entry point and main chat loop |
| `src/agent/agent.ts` | AI agent definition |
| `src/agent/agent_tool_generateSql.ts` | `generateSql` tool using Zod schema, with human-in-the-loop confirmation |
| `src/agent/prompt_buider.ts` | System prompt construction |
| `src/agent/aiclient.ts` | Vercel AI SDK client factory supporting OpenAI-compatible servers & Google Gemini |
| `src/db/app_db.ts` | SQLite connection, data-table (products/stock_movements) schema and seeding |
| `src/db/knowledge_db.ts` | Knowledge-table schema and schema introspection for the LLM |
| `src/utils/seed_knowledge_db.ts` | Seeding script for the knowledge_table |
| `src/utils/index.ts` | Shared helpers (input sanitizing) |
| `src/mcp/server.ts` | MCP server definition with the `knowledge_table` and `run_query` tools |
| `src/mcp/http.ts` | Express app serving the MCP server over Streamable HTTP |

## Notes

- SQL queries proposed by the LLM are shown to you and require explicit confirmation before execution — always review a query before approving it, especially destructive statements (`UPDATE`, `DELETE`, `DROP`).
- The MCP `run_query` tool has **no** confirmation step on the server side and runs whatever SQL the client sends. Rely on your MCP client's tool-approval prompt, and keep the server bound to localhost.
- `*.db` files are gitignored; they hold your actual data and are never committed.
- `.env` is gitignored; never commit real API keys.

