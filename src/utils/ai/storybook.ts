import { getAiJsonObject } from "./sdk";
import { ModelMessage } from "../../types";
import { z } from "zod";

const storybookSchema = z.object({
    content: z.string().describe("The full content of the Storybook file (.stories.tsx)"),
});

export const generateStorybookContent = async (componentName: string, componentContent: string): Promise<string> => {
    const prompt = `
You are a senior frontend engineer. Your task is to generate a comprehensive Storybook file (.stories.tsx) for the following React component.

Component Name: ${componentName}
Component Content:
${componentContent}

Requirements:
1. Use Storybook 7+ (CSF 3.0) syntax.
2. Include a default export with title and component.
3. Generate multiple stories showing different states/props (e.g., Default, Primary, Variant, etc.).
4. Use TypeScript types.
5. If the component uses Tailwind CSS, ensure the stories reflect that.
6. Return ONLY the code for the storybook file.

Output Format:
{
  "content": "... code content ..."
}
`;

    const messages: ModelMessage[] = [
        {
            role: 'system',
            content: 'You are an expert React and Storybook developer.',
        },
        {
            role: 'user',
            content: prompt,
        },
    ];

    const result = await getAiJsonObject(messages, storybookSchema);
    // result is from streamText which returns a StepResult with an output property
    // We need to wait for the object result. If using streamText with output: Output.object
    // we should use the object result.
    const finalResult = await result.output;
    return finalResult.content;
};
