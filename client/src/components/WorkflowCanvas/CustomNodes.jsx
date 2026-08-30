// client/src/components/WorkflowCanvas/CustomNodes.jsx
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Github, Container, Server, Database, ArrowRightLeft, CheckCircle, Play, AlertTriangle } from 'lucide-react';

const NODE_THEMES = {
  githubRepo: {
    title: 'GitHub Repository',
    icon: Github,
    color: '#2ea44f',
    borderColor: 'rgba(46, 164, 79, 0.4)',
  },
  dockerBuild: {
    title: 'Docker Build & Deploy',
    icon: Container,
    color: '#099cec',
    borderColor: 'rgba(9, 156, 236, 0.4)',
  },
  awsEC2: {
    title: 'AWS EC2 Instance',
    icon: Server,
    color: '#ff9900',
    borderColor: 'rgba(255, 153, 0, 0.4)',
  },
  postgresDB: {
    title: 'PostgreSQL Database',
    icon: Database,
    color: '#336791',
    borderColor: 'rgba(51, 103, 145, 0.4)',
  },
  nginxProxy: {
    title: 'Nginx Reverse Proxy',
    icon: ArrowRightLeft,
    color: '#009639',
    borderColor: 'rgba(0, 150, 57, 0.4)',
  },
};

const CustomNode = ({ type, data, selected }) => {
  const theme = NODE_THEMES[type] || {
    title: 'Custom Action',
    icon: Server,
    color: 'var(--emerald-500)',
    borderColor: 'var(--border-strong)',
  };
  const Icon = theme.icon;

  // Status mapping
  const nodeStatus = data.status || 'idle'; // idle | running | success | failed

  const getStatusBadge = () => {
    switch (nodeStatus) {
      case 'running':
        return (
          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--amber-400)',
                display: 'inline-block',
                marginRight: 4,
                animation: 'pulse-glow 1s infinite',
              }}
            />
            RUNNING
          </span>
        );
      case 'success':
        return (
          <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
            <CheckCircle size={10} style={{ marginRight: 2 }} />
            SUCCESS
          </span>
        );
      case 'failed':
        return (
          <span className="badge badge-error" style={{ fontSize: '0.65rem' }}>
            <AlertTriangle size={10} style={{ marginRight: 2 }} />
            FAILED
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
            READY
          </span>
        );
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${selected ? theme.color : 'var(--border-default)'}`,
        borderRadius: 10,
        width: 250,
        padding: '0.875rem',
        boxShadow: selected ? `0 0 15px ${theme.color}25` : '0 4px 6px rgba(0,0,0,0.15)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: theme.color, width: 8, height: 8, border: '2px solid var(--bg-surface)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: theme.color, width: 8, height: 8, border: '2px solid var(--bg-surface)' }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
        <div
          style={{
            background: `${theme.color}15`,
            color: theme.color,
            width: 32,
            height: 32,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `1px solid ${theme.borderColor}`,
          }}
        >
          <Icon size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'var(--text-primary)',
            }}
          >
            {data.label || theme.title}
          </h4>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {type}
          </span>
        </div>
      </div>

      {/* Node Info / Summary Config */}
      <div
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: 6,
          padding: '0.5rem 0.625rem',
          fontSize: '0.75rem',
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '0.75rem',
          maxHeight: 70,
          overflow: 'hidden',
        }}
      >
        {Object.keys(data.config || {}).length > 0 ? (
          Object.entries(data.config).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{key}:</span>
              <span style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {String(val)}
              </span>
            </div>
          ))
        ) : (
          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No config set</span>
        )}
      </div>

      {/* Status Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Status</span>
        {getStatusBadge()}
      </div>
    </div>
  );
};

export const GitHubNode = memo((props) => <CustomNode type="githubRepo" {...props} />);
export const DockerNode = memo((props) => <CustomNode type="dockerBuild" {...props} />);
export const AWSNode = memo((props) => <CustomNode type="awsEC2" {...props} />);
export const PostgresNode = memo((props) => <CustomNode type="postgresDB" {...props} />);
export const NginxNode = memo((props) => <CustomNode type="nginxProxy" {...props} />);
