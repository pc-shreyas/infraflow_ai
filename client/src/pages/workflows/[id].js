// client/src/pages/workflows/[id].js
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ReactFlowProvider, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { GitBranch, Save, Play, ChevronLeft, AlertCircle, Sparkles } from 'lucide-react';
import AuthGuard from '../../components/ProtectedRoute/AuthGuard';
import AppShellHeader from '../../components/AppShell/Header';
import AppShellSidebar from '../../components/AppShell/Sidebar';
import Canvas from '../../components/WorkflowCanvas/Canvas';
import NodePalette from '../../components/WorkflowCanvas/NodePalette';
import NodeConfigPanel from '../../components/WorkflowCanvas/NodeConfigPanel';
import useWorkflowStore from '../../store/workflowStore';

function WorkflowWorkspaceContent() {
  const router = useRouter();
  const { id } = router.query;
  const { currentWorkflow, isLoading, error, fetchWorkflow, updateWorkflow } = useWorkflowStore();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState('draft');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load workflow details
  useEffect(() => {
    if (id) {
      fetchWorkflow(id).then((w) => {
        if (w) {
          setNodes(w.nodes || []);
          setEdges(w.edges || []);
          setWorkflowName(w.name || '');
          setWorkflowDesc(w.description || '');
          setWorkflowStatus(w.status || 'draft');
        }
      });
    }
  }, [id, fetchWorkflow]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'var(--emerald-500)' } }, eds)),
    []
  );

  // Handle Drag & Drop Drop Event
  const onDrop = useCallback(
    (type, position) => {
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          config: {},
          status: 'idle',
        },
      };
      setNodes((nds) => nds.concat(newNode));
      setSelectedNodeId(newNode.id);
    },
    []
  );

  // Select Node to Config
  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Update Config from Panel
  const onUpdateNode = useCallback((nodeId, data) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data };
        }
        return node;
      })
    );
    setSaveSuccess(false);
  }, []);

  // Delete Node from Panel / Canvas
  const onDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNodeId(null);
    setSaveSuccess(false);
  }, []);

  // Save changes to database
  const handleSave = async () => {
    if (!workflowName.trim()) return;
    setSaveSuccess(false);
    const updated = await updateWorkflow(id, {
      name: workflowName,
      description: workflowDesc,
      status: workflowStatus,
      nodes,
      edges,
    });
    if (updated) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Dispatch execution orchestrator (built in Phase 4)
  const handleExecute = async () => {
    // Save current graph first
    await handleSave();
    // Navigate to execution view or hit route.
    try {
      const api = require('../../services/api').default;
      const res = await api.post(`/workflows/${id}/execute`);
      const executionId = res.data.data.executionId;
      router.push(`/executions/${executionId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to dispatch workflow execution.');
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-void)' }}>
      <AppShellSidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Workspace Toolbar */}
        <header
          style={{
            height: 'var(--header-height)',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            zIndex: 10,
          }}
        >
          {/* Left: Breadcrumbs & Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <button
              onClick={() => router.push('/workflows')}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '0.35rem 0.5rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="workspace-workflow-name"
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    padding: 0,
                    width: 200,
                  }}
                  placeholder="Enter name"
                />
                <span className={`badge ${workflowStatus === 'active' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                  {workflowStatus.toUpperCase()}
                </span>
              </div>
              <input
                id="workspace-workflow-desc"
                type="text"
                value={workflowDesc}
                onChange={(e) => setWorkflowDesc(e.target.value)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  outline: 'none',
                  padding: 0,
                  width: 300,
                }}
                placeholder="Workflow description..."
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              id="workspace-workflow-status-select"
              value={workflowStatus}
              onChange={(e) => setWorkflowStatus(e.target.value)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 6,
                padding: '0.4rem 0.6rem',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>

            <button
              id="workspace-save-workflow"
              className="btn btn-secondary"
              onClick={handleSave}
              disabled={isLoading}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.875rem' }}
            >
              <Save size={14} />
              {saveSuccess ? 'Saved!' : 'Save Graph'}
            </button>

            <button
              id="workspace-execute-workflow"
              className="btn btn-primary"
              onClick={handleExecute}
              style={{ fontSize: '0.8rem', padding: '0.45rem 0.875rem' }}
            >
              <Play size={14} fill="#fff" />
              Deploy Graph
            </button>
          </div>
        </header>

        {/* Workspace Canvas Frame */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Left panel palette */}
          <NodePalette />

          {/* Center Canvas */}
          <Canvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onNodeClick={onNodeClick}
          />

          {/* Right Panel configuration */}
          <NodeConfigPanel
            node={selectedNode}
            onUpdateNode={onUpdateNode}
            onDeleteNode={onDeleteNode}
            onClose={() => setSelectedNodeId(null)}
          />
        </div>
      </div>
    </div>
  );
}

export default function WorkflowWorkspace() {
  return (
    <AuthGuard>
      <ReactFlowProvider>
        <WorkflowWorkspaceContent />
      </ReactFlowProvider>
    </AuthGuard>
  );
}
