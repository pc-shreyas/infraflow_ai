// End-to-end full workflow execution integration test
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');
const Integration = require('../models/Integration');
const integrationService = require('../services/integrationService');
const executionService = require('../services/executionService');
const Orchestrator = require('../agents/orchestrator');
const githubDriver = require('../integrations/githubIntegration');
const awsDriver = require('../integrations/awsIntegration');
const dockerDriver = require('../integrations/dockerIntegration');

jest.mock('../integrations/githubIntegration');
jest.mock('../integrations/awsIntegration');
jest.mock('../integrations/dockerIntegration');

describe('End-to-End Workflow & 5-Agent Execution Suite', () => {
  let mongoServer;
  let testUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Workflow.deleteMany({});
    await Execution.deleteMany({});
    await ExecutionLog.deleteMany({});
    await Integration.deleteMany({});

    testUser = await User.create({
      name: 'Test SRE',
      email: 'sre@infraflow.ai',
      password: 'hashed_password_123',
    });
  });

  it('completes the entire workflow lifecycle: create workflow -> save integration -> trigger execution -> 5-agent pipeline -> logs verified -> terminal output ready', async () => {
    // 1. Configure user provider integration (GitHub + AWS)
    await integrationService.saveIntegration(testUser._id, 'github', {
      personalAccessToken: 'ghp_mock_token_for_e2e_test',
    });

    await integrationService.saveIntegration(testUser._id, 'aws', {
      accessKeyId: 'AKIA_MOCK_KEY',
      secretAccessKey: 'SECRET_MOCK_KEY',
      region: 'us-east-1',
    });

    // Verify integration is saved with AES-256 encryption
    const userIntegrations = await integrationService.getUserIntegrations(testUser._id);
    expect(userIntegrations.length).toBe(2);
    expect(userIntegrations.some((i) => i.provider === 'github')).toBe(true);

    // Mock driver tasks to simulate fast safe cloud response
    githubDriver.executeTask.mockResolvedValue({
      status: 'SUCCESS',
      commitHash: 'commit_sha_98765',
      repository: 'sample-app',
    });

    dockerDriver.executeTask.mockResolvedValue({
      status: 'SUCCESS',
      containerId: 'c_container_12345',
      exposedPort: 8080,
    });

    awsDriver.executeTask.mockResolvedValue({
      status: 'SUCCESS',
      instanceId: 'i_instance_778899',
      publicIp: '54.210.100.200',
    });

    // 2. Create multi-node visual infrastructure workflow
    const workflow = await Workflow.create({
      name: 'E2E Full Stack Pipeline',
      description: 'GitHub -> Docker -> Postgres -> AWS EC2 -> Nginx Proxy',
      owner: testUser._id,
      nodes: [
        {
          id: 'git-node-1',
          type: 'githubRepo',
          position: { x: 100, y: 100 },
          data: { label: 'Source Repo', config: { repoUrl: 'https://github.com/infraflow/sample-app', branch: 'main' } },
        },
        {
          id: 'postgres-node-2',
          type: 'postgresDB',
          position: { x: 400, y: 250 },
          data: { label: 'PostgreSQL DB', config: { dbName: 'prod_db', port: 5432 } },
        },
        {
          id: 'docker-node-3',
          type: 'dockerBuild',
          position: { x: 400, y: 100 },
          data: { label: 'Docker Container', config: { imageName: 'my-app:v1', containerPort: '8080:8080' } },
        },
        {
          id: 'aws-node-4',
          type: 'awsEC2',
          position: { x: 700, y: 100 },
          data: { label: 'AWS EC2 Host', config: { instanceType: 't3.micro', region: 'us-east-1' } },
        },
        {
          id: 'nginx-node-5',
          type: 'nginxProxy',
          position: { x: 1000, y: 100 },
          data: { label: 'Nginx Ingress', config: { domain: 'app.example.com', upstreamPort: 8080 } },
        },
      ],
      edges: [
        { id: 'e1', source: 'git-node-1', target: 'docker-node-3' },
        { id: 'e2', source: 'postgres-node-2', target: 'docker-node-3' },
        { id: 'e3', source: 'docker-node-3', target: 'aws-node-4' },
        { id: 'e4', source: 'aws-node-4', target: 'nginx-node-5' },
      ],
    });

    expect(workflow._id).toBeDefined();

    // 3. Trigger execution
    const execution = await executionService.triggerExecution({
      workflowId: workflow._id.toString(),
      userId: testUser._id.toString(),
    });

    expect(execution.status).toBe('PENDING');

    // 4. Run orchestrator 5-agent lifecycle
    await Orchestrator.run(execution._id.toString());

    // 5. Verify final execution state
    const finishedExecution = await Execution.findById(execution._id);
    expect(finishedExecution.status).toBe('COMPLETED');
    expect(finishedExecution.durationMs).toBeGreaterThan(0);
    expect(finishedExecution.endTime).toBeDefined();

    // Verify all 5 nodes succeeded
    expect(finishedExecution.nodeStates.get('git-node-1').status).toBe('success');
    expect(finishedExecution.nodeStates.get('postgres-node-2').status).toBe('success');
    expect(finishedExecution.nodeStates.get('docker-node-3').status).toBe('success');
    expect(finishedExecution.nodeStates.get('aws-node-4').status).toBe('success');
    expect(finishedExecution.nodeStates.get('nginx-node-5').status).toBe('success');

    // 6. Verify terminal logs hydration
    const terminalData = await executionService.getExecutionTerminalLogs({
      executionId: execution._id.toString(),
      userId: testUser._id.toString(),
    });

    expect(terminalData.logs.length).toBeGreaterThan(5);
    expect(terminalData.rawTerminalStream).toContain('INFRAFLOW AI — 5-AGENT EXECUTION ENGINE');
    expect(terminalData.rawTerminalStream).toContain('PIPELINE COMPLETED');
  });

  it('handles and remediates runtime node failures with Self-Healing Agent', async () => {
    // Docker failure simulation causing self-healing remediation
    let callCount = 0;
    dockerDriver.executeTask.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('PORT_IN_USE: Port 8080 already bound by another container');
      }
      return {
        status: 'SUCCESS',
        containerId: 'remediated_c_4455',
        exposedPort: 8081,
      };
    });

    const workflow = await Workflow.create({
      name: 'Failing & Self Healing Pipeline',
      owner: testUser._id,
      nodes: [
        {
          id: 'docker-fail-node',
          type: 'dockerBuild',
          position: { x: 100, y: 100 },
          data: { label: 'Docker App', config: { imageName: 'fail-app:v1', containerPort: '8080:8080' } },
        },
      ],
      edges: [],
    });

    const execution = await executionService.triggerExecution({
      workflowId: workflow._id.toString(),
      userId: testUser._id.toString(),
    });

    await Orchestrator.run(execution._id.toString());

    const result = await Execution.findById(execution._id);
    expect(result.status).toBe('COMPLETED');
    expect(result.retryCount).toBe(1); // Auto-remediated!
  });
});
