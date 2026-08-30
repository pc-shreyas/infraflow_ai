// client/src/components/WorkflowCanvas/NodeConfigPanel.jsx
import { useState, useEffect } from 'react';
import { Settings, Save, Trash2, X } from 'lucide-react';

const CONFIG_FIELDS = {
  githubRepo: [
    { name: 'repoUrl', label: 'Repository URL', type: 'text', placeholder: 'https://github.com/org/repo' },
    { name: 'branch', label: 'Branch Name', type: 'text', placeholder: 'main' },
    { name: 'accessToken', label: 'Access Token Ref', type: 'text', placeholder: 'github-token-cred' },
  ],
  dockerBuild: [
    { name: 'dockerfilePath', label: 'Dockerfile Path', type: 'text', placeholder: './Dockerfile' },
    { name: 'imageName', label: 'Target Image Name', type: 'text', placeholder: 'my-app' },
    { name: 'containerPort', label: 'Host Port Mapping', type: 'text', placeholder: '8080:8080' },
  ],
  awsEC2: [
    { name: 'instanceType', label: 'EC2 Instance Type', type: 'text', placeholder: 't3.micro' },
    { name: 'region', label: 'AWS Region', type: 'text', placeholder: 'us-east-1' },
    { name: 'securityGroup', label: 'Security Group Ref', type: 'text', placeholder: 'sg-default' },
  ],
  postgresDB: [
    { name: 'dbName', label: 'Database Name', type: 'text', placeholder: 'prod_db' },
    { name: 'dbUser', label: 'DB Username', type: 'text', placeholder: 'postgres' },
    { name: 'port', label: 'Ingress Port', type: 'number', placeholder: '5432' },
  ],
  nginxProxy: [
    { name: 'domain', label: 'Public Domain Name', type: 'text', placeholder: 'api.mycompany.com' },
    { name: 'upstreamPort', label: 'Forward Upstream Port', type: 'number', placeholder: '8080' },
    { name: 'enableSSL', label: 'Automatic SSL Cert (Let\'s Encrypt)', type: 'checkbox' },
  ],
};

const NodeConfigPanel = ({ node, onUpdateNode, onDeleteNode, onClose }) => {
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (node) {
      setLabel(node.data?.label || '');
      setConfig(node.data?.config || {});
    }
  }, [node]);

  if (!node) {
    return (
      <div
        style={{
          width: 300,
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: 'var(--text-muted)',
          height: '100%',
        }}
      >
        <Settings size={28} style={{ marginBottom: '0.75rem' }} />
        <span style={{ fontSize: '0.85rem' }}>Select a node to configure</span>
      </div>
    );
  }

  const fields = CONFIG_FIELDS[node.type] || [];

  const handleFieldChange = (name, val, type) => {
    setConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? val : val,
    }));
  };

  const handleSave = () => {
    onUpdateNode(node.id, {
      ...node.data,
      label,
      config,
    });
  };

  return (
    <div
      style={{
        width: 320,
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={16} color="var(--emerald-400)" />
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Configure Node</h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Inputs */}
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Node Name Label */}
        <div className="form-group">
          <label className="form-label" htmlFor="node-config-name">Node Display Name</label>
          <input
            id="node-config-name"
            className="form-input"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Name this task"
          />
        </div>

        <div className="divider" style={{ margin: '0.5rem 0' }} />

        {/* Dynamic Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Properties
          </span>

          {fields.map((field) => (
            <div className="form-group" key={field.name}>
              <label className="form-label" htmlFor={`node-field-${field.name}`}>{field.label}</label>
              {field.type === 'checkbox' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <input
                    id={`node-field-${field.name}`}
                    type="checkbox"
                    checked={!!config[field.name]}
                    onChange={(e) => handleFieldChange(field.name, e.target.checked, 'checkbox')}
                    style={{
                      accentColor: 'var(--emerald-500)',
                      width: 16,
                      height: 16,
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Enabled</span>
                </div>
              ) : (
                <input
                  id={`node-field-${field.name}`}
                  className="form-input"
                  type={field.type}
                  placeholder={field.placeholder}
                  value={config[field.name] !== undefined ? config[field.name] : ''}
                  onChange={(e) => handleFieldChange(field.name, e.target.value, field.type)}
                />
              )}
            </div>
          ))}

          {fields.length === 0 && (
            <span style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              No properties required for this node.
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <button
          id="node-config-save"
          onClick={handleSave}
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
        >
          <Save size={14} />
          Apply Changes
        </button>
        <button
          id="node-config-delete"
          onClick={() => onDeleteNode(node.id)}
          className="btn btn-danger"
          style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}
        >
          <Trash2 size={14} />
          Delete Node
        </button>
      </div>
    </div>
  );
};

export default NodeConfigPanel;
