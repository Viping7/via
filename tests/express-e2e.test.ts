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

describe('Express E2E Test', () => {
    const viaDataDir = getViaDataDir();
    const testOutputDir = path.join(__dirname, 'output-express');

    beforeEach(async () => {
        if (fs.existsSync(viaDataDir)) fs.rmSync(viaDataDir, { recursive: true, force: true });
        if (fs.existsSync(testOutputDir)) fs.rmSync(testOutputDir, { recursive: true, force: true });
        fs.mkdirSync(testOutputDir, { recursive: true });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should learn from user.controller.ts and create Auth module', async () => {
        const controllersPath = 'tests/express-app/src/controllers';

        (inquirer.prompt as unknown as jest.Mock)
            .mockResolvedValueOnce({ selectedModuleNames: ['user.controller.ts'] })
            .mockResolvedValueOnce({ customName: 'UserControllerModule' });

        await learn(controllersPath);

        // 2. USE
        jest.spyOn(process, 'cwd').mockReturnValue(testOutputDir);
        await use('UserControllerModule', 'Auth');

        // With Improved originalName ('user'), we expect:
        // user.controller.ts -> auth.controller.ts
        // user.service.ts -> auth.service.ts

        const controllerPath = path.join(testOutputDir, 'tests/express-app/src/controllers/auth.controller.ts');
        const servicePath = path.join(testOutputDir, 'tests/express-app/src/services/auth.service.ts');

        expect(fs.existsSync(controllerPath)).toBe(true);
        expect(fs.existsSync(servicePath)).toBe(true);

        const controllerContent = fs.readFileSync(controllerPath, 'utf-8');
        expect(controllerContent).toContain('class AuthController');

        const serviceContent = fs.readFileSync(servicePath, 'utf-8');
        expect(serviceContent).toContain('class AuthService');
    });
});
