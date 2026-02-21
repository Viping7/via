import { learn } from '../src/commands/learn';
import { use } from '../src/commands/use';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import { getViaDataDir } from '../src/utils/paths';

jest.mock('inquirer', () => ({
    __esModule: true,
    default: {
        prompt: jest.fn()
    }
}));

jest.mock('../src/utils/branding', () => ({
    showLogo: jest.fn(),
    showAbout: jest.fn(),
    showWelcomeMessage: jest.fn(),
    showStatusLoader: jest.fn(() => ({ stop: jest.fn() }))
}));

describe('CDK E2E Test', () => {
    const viaDataDir = getViaDataDir();
    const testOutputDir = path.join(__dirname, 'output-cdk');

    beforeEach(async () => {
        if (fs.existsSync(viaDataDir)) fs.rmSync(viaDataDir, { recursive: true, force: true });
        if (fs.existsSync(testOutputDir)) fs.rmSync(testOutputDir, { recursive: true, force: true });
        fs.mkdirSync(testOutputDir, { recursive: true });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should learn from storage-stack.ts and create Backup module', async () => {
        const cdkLibPath = 'tests/cdk-app/lib';

        (inquirer.prompt as unknown as jest.Mock)
            .mockResolvedValueOnce({ selectedModuleNames: ['storage-stack.ts'] })
            .mockResolvedValueOnce({ customName: 'CdkStorageModule' });

        await learn(cdkLibPath);

        // 2. USE
        jest.spyOn(process, 'cwd').mockReturnValue(testOutputDir);
        await use('CdkStorageModule', 'Backup');

        // With Improved originalName ('storage'), we expect:
        // storage-stack.ts -> backup-stack.ts
        const stackPath = path.join(testOutputDir, 'tests/cdk-app/lib/backup-stack.ts');
        const lambdaPath = path.join(testOutputDir, 'tests/cdk-app/src/lambda/uploader.ts');

        expect(fs.existsSync(stackPath)).toBe(true);
        expect(fs.existsSync(lambdaPath)).toBe(true);

        const stackContent = fs.readFileSync(stackPath, 'utf-8');
        expect(stackContent).toContain('class BackupStack');
    });
});
