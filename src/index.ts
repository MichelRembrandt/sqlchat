import 'dotenv/config';
import { input } from '@inquirer/prompts';
import { getKnowledgeTable } from './db/knowledge_db.js';
import { seedKnowledgeTable } from './utils/seed_knowledge_db.js';
import { runAgent } from './agent/agent.js';

async function main() {
  console.log('🤖 Data Chat CLI initialized. Type "exit" or "q" to quit.\n');
  seedKnowledgeTable();
  const knowledgeTable = getKnowledgeTable();

  while (true) {
    // 1. Get user input
    const userPrompt = await input({ message: 'Chat >' });
    if (userPrompt.toLowerCase() === 'exit' || userPrompt.toLowerCase() === 'q') {
      console.log('Goodbye!');
      break;
    }

    if (!userPrompt.trim()) continue;

    try {
      console.log('\nThinking...');
      const responseText = await runAgent(userPrompt, knowledgeTable);

      if (responseText && responseText.trim()) {
        console.log(`\n🤖 ${responseText.trim()}\n`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\n❌ Error: ${message}\n`);
    }
  }
}

main();