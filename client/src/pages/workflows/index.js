// client/src/pages/workflows/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { GitBranch, Plus, Sparkles, Trash2, Calendar, FileText, Play } from 'lucide-react';
import AuthGuard from '../../components/ProtectedRoute/AuthGuard';
import AppShellHeader from '../../components/AppShell/Header';
import AppShellSidebar from '../../components/AppShell/Sidebar';
import useWorkflowStore from '../../store/workflowStore';

export default function WorkflowsIndex() {
  const router = useRouter();
  const { workflows, isLoading, error, fetchWorkflows, createWorkflow, deleteWorkflow, generateWorkflow } = useWorkflowStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newWorkflow.name.trim()) return;

    const created = await createWorkflow(newWorkflow);
    if (created) {
      setShowCreateModal(false);
      setNewWorkflow({ name: '', description: '' });
      router.push(`/workflows/${created._id}`);
    }
  };

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setLocalLoading(true);
    const generated = await generateWorkflow(aiPrompt);
    setLocalLoading(false);
    if (generated) {
      setShowAIModal(false);
      setAiPrompt('');
      router.push(`/workflows/${generated._id}`);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this workflow? This cannot be undone.')) {
      await deleteWorkflow(id);
    }
  };

  return (
    <AuthGuard>
      <Head>
        <title>Workflows — InfraFlow AI</title>
      </Head>

      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-void)' }}>
        <AppShellSidebar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AppShellHeader />

          {/* Main workspace scroll */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            <div className="page-container" style={{ maxWidth: 1100, padding: 0 }}>
              {/* Header block */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                    Infrastructure Workflows
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Construct visual DevOps DAG pipelines and trigger agent executions.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link
                    id="open-ai-generator"
                    href="/workflows/builder"
                    className="btn btn-secondary"
                    style={{ border: '1px solid rgba(16,185,129,0.3)', color: 'var(--emerald-400)', textDecoration: 'none' }}
                  >
                    <Sparkles size={16} />
                    AI Architect
                  </Link>
                  <button
                    id="create-new-workflow"
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <Plus size={16} />
                    Manual Build
                  </button>
                </div>
              </div>

              {/* Error state */}
              {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                  <span>{error}</span>
                </div>
              )}

              {/* Empty state */}
              {!isLoading && workflows.length === 0 && (
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 14,
                    padding: '4rem 2rem',
                    textAlign: 'center',
                    maxWidth: 600,
                    margin: '2rem auto 0',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      background: 'rgba(16,185,129,0.06)',
                      color: 'var(--emerald-400)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.25rem',
                    }}
                  >
                    <GitBranch size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    No Workflows Found
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    Get started by designing a workflow manually or utilizing natural language to generate one with AI.
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setShowAIModal(true)}
                      style={{ color: 'var(--emerald-400)' }}
                    >
                      <Sparkles size={14} />
                      AI Prompt
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                      Create Manually
                    </button>
                  </div>
                </div>
              )}

              {/* Grid List */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1.25rem',
                }}
              >
                {workflows.map((w) => (
                  <Link
                    key={w._id}
                    href={`/workflows/${w._id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span
                            className={`badge ${
                              w.status === 'active' ? 'badge-success' : 'badge-neutral'
                            }`}
                          >
                            {w.status.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            v{w.version || 1}
                          </span>
                        </div>

                        <h3
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            marginBottom: '0.375rem',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {w.name}
                        </h3>
                        <p
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.825rem',
                            lineHeight: 1.4,
                            marginBottom: '1rem',
                            height: '2.8rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {w.description || 'No description provided.'}
                        </p>
                      </div>

                      <div>
                        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0.75rem 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={12} />
                            <span>{new Date(w.createdAt || w.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                              onClick={(e) => handleDelete(w._id, e)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: 2,
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red-400)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Manual creation Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 460,
              padding: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Create Workflow</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Assign a name and optional description to your cloud deployment canvas.
            </p>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-workflow-name">Workflow Name</label>
                <input
                  id="new-workflow-name"
                  className="form-input"
                  type="text"
                  placeholder="EC2 Webapp Cluster"
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-workflow-desc">Description</label>
                <textarea
                  id="new-workflow-desc"
                  className="form-input"
                  placeholder="AWS deployment graph mapping docker, ec2 and nginx"
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button id="submit-create-workflow" type="submit" className="btn btn-primary">
                  Create & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Prompt Modal */}
      {showAIModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 520,
              padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles size={20} color="var(--emerald-400)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>AI Generator Prompt</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Describe the infrastructure layout in plain English (e.g., "Deploy Node.js dockerized app and a Postgres database on an AWS EC2 instance, secure it behind Nginx").
            </p>

            <form onSubmit={handleAIGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="ai-workflow-prompt">Infrastructure Intent Prompt</label>
                <textarea
                  id="ai-workflow-prompt"
                  className="form-input"
                  placeholder="Deploy my docker build of repository 'main-api' onto EC2 with automated health checks..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={4}
                  style={{ resize: 'none', fontSize: '0.9rem' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAIModal(false)}
                  disabled={localLoading}
                >
                  Cancel
                </button>
                <button
                  id="submit-ai-generator"
                  type="submit"
                  className="btn btn-primary"
                  disabled={localLoading}
                >
                  {localLoading ? 'Generating...' : 'Convert to Graph'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
