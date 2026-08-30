// Jest setup file
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.GEMINI_API_KEY = 'test-gemini-key-12345';
process.env.OPENROUTER_API_KEY = '';

// Suppress console output during tests unless there's an error
if (process.env.DEBUG_TESTS !== 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    // Keep error output for debugging
    error: console.error,
  };
}
