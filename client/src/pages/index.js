// client/src/pages/index.js
// Root route — redirects authenticated users to /dashboard,
// unauthenticated users to /login.

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import useAuthStore from '../store/authStore';

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  useEffect(() => {
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [isAuthenticated, router]);

  return (
    <>
      <Head>
        <title>InfraFlow AI — Agentic DevOps Platform</title>
        <meta name="description" content="AI-powered infrastructure automation for SREs and DevOps engineers." />
      </Head>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-base)',
          color: 'var(--text-secondary)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            border: '2px solid var(--border-default)',
            borderTopColor: 'var(--emerald-400)',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 1s linear infinite',
          }}
        />
      </div>
    </>
  );
}
