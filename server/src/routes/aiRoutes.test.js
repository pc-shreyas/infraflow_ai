// Tests for AI Routes
const express = require('express');
const request = require('supertest');
const aiRoutes = require('./aiRoutes');
const aiService = require('../services/aiService');
const geminiService = require('../services/geminiService');

// Mock the services
jest.mock('../services/aiService');
jest.mock('../services/geminiService');

describe('AI Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);

    // Add error handler
    app.use((err, req, res, next) => {
      res.status(500).json({
        success: false,
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {},
      });
    });

    jest.clearAllMocks();
  });

  describe('GET /api/ai/test', () => {
    it('should return success when Gemini is working', async () => {
      geminiService.generateText.mockResolvedValue(
        'Hello! Gemini API is connected to InfraFlow AI.'
      );

      const response = await request(app)
        .get('/api/ai/test')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Gemini API is working');
      expect(response.body.data).toHaveProperty('response');
    });

    it('should return error when Gemini fails', async () => {
      geminiService.generateText.mockRejectedValue(
        new Error('Gemini API error: Invalid API key')
      );

      const response = await request(app)
        .get('/api/ai/test')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Gemini API error');
    });

    it('should handle timeout errors gracefully', async () => {
      geminiService.generateText.mockRejectedValue(
        new Error('Gemini API timeout')
      );

      const response = await request(app)
        .get('/api/ai/test')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ai/generate', () => {
    it('should generate workflow with valid prompt', async () => {
      const mockWorkflow = {
        name: 'Test Pipeline',
        description: 'Test workflow',
        nodes: [{ id: 'n1', type: 'dockerBuild', position: { x: 100, y: 100 }, data: {} }],
        edges: [],
        status: 'draft',
      };

      aiService.generateWorkflowGraph.mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 'Deploy a Docker application' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('workflow');
      expect(response.body.data.workflow.name).toBe('Test Pipeline');
    });

    it('should reject request without prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject prompt that is too short', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 'App' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject prompt that is too long', async () => {
      const longPrompt = 'a'.repeat(2001);

      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: longPrompt })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept prompt with valid length (5-2000 chars)', async () => {
      const validPrompt = 'Deploy Node.js app with PostgreSQL';

      aiService.generateWorkflowGraph.mockResolvedValue({
        name: 'Test',
        nodes: [],
        edges: [],
        status: 'draft',
      });

      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: validPrompt })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should trim whitespace from prompt', async () => {
      const promptWithWhitespace = '  Deploy application  ';

      aiService.generateWorkflowGraph.mockResolvedValue({
        name: 'Test',
        nodes: [],
        edges: [],
        status: 'draft',
      });

      await request(app)
        .post('/api/ai/generate')
        .send({ prompt: promptWithWhitespace })
        .expect(200);

      expect(aiService.generateWorkflowGraph).toHaveBeenCalledWith(
        'Deploy application'
      );
    });

    it('should return error when AI service fails', async () => {
      aiService.generateWorkflowGraph.mockRejectedValue(
        new Error('AI service error')
      );

      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 'Create infrastructure' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should handle generation timeout', async () => {
      aiService.generateWorkflowGraph.mockImplementation(
        () => new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Generation timeout')), 50)
        )
      );

      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 'Very complex infrastructure setup' });

      expect(response.body.success).toBe(false);
    });

    it('should return structured workflow response', async () => {
      const mockWorkflow = {
        name: 'Production Pipeline',
        description: 'Multi-tier production setup',
        nodes: [
          {
            id: 'git-1',
            type: 'githubRepo',
            position: { x: 100, y: 180 },
            data: {
              label: 'Source Code',
              config: { repoUrl: 'https://github.com/org/app', branch: 'main' },
              status: 'idle',
            },
          },
          {
            id: 'docker-1',
            type: 'dockerBuild',
            position: { x: 400, y: 180 },
            data: {
              label: 'Docker Build',
              config: { dockerfilePath: './Dockerfile', imageName: 'app', containerPort: '8080:8080' },
              status: 'idle',
            },
          },
        ],
        edges: [
          {
            id: 'edge-git-docker',
            source: 'git-1',
            target: 'docker-1',
            animated: true,
            style: { stroke: 'var(--emerald-500)' },
          },
        ],
        status: 'draft',
      };

      aiService.generateWorkflowGraph.mockResolvedValue(mockWorkflow);

      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 'Production infrastructure' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('generated successfully');
      expect(response.body.data.workflow).toEqual(mockWorkflow);
      expect(response.body.data.workflow.nodes).toHaveLength(2);
      expect(response.body.data.workflow.edges).toHaveLength(1);
    });

    it('should reject non-string prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject null prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: null })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle Content-Type application/json', async () => {
      aiService.generateWorkflowGraph.mockResolvedValue({
        name: 'Test',
        nodes: [],
        edges: [],
        status: 'draft',
      });

      const response = await request(app)
        .post('/api/ai/generate')
        .set('Content-Type', 'application/json')
        .send({ prompt: 'Generate workflow' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for undefined routes', async () => {
      const response = await request(app)
        .get('/api/ai/undefined-route')
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON in request', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Express can return either 400 Bad Request or 500 depending on middleware
      // The important thing is it doesn't crash
      expect([400, 500]).toContain(response.status);
    });
  });
});
