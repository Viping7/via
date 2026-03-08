import { mkdir, readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, basename } from "path";
import { Project, SourceFile, Node } from "ts-morph";
import { gunzipSync } from "zlib";
import { getViaDataPath, resolveExistingPath } from "../utils/paths";
import chalk from "chalk";
import { isSingluar, pluralize, singularize } from "../utils/use/text";
import { FileDependencyNode, Module } from "../types";
import { generateStorybookContent } from "../utils/ai/storybook";
import { execSync } from "child_process";

const PROTECTED_KEYWORDS = new Set([
  's3', 'sqs', 'sns', 'lambda', 'dynamodb', 'iam', 'cdk', 'construct', 'stack', 'app', 'stage', 'bucket', 'function', 'handler', 'service', 'controller',
  'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 'useMemo', 'useRef', 'useImperativeHandle', 'useLayoutEffect', 'useDebugValue',
  'React', 'Next', 'Link', 'Image', 'Head', 'Script',
  'props', 'children', 'className', 'style', 'ref', 'key', 'onClick', 'onChange', 'onSubmit'
]);

const getPackageManager = () => {
  if (existsSync(join(process.cwd(), 'yarn.lock'))) return 'yarn';
  if (existsSync(join(process.cwd(), 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(process.cwd(), 'bun.lockb'))) return 'bun';
  return 'npm';
};

const installDependencies = async (deps: string[]) => {
  const pm = getPackageManager();
  const command = pm === 'npm' ? `npm install ${deps.join(' ')}` : `${pm} add ${deps.join(' ')}`;
  console.log(chalk.yellow(`\nInstalling dependencies: ${deps.join(', ')} using ${pm}...`));
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(chalk.green(`✓ Dependencies installed successfully!`));
  } catch (error) {
    console.error(chalk.red(`✖ Failed to install dependencies:`), error);
  }
};

const checkMissingDependencies = async (externalDeps: string[] = []) => {
  if (externalDeps.length === 0) return [];

  const packageJsonPath = join(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) return externalDeps;

  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
      ...(packageJson.peerDependencies || {})
    };

    return externalDeps.filter(dep => !allDeps[dep]);
  } catch (error) {
    return externalDeps;
  }
};

export const smartRename = (text: string, originalName: string, newName: string) => {
  if (!originalName || !newName || originalName === newName) return text;

  const toPascal = (s: string) => s.split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  const toCamel = (s: string) => {
    const p = toPascal(s);
    return p.charAt(0).toLowerCase() + p.slice(1);
  };
  const toKebab = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/_/g, '-');
  const toSnake = (s: string) => toKebab(s).replace(/-/g, '_');

  const getVariations = (name: string) => {
    const variations = [name, toPascal(name), toCamel(name), toKebab(name), toSnake(name)];
    const allVariations = [...new Set(variations.flatMap(v => [v, pluralize(v), singularize(v)]))];
    return allVariations.filter(v => v.length > 0);
  };

  const variations = getVariations(originalName);
  const sortedVariations = variations.sort((a, b) => b.length - a.length);
  // Negative lookahead to prevent matching 'StorageS' in 'StorageStack' as 'storages'
  const regex = new RegExp(sortedVariations.map(v => {
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // For words that might be substrings, enforce word boundaries or boundaries between case changes
    if (v.length < 4) return `\\b${escaped}\\b`;
    if (v.toLowerCase().endsWith('s') && !originalName.toLowerCase().endsWith('s')) {
      return `${escaped}(?![a-zA-Z])`;
    }
    return escaped;
  }).join('|'), 'gi');

  return text.replace(regex, (match, offset) => {
    // Skip protected keywords (system terms, AWS services, etc.)
    if (PROTECTED_KEYWORDS.has(match.toLowerCase())) {
      return match;
    }

    // Preserve plurality if possible
    const isPluralMatch = !isSingluar(match);
    let target = isSingluar(newName) ? newName : singularize(newName);

    if (isPluralMatch) {
      target = pluralize(target);
    }

    // Check context (surrounding characters for snake_case/kebab-case)
    const prevChar = offset > 0 ? text[offset - 1] : '';
    const nextChar = offset + match.length < text.length ? text[offset + match.length] : '';

    const isSnakeContext = prevChar === '_' || nextChar === '_';
    const isKebabContext = prevChar === '-' || nextChar === '-';

    // Determine casing based on match and context
    if (match === match.toUpperCase() && match.toLowerCase() !== match) return target.toUpperCase();
    if (match.includes('_') || isSnakeContext) return toSnake(target);
    if (match.includes('-') || isKebabContext) return toKebab(target);
    if (match[0] === match[0].toUpperCase()) return toPascal(target);
    return toCamel(target);
  });
};

export const use = async (name: string, newName?: string) => {
  try {
    const mappingPath = getViaDataPath('mapping.json');
    if (!existsSync(mappingPath)) {
      console.log("Module mapping not found");
      return;
    }
    const mappingFile = await readFile(mappingPath, 'utf-8');
    const mapping = JSON.parse(mappingFile);
    const id = mapping[name];
    if (!id) {
      console.log("Module not found");
      return;
    }
    let jsonFile: Module;
    const viaPath = getViaDataPath(`modules/${id}.via`);

    if (existsSync(viaPath)) {
      const buffer = await readFile(viaPath);
      const decompressed = gunzipSync(buffer);
      jsonFile = JSON.parse(decompressed.toString());
    } else {
      console.log("Module file not found");
      return;
    }

    const { originalName, deps, externalDependencies = [] } = jsonFile;
    const targetName = newName || originalName;

    // Check for missing dependencies
    const missingDeps = await checkMissingDependencies(externalDependencies);
    if (missingDeps.length > 0) {
      const { confirm } = await import("@inquirer/prompts");
      const shouldInstall = await confirm({
        message: `${chalk.yellow('This module requires external dependencies:')} ${chalk.cyan(missingDeps.join(', '))}. Install them now?`,
        default: true
      });
      if (shouldInstall) {
        await installDependencies(missingDeps);
      }
    }

    const allFiles = flattenDeps([deps]);

    const summary = {
      created: [] as string[],
      merged: [] as string[]
    };

    for (const file of allFiles) {
      const { path: filePathRelative, content } = file;
      const renamedPath = smartRename(filePathRelative, originalName, targetName);

      if (content) {
        // 1. Load file with ts-morph
        const project = new Project();
        const sourceFile = project.createSourceFile("temp.ts", content);

        // 2. Targeted renaming using AST traversal and range-based replacement
        const replacements: { start: number; end: number; text: string }[] = [];

        sourceFile.forEachDescendant(node => {
          if (Node.isIdentifier(node)) {
            const text = node.getText();
            const renamed = smartRename(text, originalName, targetName);
            if (text !== renamed) {
              replacements.push({ start: node.getStart(), end: node.getEnd(), text: renamed });
            }
          } else if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
            const text = node.getLiteralText();
            const renamed = smartRename(text, originalName, targetName);
            if (text !== renamed) {
              const quote = Node.isStringLiteral(node) ? node.getText()[0] : '`';
              replacements.push({ start: node.getStart(), end: node.getEnd(), text: `${quote}${renamed}${quote}` });
            }
          }
        });

        let finalContent = sourceFile.getFullText();
        replacements.sort((a, b) => b.start - a.start);
        for (const r of replacements) {
          finalContent = finalContent.slice(0, r.start) + r.text + finalContent.slice(r.end);
        }
        sourceFile.replaceWithText(finalContent);

        // 3. Save to disk
        const pathAfterRename = renamedPath;
        const resolvedPath = resolveExistingPath(pathAfterRename);
        const fullFilePath = join(process.cwd(), resolvedPath);
        const relativePath = resolvedPath;

        await mkdir(dirname(fullFilePath), { recursive: true });

        if (existsSync(fullFilePath)) {
          const existingContent = await readFile(fullFilePath, 'utf-8');
          const diskProject = new Project();
          const existingFile = diskProject.createSourceFile(fullFilePath, existingContent, { overwrite: true });

          mergeSourceFiles(existingFile, sourceFile);
          await writeFile(fullFilePath, existingFile.getFullText());
          summary.merged.push(relativePath);
        } else {
          const finalFileContent = sourceFile.getFullText();
          await writeFile(fullFilePath, finalFileContent);
          summary.created.push(relativePath);

          // 4. Storybook generation for UI components
          if (relativePath.endsWith(".tsx") || relativePath.endsWith(".jsx")) {
            const { confirm } = await import("@inquirer/prompts");
            const shouldGenerateStorybook = await confirm({
              message: `Generate Storybook for ${chalk.cyan.bold(basename(relativePath))}?`,
              default: false
            });

            if (shouldGenerateStorybook) {
              console.log(chalk.yellow(`\nGenerating Storybook for ${targetName}...`));
              try {
                const storyContent = await generateStorybookContent(targetName, finalFileContent);
                const storyPath = relativePath.replace(/\.(tsx|jsx)$/, ".stories.$1");
                const fullStoryPath = join(process.cwd(), storyPath);
                await writeFile(fullStoryPath, storyContent);
                summary.created.push(storyPath);
                console.log(chalk.green(`✓ Storybook created: ${storyPath}`));
              } catch (error) {
                console.error(chalk.red("✖ Failed to generate Storybook:"), error);
              }
            }
          }
        }
      }
    }

    console.log(`\n${chalk.green.bold('✨ Successfully prepared your new module!')}`);
    console.log(`${chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}`);

    if (summary.created.length > 0) {
      console.log(`${chalk.blue.bold('NEW FILES:')}`);
      summary.created.forEach(f => console.log(`  ${chalk.blue('+')} ${f}`));
    }

    if (summary.merged.length > 0) {
      console.log(`${chalk.yellow.bold('MERGED FILES:')}`);
      summary.merged.forEach(f => console.log(`  ${chalk.yellow('~')} ${f}`));
    }

    console.log(`${chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}`);
    console.log(`${chalk.white.bold('Next Steps:')}`);
    console.log(`  1. Note: ${chalk.cyan('Auto-import is not yet supported')}.`);
    console.log(`  2. Manually import ${chalk.green.bold(targetName)} in your project.`);
    console.log(`  3. Start using your new functionality!\n`);

  } catch (e) {
    console.log(chalk.red.bold("✖ Error while using module:"), e);
  }
};

function mergeSourceFiles(target: SourceFile, source: SourceFile) {
  const sourceDecls = [
    ...source.getClasses(),
    ...source.getFunctions(),
    ...source.getInterfaces(),
    ...source.getTypeAliases(),
    ...source.getVariableStatements()
  ];

  for (const decl of sourceDecls) {
    if (Node.isClassDeclaration(decl) || Node.isFunctionDeclaration(decl) || Node.isInterfaceDeclaration(decl) || Node.isTypeAliasDeclaration(decl)) {
      const name = decl.getName();
      if (name) {
        const exists = !!(
          target.getClass(name) ||
          target.getFunction(name) ||
          target.getInterface(name) ||
          target.getTypeAlias(name)
        );

        if (!exists) {
          target.addStatements(decl.getText());
        } else {
          console.warn(`Skipping: "${name}" already exists in the target file.`);
        }
      }
    } else if (Node.isVariableStatement(decl)) {
      for (const varDecl of decl.getDeclarations()) {
        const name = varDecl.getName();
        const exists = !!target.getVariableDeclaration(name);
        if (!exists) {
          target.addStatements(decl.getText());
          break;
        }
      }
    }
  }

  // Merge imports as well
  const sourceImports = source.getImportDeclarations();
  const targetImports = target.getImportDeclarations();

  for (const imp of sourceImports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    const existingImp = targetImports.find((ti) => ti.getModuleSpecifierValue() === moduleSpecifier);

    if (!existingImp) {
      target.addImportDeclaration(imp.getStructure());
    } else {
      const namedImports = imp.getNamedImports();
      for (const ni of namedImports) {
        const niName = ni.getName();
        if (!existingImp.getNamedImports().some((tni) => tni.getName() === niName)) {
          existingImp.addNamedImport(ni.getStructure());
        }
      }
    }
  }
}

function flattenDeps(deps: FileDependencyNode[]): FileDependencyNode[] {
  return deps.reduce((acc, dep) => {
    return acc.concat(dep, flattenDeps(dep.dependencies || []));
  }, [] as FileDependencyNode[]);
}
