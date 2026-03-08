import * as path from "path";
import { writeFile, readFile } from "fs/promises";
import { readFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";
import { Project, ts } from "ts-morph";
import { gzipSync } from "zlib";
import { getNestedDependencies } from "./get-dependencies";
import { FileStructure, Mapping, Module } from "../../types";

const BUILTIN_MODULES = new Set([
    'assert', 'async_hooks', 'buffer', 'child_process', 'cluster', 'console', 'constants',
    'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'http2', 'https', 'inspector',
    'module', 'net', 'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring',
    'readline', 'repl', 'stream', 'string_decoder', 'timers', 'tls', 'trace_events', 'tty',
    'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib'
]);

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

    const findConfig = (dir: string): string | null => {
        const tsPath = path.join(dir, 'tsconfig.json');
        const jsPath = path.join(dir, 'jsconfig.json');
        if (existsSync(tsPath)) return tsPath;
        if (existsSync(jsPath)) return jsPath;
        const parent = path.dirname(dir);
        if (parent === dir) return null;
        return findConfig(parent);
    };

    const VIRTUAL_ROOT = "/virtual";
    const configPath = findConfig(process.cwd());
    const configDir = configPath ? path.dirname(configPath) : process.cwd();
    const cwdOffset = path.relative(configDir, process.cwd());

    let compilerOptions: any = {
        allowJs: true,
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
    };

    if (configPath) {
        try {
            const configText = readFileSync(configPath, 'utf-8');
            const result = ts.parseConfigFileTextToJson(configPath, configText);
            const config = result.config;

            if (config && config.compilerOptions) {
                const options = config.compilerOptions;
                if (options.baseUrl) {
                    // baseUrl is relative to config file location
                    compilerOptions.baseUrl = path.join(VIRTUAL_ROOT, options.baseUrl);
                } else {
                    compilerOptions.baseUrl = VIRTUAL_ROOT;
                }
                if (options.paths) {
                    compilerOptions.paths = options.paths;
                }
            }
        } catch (e) {
            console.warn(`Warning: Could not parse ${configPath}. Path aliases might not be resolved.`);
        }
    } else {
        compilerOptions.baseUrl = VIRTUAL_ROOT;
    }

    const project = new Project({
        useInMemoryFileSystem: true,
        compilerOptions
    });

    for (const file of flattenedFiles) {
        if (file.content !== undefined && !file.isDirectory) {
            // file.path is relative to process.cwd(). 
            // We need it relative to configDir to match baseUrl/paths.
            const pathRelativeToConfig = path.join(cwdOffset, file.path);
            const virtualPath = path.join(VIRTUAL_ROOT, pathRelativeToConfig);
            project.createSourceFile(virtualPath, file.content, { overwrite: true });
        }
    }

    const components: Module[] = modulesToProcess.map(module => {
        const entryFile = module.entryFile;
        const projectRoot = process.cwd();
        const relativeEntryPath = path.isAbsolute(entryFile) ? path.relative(projectRoot, entryFile) : entryFile;

        // Same here: adjust entry path relative to configDir
        const entryPathRelativeToConfig = path.join(cwdOffset, relativeEntryPath);
        const virtualEntryPath = path.join(VIRTUAL_ROOT, entryPathRelativeToConfig);

        const externalDepsSet = new Set<string>();
        const deps = getNestedDependencies(virtualEntryPath, project, new Set(), externalDepsSet);

        // Filter out built-ins
        const externalDependencies = Array.from(externalDepsSet).filter(dep => !BUILTIN_MODULES.has(dep));

        return {
            name: module.moduleName,
            originalName: module.originalName || "",
            exportedNames: deps?.exportedNames || [],
            deps: deps!,
            externalDependencies
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
        if (component.externalDependencies && component.externalDependencies.length > 0) {
            console.log(`${chalk.gray('Dependencies:')} ${chalk.yellow(component.externalDependencies.join(', '))}`);
        }
        console.log(`${chalk.gray('Example usage:')} ${chalk.white(`via ${component.name} create [newName]`)}\n`);
    }

    await writeFile(mappingPath, JSON.stringify(mapping), 'utf-8');

    for (const sourceFile of project.getSourceFiles()) {
        project.removeSourceFile(sourceFile);
    }
}
