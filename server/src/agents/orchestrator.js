// server/src/agents/orchestrator.js
// Central pipeline engine coordinating the 5-Agent model execution lifecycle.

const Execution = require('../models/Execution');
const ArchitectAgent = require('./architectAgent');
const ExecutionAgent = require('./executionAgent');
const ValidationAgent = require('./validationAgent');
const RecoveryAgent = require('./recoveryAgent');
const MonitoringAgent = require('./monitoringAgent');

class Orchestrator {
  /**
   * Executes a workflow run through all 5 agent modules.
   * @param {string} executionId
   */
  static async run(executionId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      console.error(`[Orchestrator] Execution ${executionId} not found.`);
      return;
    }

    const startTime = Date.now();
    execution.status = 'RUNNING';
    execution.startTime = new Date(startTime);
    await execution.save();

    MonitoringAgent.emitExecutionStatus(executionId, 'RUNNING');

    await MonitoringAgent.log({
      executionId,
      agent: 'orchestrator',
      level: 'info',
      message: `[Orchestrator] Initiating 5-Agent Execution Pipeline for execution ID: ${executionId}`,
      rawStreamOutput: `\x1b[1m\x1b[36m╔══════════════════════════════════════════════════════════════╗\r\n║             INFRAFLOW AI — 5-AGENT EXECUTION ENGINE          ║\r\n╚══════════════════════════════════════════════════════════════╝\x1b[0m\r\nExecution ID: ${executionId}\r\nTimestamp   : ${new Date().toISOString()}\r\n\r\n`,
    });

    const snapshot = execution.workflowSnapshot || {};
    const nodes = snapshot.nodes || [];
    const edges = snapshot.edges || [];

    const nodeStates = new Map();
    const context = {}; // Shared context carrying outputs from earlier nodes

    try {
      // ── 1. ARCHITECT AGENT ─────────────────────────────────────────────────
      const { executionPlan, riskIndex } = await ArchitectAgent.plan({
        executionId,
        nodes,
        edges,
      });

      // Initialize states in execution map
      executionPlan.forEach((n) => {
        nodeStates.set(n.id, { status: 'idle', output: null });
        MonitoringAgent.emitNodeStatus(executionId, n.id, 'idle');
      });

      // ── 2. EXECUTION & VALIDATION LOOP ────────────────────────────────────
      for (const node of executionPlan) {
        // Check for cancellation
        const currentExecution = await Execution.findById(executionId).select('status');
        if (currentExecution?.status === 'CANCELLED') {
          await MonitoringAgent.log({
            executionId,
            agent: 'orchestrator',
            level: 'warning',
            message: '[Orchestrator] Execution was cancelled by operator.',
            rawStreamOutput: `\x1b[33m[Orchestrator] Pipeline cancelled by operator.\x1b[0m\r\n`,
          });
          return;
        }

        let nodeSuccess = false;
        let retryCount = 0;
        let currentNode = { ...node };

        while (!nodeSuccess && retryCount <= 3) {
          try {
            // Update node status to running
            nodeStates.set(currentNode.id, { status: 'running' });
            execution.nodeStates = nodeStates;
            await execution.save();
            MonitoringAgent.emitNodeStatus(executionId, currentNode.id, 'running');

            // ── EXECUTE ──
            const execResult = await ExecutionAgent.executeStep({
              executionId,
              node: currentNode,
              context,
            });

            // ── VALIDATE ──
            const valResult = await ValidationAgent.validate({
              executionId,
              node: currentNode,
              output: execResult.output,
            });

            if (!valResult.valid && valResult.issues.length > 0) {
              throw new Error(`Validation failed: ${valResult.issues.join('; ')}`);
            }

            // Save output to context for downstream nodes
            context[currentNode.id] = execResult.output;
            nodeStates.set(currentNode.id, { status: 'success', output: execResult.output });
            execution.nodeStates = nodeStates;
            await execution.save();

            MonitoringAgent.emitNodeStatus(executionId, currentNode.id, 'success', execResult.output);
            nodeSuccess = true;
          } catch (err) {
            // ── 4. SELF-HEALING RECOVERY AGENT ──
            execution.status = 'REMEDIATING';
            await execution.save();
            MonitoringAgent.emitExecutionStatus(executionId, 'REMEDIATING');
            MonitoringAgent.emitNodeStatus(executionId, currentNode.id, 'remediating');

            const recovery = await RecoveryAgent.remediate({
              executionId,
              node: currentNode,
              error: err,
              retryCount,
            });

            if (recovery.canRecover) {
              retryCount++;
              execution.retryCount += 1;
              currentNode = {
                ...currentNode,
                data: {
                  ...currentNode.data,
                  config: recovery.remediatedConfig,
                },
              };
              execution.status = 'RUNNING';
              await execution.save();
              MonitoringAgent.emitExecutionStatus(executionId, 'RUNNING');
            } else {
              // Fatal failure
              nodeStates.set(currentNode.id, { status: 'failed', error: err.message });
              execution.nodeStates = nodeStates;
              execution.status = 'FAILED';
              execution.endTime = new Date();
              execution.durationMs = Date.now() - startTime;
              execution.errorDetails = {
                failedNodeId: currentNode.id,
                message: err.message,
              };
              await execution.save();

              MonitoringAgent.emitNodeStatus(executionId, currentNode.id, 'failed');
              MonitoringAgent.emitExecutionStatus(executionId, 'FAILED', { durationMs: execution.durationMs });

              await MonitoringAgent.log({
                executionId,
                nodeId: currentNode.id,
                agent: 'orchestrator',
                level: 'error',
                message: `[Orchestrator] Execution pipeline FAILED on step: ${currentNode.data?.label || currentNode.type}`,
                rawStreamOutput: `\r\n\x1b[31m✖ [PIPELINE FAILED]\x1b[0m Deployment terminated after ${execution.durationMs}ms with error: ${err.message}\r\n`,
              });
              return;
            }
          }
        }
      }

      // ── 5. PIPELINE COMPLETION ─────────────────────────────────────────────
      const durationMs = Date.now() - startTime;
      execution.status = 'COMPLETED';
      execution.endTime = new Date();
      execution.durationMs = durationMs;
      await execution.save();

      MonitoringAgent.emitExecutionStatus(executionId, 'COMPLETED', { durationMs });

      await MonitoringAgent.log({
        executionId,
        agent: 'orchestrator',
        level: 'success',
        message: `[Orchestrator] Pipeline COMPLETED successfully in ${durationMs}ms with ${nodes.length} provisions active.`,
        rawStreamOutput: `\r\n\x1b[32m✔ [PIPELINE COMPLETED]\x1b[0m All infrastructure steps verified and active in ${durationMs}ms.\r\n\x1b[36mDeployment live and telemetry online.\x1b[0m\r\n`,
      });
    } catch (fatalErr) {
      execution.status = 'FAILED';
      execution.endTime = new Date();
      execution.durationMs = Date.now() - startTime;
      execution.errorDetails = { message: fatalErr.message };
      await execution.save();

      MonitoringAgent.emitExecutionStatus(executionId, 'FAILED', { durationMs: execution.durationMs });

      await MonitoringAgent.log({
        executionId,
        agent: 'orchestrator',
        level: 'error',
        message: `[Orchestrator] Fatal architecture error: ${fatalErr.message}`,
        rawStreamOutput: `\r\n\x1b[31m✖ [FATAL ARCHITECTURE ERROR]\x1b[0m ${fatalErr.message}\r\n`,
      });
    }
  }
}

module.exports = Orchestrator;
