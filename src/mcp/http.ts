import 'dotenv/config';
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { buildServer } from './server.js';
import { seedKnowledgeTable } from '../utils/seed_knowledge_db.js';

const app = express();
app.use(express.json());

app.post("/sqlchat", async (req, res) => {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({});
    res.on("close", () => {
        transport.close();
        server.close();
    });
    await server.connect(transport as Transport);
    await transport.handleRequest(req, res, req.body);
});

const port = Number(process.env.PORT ?? 3000);
seedKnowledgeTable();
app.listen(port, "127.0.0.1", () =>
    console.error(`MCP listening on http://127.0.0.1:${port}/sqlchat`)
);