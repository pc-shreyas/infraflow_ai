// Tests for AI Service - Workflow Generation
const aiService = require('./aiService');

// Mock the geminiService
jest.mock('./geminiService');
const geminiService = require('./geminiService');

describe('AI Service - Workflow Generation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateWorkflowGraph validation', () => {
    it('should throw error when prompt is empty', async () => {
      await expect(aiService.generateWorkflowGraph('')).rejects.toThrow(
        'An infrastructure intent prompt is required.'
      );
    });

    it('should throw error when prompt is whitespace only', async () => {
      await expect(aiService.generateWorkflowGraph('   ')).rejects.toThrow(
        'An infrastructure intent prompt is required.'
      );
    });

    it('should throw error when prompt is not a string', async () => {
      await expect(aiService.generateWorkflowGraph(123)).rejects.toThrow(
        'An infrastructure intent prompt is required.'
      );
    });

    it('should throw error when prompt is null', async () => {
      await expect(aiService.generateWorkflowGraph(null)).rejects.toThrow(
        'An infrastructure intent prompt is required.'
      );
    });
  });

  describe('Workflow structure validation', () => {
    beforeEach(() => {
      // Make Gemini fail so we test the fallback
      geminiService.generateText.mockRejectedValue(new Error('API down'));
    });

    it('should always return object with required properties', async () => {
      const result = await aiService.generateWorkflowGraph('Create infrastructure');

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
      expect(result).toHaveProperty('status');
    });

    it('should return nodes as an array', async () => {
      const result = await aiService.generateWorkflowGraph('Deploy app');

      expect(Array.isArray(result.nodes)).toBe(true);
    });

    it('should return edges as an array', async () => {
      const result = await aiService.generateWorkflowGraph('Deploy app');

      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should set status to draft', async () => {
      const result = await aiService.generateWorkflowGraph('Deploy app');

      expect(result.status).toBe('draft');
    });

    it('should create nodes with required fields', async () => {
      const result = await aiService.generateWorkflowGraph('Deploy Docker app');

      result.nodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('position');
        expect(node).toHaveProperty('data');
        expect(typeof node.id).toBe('string');
        expect(typeof node.type).toBe('string');
        expect(node.position).toHaveProperty('x');
        expect(node.position).toHaveProperty('y');
      });
    });

    it('should create edges with required fields', async () => {
      const result = await aiService.generateWorkflowGraph('Deploy Docker app with database');

      result.edges.forEach(edge => {
        expect(edge).toHaveProperty('id');
        expect(edge).toHaveProperty('source');
        expect(edge).toHaveProperty('target');
        expect(typeof edge.source).toBe('string');
        expect(typeof edge.target).toBe('string');
      });
    });
  });

  describe('Fallback Generator - Keyword Detection', () => {
    beforeEach(() => {
      geminiService.generateText.mockRejectedValue(new Error('API down'));
    });

    it('should detect Docker and create Docker node', async () => {
      const result = await aiService.generateWorkflowGraph('I need Docker container');

      const dockerNode = result.nodes.find(n => n.type === 'dockerBuild');
      expect(dockerNode).toBeDefined();
    });

    it('should detect container keyword and create Docker node', async () => {
      const result = await aiService.generateWorkflowGraph('Run my application in a container');

      const dockerNode = result.nodes.find(n => n.type === 'dockerBuild');
      expect(dockerNode).toBeDefined();
    });

    it('should detect PostgreSQL and create database node', async () => {
      const result = await aiService.generateWorkflowGraph('Setup PostgreSQL database');

      const dbNode = result.nodes.find(n => n.type === 'postgresDB');
      expect(dbNode).toBeDefined();
    });

    it('should detect database keyword and create database node', async () => {
      const result = await aiService.generateWorkflowGraph('I need a database for my app');

      const dbNode = result.nodes.find(n => n.type === 'postgresDB');
      expect(dbNode).toBeDefined();
    });

    it('should detect AWS and create EC2 node', async () => {
      const result = await aiService.generateWorkflowGraph('Deploy on AWS');

      const awsNode = result.nodes.find(n => n.type === 'awsEC2');
      expect(awsNode).toBeDefined();
    });

    it('should detect EC2 keyword and create EC2 node', async () => {
      const result = await aiService.generateWorkflowGraph('Launch an EC2 instance');

      const awsNode = result.nodes.find(n => n.type === 'awsEC2');
      expect(awsNode).toBeDefined();
    });

    it('should detect Nginx and create proxy node', async () => {
      const result = await aiService.generateWorkflowGraph('Setup Nginx reverse proxy');

      const nginxNode = result.nodes.find(n => n.type === 'nginxProxy');
      expect(nginxNode).toBeDefined();
    });

    it('should detect SSL and create proxy node', async () => {
      const result = await aiService.generateWorkflowGraph('Setup SSL certificate with proxy');

      const nginxNode = result.nodes.find(n => n.type === 'nginxProxy');
      expect(nginxNode).toBeDefined();
    });

    it('should detect GitHub/Git and create repo node', async () => {
      const result = await aiService.generateWorkflowGraph('Sync code from GitHub');

      const gitNode = result.nodes.find(n => n.type === 'githubRepo');
      expect(gitNode).toBeDefined();
    });

    it('should create a basic pipeline when no keywords match', async () => {
      const result = await aiService.generateWorkflowGraph('Generic infrastructure request');

      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.edges).toBeDefined();
    });
  });

  describe('Gemini Provider Integration', () => {
    it('should use Gemini when it returns valid workflow JSON', async () => {
      const mockWorkflow = {
        name: 'Gemini Generated Pipeline',
        description: 'From Gemini',
        nodes: [{ id: 'n1', type: 'dockerBuild', position: { x: 100, y: 180 }, data: { label: 'Build', config: {} } }],
        edges: [],
      };

      geminiService.generateText.mockResolvedValue(JSON.stringify(mockWorkflow));

      const result = await aiService.generateWorkflowGraph('Docker deployment');

      expect(result.name).toContain('Gemini Generated Pipeline');
      expect(geminiService.generateText).toHaveBeenCalled();
    });

    it('should fall back when Gemini fails', async () => {
      geminiService.generateText.mockRejectedValue(new Error('API error'));

      const result = await aiService.generateWorkflowGraph('Docker app');

      expect(result.nodes.length).toBeGreaterThan(0);
    });

    it('should fall back when Gemini returns invalid JSON', async () => {
      geminiService.generateText.mockResolvedValue('{ invalid json }');

      const result = await aiService.generateWorkflowGraph('Infrastructure');

      expect(result.nodes.length).toBeGreaterThan(0);
    });

    it('should fall back when Gemini times out', async () => {
      geminiService.generateText.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 10)
        )
      );

      const result = await aiService.generateWorkflowGraph('Setup infrastructure');

      expect(result.nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Name and Description Generation', () => {
    beforeEach(() => {
      geminiService.generateText.mockRejectedValue(new Error('API down'));
    });

    it('should generate descriptive name from prompt', async () => {
      const result = await aiService.generateWorkflowGraph('Deploy production application with monitoring');

      expect(result.name).toBeTruthy();
      expect(result.name.length).toBeGreaterThan(0);
    });

    it('should include prompt in description', async () => {
      const prompt = 'Setup multi-tier architecture';
      const result = await aiService.generateWorkflowGraph(prompt);

      expect(result.description).toBeTruthy();
      expect(result.description).toContain(prompt);
    });
  });
});

