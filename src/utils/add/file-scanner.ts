import * as path from "path";
import { readdir, readFile, stat } from "fs/promises";
import { FileStructure } from "../../types";
import { IGNORE_LIST } from "../constants";
import { statSync } from "fs";

const ENTRY_FILE_REGEX = /\.(module|routes|router|stack|construct)\.(ts|js|tsx|jsx)$/;

export const getAllFileAndFolders = async (dir = '', projectRoot = process.cwd()): Promise<FileStructure[]> => {
    const currentDir = path.join(projectRoot, dir);
    const allFiles = (await readdir(currentDir))
        .filter((file) => !IGNORE_LIST.includes(file));

    const folderStructurePromise = allFiles.flatMap(async file => {
        const filePath = path.join(currentDir, file);
        const relativePath = path.join(dir, file);
        const stats = await stat(filePath);

        if (!stats.isDirectory()) {
            const fileContent = await readFile(filePath, 'utf-8');
            return {
                fileName: file,
                path: relativePath,
                isDirectory: false,
                content: fileContent,
            }
        } else {
            const subFolders = await getAllFileAndFolders(relativePath, projectRoot);
            return [{
                fileName: file,
                path: relativePath,
                isDirectory: true
            }, ...subFolders]
        }
    })
    return Promise.all(folderStructurePromise) as Promise<FileStructure[]>;
}


export const readFiles = async (dirPath: string, modulesToProcess: {
    moduleName: string,
    entryFile: string | string[],
    manual: boolean
}[] = []) => {
    const files = await readdir(dirPath);

    for (const entry of files) {
        if (IGNORE_LIST.includes(entry)) continue;
        const entryPath = path.join(dirPath, entry);
        const relativeEntryPath = path.relative(process.cwd(), entryPath);
        const stats = statSync(entryPath);
        if (stats.isDirectory()) {
            const subFiles = await readdir(entryPath);
            const entryFile = subFiles.find(f => ENTRY_FILE_REGEX.test(f)
            );

            modulesToProcess.push({
                moduleName: entry,
                entryFile: entryFile ? path.join(relativeEntryPath, entryFile) : subFiles.map(f => path.join(relativeEntryPath, f)),
                manual: true
            });
        } else {
            modulesToProcess.push({
                moduleName: entry,
                entryFile: relativeEntryPath,
                manual: true
            });
        }
    }
    return modulesToProcess;
}