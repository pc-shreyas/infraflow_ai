module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/config/db.js', // Skip DB config as it's environment-dependent
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
