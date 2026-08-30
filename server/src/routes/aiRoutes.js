const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const { generateText } = require('../services/geminiService');
const { generateWorkflowGraph } = require('../services/aiService');

/**
 * GET /api/ai/test
 * 
 * Development-only endpoint to test Gemini API connectivity.
 * 
 * WARNING: This endpoint is for development testing only.
 * In production, this should be disabled or require authentication.
 */
router.get('/test', async (req, res, next) => {
    try {
        // This is a development endpoint - log the access
        console.log('[AI Routes] /test endpoint called');
        
        const response = await generateText(
            'Say hello! Confirm that Gemini API is connected to InfraFlow AI.'
        );

        res.status(200).json({
            success: true,
            message: 'Gemini API is working',
            data: {
                response,
            },
        });
    } catch (error) {
        console.error('[AI Routes] /test endpoint error:', error.message);
        next(error);
    }
});

/**
 * POST /api/ai/generate
 * 
 * Generate a workflow graph from natural language prompt.
 * 
 * Request body:
 * {
 *   "prompt": "Deploy a Node.js app with PostgreSQL and Nginx"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "workflow": { nodes, edges, name, description },
 *     "generatedBy": "openrouter|gemini|fallback"
 *   }
 * }
 */
router.post('/generate',
    [
        body('prompt')
            .trim()
            .notEmpty().withMessage('Prompt is required')
            .isLength({ min: 5, max: 2000 }).withMessage('Prompt must be between 5 and 2000 characters'),
    ],
    async (req, res, next) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: errors.array(),
                });
            }

            const { prompt } = req.body;
            console.log('[AI Routes] Generating workflow for prompt:', prompt.substring(0, 100));

            // Generate workflow
            const workflow = await generateWorkflowGraph(prompt);

            res.status(200).json({
                success: true,
                message: 'Workflow generated successfully',
                data: {
                    workflow,
                },
            });
        } catch (error) {
            console.error('[AI Routes] /generate endpoint error:', error.message);
            next(error);
        }
    }
);

module.exports = router;