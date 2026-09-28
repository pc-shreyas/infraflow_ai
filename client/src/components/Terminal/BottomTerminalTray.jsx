// client/src/components/Terminal/BottomTerminalTray.jsx
import React, { useState, useEffect } from 'react';
import { Terminal, ChevronUp, ChevronDown, X, Play, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import TerminalStream from './TerminalStream';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

/**
 * Collapsible Bottom Terminal Panel for Live Deployment Streaming.
 * Can be embedded in workflow canvas pages or execution views.
 * @param {object} props
 * @param {string} [props.executionId] - Active execution ID to stream
 * @param {Function} [props.onClose] - Callback when closed
 * @param {boolean} [props.defaultExpanded] - Initial open state
 */
export default function BottomTerminalTray({
  executionId = null,
  onClose = null,
  defaultExpanded = true,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [logs, setLogs] = useState([]);
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    setSocket(s);

    if (s) {
      if (s.connected) setSocketConnected(true);
      const onConnect = () => setSocketConnected(true);
      const onDisconnect = () => setSocketConnected(false);

      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);

      return () => {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
      };
    }
  }, []);

  useEffect(() => {
    if (!executionId) {
      setLogs([]);
      setExecution(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    Promise.allSettled([
      api.get(`/executions/${executionId}`),
      api.get(`/executions/${executionId}/terminal-logs`),
    ]).then(([execResult, logsResult]) => {
      if (!active) return;

      if (execResult.status === 'fulfilled') {
        setExecution(execResult.value.data?.data?.execution || null);
      } else {
        setError('Failed to fetch execution status.');
      }

      if (logsResult.status === 'fulfilled') {
        setLogs(logsResult.value.data?.data?.logs || []);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [executionId]);

  if (!executionId) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(9, 13, 22, 0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-default)',
        boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        height: expanded ? '380px' : '42px',
        overflow: 'hidden',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          height: 42,
          minHeight: 42,
          padding: '0 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none',
          background: 'var(--bg-surface)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: 5,
              background: 'rgba(16,185,129,0.15)',
              color: 'var(--emerald-400)',
            }}
          >
            <Terminal size={14} />
          </div>

          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
            Live Deployment Console
          </span>

          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            #{String(executionId).slice(-8)}
          </span>

          {execution?.status && (
            <span
              className={`badge ${
                execution.status === 'COMPLETED'
                  ? 'badge-success'
                  : ['FAILED', 'CANCELLED'].includes(execution.status)
                  ? 'badge-error'
                  : 'badge-warning'
              }`}
              style={{ fontSize: '0.65rem' }}
            >
              {execution.status}
            </span>
          )}

          {socketConnected ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--emerald-400)', fontFamily: 'JetBrains Mono, monospace', marginLeft: '0.5rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--emerald-400)', animation: 'pulse-glow 2s infinite' }} />
              STREAM CONNECTED
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--amber-400)', fontFamily: 'JetBrains Mono, monospace', marginLeft: '0.5rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber-400)' }} />
              CONNECTING SOCKET…
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="btn btn-ghost"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
            title={expanded ? 'Minimize' : 'Expand'}
          >
            {expanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              title="Close Panel"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Terminal View Body */}
      {expanded && (
        <div style={{ flex: 1, padding: '0.75rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {error ? (
            <div className="alert alert-error" style={{ margin: 'auto' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : (
            <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
              <TerminalStream logs={logs} socket={socket} executionId={executionId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
