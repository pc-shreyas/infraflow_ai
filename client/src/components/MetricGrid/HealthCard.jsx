// client/src/components/MetricGrid/HealthCard.jsx
import React from 'react';

/**
 * Reusable Metric/Health Card displaying dynamic telemetry counts, rates, and status.
 * @param {object} props
 * @param {import('lucide-react').LucideIcon} props.icon
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {string} [props.sub]
 * @param {string} [props.color]
 * @param {number} [props.delay]
 * @param {boolean} [props.loading]
 */
export default function HealthCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'var(--emerald-400)',
  delay = 0,
  loading = false,
}) {
  return (
    <div
      className="card animate-fade-in-up"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        animationDelay: `${delay}ms`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={20} color={color} strokeWidth={2} />
      </div>

      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </p>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
            <span
              className="animate-spin"
              style={{
                width: 18,
                height: 18,
                border: '2px solid var(--border-default)',
                borderTopColor: color,
                borderRadius: '50%',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading…</span>
          </div>
        ) : (
          <>
            <p
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
                marginTop: 2,
              }}
            >
              {value}
            </p>
            {sub && (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginTop: 3,
                }}
              >
                {sub}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
