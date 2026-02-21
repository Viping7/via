import { readFile, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import chalk from 'chalk';
import { getViaDataPath } from '../utils/paths';

export const removeModule = async (name: string) => {
    try {
        const mappingPath = getViaDataPath('mapping.json');

        if (!existsSync(mappingPath)) {
            console.log(chalk.yellow("\nNo modules found.\n"));
            return;
        }

        const mappingFile = await readFile(mappingPath, 'utf-8');
        const mapping = JSON.parse(mappingFile);
        const id = mapping[name];

        if (!id) {
            console.log(chalk.red(`\nModule "${name}" not found.\n`));
            return;
        }

        const { confirm } = await import('@inquirer/prompts');
        const shouldDelete = await confirm({
            message: `Are you sure you want to delete the module "${name}"?`,
            default: false,
        });

        if (!shouldDelete) {
            console.log(chalk.gray("\nDeletion cancelled.\n"));
            return;
        }

        // Delete the .via file
        const viaPath = getViaDataPath(`modules/${id}.via`);
        if (existsSync(viaPath)) {
            await unlink(viaPath);
        }

        // Remove from mapping
        delete mapping[name];
        await writeFile(mappingPath, JSON.stringify(mapping, null, 2), 'utf-8');

        console.log(chalk.green(`\n✓ Module "${name}" has been deleted.\n`));

    } catch (e) {
        console.error(chalk.red("Error deleting module:"), e);
    }
};
