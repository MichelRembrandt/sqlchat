import { tool } from 'ai';
import { sanitizeInput } from '../utils/index.js';
import z from 'zod';
import { confirm } from '@inquirer/prompts';
import { db } from '../db/app_db.js';


interface QuerySuccess {
  status: 'success';
  rowCount: number;
  rows: unknown[];
}
interface QueryError {
  status: 'error';
  error: string;
}
interface QueryCanceled {
  status: 'canceled';
  message: string;
}
type QueryResult = QuerySuccess | QueryError | QueryCanceled;

export const generateSqlExecutionTool = tool({
  description: 'Generate and execute a SQLite SQL query based on user question and database schema.',
  inputSchema: z.object({
    sql: z.string().describe('The SQLite SQL query to execute.'),
  }),
  execute: async ({ sql }: { sql: string }): Promise<QueryResult> => {
    const sanitized = sanitizeInput(sql);
    return await runSql(sanitized);
  },
});

async function runSql(sql: string | null): Promise<QueryResult> {
  console.log('sql', sql);
  if (!sql || !sql.trim()) {
    console.error('\n❌ Execution Error: No valid SQL query was provided by the model.\n');
    return { status: 'error', error: 'No valid SQL query string provided.' };
  }

  console.log(`\nProposed SQL Query:\n\x1b[36m${sql}\x1b[0m\n`);

  const shouldRun = await confirm({
    message: 'Do you want to execute this query against your database?',
    default: true,
  });

  if (!shouldRun) {
    console.log('Query execution canceled by user.\n');
    return { status: 'canceled', message: 'Query execution was canceled by the user.' };
  }

  console.log('Executing query...');
  try {
    const queryResult = db.prepare(sql).all();
    if (queryResult.length > 0) {
      console.table(queryResult);
    } else {
      console.log('(no rows returned)');
    }
    return { status: 'success', rowCount: queryResult.length, rows: queryResult };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Execution Error: ${message}\n`);
    return { status: 'error', error: message };
  }
}