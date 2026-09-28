// Tests for Gemini Service - Unit & Integration tests
// Mock the @google/genai module so tests never make real API calls
const mockGenerateContent = jest.fn();
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

describe('Gemini Service - Structure and Error Handling', () => {
  let geminiService;
  
  beforeEach(() => {
    // Fresh require for each test
    jest.resetModules();
    jest.clearAllMocks();
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
      mockGenerateContent.mockResolvedValue({ text: 'sample output' });
      expect(geminiService.generateText('test')).toBeInstanceOf(Promise);
    });

    it('should handle missing API key error gracefully', async () => {
      const env = require('../config/env');
      const originalKey = env.GEMINI_API_KEY;
      env.GEMINI_API_KEY = '';

      try {
        await geminiService.generateText('test');
      } catch (error) {
        expect(error.message).toContain('Gemini API error');
      } finally {
        env.GEMINI_API_KEY = originalKey;
      }
    });

    it('should handle SDK errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Quota exceeded'));
      await expect(geminiService.generateText('test')).rejects.toThrow('Gemini API error: Quota exceeded');
    });

    it('should handle empty response text gracefully', async () => {
      mockGenerateContent.mockResolvedValue({});
      await expect(geminiService.generateText('test')).rejects.toThrow('Gemini API error: No text content in response');
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



