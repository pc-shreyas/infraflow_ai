// client/src/components/AppShell/Header.jsx
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Activity, Bell, LogOut, User, Zap } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Header = () => {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Brand */}
      <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: 28,
            height: 28,
            background: 'linear-gradient(135deg, var(--emerald-500), var(--cyan-500))',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span
          style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          InfraFlow<span style={{ color: 'var(--emerald-400)' }}> AI</span>
        </span>
      </Link>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* Live status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.3rem 0.75rem',
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 999,
            fontSize: '0.75rem',
            color: 'var(--emerald-400)',
            fontWeight: 600,
          }}
        >
          <Activity size={12} strokeWidth={2.5} />
          Operational
        </div>

        {/* Notifications (placeholder) */}
        <button className="btn btn-ghost" style={{ padding: '0.5rem' }} title="Notifications">
          <Bell size={16} />
        </button>

        {/* User menu */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.75rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  background: 'linear-gradient(135deg, var(--emerald-500), var(--cyan-500))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <span className="badge badge-info" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                {user.role?.replace('_', ' ')}
              </span>
            </div>

            <button
              className="btn btn-ghost"
              style={{ padding: '0.5rem', color: 'var(--red-400)' }}
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
