// client/src/pages/workflows/builder.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Sparkles, Terminal, ArrowRight, Layers, Cpu, Server, Database, Container } from 'lucide-react';
import AuthGuard from '../../components/ProtectedRoute/AuthGuard';
import AppShellHeader from '../../components/AppShell/Header';
import AppShellSidebar from '../../components/AppShell/Sidebar';
import useWorkflowStore from '../../store/workflowStore';

const TEMPLATE_PROMPTS = [
  {
    title: 'Full Stack Node.js & Postgres on AWS',
    prompt: 'Deploy a Node.js repository from GitHub with Docker, connected to a PostgreSQL database on AWS EC2 behind an Nginx reverse proxy with SSL.',
    icon: Server,
    color: '#ff9900',
  },
  {
    title: 'Containerized Microservice & Ingress',
    prompt: 'Build and deploy a Docker container from GitHub main branch and configure an Nginx proxy with automated SSL.',
    icon: Container,
    color: '#099cec',
  },
  {
    title: 'PostgreSQL Database Provisioning',
    prompt: 'Provision a standalone PostgreSQL production database with secure ingress and backup configuration.',
    icon: Database,
    color: '#336791',
  },
];

export default function WorkflowsBuilderPage() {
  const router = useRouter();
  const { generateWorkflow, createWorkflow, isLoading, error } = useWorkflowStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    setLocalError('');

    if (!prompt.trim()) {
      setLocalError('Please describe the infrastructure requirements.');
      return;
    }

    setIsGenerating(true);
    const result = await generateWorkflow(prompt);
    setIsGenerating(false);

    if (result && result._id) {
      router.push(`/workflows/${result._id}`);
    } else {
      setLocalError('Failed to generate workflow. Please try again or create manually.');
    }
  };

  const handleCreateBlank = async () => {
    const created = await createWorkflow({
      name: 'Untitled Infrastructure',
      description: 'Manual scratchpad layout',
    });
    if (created && created._id) {
      router.push(`/workflows/${created._id}`);
    }
  };

  return (
    <AuthGuard>
      <Head>
        <title>Workflow Builder — InfraFlow AI</title>
      </Head>

      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-void)' }}>
        <AppShellSidebar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AppShellHeader />

          <main style={{ flex: 1, overflowY: 'auto', padding: '2.5rem 1.5rem' }}>
            <div className="page-container" style={{ maxWidth: 800, padding: 0 }}>
              {/* Header Title */}
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    padding: '0.35rem 0.875rem',
                    borderRadius: 999,
                    color: 'var(--emerald-400)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                  }}
                >
                  <Sparkles size={14} />
                  Agentic AI Infrastructure Generator
                </div>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
                  What do you want to build?
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 540, margin: '0 auto' }}>
                  Describe your architecture in plain English. InfraFlow converts your intent into an executable visual DAG.
                </p>
              </div>

              {/* Main Prompt Card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 14,
                  padding: '1.75rem',
                  marginBottom: '2rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
                }}
              >
                {(localError || error) && (
                  <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                    <span>{localError || error}</span>
                  </div>
                )}

                <form onSubmit={handleGenerate}>
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" htmlFor="builder-prompt-input" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <Terminal size={14} />
                      Infrastructure Intent Specification
                    </label>
                    <textarea
                      id="builder-prompt-input"
                      className="form-input"
                      rows={4}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Deploy my Node.js application repository from GitHub onto AWS EC2 with Docker containerization, PostgreSQL database, and Nginx reverse proxy..."
                      style={{ fontSize: '0.95rem', lineHeight: 1.5, resize: 'none' }}
                      disabled={isGenerating}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={handleCreateBlank}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.875rem' }}
                      disabled={isGenerating}
                    >
                      <Layers size={15} />
                      Start from Empty Canvas
                    </button>

                    <button
                      id="builder-generate-submit"
                      type="submit"
                      className="btn btn-primary glow-emerald"
                      disabled={isGenerating || !prompt.trim()}
                      style={{ padding: '0.65rem 1.5rem', fontSize: '0.925rem' }}
                    >
                      {isGenerating ? (
                        <>
                          <span
                            style={{
                              width: 16,
                              height: 16,
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderTopColor: '#fff',
                              borderRadius: '50%',
                              display: 'inline-block',
                              animation: 'spin 1s linear infinite',
                            }}
                          />
                          Generating Architecture DAG…
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          Generate Architecture DAG
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Template Suggestion Chips */}
              <div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: '0.875rem',
                  }}
                >
                  Or start with a pre-configured architecture prompt:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {TEMPLATE_PROMPTS.map((t, idx) => {
                    const Icon = t.icon;
                    return (
                      <div
                        key={idx}
                        onClick={() => setPrompt(t.prompt)}
                        style={{
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 10,
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = t.color;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <div
                            style={{
                              background: `${t.color}15`,
                              color: t.color,
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Icon size={14} />
                          </div>
                          <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {t.title}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                          {t.prompt}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
