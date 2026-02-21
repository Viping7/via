import { ModelMessage } from "ai";
import { detectionPrompt } from "./detection-prompt";
import { getAiJsonObject } from "./sdk";
import { moduleSchema } from "../../schema";


export const detectBlocks = async (fileMeta: object) => {
    const messages: ModelMessage[] = [
        {
            role: 'system',
            content: detectionPrompt,
        },
        {
            role: 'user',
            content: JSON.stringify(fileMeta),
        },
    ];

    const result = await getAiJsonObject(messages, moduleSchema);
    return result.output;
}