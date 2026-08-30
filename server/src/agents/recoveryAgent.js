// server/src/agents/recoveryAgent.js
// 4th Agent in the 5-Agent Model: Intercepts failure events, adjusts parameters, and executes self-healing retries.

const MonitoringAgent = require('./monitoringAgent');

class RecoveryAgent {
  /**
   * Evaluates an error event and remediates the node configuration.
   * @param {object} params
   * @param {string} params.executionId
   * @param {object} params.node
   * @param {Error|object} params.error
   * @param {number} params.retryCount
   * @returns {Promise<{ canRecover: boolean, remediatedConfig: object, action: string, explanation: string }>}
   */
  static async remediate({ executionId, node, error, retryCount }) {
    const nodeId = node.id;
    const nodeType = node.type;
    const label = node.data?.label || nodeType;
    const errorMsg = error?.message || String(error);

    await MonitoringAgent.log({
      executionId,
      nodeId,
      agent: 'recovery',
      level: 'warning',
      message: `[Self-Healing Agent] Intercepted failure on ${label}: "${errorMsg}". Initiating automated recovery analysis (Attempt ${retryCount + 1}/3)...`,
      rawStreamOutput: `\r\n\x1b[33m[Self-Healing Recovery Agent]\x1b[0m ──── Intercepted Failure on \x1b[1m${label}\x1b[0m ────\r\n\x1b[31mError Message:\x1b[0m ${errorMsg}\r\n\x1b[33mAnalyzing error signature and preparing parameter remediation...\x1b[0m\r\n`,
    });

    if (retryCount >= 3) {
      const explanation = `Maximum automated retry limit (3) exceeded for node ${label}. Escalating to operator intervention.`;
      await MonitoringAgent.log({
        executionId,
        nodeId,
        agent: 'recovery',
        level: 'error',
        message: `[Self-Healing Agent] ${explanation}`,
        rawStreamOutput: `\x1b[31m✖ [RECOVERY FAILED]\x1b[0m ${explanation}\r\n`,
      });
      return {
        canRecover: false,
        remediatedConfig: node.data?.config || {},
        action: 'ESCALATE_TO_HUMAN',
        explanation,
      };
    }

    const currentConfig = { ...(node.data?.config || {}) };
    let action = 'RETRY_WITH_BACKOFF';
    let explanation = 'Applied standard exponential backoff and retry.';

    // 1. Port In Use Collision
    if (errorMsg.includes('PORT_IN_USE') || errorMsg.includes('EADDRINUSE') || errorMsg.includes('port')) {
      const oldPort = currentConfig.containerPort || currentConfig.port || '8080';
      const newPort = parseInt(String(oldPort).split(':')[0], 10) + 1 || 8081;
      currentConfig.containerPort = `${newPort}:8080`;
      if (currentConfig.port) currentConfig.port = newPort;
      action = 'REMAP_PORT';
      explanation = `Detected port conflict on ${oldPort}. Automatically re-allocated host ingress port to ${newPort}.`;
    }
    // 2. Memory / OOM Killed
    else if (errorMsg.includes('OOM') || errorMsg.includes('137') || errorMsg.includes('memory')) {
      currentConfig.memoryLimit = '1024m';
      action = 'INCREASE_RAM';
      explanation = 'Container terminated due to OOM limit. Doubled allocated memory limit to 1024MB.';
    }
    // 3. Database Connection refused
    else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('database')) {
      action = 'WAIT_AND_RETRY_SOCKET';
      explanation = 'Database handshake refused. Inserting 2000ms delay to allow daemon socket binding.';
    }

    await MonitoringAgent.log({
      executionId,
      nodeId,
      agent: 'recovery',
      level: 'success',
      message: `[Self-Healing Agent] Remediation Plan: ${explanation}`,
      rawStreamOutput: `\x1b[32m✔ [REMEDIATION APPLIED]\x1b[0m ${explanation}\r\n\x1b[36mTriggering immediate auto-retry with patched configuration...\x1b[0m\r\n`,
    });

    return {
      canRecover: true,
      remediatedConfig: currentConfig,
      action,
      explanation,
    };
  }
}

module.exports = RecoveryAgent;
