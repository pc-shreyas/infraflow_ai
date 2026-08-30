import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Clock, Play } from 'lucide-react';
import AppShellHeader from '../../components/AppShell/Header';
import AppShellSidebar from '../../components/AppShell/Sidebar';
import AuthGuard from '../../components/ProtectedRoute/AuthGuard';
import api from '../../services/api';

const statusLabel = (status) => {
  if (status === 'COMPLETED') return 'Completed';
  if (['FAILED', 'CANCELLED'].includes(status)) return 'Failed';
  return 'In Progress';
};

const statusClass = (status) => {
  if (status === 'COMPLETED') return 'badge-success';
  if (['FAILED', 'CANCELLED'].includes(status)) return 'badge-danger';
  return 'badge-warning';
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

export default function ExecutionsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return undefined;
    let active = true;

    api.get('/executions')
      .then((response) => {
        if (active) setExecutions(response.data?.data?.executions || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load execution history.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [isMounted]);

  // Dates use the browser locale. Rendering only after mount avoids a server
  // locale/time-zone string differing from the first client render.
  if (!isMounted) return null;

  return (
    <AuthGuard>
      <Head>
        <title>Executions — InfraFlow AI</title>
        <meta name="description" content="InfraFlow AI workflow execution history." />
      </Head>

      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-base)' }}>
        <AppShellSidebar />
        <div style={{ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
          <AppShellHeader />
          <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            <div className="page-container" style={{ maxWidth: 1200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                <div style={{ display: 'grid', width: 42, height: 42, placeItems: 'center', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 10, background: 'rgba(34,211,238,0.1)' }}>
                  <Play size={19} color="var(--cyan-400)" />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Execution History</h1>
                  <p style={{ marginTop: 3, color: 'var(--text-secondary)' }}>Track your workflow deployments and open their live terminal streams.</p>
                </div>
              </div>

              {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading executions…</p> : null}
              {error ? <div className="alert alert-error">{error}</div> : null}

              {!loading && !error ? (
                <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
                  {executions.length ? (
                    <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
                          {['Execution ID', 'Status', 'Created', 'Workflow', ''].map((heading) => (
                            <th key={heading} style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{heading}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {executions.map((execution) => (
                          <tr key={execution._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '1rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--text-primary)' }}>#{String(execution._id).slice(-8)}</td>
                            <td style={{ padding: '1rem' }}><span className={`badge ${statusClass(execution.status)}`}>{statusLabel(execution.status)}</span></td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={14} />{formatTimestamp(execution.createdAt)}</span></td>
                            <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{execution.workflowId?.name || 'Deleted workflow'}</td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}><Link href={`/executions/${execution._id}`} className="btn btn-ghost" style={{ display: 'inline-flex', padding: '0.4rem 0.65rem', textDecoration: 'none' }}>View <ArrowRight size={14} /></Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                      <p style={{ fontWeight: 700 }}>No executions yet</p>
                      <p style={{ marginTop: 6, color: 'var(--text-secondary)' }}>Run a workflow to see its deployment history here.</p>
                      <Link href="/workflows" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '1.25rem', textDecoration: 'none' }}>Open Workflows</Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
