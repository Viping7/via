export const getAvailableModels = (provider: string) => {
    switch (provider) {
        case 'openai':
            return ['gpt-4o', 'gpt-4o-mini', 'gpt-5.2', 'gpt-5-mini', 'gpt-5-nano', 'gpt-5'];
        case 'google':
            return ['gemini-flash-latest', 'gemini-pro-latest'];
        case 'anthropic':
            return ['claude-haiku-4-5', 'claude-sonnet-4-5'];
        default:
            return [];
    }
}