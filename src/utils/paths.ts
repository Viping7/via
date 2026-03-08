import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';

export const getViaDataDir = () => {
    return join(homedir(), '.via');
};

export const getViaDataPath = (filename: string) => {
    return join(getViaDataDir(), filename);
};

/**
 * Resolves a path by checking if any part of it already exists on disk with different casing.
 * This ensures that if 'common/' exists, we reuse it instead of creating 'Common/'.
 */
export const resolveExistingPath = (targetPath: string, baseDir: string = process.cwd()): string => {
    const parts = targetPath.split(/[\\\/]/);
    let resolvedPath = baseDir;

    for (const part of parts) {
        if (!part) continue;

        const currentDirContents = existsSync(resolvedPath) ? readdirSync(resolvedPath) : [];
        const existingMatch = currentDirContents.find(item => item.toLowerCase() === part.toLowerCase());

        if (existingMatch) {
            resolvedPath = join(resolvedPath, existingMatch);
        } else {
            resolvedPath = join(resolvedPath, part);
        }
    }

    // Return the path relative to baseDir
    return resolvedPath.replace(baseDir, '').replace(/^[\\\/]/, '');
};
