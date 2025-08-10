export default {
    testEnvironment: 'node',
    preset: null,
    transform: {},
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/generated/'
    ],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'repositories/**/*.js',
        'routes/**/*.js',
        'middleware/**/*.js',
        'index.js',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    coverageThreshold: {
        global: {
            branches: 55,
            functions: 85,
            lines: 75,
            statements: 75
        }
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    testTimeout: 10000
}