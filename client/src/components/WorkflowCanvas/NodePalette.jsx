// client/src/components/WorkflowCanvas/NodePalette.jsx
import { Github, Container, Server, Database, ArrowRightLeft } from 'lucide-react';

const PALETTE_ITEMS = [
  {
    type: 'githubRepo',
    label: 'GitHub Repository',
    description: 'Fetch repository source and trigger git webhooks.',
    icon: Github,
    color: '#2ea44f',
  },
  {
    type: 'dockerBuild',
    label: 'Docker Container',
    description: 'Compile local Dockerfiles and spin up runtime containers.',
    icon: Container,
    color: '#099cec',
  },
  {
    type: 'awsEC2',
    label: 'AWS EC2 Instance',
    description: 'Provision AWS virtual servers and manage security rules.',
    icon: Server,
    color: '#ff9900',
  },
  {
    type: 'postgresDB',
    label: 'PostgreSQL Database',
    description: 'Launch database schemas and run storage provisioners.',
    icon: Database,
    color: '#336791',
  },
  {
    type: 'nginxProxy',
    label: 'Nginx Proxy',
    description: 'Map web domains and forward ingress SSL connections.',
    icon: ArrowRightLeft,
    color: '#009639',
  },
];

const NodePalette = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      style={{
        width: 260,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '1.25rem 0.875rem',
        overflowY: 'auto',
      }}
    >
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>
        Node Palette
      </h3>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        Drag nodes onto the canvas to construct your infrastructure graph.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              onDragStart={(event) => onDragStart(event, item.type)}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '0.75rem',
                cursor: 'grab',
                transition: 'border-color 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = item.color;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                <div
                  style={{
                    background: `${item.color}15`,
                    color: item.color,
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={14} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {item.label}
                </span>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NodePalette;
