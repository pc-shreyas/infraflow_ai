// server/src/agents/architectAgent.js
// 1st Agent in the 5-Agent Model: Resolves graph dependencies, topological order, and calculates risk index.

const MonitoringAgent = require('./monitoringAgent');

class ArchitectAgent {
  /**
   * Plans the workflow execution by performing topological sort and resolving variables.
   * @param {object} params
   * @param {string} params.executionId
   * @param {Array} params.nodes
   * @param {Array} params.edges
   * @returns {Promise<{ executionPlan: Array, riskIndex: string, dependencyMap: object }>}
   */
  static async plan({ executionId, nodes, edges }) {
    await MonitoringAgent.log({
      executionId,
      agent: 'architect',
      level: 'info',
      message: `[Architect Agent] Analyzing infrastructure graph (${nodes.length} nodes, ${edges.length} edges)...`,
      rawStreamOutput: `\x1b[36m[Architect Agent]\x1b[0m Inspecting ${nodes.length} infrastructure nodes for topological dependencies...\r\n`,
    });

    if (!nodes || nodes.length === 0) {
      throw new Error('Graph has no nodes to execute.');
    }

    // Build in-degree map and adjacency list
    const inDegree = new Map();
    const adjList = new Map();
    const nodeMap = new Map();

    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adjList.set(n.id, []);
      nodeMap.set(n.id, n);
    });

    edges.forEach((e) => {
      if (inDegree.has(e.target) && adjList.has(e.source)) {
        inDegree.set(e.target, inDegree.get(e.target) + 1);
        adjList.get(e.source).push(e.target);
      }
    });

    // Kahn's Algorithm for Topological Sort
    const queue = [];
    inDegree.forEach((deg, nodeId) => {
      if (deg === 0) queue.push(nodeId);
    });

    const executionPlan = [];
    while (queue.length > 0) {
      const u = queue.shift();
      executionPlan.push(nodeMap.get(u));

      for (const v of adjList.get(u) || []) {
        inDegree.set(v, inDegree.get(v) - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    // Cycle detection check
    if (executionPlan.length !== nodes.length) {
      const errorMsg = 'Cyclic dependency detected in workflow DAG. Cannot determine valid execution order.';
      await MonitoringAgent.log({
        executionId,
        agent: 'architect',
        level: 'error',
        message: `[Architect Agent] ERROR: ${errorMsg}`,
        rawStreamOutput: `\x1b[31m[Architect Agent] FATAL: Cyclic dependency detected!\x1b[0m\r\n`,
      });
      throw new Error(errorMsg);
    }

    // Calculate Risk Index based on provisions
    const types = nodes.map((n) => n.type);
    let riskScore = 0;
    if (types.includes('awsEC2')) riskScore += 3;
    if (types.includes('postgresDB')) riskScore += 2;
    if (types.includes('dockerBuild')) riskScore += 1;
    if (types.includes('nginxProxy')) riskScore += 1;

    let riskIndex = 'LOW';
    if (riskScore >= 5) riskIndex = 'HIGH';
    else if (riskScore >= 3) riskIndex = 'MEDIUM';

    await MonitoringAgent.log({
      executionId,
      agent: 'architect',
      level: 'success',
      message: `[Architect Agent] Execution plan validated. ${executionPlan.length} steps sequenced. Risk Index: ${riskIndex}.`,
      rawStreamOutput: `\x1b[32m[Architect Agent]\x1b[0m Topological sort completed. Order: [${executionPlan.map((n) => n.data?.label || n.type).join(' -> ')}]\r\n\x1b[33m[Architect Agent]\x1b[0m Calculated deployment risk profile: ${riskIndex}\r\n`,
    });

    return {
      executionPlan,
      riskIndex,
      dependencyMap: Object.fromEntries(adjList),
    };
  }
}

module.exports = ArchitectAgent;
