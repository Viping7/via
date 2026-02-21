import { Project, ts } from "ts-morph";
import { FileDependencyNode } from "../../types";


/**
 * Recursively gets dependencies of an entry file in a nested format.
 * @param entryFilePath Absolute or relative path to the entry file.
 * @param project The ts-morph project instance to use.
 * @param visited Optional set of visited file paths to handle cycles.
 */
export function getNestedDependencies(
    entryFilePath: string,
    project: Project,
    visited: Set<string> = new Set()
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
        const depSourceFile = imp.getModuleSpecifierSourceFile();
        if (depSourceFile && !depSourceFile.isInNodeModules()) {
            const depPath = depSourceFile.getFilePath();
            const depNode = getNestedDependencies(depPath, project, visited);
            if (depNode) {
                dependencies.push(depNode);
            }
        }
    }

    // Check exports (e.g., export * from './module')
    const exportDeclarations = sourceFile.getExportDeclarations();
    for (const exp of exportDeclarations) {
        const depSourceFile = exp.getModuleSpecifierSourceFile();
        if (depSourceFile && !depSourceFile.isInNodeModules()) {
            const depPath = depSourceFile.getFilePath();
            const depNode = getNestedDependencies(depPath, project, visited);
            if (depNode) {
                dependencies.push(depNode);
            }
        }
    }

    return {
        path: entryFilePath.replace('/virtual', ''),
        content,
        dependencies,
        exportedNames,
    };
}
