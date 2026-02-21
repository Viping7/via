import { reduce } from "lodash";
import { FileStructure } from "../../types";

export const getFileNamesAndFolders = (files: FileStructure[]) => {
    return reduce(files, (acc, file) => {
        if (file.isDirectory) {
            if (!acc[file.path]) {
                acc[file.path] = [];
            }
            return acc;
        }
        const folder = file.path.replace(`/${file.fileName}`, '')
        // console.log(acc, file.folderName);
        if (acc[folder]) {
            acc[folder].push(file.fileName);
        }
        return acc;
    }, {} as { [key in string]: string[] });

}