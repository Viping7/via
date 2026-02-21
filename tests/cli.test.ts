import { listModules } from '../src/commands/list';
import { smartRename } from '../src/commands/use';
import * as fs from 'fs';
import * as path from 'path';
import { getViaDataPath } from '../src/utils/paths';

// Mocking console.log to avoid cluttering test output
const logSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

describe('VIA CLI Integration Tests', () => {
    const mappingPath = getViaDataPath('mapping.json');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('listModules should handle missing mapping file', async () => {
        // Temporarily rename mapping.json if it exists
        const backupPath = `${mappingPath}.bak`;
        let backedUp = false;
        if (fs.existsSync(mappingPath)) {
            fs.renameSync(mappingPath, backupPath);
            backedUp = true;
        }

        await listModules();
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No modules found"));

        if (backedUp) {
            fs.renameSync(backupPath, mappingPath);
        }
    });

    test('listModules should list existing modules', async () => {
        if (fs.existsSync(mappingPath)) {
            await listModules();
            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("Available VIA Modules"));
        }
    });

    describe('smartRename Logic', () => {
        test('should handle PascalCase', () => {
            expect(smartRename('class UserComponent {}', 'user-component', 'account-page'))
                .toBe('class AccountPage {}');
        });

        test('should handle camelCase', () => {
            expect(smartRename('const userService = new UserService();', 'user-service', 'auth-service'))
                .toBe('const authService = new AuthService();');
        });

        test('should handle kebab-case', () => {
            expect(smartRename('import { x } from "./user-module";', 'user-module', 'auth-module'))
                .toBe('import { x } from "./auth-module";');
        });

        test('should handle UPPERCASE', () => {
            expect(smartRename('const USER_CONFIG = {};', 'user', 'admin'))
                .toBe('const ADMIN_CONFIG = {};');
        });

        test('should handle fuzzy matching for internal caps (PreProcessor)', () => {
            // originalName would be 'preprocessor' from the filename
            expect(smartRename('export class PreProcessorFunction {}', 'preprocessor', 'ocr-service'))
                .toBe('export class OcrServiceFunction {}');
        });

        test('should handle path casing (Auth -> auth.ts)', () => {
            expect(smartRename('user.service.ts', 'user', 'Auth'))
                .toBe('auth.service.ts');
        });

        test('should handle multiple occurrences', () => {
            const content = 'import { User } from "./user"; const u = new User();';
            expect(smartRename(content, 'user', 'account'))
                .toBe('import { Account } from "./account"; const u = new Account();');
        });

        test('should handle plurality (users -> accounts)', () => {
            expect(smartRename('const users = [];', 'user', 'account'))
                .toBe('const accounts = [];');
            expect(smartRename('const categories = [];', 'category', 'tag'))
                .toBe('const tags = [];');
        });

        test('should prevent recursion (user -> messageuser)', () => {
            expect(smartRename('const user = "me";', 'user', 'message-user'))
                .toBe('const messageUser = "me";');
        });

        test('should handle cross-matching (matches UserService from user-service)', () => {
            expect(smartRename('class UserService {}', 'user-service', 'auth-service'))
                .toBe('class AuthService {}');
        });

        test('should handle negative lookahead for overlapping words', () => {
            // StorageS from StorageStack should not match 'storage' and become 'Backuptack'
            expect(smartRename('class StorageStack {}', 'storage', 'backup'))
                .toBe('class BackupStack {}');
        });

        test('should handle mixed casing in a single pass', () => {
            const input = 'const user = new User(); // Processing users in user-service';
            expect(smartRename(input, 'user', 'auth-service'))
                .toBe('const authService = new AuthService(); // Processing authServices in auth-service-service');
        });

        test('should respect PROTECTED_KEYWORDS (s3, lambda, etc.)', () => {
            const input = 'const s3 = new s3.Bucket(); const lambda = new lambda.Function();';
            // Even if we are renaming something that matches a substring or variation,
            // protected words should stay intact.
            expect(smartRename(input, 's3', 'backup-store'))
                .toBe(input); // Should remain unchanged because s3 is protected

            expect(smartRename('class UserStack extends cdk.Stack {}', 'user', 'auth'))
                .toBe('class AuthStack extends cdk.Stack {}'); // 'Stack' is protected, 'User' is not
        });

        test('should handle complex pluralization (process -> processes)', () => {
            expect(smartRename('const processes = [];', 'process', 'box'))
                .toBe('const boxes = [];');
            expect(smartRename('const boxes = [];', 'box', 'process'))
                .toBe('const processes = [];');
        });

        test('should handle snake_case', () => {
            expect(smartRename('const user_id = 1;', 'user', 'account_manager'))
                .toBe('const account_manager_id = 1;');
            expect(smartRename('const user_id = 1;', 'user', 'AccountManager'))
                .toBe('const account_manager_id = 1;');
        });

        test('should respect original path casing (messageHandler -> textMessagesHandler)', () => {
            expect(smartRename('messageHandler.ts', 'message', 'textMessages'))
                .toBe('textMessageHandler.ts');

            expect(smartRename('user-service.ts', 'user', 'auth'))
                .toBe('auth-service.ts');
        });

        test('should handle acronyms and short words with word boundaries', () => {
            // Short names like 'id' should use word boundaries
            expect(smartRename('const userId = id;', 'id', 'identifier'))
                .toBe('const userId = identifier;');

            expect(smartRename('class APIUser {}', 'user', 'account'))
                .toBe('class APIAccount {}');
        });
    });
});
