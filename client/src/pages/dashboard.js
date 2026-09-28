// client/src/pages/dashboard.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  GitBranch, Play, Plug, Zap, Activity, TrendingUp,
  Clock, CheckCircle, XCircle, ArrowRight, Terminal, Shield
} from 'lucide-react';
import AuthGuard from '../components/ProtectedRoute/AuthGuard';
import Header from '../components/AppShell/Header';
import Sidebar from '../components/AppShell/Sidebar';
import HealthCard from '../components/MetricGrid/HealthCard';
import useAuthStore from '../store/authStore';
import api from '../services/api';

// ── Quick Action Card ────────────────────────────────────────────────────────
const QuickAction = ({ icon: Icon, title, desc, href, color = 'var(--emerald-400)', delay = 0 }) => (
  <Link href={href} style={{ textDecoration: 'none' }}>
    <div
      className="card animate-fade-in-up"
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        <ArrowRight size={16} color="var(--text-muted)" />
      </div>
      <p style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{title}</p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{desc}</p>
    </div>
  </Link>
);

// ── Agent Status Row ─────────────────────────────────────────────────────────
const AgentRow = ({ name, role, status, color }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{name}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{role}</p>
      </div>
    </div>
    <span className={`badge ${status === 'Ready' ? 'badge-success' : 'badge-neutral'}`}>{status}</span>
  </div>
);

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    workflowsCount: 0,
    executionsCount: 0,
    successfulCount: 0,
    successRate: '—',
    integrationsCount: 0,
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchDashboardData = async () => {
      try {
        const [healthRes, workflowsRes, executionsRes, integrationsRes] = await Promise.allSettled([
          api.get('/health'),
          api.get('/workflows?limit=1'),
          api.get('/executions?limit=50'),
          api.get('/integrations'),
        ]);

        if (!active) return;

        // Health check response
        if (healthRes.status === 'fulfilled') {
          setHealthData(healthRes.value.data?.data || { status: 'ok', dbMode: 'mongodb' });
        } else {
          setHealthData({ status: 'degraded', dbMode: 'unknown' });
        }

        // Workflows count
        const workflowsTotal = workflowsRes.status === 'fulfilled'
          ? (workflowsRes.value.data?.data?.total ?? (workflowsRes.value.data?.data?.workflows?.length || 0))
          : 0;

        // Executions count and success rate
        let executionsTotal = 0;
        let successfulRuns = 0;
        let successRateStr = '—';

        if (executionsRes.status === 'fulfilled') {
          const execData = executionsRes.value.data?.data || {};
          executionsTotal = execData.total ?? (execData.executions?.length || 0);
          const executionList = execData.executions || [];
          successfulRuns = executionList.filter((e) => e.status === 'COMPLETED').length;

          if (executionsTotal > 0) {
            const calculatedRate = Math.round((successfulRuns / (execData.executions?.length || executionsTotal)) * 100);
            successRateStr = `${calculatedRate}%`;
          }
        }

        // Integrations count
        let integrationsTotal = 0;
        if (integrationsRes.status === 'fulfilled') {
          const intList = integrationsRes.value.data?.data || [];
          integrationsTotal = Array.isArray(intList)
            ? intList.filter((i) => i.isConnected).length
            : 0;
        }

        setMetrics({
          workflowsCount: workflowsTotal,
          executionsCount: executionsTotal,
          successfulCount: successfulRuns,
          successRate: successRateStr,
          integrationsCount: integrationsTotal,
        });
      } catch (_) {
        // Fallback gracefully
      } finally {
        if (active) {
          setHealthLoading(false);
          setMetricsLoading(false);
        }
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const agents = [
    { name: 'Architect Agent',  role: 'Planner / Topology',  status: 'Ready', color: 'var(--emerald-400)' },
    { name: 'Execution Agent',  role: 'Infrastructure Executor', status: 'Ready', color: 'var(--cyan-400)' },
    { name: 'Validation Agent', role: 'Security & Health Checks', status: 'Ready', color: 'var(--amber-400)' },
    { name: 'Recovery Agent',   role: 'Self-Healing Remediator',  status: 'Ready', color: '#a78bfa' },
    { name: 'Monitoring Agent', role: 'Live Telemetry & Logs',    status: 'Ready', color: '#fb7185' },
  ];

  return (
    <AuthGuard>
      <Head>
        <title>Dashboard — InfraFlow AI</title>
        <meta name="description" content="InfraFlow AI DevOps platform dashboard." />
      </Head>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
        <Header />
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar />

          {/* Main content */}
          <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

            {/* Welcome */}
            <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontSize: '1.625rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
                    <span style={{ color: 'var(--emerald-400)' }}>{user?.name?.split(' ')[0]}</span> 👋
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Your agentic DevOps workspace is ready. Deploy infrastructure with natural language.
                  </p>
                </div>
                {/* System status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 10 }}>
                  {healthLoading ? (
                    <span style={{ width: 14, height: 14, border: '2px solid var(--border-default)', borderTopColor: 'var(--emerald-400)', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: healthData?.status === 'ok' ? 'var(--emerald-400)' : 'var(--red-400)', animation: 'pulse-glow 2s infinite' }} />
                  )}
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {healthData?.status === 'ok' ? 'All Systems Operational' : 'System Degraded'}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      DB: {healthData?.dbMode || '…'} · {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metric / Health Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <HealthCard
                icon={GitBranch}
                label="Workflows"
                value={metrics.workflowsCount}
                sub={metrics.workflowsCount === 1 ? '1 active pipeline' : `${metrics.workflowsCount} active pipelines`}
                color="var(--emerald-400)"
                delay={50}
                loading={metricsLoading}
              />
              <HealthCard
                icon={Play}
                label="Executions"
                value={metrics.executionsCount}
                sub={metrics.executionsCount === 1 ? '1 total run' : `${metrics.executionsCount} total runs`}
                color="var(--cyan-400)"
                delay={100}
                loading={metricsLoading}
              />
              <HealthCard
                icon={CheckCircle}
                label="Success Rate"
                value={metrics.successRate}
                sub={metrics.executionsCount > 0 ? `${metrics.successfulCount} passed runs` : 'No runs recorded'}
                color="var(--amber-400)"
                delay={150}
                loading={metricsLoading}
              />
              <HealthCard
                icon={Plug}
                label="Integrations"
                value={metrics.integrationsCount}
                sub={metrics.integrationsCount === 1 ? '1 provider connected' : `${metrics.integrationsCount} providers connected`}
                color="#a78bfa"
                delay={200}
                loading={metricsLoading}
              />
            </div>

            {/* Middle grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

              {/* Quick actions */}
              <div>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Quick Actions
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <QuickAction icon={Zap}       title="New Workflow"       desc="Build with AI or manually"    href="/workflows/builder" color="var(--emerald-400)" delay={250} />
                  <QuickAction icon={Play}      title="View Executions"    desc="Monitor active deployments"   href="/executions"        color="var(--cyan-400)"    delay={300} />
                  <QuickAction icon={Plug}      title="Connect Providers"  desc="AWS, GitHub, Docker & more"   href="/integrations"      color="#a78bfa"            delay={350} />
                  <QuickAction icon={Shield}    title="Validate Setup"     desc="Run health checks"            href="/workflows"         color="var(--amber-400)"   delay={400} />
                </div>
              </div>

              {/* 5-Agent status panel */}
              <div>
                <h2 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  5-Agent Engine Status
                </h2>
                <div className="card" style={{ padding: '1.25rem' }}>
                  {agents.map((agent) => (
                    <AgentRow key={agent.name} {...agent} />
                  ))}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Terminal size={12} />
                    Agents activate on workflow execution in Phase 4.
                  </p>
                </div>
              </div>
            </div>

            {/* Getting started banner */}
            <div
              className="animate-fade-in-up"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.06) 100%)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 12,
                padding: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                animationDelay: '450ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--emerald-500), var(--cyan-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--emerald-glow)' }}>
                  <Zap size={22} color="#fff" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.15rem' }}>Ready to deploy infrastructure with AI?</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Type a plain-English prompt and let the 5-agent engine do the heavy lifting.
                  </p>
                </div>
              </div>
              <Link href="/workflows/builder">
                <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                  <Zap size={15} />
                  Start Building
                </button>
              </Link>
            </div>

          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

