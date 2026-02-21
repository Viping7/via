import { readFile } from "fs/promises";
import { existsSync } from "fs";
import chalk from "chalk";
import { getViaDataPath } from "../utils/paths";

export const listModules = async () => {
    try {
        const mappingPath = getViaDataPath('mapping.json');

        if (!existsSync(mappingPath)) {
            console.log(chalk.yellow("\nNo modules found. Use 'via project' or 'via learn <path>' to add some!\n"));
            return;
        }

        const mappingFile = await readFile(mappingPath, 'utf-8');
        const mapping = JSON.parse(mappingFile);
        const moduleNames = Object.keys(mapping);

        if (moduleNames.length === 0) {
            console.log(chalk.yellow("\nNo modules found. Use 'via project' or 'via learn <path>' to add some!\n"));
            return;
        }

        console.log(chalk.cyan.bold("\nAvailable VIA Modules:"));
        console.log(chalk.cyan("=".repeat(25)));

        moduleNames.sort().forEach((name, index) => {
            console.log(`${chalk.gray(index + 1 + ".")} ${chalk.white(name)}`);
        });

        console.log(chalk.cyan("=".repeat(25)));
        console.log(chalk.gray(`Total: ${moduleNames.length} modules\n`));

    } catch (e) {
        console.error(chalk.red("Error listing modules:"), e);
    }
};
