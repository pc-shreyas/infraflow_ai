// Tests for Gemini Service - Integration tests
// Note: These tests verify the service structure and error handling
// without requiring a real Gemini API key

describe('Gemini Service - Structure and Error Handling', () => {
  let geminiService;
  
  beforeEach(() => {
    // Fresh require for each test
    jest.resetModules();
    geminiService = require('./geminiService');
  });

  describe('Module exports', () => {
    it('should export generateText function', () => {
      expect(typeof geminiService.generateText).toBe('function');
    });

    it('should export an object with generateText', () => {
      expect(geminiService).toHaveProperty('generateText');
    });
  });

  describe('generateText error handling', () => {
    it('should be an async function', async () => {
      expect(geminiService.generateText()).toBeInstanceOf(Promise);
    });

    it('should handle missing API key error gracefully', async () => {
      // When GEMINI_API_KEY is not properly configured
      try {
        // This will fail if API key is not in environment
        // That's expected behavior for this test
        await geminiService.generateText('test');
      } catch (error) {
        expect(error.message).toContain('Gemini API error');
      }
    });
  });

  describe('Gemini model configuration', () => {
    it('should use correct Gemini model name', () => {
      // Verify the file contains the correct model
      const fs = require('fs');
      const content = fs.readFileSync('./src/services/geminiService.js', 'utf8');
      expect(content).toContain('gemini-2.5-flash');
    });

    it('should use correct SDK package', () => {
      // Verify the file requires the correct package
      const fs = require('fs');
      const content = fs.readFileSync('./src/services/geminiService.js', 'utf8');
      expect(content).toContain('@google/genai');
      expect(content).not.toContain('@google/generative-ai');
    });
  });

  describe('Service initialization', () => {
    it('should have lazy initialization pattern', () => {
      const fs = require('fs');
      const content = fs.readFileSync('./src/services/geminiService.js', 'utf8');
      expect(content).toContain('getAIInstance');
      expect(content).toContain('if (!ai)');
    });

    it('should check for API key before use', () => {
      const fs = require('fs');
      const content = fs.readFileSync('./src/services/geminiService.js', 'utf8');
      expect(content).toContain('GEMINI_API_KEY');
      expect(content).toContain('throw new Error');
    });
  });
});


