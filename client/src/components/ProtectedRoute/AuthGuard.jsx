// client/src/components/ProtectedRoute/AuthGuard.jsx
// Wraps protected pages. Redirects to /login if no token is present.

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../../store/authStore';

const AuthGuard = ({ children }) => {
  const router = useRouter();
  const { token, isLoading } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-base)',
          color: 'var(--text-secondary)',
          fontFamily: 'Inter, sans-serif',
          gap: '0.75rem',
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            border: '2px solid var(--border-default)',
            borderTopColor: 'var(--emerald-400)',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
          }}
        />
        Authenticating…
      </div>
    );
  }

  return children;
};

export default AuthGuard;
