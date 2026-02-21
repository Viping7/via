import * as path from "path";
import { mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import { getAllFileAndFolders, readFiles } from "../utils/add/file-scanner";
import { processModules } from "../utils/add/module-processor";
import { chain } from "lodash";
import { getViaDataPath } from "../utils/paths";
import { getFileNamesAndFolders } from "../utils/add/meta";
import { detectBlocks } from "../utils/ai/blocks";
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

            const foldersWithFiles = getFileNamesAndFolders(flattenedFiles);
            loader = showStatusLoader();
            const blocks = await detectBlocks(foldersWithFiles);
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
