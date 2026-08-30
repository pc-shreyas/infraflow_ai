// server/src/services/aiService.js
// Converts natural language infrastructure intent into an executable node-graph.
// Priority: OpenRouter -> Gemini SDK -> Deterministic Rule-Based Fallback.

const env = require('../config/env');
const geminiService = require('./geminiService');

/**
 * Deterministic rule-based fallback generator.
 * Parses keywords from the prompt and constructs a structured DAG.
 * @param {string} prompt
 * @returns {object} Workflow graph with nodes and edges
 */
const generateDeterministicWorkflow = (prompt) => {
  const p = prompt.toLowerCase();
  const nodes = [];
  const edges = [];

  let xPos = 100;
  const yBase = 180;

  // 1. Source Repository
  const hasGit = p.includes('git') || p.includes('repo') || p.includes('code') || p.includes('node') || p.includes('react') || p.includes('python');
  let gitNodeId = null;
  if (hasGit || !p.includes('database only')) {
    gitNodeId = `githubRepo-${Date.now()}-1`;
    nodes.push({
      id: gitNodeId,
      type: 'githubRepo',
      position: { x: xPos, y: yBase },
      data: {
        label: 'Source Code (GitHub)',
        config: {
          repoUrl: 'https://github.com/infraflow/sample-app',
          branch: 'main',
        },
        status: 'idle',
      },
    });
    xPos += 300;
  }

  // 2. Database (Postgres)
  const hasDB = p.includes('postgres') || p.includes('database') || p.includes('db') || p.includes('sql');
  let dbNodeId = null;
  if (hasDB) {
    dbNodeId = `postgresDB-${Date.now()}-2`;
    nodes.push({
      id: dbNodeId,
      type: 'postgresDB',
      position: { x: xPos, y: yBase + 180 },
      data: {
        label: 'PostgreSQL Database',
        config: {
          dbName: 'app_production',
          dbUser: 'infra_admin',
          port: 5432,
        },
        status: 'idle',
      },
    });
  }

  // 3. Docker Build
  const hasDocker = p.includes('docker') || p.includes('container') || p.includes('image') || hasGit;
  let dockerNodeId = null;
  if (hasDocker) {
    dockerNodeId = `dockerBuild-${Date.now()}-3`;
    nodes.push({
      id: dockerNodeId,
      type: 'dockerBuild',
      position: { x: xPos, y: yBase },
      data: {
        label: 'Docker Container Build',
        config: {
          dockerfilePath: './Dockerfile',
          imageName: 'app-service',
          containerPort: '8080:8080',
        },
        status: 'idle',
      },
    });

    if (gitNodeId) {
      edges.push({
        id: `edge-${gitNodeId}-${dockerNodeId}`,
        source: gitNodeId,
        target: dockerNodeId,
        animated: true,
        style: { stroke: 'var(--emerald-500)' },
      });
    }

    if (dbNodeId) {
      edges.push({
        id: `edge-${dbNodeId}-${dockerNodeId}`,
        source: dbNodeId,
        target: dockerNodeId,
        animated: true,
        style: { stroke: 'var(--cyan-400)' },
      });
    }

    xPos += 300;
  }

  // 4. AWS EC2 Cloud Host
  const hasAWS = p.includes('aws') || p.includes('ec2') || p.includes('cloud') || p.includes('server') || p.includes('deploy') || p.includes('vm');
  let awsNodeId = null;
  if (hasAWS || nodes.length === 0) {
    awsNodeId = `awsEC2-${Date.now()}-4`;
    nodes.push({
      id: awsNodeId,
      type: 'awsEC2',
      position: { x: xPos, y: yBase },
      data: {
        label: 'AWS EC2 Production Host',
        config: {
          instanceType: 't3.micro',
          region: 'us-east-1',
          securityGroup: 'sg-infraflow-default',
        },
        status: 'idle',
      },
    });

    if (dockerNodeId) {
      edges.push({
        id: `edge-${dockerNodeId}-${awsNodeId}`,
        source: dockerNodeId,
        target: awsNodeId,
        animated: true,
        style: { stroke: 'var(--emerald-500)' },
      });
    }

    xPos += 300;
  }

  // 5. Nginx Proxy / Ingress
  const hasNginx = p.includes('nginx') || p.includes('proxy') || p.includes('ssl') || p.includes('domain') || p.includes('https');
  if (hasNginx) {
    const nginxNodeId = `nginxProxy-${Date.now()}-5`;
    nodes.push({
      id: nginxNodeId,
      type: 'nginxProxy',
      position: { x: xPos, y: yBase },
      data: {
        label: 'Nginx SSL Reverse Proxy',
        config: {
          domain: 'app.infraflow.io',
          upstreamPort: 8080,
          enableSSL: true,
        },
        status: 'idle',
      },
    });

    const upstreamTarget = awsNodeId || dockerNodeId;
    if (upstreamTarget) {
      edges.push({
        id: `edge-${upstreamTarget}-${nginxNodeId}`,
        source: upstreamTarget,
        target: nginxNodeId,
        animated: true,
        style: { stroke: 'var(--emerald-500)' },
      });
    }
  }

  // Derive workflow name from intent
  const words = prompt.split(' ').slice(0, 5).join(' ');
  const name = words.charAt(0).toUpperCase() + words.slice(1) || 'Generated Infrastructure Pipeline';

  return {
    name,
    description: `Auto-generated visual infrastructure graph for prompt: "${prompt}"`,
    nodes,
    edges,
    status: 'draft',
  };
};

/**
 * Cleans and parses JSON output from LLM responses.
 * @param {string} raw
 * @returns {object|null}
 */
const parseJSONFromLLM = (raw) => {
  try {
    // If encapsulated in markdown blocks, strip them
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[AI Service] Failed to parse JSON directly from LLM response:', err.message);
    return null;
  }
};

/**
 * Formats layout coordinates for LLM nodes if missing or overlapping.
 * @param {object} parsedGraph
 * @returns {object}
 */
const sanitizeAndLayoutGraph = (parsedGraph, prompt) => {
  if (!parsedGraph || !Array.isArray(parsedGraph.nodes) || parsedGraph.nodes.length === 0) {
    return generateDeterministicWorkflow(prompt);
  }

  const nodes = parsedGraph.nodes.map((node, index) => {
    const type = node.type || 'dockerBuild';
    const position = node.position && typeof node.position.x === 'number'
      ? node.position
      : { x: 100 + index * 300, y: 180 };

    return {
      id: node.id || `${type}-${Date.now()}-${index}`,
      type,
      position,
      data: {
        label: node.data?.label || `${type} Node`,
        config: node.data?.config || {},
        status: 'idle',
      },
    };
  });

  const validNodeIds = new Set(nodes.map((n) => n.id));
  const edges = (parsedGraph.edges || [])
    .filter((e) => validNodeIds.has(e.source) && validNodeIds.has(e.target))
    .map((e, idx) => ({
      id: e.id || `edge-${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: 'var(--emerald-500)' },
    }));

  return {
    name: parsedGraph.name || 'AI Generated Infrastructure',
    description: parsedGraph.description || `Pipeline generated for intent: "${prompt}"`,
    nodes,
    edges,
    status: 'draft',
  };
};

/**
 * Main AI workflow generation orchestrator.
 * Priority: OpenRouter -> Gemini SDK -> Deterministic Rule-Based Fallback.
 * @param {string} prompt
 * @returns {Promise<object>}
 */
const generateWorkflowGraph = async (prompt) => {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw new Error('An infrastructure intent prompt is required.');
  }

  const systemPrompt = `You are an expert DevOps and SRE Infrastructure Architect AI.
Convert the user's natural language request into a valid JSON node-graph DAG for InfraFlow AI.

User Request: "${prompt}"

Valid node types:
- "githubRepo": Git source repository (config: { repoUrl, branch, accessToken })
- "dockerBuild": Docker build and container run (config: { dockerfilePath, imageName, containerPort })
- "awsEC2": AWS EC2 VM host (config: { instanceType, region, securityGroup })
- "postgresDB": PostgreSQL database (config: { dbName, dbUser, port })
- "nginxProxy": Nginx reverse proxy with SSL (config: { domain, upstreamPort, enableSSL })

Output ONLY a JSON object with this exact structure (NO extra text, NO markdown fences):
{
  "name": "Concise Pipeline Name",
  "description": "Short explanation of the architecture",
  "nodes": [
    {
      "id": "githubRepo-1",
      "type": "githubRepo",
      "position": { "x": 100, "y": 180 },
      "data": {
        "label": "Source Code",
        "config": { "repoUrl": "https://github.com/org/app", "branch": "main" }
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "githubRepo-1",
      "target": "dockerBuild-1"
    }
  ]
}`;

  // 1. Try OpenRouter if configured
  if (env.OPENROUTER_API_KEY) {
    try {
      console.log('[AI Service] Attempting OpenRouter generation...');
      const response = await Promise.race([
        fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.CLIENT_URL,
            'X-Title': 'InfraFlow AI',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [{ role: 'user', content: systemPrompt }],
          }),
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OpenRouter timeout')), 6000)
        ),
      ]);

      if (response.ok) {
        const json = await response.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = parseJSONFromLLM(content);
          if (parsed) {
            console.log('[AI Service] Successfully generated graph via OpenRouter.');
            return sanitizeAndLayoutGraph(parsed, prompt);
          }
        }
      } else {
        console.warn(`[AI Service] OpenRouter returned status ${response.status}`);
      }
    } catch (err) {
      console.warn('[AI Service] OpenRouter generation failed:', err.message);
      // Fall through to Gemini
    }
  }

  // 2. Try Gemini if configured
  if (env.GEMINI_API_KEY) {
    try {
      console.log('[AI Service] Attempting Gemini generation...');
      const text = await Promise.race([
        geminiService.generateText(systemPrompt),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
        ),
      ]);

      if (text && text.trim()) {
        const parsed = parseJSONFromLLM(text);
        if (parsed) {
          console.log('[AI Service] Successfully generated graph via Gemini.');
          return sanitizeAndLayoutGraph(parsed, prompt);
        } else {
          console.warn('[AI Service] Gemini returned unparseable JSON');
        }
      }
    } catch (err) {
      console.warn('[AI Service] Gemini generation failed:', err.message);
      // Fall through to deterministic fallback
    }
  }

  // 3. Fallback to deterministic rule engine
  console.log('[AI Service] Using deterministic rule-based generator (no external AI available or all providers failed).');
  return generateDeterministicWorkflow(prompt);
};

module.exports = {
  generateWorkflowGraph,
  generateDeterministicWorkflow,
};
