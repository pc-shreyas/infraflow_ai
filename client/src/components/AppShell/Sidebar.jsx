// client/src/components/AppShell/Sidebar.jsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard,
  GitBranch,
  Play,
  Plug,
  Settings,
  Terminal,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Workflows',    href: '/workflows',          icon: GitBranch },
  { label: 'Executions',  href: '/executions',         icon: Play },
  { label: 'Integrations',href: '/integrations',       icon: Plug },
];

const BOTTOM_ITEMS = [
  { label: 'Settings',    href: '/settings',           icon: Settings },
];

const NavItem = ({ href, label, icon: Icon, isActive }) => (
  <Link
    href={href}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      padding: '0.5rem 0.875rem',
      borderRadius: 8,
      textDecoration: 'none',
      color: isActive ? 'var(--emerald-400)' : 'var(--text-secondary)',
      background: isActive ? 'rgba(16,185,129,0.10)' : 'transparent',
      border: `1px solid ${isActive ? 'rgba(16,185,129,0.20)' : 'transparent'}`,
      fontSize: '0.875rem',
      fontWeight: isActive ? 600 : 400,
      transition: 'all 0.15s ease',
      marginBottom: 2,
    }}
    onMouseEnter={(e) => {
      if (!isActive) {
        e.currentTarget.style.color = 'var(--text-primary)';
        e.currentTarget.style.background = 'var(--bg-elevated)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isActive) {
        e.currentTarget.style.color = 'var(--text-secondary)';
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
    {label}
    {isActive && (
      <span
        style={{
          marginLeft: 'auto',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--emerald-400)',
          boxShadow: '0 0 8px var(--emerald-400)',
        }}
      />
    )}
  </Link>
);

const Sidebar = () => {
  const router = useRouter();

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0.75rem',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Section label */}
      <p
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 0.5rem',
          marginBottom: '0.5rem',
        }}
      >
        Navigation
      </p>

      {/* Main nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={router.pathname === item.href || router.pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0.75rem 0' }} />

      {/* Bottom nav */}
      <nav>
        {BOTTOM_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            isActive={router.pathname === item.href}
          />
        ))}
      </nav>

      {/* Version badge */}
      <div
        style={{
          marginTop: '0.75rem',
          padding: '0.5rem',
          background: 'var(--bg-elevated)',
          borderRadius: 6,
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', marginBottom: 2 }}>
          <Terminal size={12} color="var(--emerald-400)" />
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--emerald-400)', fontFamily: 'JetBrains Mono, monospace' }}>
            InfraFlow AI
          </span>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>v1.0.0 — Production Ready</span>
      </div>
    </aside>
  );
};

export default Sidebar;
