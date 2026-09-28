// Tests for Orchestrator, ExecutionAgent, and Integration Pipeline
const ExecutionAgent = require('./executionAgent');
const Orchestrator = require('./orchestrator');
const MonitoringAgent = require('./monitoringAgent');
const integrationService = require('../services/integrationService');
const githubDriver = require('../integrations/githubIntegration');
const awsDriver = require('../integrations/awsIntegration');
const dockerDriver = require('../integrations/dockerIntegration');
const digitaloceanDriver = require('../integrations/digitaloceanIntegration');
const vercelDriver = require('../integrations/vercelIntegration');
const Execution = require('../models/Execution');
const ExecutionLog = require('../models/ExecutionLog');

jest.mock('./monitoringAgent');
jest.mock('../services/integrationService');
jest.mock('../integrations/githubIntegration');
jest.mock('../integrations/awsIntegration');
jest.mock('../integrations/dockerIntegration');
jest.mock('../integrations/digitaloceanIntegration');
jest.mock('../integrations/vercelIntegration');
jest.mock('../models/Execution');
jest.mock('../models/ExecutionLog');

describe('Execution Agent & Integration Drivers Pipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MonitoringAgent.log.mockResolvedValue({});
    MonitoringAgent.emitExecutionStatus.mockImplementation(() => {});
    MonitoringAgent.emitNodeStatus.mockImplementation(() => {});
  });

  describe('User-Owned Credential Retrieval & Driver Dispatch', () => {
    it('should retrieve decrypted GitHub credentials and pass them to GitHub driver', async () => {
      const mockCreds = { personalAccessToken: 'ghp_secret_token_12345' };
      integrationService.getDecryptedIntegration.mockResolvedValue({
        provider: 'github',
        isConnected: true,
        credentials: mockCreds,
      });

      githubDriver.executeTask.mockResolvedValue({
        status: 'SUCCESS',
        commitHash: 'abc1234',
        repository: 'demo-app',
      });

      const node = {
        id: 'node-git-1',
        type: 'githubRepo',
        data: { label: 'Source Repo', config: { repoUrl: 'https://github.com/my/repo', branch: 'main' } },
      };

      const result = await ExecutionAgent.executeStep({
        executionId: 'exec-123',
        node,
        context: {},
        userId: 'user-456',
      });

      expect(integrationService.getDecryptedIntegration).toHaveBeenCalledWith('user-456', 'github');
      expect(githubDriver.executeTask).toHaveBeenCalledWith(
        'clone',
        { repoUrl: 'https://github.com/my/repo', branch: 'main' },
        mockCreds
      );
      expect(result.success).toBe(true);
      expect(result.output.commitSha).toBe('abc1234');
      expect(result.output.driverStatus).toBe('SUCCESS');
    });

    it('should retrieve decrypted AWS credentials and pass them to AWS driver', async () => {
      const mockCreds = { accessKeyId: 'AKIA123', secretAccessKey: 'SECRET456', region: 'us-west-2' };
      integrationService.getDecryptedIntegration.mockResolvedValue({
        provider: 'aws',
        isConnected: true,
        credentials: mockCreds,
      });

      awsDriver.executeTask.mockResolvedValue({
        status: 'SUCCESS',
        instanceId: 'i-mock12345',
        publicIp: '54.210.1.1',
      });

      const node = {
        id: 'node-aws-1',
        type: 'awsEC2',
        data: { label: 'EC2 Host', config: { instanceType: 't3.small', region: 'us-west-2' } },
      };

      const result = await ExecutionAgent.executeStep({
        executionId: 'exec-123',
        node,
        context: {},
        userId: 'user-456',
      });

      expect(integrationService.getDecryptedIntegration).toHaveBeenCalledWith('user-456', 'aws');
      expect(awsDriver.executeTask).toHaveBeenCalledWith(
        'provision',
        { resourceType: 'EC2 Instance', region: 'us-west-2' },
        mockCreds
      );
      expect(result.success).toBe(true);
      expect(result.output.instanceId).toBe('i-mock12345');
      expect(result.output.publicIp).toBe('54.210.1.1');
    });

    it('should retrieve decrypted Docker credentials and pass them to Docker driver', async () => {
      const mockCreds = { dockerHost: 'tcp://192.168.1.100:2375' };
      integrationService.getDecryptedIntegration.mockResolvedValue({
        provider: 'docker',
        isConnected: true,
        credentials: mockCreds,
      });

      dockerDriver.executeTask.mockResolvedValue({
        status: 'SUCCESS',
        containerId: 'c-mock-9988',
        exposedPort: 8080,
      });

      const node = {
        id: 'node-docker-1',
        type: 'dockerBuild',
        data: { label: 'Container Build', config: { imageName: 'custom-app:v1', containerPort: '8080:8080' } },
      };

      const result = await ExecutionAgent.executeStep({
        executionId: 'exec-123',
        node,
        context: {},
        userId: 'user-456',
      });

      expect(integrationService.getDecryptedIntegration).toHaveBeenCalledWith('user-456', 'docker');
      expect(dockerDriver.executeTask).toHaveBeenCalledWith(
        'buildAndRun',
        { imageName: 'custom-app:v1', port: '8080' },
        mockCreds
      );
      expect(result.success).toBe(true);
      expect(result.output.containerId).toBe('c-mock-9988');
    });

    it('should route digitaloceanDroplet nodes through DigitalOcean driver', async () => {
      const mockCreds = { apiToken: 'dop_v1_secret' };
      integrationService.getDecryptedIntegration.mockResolvedValue({
        provider: 'digitalocean',
        isConnected: true,
        credentials: mockCreds,
      });

      digitaloceanDriver.executeTask.mockResolvedValue({
        status: 'SUCCESS',
        dropletId: 'do-112233',
        ipAddress: '159.65.1.1',
      });

      const node = {
        id: 'node-do-1',
        type: 'digitaloceanDroplet',
        data: { label: 'DO Droplet', config: { dropletName: 'prod-droplet', region: 'sfo3', size: 's-2vcpu-2gb' } },
      };

      const result = await ExecutionAgent.executeStep({
        executionId: 'exec-123',
        node,
        context: {},
        userId: 'user-456',
      });

      expect(integrationService.getDecryptedIntegration).toHaveBeenCalledWith('user-456', 'digitalocean');
      expect(digitaloceanDriver.executeTask).toHaveBeenCalledWith(
        'provision',
        { dropletName: 'prod-droplet', region: 'sfo3', size: 's-2vcpu-2gb' },
        mockCreds
      );
      expect(result.success).toBe(true);
      expect(result.output.dropletId).toBe('do-112233');
      expect(result.output.ipAddress).toBe('159.65.1.1');
    });

    it('should route vercelDeploy nodes through Vercel driver', async () => {
      const mockCreds = { token: 'vercel_pat_secret' };
      integrationService.getDecryptedIntegration.mockResolvedValue({
        provider: 'vercel',
        isConnected: true,
        credentials: mockCreds,
      });

      vercelDriver.executeTask.mockResolvedValue({
        status: 'SUCCESS',
        deploymentId: 'dpl_abc999',
        url: 'https://my-app.vercel.app',
      });

      const node = {
        id: 'node-vercel-1',
        type: 'vercelDeploy',
        data: { label: 'Vercel Deployment', config: { projectName: 'my-app' } },
      };

      const result = await ExecutionAgent.executeStep({
        executionId: 'exec-123',
        node,
        context: {},
        userId: 'user-456',
      });

      expect(integrationService.getDecryptedIntegration).toHaveBeenCalledWith('user-456', 'vercel');
      expect(vercelDriver.executeTask).toHaveBeenCalledWith(
        'deploy',
        { projectName: 'my-app' },
        mockCreds
      );
      expect(result.success).toBe(true);
      expect(result.output.deploymentId).toBe('dpl_abc999');
      expect(result.output.url).toBe('https://my-app.vercel.app');
    });
  });

  describe('Missing, Disconnected, or Null Credentials Handling', () => {
    it('should execute safely with empty credentials if user has not configured the integration', async () => {
      integrationService.getDecryptedIntegration.mockResolvedValue(null);

      githubDriver.executeTask.mockResolvedValue({
        status: 'SUCCESS',
        commitHash: 'commit-fallback',
      });

      const node = {
        id: 'node-git-1',
        type: 'githubRepo',
        data: { label: 'GitHub Step', config: {} },
      };

      const result = await ExecutionAgent.executeStep({
        executionId: 'exec-123',
        node,
        context: {},
        userId: 'user-without-creds',
      });

      expect(githubDriver.executeTask).toHaveBeenCalledWith('clone', expect.any(Object), {});
      expect(result.success).toBe(true);
    });

    it('should handle integration service errors gracefully without crashing execution', async () => {
      integrationService.getDecryptedIntegration.mockRejectedValue(new Error('Decryption failed'));

      awsDriver.executeTask.mockResolvedValue({
        status: 'SUCCESS',
        instanceId: 'i-default',
      });

      const node = {
        id: 'node-aws-1',
        type: 'awsEC2',
        data: { label: 'AWS Step', config: {} },
      };

      const result = await ExecutionAgent.executeStep({
        executionId: 'exec-123',
        node,
        context: {},
        userId: 'user-err',
      });

      expect(result.success).toBe(true);
      expect(awsDriver.executeTask).toHaveBeenCalledWith('provision', expect.any(Object), {});
    });
  });

  describe('Credential Leakage Prevention in Logs & Telemetry', () => {
    it('should never log plain secret tokens in MonitoringAgent.log', async () => {
      const secretToken = 'ghp_SUPER_SECRET_TOKEN_DO_NOT_LEAK';
      integrationService.getDecryptedIntegration.mockResolvedValue({
        provider: 'github',
        isConnected: true,
        credentials: { personalAccessToken: secretToken },
      });

      githubDriver.executeTask.mockResolvedValue({
        status: 'SUCCESS',
        commitHash: 'safe123',
      });

      const node = {
        id: 'node-git-1',
        type: 'githubRepo',
        data: { label: 'Secure Repo' },
      };

      await ExecutionAgent.executeStep({
        executionId: 'exec-leak-test',
        node,
        context: {},
        userId: 'user-1',
      });

      const logCalls = MonitoringAgent.log.mock.calls;
      logCalls.forEach((callArgs) => {
        const payload = callArgs[0] || {};
        const msg = JSON.stringify(payload);
        expect(msg).not.toContain(secretToken);
      });
    });
  });
});
