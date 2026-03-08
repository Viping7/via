import * as path from "path";
import { mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { getAllFileAndFolders, readFiles } from "../utils/add/file-scanner";
import { processModules } from "../utils/add/module-processor";
import { chain } from "lodash";
import { getViaDataPath } from "../utils/paths";
import { getFileNamesAndFolders } from "../utils/add/meta";
import { detectBlocks } from "../utils/ai/blocks";
import { detectProjectType, ProjectType } from "../utils/ai/project-type";
import { FRAMEWORK_LABEL_MAP } from "../utils/constants";
import { showStatusLoader } from "../utils/branding";
import { configure } from "./config";
import chalk from "chalk";

export const learn = async (targetPath?: string) => {
    let loader;
    try {
        const modulesDir = getViaDataPath('modules');

        if (!existsSync(modulesDir)) {
            await mkdir(modulesDir, { recursive: true });
        }

        let mapping = {};
        const mappingPath = getViaDataPath('mapping.json');
        if (existsSync(mappingPath)) {
            const mappingFile = await readFile(mappingPath, 'utf-8');
            mapping = JSON.parse(mappingFile);
        }

        const folderStructure = await getAllFileAndFolders();
        const flattenedFiles = chain(folderStructure).flattenDeep().orderBy([item => !item.isDirectory, "name"],
            ["asc", "asc"]).value();

        let modulesToProcess = [];

        if (targetPath) {
            // Manual mode: scan the provided path
            const absoluteTargetPath = path.resolve(process.cwd(), targetPath);
            if (!existsSync(absoluteTargetPath)) {
                console.error(`Error: Path ${targetPath} does not exist.`);
                return;
            }
            modulesToProcess = await readFiles(absoluteTargetPath);
            if (modulesToProcess.length === 0) {
                console.log("No modules found in the specified path.");
                return;
            }
        } else {
            // Automatic mode: detect blocks
            const configPath = getViaDataPath('config.json');
            if (!existsSync(configPath)) {
                console.log(chalk.yellow("\nAI configuration not found. Let's set it up first...\n"));
                await configure();

                // Re-verify after configuration attempt
                if (!existsSync(configPath)) {
                    console.log(chalk.red("\nAI configuration is required for auto-detection. Operation cancelled.\n"));
                    return;
                }
            }

            const { confirm, select } = await import("@inquirer/prompts");
            let projectType = detectProjectType();

            if (projectType !== "generic") {
                const label = (FRAMEWORK_LABEL_MAP as any)[projectType] || projectType;
                const confirmType = await confirm({
                    message: `Detected ${chalk.cyan.bold(label)} project. Proceed?`,
                    default: true
                });

                if (!confirmType) {
                    projectType = "generic"; // Reset to allow manual selection
                }
            }

            if (projectType === "generic") {
                projectType = await select({
                    message: 'Select project type:',
                    choices: Object.entries(FRAMEWORK_LABEL_MAP).map(([value, name]) => ({
                        name,
                        value
                    })),
                    default: 'generic'
                }) as ProjectType;
            }

            if (projectType === "next") {
                const extractionType = await select({
                    message: "What do you want to extract from this Next.js project?",
                    choices: [
                        { name: "Front-end (UI, Components, Hooks)", value: "next-frontend" },
                        { name: "Back-end (API Routes, Server Actions)", value: "next-backend" },
                        { name: "Both (Full Module)", value: "next" }
                    ],
                    default: "next"
                });
                projectType = extractionType as ProjectType;
            }

            const foldersWithFiles = getFileNamesAndFolders(flattenedFiles);
            loader = showStatusLoader();
            const blocks = await detectBlocks(foldersWithFiles, projectType);
            loader.stop();

            if (blocks.modules.length === 0) {
                console.log("No modules detected.");
                return;
            }
            modulesToProcess = blocks.modules.filter(module => module.confidence === "high" || module.confidence === "medium");
        }

        // Process modules (selection, renaming, extraction, saving)
        await processModules(modulesToProcess, flattenedFiles, mapping, modulesDir, mappingPath);

    } catch (e) {
        loader?.stop();
        console.error("Error during learning:", e);
    }
}
