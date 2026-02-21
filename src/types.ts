export type FileStructure = {
    fileName: string,
    path: string,
    isDirectory: boolean,
    folder?: string
    content?: string
}

export type FileDependencyNode = {
    path: string;
    content: string;
    dependencies: FileDependencyNode[];
    exportedNames?: string[];
}
export type Mapping = {
    [key: string]: string;
}

export type Module = {
    name: string;
    originalName: string;
    exportedNames: string[];
    deps: FileDependencyNode;
}