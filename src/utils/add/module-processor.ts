import * as path from "path";
import { writeFile } from "fs/promises";
import { randomUUID } from "crypto";
import { Project, ts } from "ts-morph";
import { gzipSync } from "zlib";
import { getNestedDependencies } from "./get-dependencies";
import { FileStructure, Mapping } from "../../types";

export const processModules = async (
    modules: { moduleName: string; entryFile: string; manual?: boolean, originalName?: string }[],
    flattenedFiles: FileStructure[],
    mapping: Mapping,
    modulesDir: string,
    mappingPath: string
) => {
    const inquirer = (await import('inquirer')).default;

    const { selectedModuleNames } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedModuleNames',
            message: modules.some(m => m.manual) ? 'Select entry file to proceed:' : 'Select modules to process:',
            choices: modules.map(m => ({
                name: m.moduleName,
                value: m.moduleName,
                checked: false
            })),
        }
    ]);

    const selectedModules = modules.filter(m => selectedModuleNames.includes(m.moduleName));

    if (selectedModules.length === 0) {
        console.log("No modules selected. Exiting.");
        return;
    }

    const modulesToProcess = [];
    for (const module of selectedModules) {
        if (Array.isArray(module.entryFile)) {
            const { select } = await import("@inquirer/prompts");
            const entryFile = await select({
                message: `Select an entry file:`,
                choices: module.entryFile.map(m => ({ name: m, value: m })),
                default: module.entryFile?.[0],
            });
            module.entryFile = entryFile;
            module.originalName = path.parse(entryFile).name.split(/[.-]/)[0];
            if (entryFile.length === 0) {
                console.log("No entry file selected. Exiting.");
                return;
            }
        }
        const { customName } = await inquirer.prompt([
            {
                type: 'input',
                name: 'customName',
                message: `Enter name for module ${module.moduleName}:`,
                default: module.moduleName
            }
        ]);

        if (mapping[customName]) {
            console.log(`\nNote: Module "${customName}" already exists and will be updated.\n`);
        }

        modulesToProcess.push({
            ...module,
            moduleName: customName,
            originalName: module.originalName || path.parse(module.moduleName).name.split(/[.-]/)[0] // Get base name (e.g., 'user' from 'user.controller.ts', 'storage' from 'storage-stack.ts')
        });
    }

    const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions: {
            allowJs: true,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
        }
    });

    const VIRTUAL_ROOT = "/virtual";
    for (const file of flattenedFiles) {
        if (file.content !== undefined && !file.isDirectory) {
            const virtualPath = path.join(VIRTUAL_ROOT, file.path);
            project.createSourceFile(virtualPath, file.content, { overwrite: true });
        }
    }

    const components = modulesToProcess.map(module => {
        const entryFile = module.entryFile;
        const projectRoot = process.cwd();
        const relativeEntryPath = path.isAbsolute(entryFile) ? path.relative(projectRoot, entryFile) : entryFile;
        const virtualEntryPath = path.join(VIRTUAL_ROOT, relativeEntryPath);
        const deps = getNestedDependencies(virtualEntryPath, project);
        return {
            name: module.moduleName,
            originalName: module.originalName,
            exportedNames: deps?.exportedNames || [],
            deps
        }
    });

    for (const component of components) {
        const id = mapping[component.name] || randomUUID();
        if (!mapping[component.name]) {
            mapping[component.name] = id;
        }
        const compressed = gzipSync(JSON.stringify(component));
        await writeFile(path.join(modulesDir, `${id}.via`), compressed);

        const chalk = (await import('chalk')).default;
        console.log(`\n${chalk.green.bold('✓')} Module ${chalk.cyan(component.name)} saved successfully!`);
        console.log(`${chalk.gray('Example usage:')} ${chalk.white(`via ${component.name} create [newName]`)}\n`);
    }

    await writeFile(mappingPath, JSON.stringify(mapping), 'utf-8');

    for (const sourceFile of project.getSourceFiles()) {
        project.removeSourceFile(sourceFile);
    }
}
