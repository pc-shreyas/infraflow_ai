import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '../../components/ProtectedRoute/AuthGuard';
import TerminalStream from '../../components/Terminal/TerminalStream';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

const AGENTS = ['architect', 'execution', 'validation', 'recovery', 'monitoring'];
const TERMINAL_STATUSES = new Set(['COMPLETED', 'FAILED', 'CANCELLED']);
const displayStatus = (status) => String(status || 'PENDING').replace(/_/g, ' ');

export default function ExecutionDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [execution, setExecution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || Array.isArray(id)) return undefined;
    let active = true;
    setLoading(true);
    setError('');
    setSocket(getSocket());

    Promise.all([api.get(`/executions/${id}`), api.get(`/executions/${id}/terminal-logs`)])
      .then(([executionResponse, logsResponse]) => {
        if (!active) return;
        setExecution(executionResponse.data?.data?.execution || null);
        setLogs(logsResponse.data?.data?.logs || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Unable to load this execution.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [id]);

  const agentStatuses = useMemo(() => {
    const loggedAgents = new Set(logs.map((log) => log.agent));
    const terminal = TERMINAL_STATUSES.has(execution?.status);
    return AGENTS.map((agent) => ({
      name: agent,
      status: loggedAgents.has(agent) ? (terminal ? 'COMPLETE' : 'ACTIVE') : 'WAITING',
    }));
  }, [execution?.status, logs]);

  return (
    <AuthGuard>
      <main className="min-h-screen bg-slate-950 p-6 font-sans text-slate-100">
        <div className="mx-auto max-w-7xl space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div>
              <h1 className="font-mono text-xl font-bold text-emerald-400">Execution #{String(id || '').slice(-8)}</h1>
              <p className="mt-1 text-sm text-slate-400">Status: <span className="font-semibold text-slate-100">{displayStatus(execution?.status)}</span></p>
            </div>
            <button type="button" onClick={() => router.push('/dashboard')} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700">← Return to Dashboard</button>
          </header>

          {loading ? <p className="font-mono text-slate-400">Loading live deployment stream…</p> : null}
          {error ? <p role="alert" className="rounded-lg border border-red-900 bg-red-950/40 p-4 text-red-300">{error}</p> : null}

          {!loading && !error ? <>
            <section aria-label="Agent status" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {agentStatuses.map(({ name, status }) => (
                <div key={name} className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-center">
                  <span className="mb-2 block text-xs uppercase tracking-wider text-slate-400">{name} Agent</span>
                  <span className={`rounded border px-2 py-0.5 font-mono text-xs font-bold ${status === 'ACTIVE' ? 'border-emerald-800/50 bg-emerald-950/60 text-emerald-400' : status === 'COMPLETE' ? 'border-cyan-800/50 bg-cyan-950/60 text-cyan-300' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>{status}</span>
                </div>
              ))}
            </section>
            <section className="space-y-2">
              <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-slate-300">Live Agent Terminal Feed</h2>
              <TerminalStream logs={logs} socket={socket} executionId={id} />
            </section>
          </> : null}
        </div>
      </main>
    </AuthGuard>
  );
}
