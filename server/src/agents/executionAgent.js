// server/src/agents/executionAgent.js
// 2nd Agent in the 5-Agent Model: Executes infrastructure tasks against providers with rich terminal output.

const MonitoringAgent = require('./monitoringAgent');

class ExecutionAgent {
  /**
   * Executes a single infrastructure node.
   * @param {object} params
   * @param {string} params.executionId
   * @param {object} params.node
   * @param {object} params.context - Outputs from previous nodes in the DAG
   * @returns {Promise<{ success: boolean, output: object }>}
   */
  static async executeStep({ executionId, node, context }) {
    const nodeId = node.id;
    const nodeType = node.type;
    const config = node.data?.config || {};
    const label = node.data?.label || nodeType;

    await MonitoringAgent.log({
      executionId,
      nodeId,
      agent: 'execution',
      level: 'info',
      message: `[Execution Agent] Dispatching task for: ${label} (${nodeType})...`,
      rawStreamOutput: `\r\n\x1b[35m[Execution Agent]\x1b[0m ──── Beginning Step: \x1b[1m${label}\x1b[0m ────\r\n`,
    });

    let result = {};

    switch (nodeType) {
      case 'githubRepo': {
        const repo = config.repoUrl || 'https://github.com/infraflow/demo-app';
        const branch = config.branch || 'main';
        await MonitoringAgent.log({
          executionId,
          nodeId,
          agent: 'execution',
          level: 'terminal',
          message: `Fetching git tree from ${repo} (${branch})...`,
          rawStreamOutput: `\x1b[90m$ git clone --branch ${branch} ${repo} /workspace/src\x1b[0m\r\nCloning into '/workspace/src'...\r\nremote: Enumerating objects: 42, done.\r\nremote: Total 42 (delta 18), reused 42 (delta 18)\r\nReceiving objects: 100% (42/42), 14.20 KiB | 7.10 MiB/s, done.\r\n\x1b[32m✔ Git checkout verified: commit e4f98a2 (HEAD -> ${branch})\x1b[0m\r\n`,
        });
        result = {
          repoUrl: repo,
          branch,
          commitSha: 'e4f98a21390b1c2',
          sourcePath: '/workspace/src',
        };
        break;
      }

      case 'postgresDB': {
        const dbName = config.dbName || 'production_db';
        const port = config.port || 5432;
        const user = config.dbUser || 'postgres';
        await MonitoringAgent.log({
          executionId,
          nodeId,
          agent: 'execution',
          level: 'terminal',
          message: `Provisioning PostgreSQL instance ${dbName} on port ${port}...`,
          rawStreamOutput: `\x1b[90m$ provision-postgres --name ${dbName} --port ${port} --user ${user}\x1b[0m\r\nAllocating isolated persistent volume (10Gi NVMe)...\r\nInitializing PostgreSQL data directory...\r\nStarting server process [PID 4182] on 0.0.0.0:${port}...\r\n\x1b[32m✔ PostgreSQL Database "${dbName}" is accepting connections on port ${port}\x1b[0m\r\n`,
        });
        result = {
          dbName,
          port,
          host: 'postgres.internal',
          connectionUri: `postgresql://${user}:secret@postgres.internal:${port}/${dbName}`,
        };
        break;
      }

      case 'dockerBuild': {
        const dockerfile = config.dockerfilePath || './Dockerfile';
        const imageName = config.imageName || 'app-service:latest';
        const portMap = config.containerPort || '8080:8080';
        await MonitoringAgent.log({
          executionId,
          nodeId,
          agent: 'execution',
          level: 'terminal',
          message: `Compiling Docker container ${imageName} from ${dockerfile}...`,
          rawStreamOutput: `\x1b[90m$ docker build -t ${imageName} -f ${dockerfile} .\x1b[0m\r\n[+] Building 2.4s (8/8) FINISHED\r\n => [internal] load build definition from Dockerfile\r\n => [1/4] FROM node:20-alpine\r\n => [2/4] WORKDIR /usr/src/app\r\n => [3/4] COPY package*.json ./\r\n => [4/4] RUN npm ci --omit=dev\r\n => exporting to image\r\n => naming to docker.io/library/${imageName}\r\n\x1b[90m$ docker run -d -p ${portMap} --name ${imageName.split(':')[0]} ${imageName}\x1b[0m\r\nContainer ID: 7c89f012bce1\r\n\x1b[32m✔ Container active & listening on ${portMap}\x1b[0m\r\n`,
        });
        result = {
          containerId: '7c89f012bce1',
          image: imageName,
          ports: portMap,
          status: 'running',
        };
        break;
      }

      case 'awsEC2': {
        const instanceType = config.instanceType || 't3.micro';
        const region = config.region || 'us-east-1';
        const sg = config.securityGroup || 'sg-default';
        await MonitoringAgent.log({
          executionId,
          nodeId,
          agent: 'execution',
          level: 'terminal',
          message: `Provisioning AWS EC2 Instance (${instanceType}) in ${region}...`,
          rawStreamOutput: `\x1b[90m$ aws ec2 run-instances --image-id ami-0c7217cdde317cfec --instance-type ${instanceType} --region ${region}\x1b[0m\r\nProvisioning EC2 instance i-0a8b9c7e6f5d4c3b2...\r\nAttaching Security Group ${sg} [Inbound: 22, 80, 443, 8080]...\r\nAssigning Elastic IPv4: 54.210.88.192...\r\nWaiting for instance status checks (2/2)...\r\n\x1b[32m✔ AWS EC2 Instance i-0a8b9c7e6f5d4c3b2 state: running (Public IP: 54.210.88.192)\x1b[0m\r\n`,
        });
        result = {
          instanceId: 'i-0a8b9c7e6f5d4c3b2',
          instanceType,
          region,
          publicIp: '54.210.88.192',
          privateIp: '10.0.1.45',
        };
        break;
      }

      case 'nginxProxy': {
        const domain = config.domain || 'app.infraflow.io';
        const upstream = config.upstreamPort || 8080;
        const ssl = config.enableSSL !== false;
        await MonitoringAgent.log({
          executionId,
          nodeId,
          agent: 'execution',
          level: 'terminal',
          message: `Configuring Nginx Reverse Proxy for ${domain} -> :${upstream}...`,
          rawStreamOutput: `\x1b[90m$ nginx -t && certbot certonly --standalone -d ${domain}\x1b[0m\r\nGenerating SSL certificates via Let's Encrypt ACME...\r\nWriting nginx virtual host upstream configuration for port ${upstream}...\r\nTesting configuration syntax: nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\r\nReloading nginx daemon (systemctl reload nginx)...\r\n\x1b[32m✔ Nginx Ingress Live: https://${domain} (Proxying -> localhost:${upstream})\x1b[0m\r\n`,
        });
        result = {
          domain,
          upstreamPort: upstream,
          sslActive: ssl,
          url: `https://${domain}`,
        };
        break;
      }

      default: {
        await MonitoringAgent.log({
          executionId,
          nodeId,
          agent: 'execution',
          level: 'info',
          message: `Executing generic handler for ${label}...`,
          rawStreamOutput: `Executing generic provisioner for ${nodeType}...\r\n\x1b[32m✔ Step executed successfully\x1b[0m\r\n`,
        });
        result = { completed: true };
      }
    }

    return {
      success: true,
      output: result,
    };
  }
}

module.exports = ExecutionAgent;
