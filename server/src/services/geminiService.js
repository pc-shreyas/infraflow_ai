const { GoogleGenAI } = require('@google/genai');
const env = require('../config/env');

let ai = null;

/**
 * Returns the lazily initialized GoogleGenAI instance.
 * @returns {GoogleGenAI}
 */
function getAIInstance() {
    if (!ai) {
        if (!env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        ai = new GoogleGenAI({
            apiKey: env.GEMINI_API_KEY,
        });
    }
    return ai;
}

/**
 * Generate text using Gemini API
 * @param {string} prompt - The prompt to send to the model
 * @returns {Promise<string>} The generated text response
 */
async function generateText(prompt) {
    try {
        const client = getAIInstance();
        
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // Handle streaming response (response.text should be available)
        if (!response.text) {
            throw new Error('No text content in response');
        }

        return response.text;
    } catch (error) {
        // Add context to error and re-throw
        const errorMsg = error.message || 'Unknown error';
        throw new Error(`Gemini API error: ${errorMsg}`);
    }
}

module.exports = {
    generateText,
};