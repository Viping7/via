import * as path from "path";
import { Project, ts } from "ts-morph";
import { FileDependencyNode } from "../../types";


/**
 * Recursively gets dependencies of an entry file in a nested format.
 * @param entryFilePath Absolute or relative path to the entry file.
 * @param project The ts-morph project instance to use.
 * @param visited Optional set of visited file paths to handle cycles.
 * @param externalDeps Optional set to collect external dependency names.
 */
export function getNestedDependencies(
    entryFilePath: string,
    project: Project,
    visited: Set<string> = new Set(),
    externalDeps: Set<string> = new Set()
): FileDependencyNode | null {
    if (visited.has(entryFilePath)) {
        return null;
    }

    visited.add(entryFilePath);

    const sourceFile = project.getSourceFile(entryFilePath);

    if (!sourceFile) {
        console.error(`Source file not found in project: ${entryFilePath}`);
        return null;
    }

    const content = sourceFile.getFullText();
    const dependencies: FileDependencyNode[] = [];

    // Extract exported names
    const exportedNames: string[] = [];
    sourceFile.getExportedDeclarations().forEach((decls, name) => {
        if (name !== 'default') {
            exportedNames.push(name);
        } else {
            // Handle default exports by looking at the actual identifier being exported
            decls.forEach(decl => {
                if (ts.isVariableDeclaration(decl.compilerNode) ||
                    ts.isClassDeclaration(decl.compilerNode) ||
                    ts.isFunctionDeclaration(decl.compilerNode) ||
                    ts.isInterfaceDeclaration(decl.compilerNode)) {
                    const nameNode = decl.compilerNode.name;
                    if (nameNode && ts.isIdentifier(nameNode)) {
                        exportedNames.push(nameNode.text);
                    }
                }
            });
        }
    });

    // Check imports
    const importDeclarations = sourceFile.getImportDeclarations();
    for (const imp of importDeclarations) {
        const specifier = imp.getModuleSpecifierValue();
        const depSourceFile = imp.getModuleSpecifierSourceFile();

        if (depSourceFile && !depSourceFile.isInNodeModules()) {
            const depPath = depSourceFile.getFilePath();
            const depNode = getNestedDependencies(depPath, project, visited, externalDeps);
            if (depNode) {
                dependencies.push(depNode);
            }
        } else if (depSourceFile?.isInNodeModules()) {
            // Track external dependency
            const packageName = specifier.startsWith('@')
                ? specifier.split('/').slice(0, 2).join('/')
                : specifier.split('/')[0];
            externalDeps.add(packageName);
        } else if (specifier.startsWith('.') || specifier.startsWith('/')) {
            // Handle non-source files (CSS, SVG, etc.) if they are relative
            const sourceFilePath = sourceFile.getFilePath();
            const depPath = path.resolve(path.dirname(sourceFilePath), specifier);
            // ts-morph might not find these if they aren't in the project, but we can still track them
            if (!visited.has(depPath) && (specifier.endsWith('.css') || specifier.endsWith('.scss') || specifier.endsWith('.svg') || specifier.endsWith('.png'))) {
                visited.add(depPath);
                // Minimal node for non-TS files
                dependencies.push({
                    path: depPath.replace(/^[/\\]virtual[/\\]?/, '').replace(/\\/g, '/'),
                    content: '', // Content will be handled during 'use' if needed, or we just skip it for now
                    dependencies: [],
                    exportedNames: []
                });
            }
        } else if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
            // Likely a node module that ts-morph didn't resolve to a file
            const packageName = specifier.startsWith('@')
                ? specifier.split('/').slice(0, 2).join('/')
                : specifier.split('/')[0];
            externalDeps.add(packageName);
        }
    }

    // Check exports (e.g., export * from './module')
    const exportDeclarations = sourceFile.getExportDeclarations();
    for (const exp of exportDeclarations) {
        const depSourceFile = exp.getModuleSpecifierSourceFile();
        if (depSourceFile && !depSourceFile.isInNodeModules()) {
            const depPath = depSourceFile.getFilePath();
            const depNode = getNestedDependencies(depPath, project, visited, externalDeps);
            if (depNode) {
                dependencies.push(depNode);
            }
        }
    }

    // Check dynamic imports: import("./module")
    const callExpressions = sourceFile.getDescendantsOfKind(ts.SyntaxKind.CallExpression);
    for (const call of callExpressions) {
        if (call.getExpression().getKind() === ts.SyntaxKind.ImportKeyword) {
            const args = call.getArguments();
            if (args.length > 0) {
                // Try to resolve the module via ts-morph's symbol resolution
                const arg = args[0];
                const symbol = arg.getSymbol();
                if (symbol) {
                    const declarations = symbol.getDeclarations();
                    if (declarations.length > 0) {
                        const referencedSourceFile = declarations[0].getSourceFile();
                        if (referencedSourceFile && !referencedSourceFile.isInNodeModules()) {
                            const depPath = referencedSourceFile.getFilePath();
                            const depNode = getNestedDependencies(depPath, project, visited, externalDeps);
                            if (depNode) {
                                dependencies.push(depNode);
                            }
                        } else if (referencedSourceFile?.isInNodeModules()) {
                            const specifier = arg.getKind() === ts.SyntaxKind.StringLiteral ? (arg as any).getLiteralText() : "";
                            if (specifier) {
                                const packageName = specifier.startsWith('@')
                                    ? specifier.split('/').slice(0, 2).join('/')
                                    : specifier.split('/')[0];
                                externalDeps.add(packageName);
                            }
                        }
                    }
                } else if (arg.getKind() === ts.SyntaxKind.StringLiteral) {
                    // Fallback for non-TS files or if symbol resolution fails but it's a relative path
                    const specifier = (arg as any).getLiteralText();
                    if (specifier.startsWith('.')) {
                        const sourceFilePath = sourceFile.getFilePath();
                        const depPath = path.resolve(path.dirname(sourceFilePath), specifier);
                        if (!visited.has(depPath) && (specifier.endsWith('.css') || specifier.endsWith('.scss') || specifier.endsWith('.svg') || specifier.endsWith('.png'))) {
                            visited.add(depPath);
                            dependencies.push({
                                path: depPath.replace(/^[/\\]virtual[/\\]?/, '').replace(/\\/g, '/'),
                                content: '',
                                dependencies: [],
                                exportedNames: []
                            });
                        }
                    } else if (!specifier.startsWith('/')) {
                        // External module
                        const packageName = specifier.startsWith('@')
                            ? specifier.split('/').slice(0, 2).join('/')
                            : specifier.split('/')[0];
                        externalDeps.add(packageName);
                    }
                }
            }
        }
    }

    return {
        path: entryFilePath.replace(/^[/\\]virtual[/\\]?/, '').replace(/\\/g, '/'),
        content,
        dependencies,
        exportedNames,
    };
}
