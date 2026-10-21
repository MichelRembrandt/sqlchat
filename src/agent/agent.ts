import { generateText, isStepCount } from 'ai';
import { getLanguageModel } from './aiclient.js';
import { SYSTEM_PROMPT } from './prompt_buider.js';
import { generateSqlExecutionTool } from './agent_tool_generateSql.js';

export async function runAgent(userPrompt: string, knowledgeTable: string): Promise<string> {
  const model = getLanguageModel();

  const response = await generateText({
    model,
    system: SYSTEM_PROMPT(knowledgeTable),
    prompt: userPrompt,
    tools: {
      generateSql: generateSqlExecutionTool,
    },
    stopWhen: isStepCount(5),
    providerOptions: {
      openai: {
        parallelToolCalls: false,
      },
    },
  });

  return response.text;
}