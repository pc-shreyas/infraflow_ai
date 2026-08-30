// client/src/pages/login.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Eye, EyeOff, Zap, Terminal, AlertCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Redirect if already logged in
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

    if (!form.email || !form.password) {
      setLocalError('Please enter your email and password.');
      return;
    }

    const result = await login({ email: form.email, password: form.password });
    if (result.success) {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <Head>
        <title>Login — InfraFlow AI</title>
        <meta name="description" content="Sign in to your InfraFlow AI DevOps workspace." />
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
        {/* Ambient background glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '10%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="animate-fade-in-up"
          style={{
            width: '100%',
            maxWidth: 440,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: 'linear-gradient(135deg, var(--emerald-500), var(--cyan-500))',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: 'var(--emerald-glow)',
              }}
            >
              <Zap size={26} color="#fff" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.03em' }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Sign in to your InfraFlow AI workspace
            </p>
          </div>

          {/* Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              padding: '2rem',
            }}
          >
            {/* Error alert */}
            {localError && (
              <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{localError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label" htmlFor="login-email">Email Address</label>
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  name="email"
                  placeholder="sre@company.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="login-password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                    style={{ paddingRight: '2.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ width: '100%', padding: '0.7rem' }}
              >
                {isLoading ? (
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
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="divider" />

            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: 'var(--emerald-400)', fontWeight: 600, textDecoration: 'none' }}>
                Create one
              </Link>
            </p>
          </div>

          {/* Footer hint */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'center',
              marginTop: '1.5rem',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}
          >
            <Terminal size={12} />
            InfraFlow AI — Agentic DevOps Platform
          </div>
        </div>
      </div>
    </>
  );
}
