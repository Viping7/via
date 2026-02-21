module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.ts'],
    verbose: true,
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    transformIgnorePatterns: [
        'node_modules/(?!(gradient-string|chalk|figlet|@inquirer)/)'
    ],
};
