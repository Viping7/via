import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import chalk from 'chalk';
import { getViaDataDir, getViaDataPath } from '../utils/paths';
import { getAvailableModels } from '../utils/ai/models';

export interface Config {
    provider: 'openai' | 'google' | 'anthropic' | 'ollama';
    model: string;
    apiKey?: string;
    baseUrl?: string;
}

const defaultConfig: Config = {
    provider: 'openai',
    model: 'gpt-4o-mini',
};

export const getConfig = async (): Promise<Config> => {
    const configPath = getViaDataPath('config.json');
    if (!existsSync(configPath)) {
        return defaultConfig;
    }
    try {
        const content = await readFile(configPath, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        return defaultConfig;
    }
};

export const setConfig = async (config: Config) => {
    const configDir = getViaDataDir();
    if (!existsSync(configDir)) {
        await mkdir(configDir, { recursive: true });
    }
    const configPath = getViaDataPath('config.json');
    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
};

export const configure = async () => {
    const { select, input } = await import('@inquirer/prompts');
    const currentConfig = await getConfig();

    console.log(`\n${chalk.cyan.bold('--- VIA AI Configuration ---')}\n`);

    const provider = await select({
        message: 'Select your preferred AI Provider:',
        choices: [
            { name: 'OpenAI', value: 'openai' as const },
            { name: 'Google (Gemini)', value: 'google' as const },
            { name: 'Anthropic (Claude)', value: 'anthropic' as const },
            { name: 'Ollama (Local)', value: 'ollama' as const },
        ],
        default: currentConfig.provider,
    });

    let model: string;
    let baseUrl: string;

    if (provider === 'ollama') {
        model = await input({
            message: 'Enter your local Ollama model name (e.g., llama3, mistral):',
            default: currentConfig.provider === 'ollama' ? currentConfig.model : 'llama3',
        });
        baseUrl = await input({
            message: 'Enter your local Ollama base URL (e.g., http://localhost:11434):',
            default: currentConfig.provider === 'ollama' ? currentConfig.baseUrl : 'http://localhost:11434',
        });
    } else {
        const modelChoices = getAvailableModels(provider);

        model = await select({
            message: `Select ${provider} model:`,
            choices: modelChoices.map(m => ({ name: m, value: m })),
            default: modelChoices.includes(currentConfig.model) ? currentConfig.model : modelChoices?.[0],
        });
    }

    let apiKey = '';
    if (provider !== 'ollama') {
        apiKey = await input({
            message: `Enter API Key for ${provider} (leave empty to use Environment Variable):`,
            default: '',
        });
    }

    const newConfig: Config = { provider, model };
    if (apiKey) {
        newConfig.apiKey = apiKey;
    }

    if (baseUrl) {
        newConfig.baseUrl = baseUrl;
    }

    await setConfig(newConfig);
    console.log(`\n${chalk.green.bold('✓')} Configuration updated: ${chalk.cyan(provider)} - ${chalk.white(model)}\n`);
};
