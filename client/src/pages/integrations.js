// client/src/pages/integrations.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Plug, CheckCircle2, XCircle, ShieldCheck, Key, RefreshCw, Trash2,
  ExternalLink, AlertCircle, Eye, EyeOff, Server, Container, Github, Plus
} from 'lucide-react';
import AuthGuard from '../components/ProtectedRoute/AuthGuard';
import AppShellHeader from '../components/AppShell/Header';
import AppShellSidebar from '../components/AppShell/Sidebar';
import api from '../services/api';

const PROVIDER_METADATA = {
  aws: {
    name: 'Amazon Web Services',
    icon: Server,
    color: '#ff9900',
    description: 'Provision and control EC2 instances, security groups, and VPC infrastructure.',
    fields: [
      { key: 'accessKeyId', label: 'AWS Access Key ID', placeholder: 'AKIAIOSFODNN7EXAMPLE', type: 'text' },
      { key: 'secretAccessKey', label: 'AWS Secret Access Key', placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', type: 'password' },
      { key: 'region', label: 'Default Region', placeholder: 'us-east-1', type: 'text', default: 'us-east-1' }
    ]
  },
  github: {
    name: 'GitHub',
    icon: Github,
    color: '#2ea44f',
    description: 'Clone private source repositories, inspect branches, and configure CI/CD triggers.',
    fields: [
      { key: 'personalAccessToken', label: 'Personal Access Token (PAT)', placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }
    ]
  },
  docker: {
    name: 'Docker Engine',
    icon: Container,
    color: '#099cec',
    description: 'Connect to remote Docker socket/daemon to build and run container images.',
    fields: [
      { key: 'dockerHost', label: 'Docker Daemon Host / Socket', placeholder: 'unix:///var/run/docker.sock or tcp://127.0.0.1:2375', type: 'text', default: 'unix:///var/run/docker.sock' }
    ]
  },
  digitalocean: {
    name: 'DigitalOcean',
    icon: Server,
    color: '#0080ff',
    description: 'Provision Droplets, VPC networks, and managed volumes via DigitalOcean API.',
    fields: [
      { key: 'apiToken', label: 'Personal Access Token (apiToken)', placeholder: 'dop_v1_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' }
    ]
  },
  vercel: {
    name: 'Vercel',
    icon: ExternalLink,
    color: '#ffffff',
    description: 'Deploy serverless frontend apps, Next.js bundles, and manage edge domains.',
    fields: [
      { key: 'token', label: 'API Access Token', placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' },
      { key: 'teamId', label: 'Team ID (Optional)', placeholder: 'team_xxxxxxxxxxxx', type: 'text' }
    ]
  }
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState(null);
  const [modalProvider, setModalProvider] = useState(null);
  const [formData, setFormData] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [alert, setAlert] = useState(null);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/integrations');
      const list = res.data?.data || [];
      const map = {};
      list.forEach((item) => {
        map[item.provider] = item;
      });
      setIntegrations(map);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load integrations status.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const openConnectModal = (providerKey) => {
    const meta = PROVIDER_METADATA[providerKey];
    const initialForm = {};
    meta.fields.forEach((f) => {
      initialForm[f.key] = f.default || '';
    });
    setFormData(initialForm);
    setShowSecrets({});
    setModalProvider(providerKey);
  };

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleShowSecret = (fieldKey) => {
    setShowSecrets((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleSaveIntegration = async (e) => {
    if (e) e.preventDefault();
    if (!modalProvider) return;

    setSavingProvider(modalProvider);
    setAlert(null);

    try {
      const res = await api.post('/integrations', {
        provider: modalProvider,
        credentials: formData,
        metadata: {
          configuredAt: new Date().toISOString()
        }
      });

      setAlert({
        type: 'success',
        message: res.data?.message || `Successfully connected ${PROVIDER_METADATA[modalProvider].name}.`
      });

      setModalProvider(null);
      setFormData({});
      await fetchIntegrations();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || `Failed to save ${PROVIDER_METADATA[modalProvider].name} credentials.`
      });
    } finally {
      setSavingProvider(null);
    }
  };

  const handleDisconnect = async (providerKey) => {
    if (!confirm(`Are you sure you want to disconnect ${PROVIDER_METADATA[providerKey].name}?`)) {
      return;
    }

    setDisconnectingProvider(providerKey);
    setAlert(null);

    try {
      const res = await api.delete(`/integrations/${providerKey}`);
      setAlert({
        type: 'success',
        message: res.data?.message || `Disconnected ${PROVIDER_METADATA[providerKey].name}.`
      });
      await fetchIntegrations();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || `Failed to disconnect ${PROVIDER_METADATA[providerKey].name}.`
      });
    } finally {
      setDisconnectingProvider(null);
    }
  };

  return (
    <AuthGuard>
      <Head>
        <title>Integrations & Credentials — InfraFlow AI</title>
        <meta name="description" content="Manage encrypted DevOps provider integrations." />
      </Head>

      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-void)' }}>
        <AppShellSidebar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AppShellHeader />

          <main style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.5rem' }}>
            <div className="page-container" style={{ maxWidth: 1000, padding: 0 }}>
              
              {/* Top Banner */}
              <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Plug size={18} color="var(--emerald-400)" />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                      DevOps Integrations
                    </h1>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Connect cloud infrastructure and developer tooling. All credentials are encrypted at rest using AES-256-GCM.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface)', padding: '0.5rem 0.875rem', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <ShieldCheck size={16} color="var(--emerald-400)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    AES-256-GCM Encryption Active
                  </span>
                </div>
              </div>

              {/* Alert Message */}
              {alert && (
                <div className={`alert ${alert.type === 'error' ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1.5rem' }}>
                  {alert.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                  <span style={{ flex: 1 }}>{alert.message}</span>
                  <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
                </div>
              )}

              {/* Providers Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {Object.entries(PROVIDER_METADATA).map(([key, meta]) => {
                  const Icon = meta.icon;
                  const item = integrations[key];
                  const isConnected = item && item.isConnected;

                  return (
                    <div
                      key={key}
                      className="card"
                      style={{
                        background: 'var(--bg-surface)',
                        border: `1px solid ${isConnected ? 'rgba(16,185,129,0.35)' : 'var(--border-subtle)'}`,
                        borderRadius: 12,
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 10,
                                background: `${meta.color}15`,
                                border: `1px solid ${meta.color}30`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Icon size={22} color={meta.color} />
                            </div>
                            <div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{meta.name}</h3>
                              <span
                                className={`badge ${isConnected ? 'badge-success' : 'badge-neutral'}`}
                                style={{ marginTop: '0.2rem', fontSize: '0.68rem' }}
                              >
                                {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                          {meta.description}
                        </p>

                        {/* Stored Credential summary */}
                        {isConnected && (
                          <div
                            style={{
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: 8,
                              padding: '0.75rem',
                              marginBottom: '1.25rem',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <Key size={13} color="var(--emerald-400)" />
                              <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Encrypted Secret
                              </span>
                            </div>
                            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--emerald-400)' }}>
                              ••••••••••••••••••••••••••••••••
                            </p>
                            {item.createdAt && (
                              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                                Connected on {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                        {isConnected ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openConnectModal(key)}
                              className="btn btn-secondary"
                              style={{ flex: 1, fontSize: '0.8125rem', padding: '0.45rem' }}
                            >
                              Update Keys
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDisconnect(key)}
                              disabled={disconnectingProvider === key}
                              className="btn btn-danger"
                              style={{ fontSize: '0.8125rem', padding: '0.45rem 0.75rem' }}
                              title="Disconnect provider"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openConnectModal(key)}
                            className="btn btn-primary"
                            style={{ width: '100%', fontSize: '0.85rem' }}
                          >
                            <Plus size={15} />
                            Connect {meta.name}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Security Banner Footer */}
              <div
                style={{
                  marginTop: '2.5rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={20} color="var(--cyan-400)" />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    Zero Plaintext Storage
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    InfraFlow AI encrypts all access tokens and keys with AES-256-GCM prior to database persistence. Decryption only occurs in-memory during agentic execution cycles.
                  </p>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>

      {/* Connect / Edit Modal */}
      {modalProvider && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(6, 10, 15, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={() => !savingProvider && setModalProvider(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 520,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 12,
              padding: '1.75rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Key size={18} color="var(--emerald-400)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                  Configure {PROVIDER_METADATA[modalProvider].name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalProvider(null)}
                disabled={savingProvider}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Credentials are tested with the provider driver before being encrypted and saved.
            </p>

            <form onSubmit={handleSaveIntegration}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {PROVIDER_METADATA[modalProvider].fields.map((field) => {
                  const isPassword = field.type === 'password';
                  const isVisible = showSecrets[field.key];
                  const inputType = isPassword ? (isVisible ? 'text' : 'password') : 'text';

                  return (
                    <div key={field.key} className="form-group">
                      <label className="form-label" htmlFor={`field-${field.key}`}>
                        {field.label}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id={`field-${field.key}`}
                          type={inputType}
                          className="form-input"
                          value={formData[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          placeholder={field.placeholder}
                          required
                          disabled={savingProvider}
                          style={{ paddingRight: isPassword ? '2.5rem' : '0.875rem', fontFamily: isPassword && !isVisible ? 'inherit' : 'JetBrains Mono, monospace', fontSize: '0.875rem' }}
                        />
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() => toggleShowSecret(field.key)}
                            style={{
                              position: 'absolute',
                              right: '0.625rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalProvider(null)}
                  disabled={savingProvider}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.875rem' }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProvider}
                  className="btn btn-primary glow-emerald"
                  style={{ fontSize: '0.875rem' }}
                >
                  {savingProvider ? (
                    <>
                      <span className="animate-spin" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />
                      Verifying & Encrypting…
                    </>
                  ) : (
                    'Verify & Save Credentials'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
