import { homedir } from 'os';
import { join } from 'path';

export const getViaDataDir = () => {
    return join(homedir(), '.via');
};

export const getViaDataPath = (filename: string) => {
    return join(getViaDataDir(), filename);
};
