# sqlchatcli

A command-line chat interface for querying a SQLite database in plain English. You ask a question, an AI agent generates SQL via a tool call with Zod schema validation, asks you to approve the query before execution, and reports the results as a table.

## How it works

1. You type a question at the `Chat >` prompt.
2. An AI agent powered by Vercel AI SDK (`ai`) is provided schema context from the `knowledge_table` ([knowledge_db.js](knowledge_db.js)).
3. The agent calls the `generateSql` tool (defined with Zod parameters) to propose a SQL query ([prompt.js](prompt.js)).
4. The tool execution presents the proposed query and requests human-in-the-loop confirmation before running against local SQLite ([data_db.js](data_db.js)).
5. On approval, the query results are printed directly as a table and summarized by the agent.

The LLM backend is provider-agnostic via Vercel AI SDK: it connects to local OpenAI-compatible servers (Ollama, LM Studio) or Google Gemini API ([aiclient.js](aiclient.js)).

## Requirements

- Node.js 18+ (uses ES modules)
- An OpenAI-compatible LLM endpoint:
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

3. Run the CLI:

   ```bash
   node index.js
   ```

## Usage

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

The app reads and writes a local SQLite file (`app.db`), which is gitignored — it's never committed, so each environment brings its own data.

1. **Create/point at a SQLite database.** [data_db.js](data_db.js) opens `app.db` in the project root via `better-sqlite3`.
2. **Add a `knowledge_table`.** A data dictionary describing the schema for the agent ([knowledge_db.js](knowledge_db.js)).
3. **Seed your data tables** ([seed_knowledge_db.js](seed_knowledge_db.js)).

## Project structure

| File | Purpose |
| --- | --- |
| `index.js` | CLI entry point and main chat loop |
| `data_db.js` | SQLite connection, data-table (products/stock_movements) schema and seeding |
| `knowledge_db.js` | Knowledge-table schema, seeding, and schema introspection for the LLM |
| `seed_knowledge_db.js` | Seeding script for knowledge_table schema |
| `aiclient.js` | Vercel AI SDK client factory supporting OpenAI & Google Gemini |
| `prompt.js` | AI Agent definition and `generateSql` tool using Zod schema |

## Notes

- SQL queries proposed by the LLM are shown to you and require explicit confirmation before execution — always review a query before approving it, especially destructive statements (`UPDATE`, `DELETE`, `DROP`).
- `app.db` is gitignored; it holds your actual data and is never committed.
- `.env` is gitignored; never commit real API keys.

