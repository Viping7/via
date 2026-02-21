import { z } from "zod";

export const moduleSchema = z.object({
    modules: z.array(
        z.object({
            moduleName: z.string(),
            entryFile: z.string(),
            confidence: z.enum(["high", "medium", "low"]),
        })
    )
});

export type ModuleType = z.infer<typeof moduleSchema>;

