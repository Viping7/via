import { ModelMessage } from "ai";
import { getDetectionPrompt } from "./detection-prompt";
import { ProjectType } from "./project-type";
import { getAiJsonObject } from "./sdk";
import { moduleSchema } from "../../schema";
import { FRAMEWORK_LABEL_MAP } from "../constants";


export const detectBlocks = async (fileMeta: object, projectType: ProjectType) => {
    console.log(`Using project type for detection: ${FRAMEWORK_LABEL_MAP[projectType]}`);

    const prompt = getDetectionPrompt(projectType);

    const messages: ModelMessage[] = [
        {
            role: 'system',
            content: prompt,
        },
        {
            role: 'user',
            content: JSON.stringify(fileMeta),
        },
    ];
    const result = await getAiJsonObject(messages, moduleSchema);
    return result.output;
}