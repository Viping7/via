import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, Output, ModelMessage } from 'ai';
import { z } from 'zod';
import { getConfig } from '../../commands/config';
import { ModuleType } from '../../schema';

const getModel = async () => {
    const config = await getConfig();
    const apiKey = config.apiKey || process.env[`${config.provider.toUpperCase()}_API_KEY`];

    switch (config.provider) {
        case 'google':
            return createGoogleGenerativeAI({ apiKey })(config.model);
        case 'anthropic':
            return createAnthropic({ apiKey })(config.model);
        case 'ollama':
            return createOpenAI({
                baseURL: config.baseUrl,
                apiKey: "ollama",
            })(config.model);
        case 'openai':
        default:
            return createOpenAI({ apiKey })(config.model);
    }
};


export const getAiJsonObject = async (messages: ModelMessage[], schema: z.ZodType<ModuleType>) => {
    const model = await getModel();
    return streamText({
        model,
        output: Output.object({ schema }),
        messages,
    });
}