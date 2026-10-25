import React from 'react';

/**
 * Top bar status LED:
 * idle: grey
 * generating: pulsing amber / cyan
 * done: steady green
 * error: red
 */
export default function StatusLED({ status = 'idle', message = '' }) {
  const getLedStyle = () => {
    switch (status) {
      case 'generating':
        return {
          bg: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.6)',
          animation: 'animate-pulse-glow',
          text: message || 'SAMPLING EXPERIMENT IN PROGRESS...'
        };
      case 'done':
        return {
          bg: '#10B981',
          glow: 'rgba(16, 185, 129, 0.4)',
          animation: '',
          text: message || 'INSTRUMENT READY / SAMPLES CAPTURED'
        };
      case 'error':
        return {
          bg: '#EF4444',
          glow: 'rgba(239, 68, 68, 0.6)',
          animation: '',
          text: message || 'INSTRUMENT FAULT / ERROR'
        };
      case 'idle':
      default:
        return {
          bg: '#64748B',
          glow: 'transparent',
          animation: '',
          text: message || 'STANDBY / IDLE'
        };
    }
  };

  const style = getLedStyle();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 10px',
        backgroundColor: 'var(--surface-2)',
        borderRadius: '9999px',
        border: '1px solid var(--border)',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
      title={`System Status: ${status}`}
    >
      <span
        className={style.animation}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: style.bg,
          boxShadow: `0 0 8px ${style.glow}`,
          display: 'inline-block',
          transition: 'all 0.3s ease'
        }}
      />
      <span style={{ color: 'var(--text-muted)' }}>{style.text}</span>
    </div>
  );
}
