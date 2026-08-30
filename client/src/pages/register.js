// client/src/pages/register.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Eye, EyeOff, Zap, Terminal, AlertCircle, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

const ROLES = [
  { value: 'sre_operator', label: 'SRE Operator', desc: 'Site Reliability Engineer' },
  { value: 'developer',    label: 'Developer',    desc: 'Application developer' },
  { value: 'admin',        label: 'Admin',        desc: 'Full platform access' },
];

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: 'At least 6 characters', ok: password.length >= 6 },
    { label: 'Contains a number',     ok: /\d/.test(password) },
    { label: 'Contains uppercase',    ok: /[A-Z]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.375rem' }}>
      {checks.map((c) => (
        <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: c.ok ? 'var(--emerald-400)' : 'var(--text-muted)' }}>
          <CheckCircle size={11} />
          {c.label}
        </div>
      ))}
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sre_operator' });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (error) setLocalError(error);
  }, [error]);

  const handleChange = (e) => {
    setLocalError('');
    clearError();
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!form.name.trim()) { setLocalError('Name is required.'); return; }
    if (!form.email)        { setLocalError('Email is required.'); return; }
    if (form.password.length < 6) { setLocalError('Password must be at least 6 characters.'); return; }

    const result = await register(form);
    if (result.success) router.push('/dashboard');
  };

  return (
    <>
      <Head>
        <title>Create Account — InfraFlow AI</title>
        <meta name="description" content="Create your InfraFlow AI DevOps account." />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-void)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '15%', left: '30%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '15%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, var(--emerald-500), var(--cyan-500))', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: 'var(--emerald-glow)' }}>
              <Zap size={26} color="#fff" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>Create your workspace</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Join InfraFlow AI — Agentic DevOps Platform</p>
          </div>

          {/* Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '2rem' }}>
            {localError && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{localError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Name */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="register-name">Full Name</label>
                <input id="register-name" className="form-input" type="text" name="name" placeholder="Jane Smith" value={form.name} onChange={handleChange} autoComplete="name" required />
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="register-email">Email Address</label>
                <input id="register-email" className="form-input" type="email" name="email" placeholder="sre@company.com" value={form.email} onChange={handleChange} autoComplete="email" required />
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="register-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="register-password"
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>

              {/* Role selector */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => { clearError(); setForm((p) => ({ ...p, role: r.value })); }}
                      style={{
                        padding: '0.625rem 0.5rem',
                        borderRadius: 8,
                        border: `1px solid ${form.role === r.value ? 'var(--emerald-500)' : 'var(--border-default)'}`,
                        background: form.role === r.value ? 'rgba(16,185,129,0.10)' : 'var(--bg-elevated)',
                        color: form.role === r.value ? 'var(--emerald-400)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        transition: 'all 0.15s ease',
                        textAlign: 'center',
                      }}
                    >
                      {r.label}
                      <div style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                id="register-submit"
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ width: '100%', padding: '0.7rem' }}
              >
                {isLoading ? (
                  <>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                    Creating account…
                  </>
                ) : 'Create Account'}
              </button>
            </form>

            <div className="divider" />

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--emerald-400)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <Terminal size={12} />
            InfraFlow AI — Agentic DevOps Platform
          </div>
        </div>
      </div>
    </>
  );
}
