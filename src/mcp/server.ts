import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import z from 'zod';
import { getKnowledgeTable } from '../db/knowledge_db.js';
import { db } from '../db/app_db.js';

export function buildServer() {
    const server = new McpServer({
        name: 'sqlchatcli',
        version: '1.0.0'
    });

    server.registerTool(
        'knowledge_table',
        {
            title: 'Database knowledge table',
            description: 'Describes the database schema: every table and column, its data type, and the meaning and relations of the columns. '
                + 'ALWAYS call this tool before calling any other tool of this MCP server, so that generated SQL uses existing tables and columns and interprets them correctly.'
        },
        async () => ({
            content: [{ type: 'text', text: getKnowledgeTable() }]
        })
    );

    server.registerTool(
            'run_query',
            {
                title: 'Run query against the database',
                description: 'Run the specified query against the database and retrieve the query result. Must be a valid, executable SQL query. ONLY raw SQL with no markdown backticks, no markdown formatting, and no extra prose.',
                inputSchema: {
                    query: z.string()
                }
            },
            async ({ query }) => {
                const queryResult = db.prepare(query).all();
                return {
                    content: [{ type: 'text', text: JSON.stringify(queryResult, null, 2) }]
                };
            }
        );

    return server;
}
