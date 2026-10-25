import React from 'react';
import SampleCard from '../components/SampleCard';
import { Sparkles, RefreshCw } from 'lucide-react';
import { getTemperatureColor, getHeatInfo } from '../theme/thermalUtils';

export default function SingleRunView({
  samples = [],
  prompt = '',
  temperature = 0.7,
  isGenerating = false,
  showConfidence = false,
  onToggleConfidence,
  onRegenerate
}) {
  const tColor = getTemperatureColor(temperature);
  const heat = getHeatInfo(temperature);

  if (isGenerating) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        <div style={{ position: 'relative', width: '48px', height: '48px' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `3px solid ${tColor}30`,
              borderTopColor: tColor,
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>

        <div>
          <div className="font-mono" style={{ fontSize: '15px', fontWeight: 600, color: tColor }}>
            Sampling at T = {Number(temperature).toFixed(2)} ({heat.label})...
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Autoregressively projecting logits through softmax and sampling next tokens...
          </div>
        </div>
      </div>
    );
  }

  if (!samples || samples.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          border: '1px dashed var(--border)',
          textAlign: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '36px' }}>🧪</span>
        <div>
          <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text)' }}>
            No samples generated yet
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Choose your parameters in the left control panel and click <strong>"Run Experiment"</strong>.
          </p>
        </div>
      </div>
    );
  }

  const isDeterministic = samples.length > 1 && new Set(samples.map(s => s.text.trim())).size === 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Completed Run: <strong>{samples.length}</strong> sample(s) at
          </span>
          <span
            className="font-mono"
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: `${tColor}20`,
              color: tColor,
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            T = {Number(temperature).toFixed(2)}
          </span>
          {isDeterministic && (
            <span
              style={{
                fontSize: '11px',
                color: '#38BDF8',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              🔒 100% Deterministic (Identical)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onRegenerate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--text)',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <RefreshCw size={13} />
          <span>Regenerate Setting</span>
        </button>
      </div>

      {/* Accessible Token Confidence Legend (FR-14 & NFR-06) */}
      {showConfidence && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            padding: '8px 14px',
            backgroundColor: 'var(--surface-2)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            fontSize: '11px',
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Token Sampling Legend:</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'rgba(45, 212, 191, 0.25)', border: '1px solid #2DD4BF' }}></span>
            <span style={{ color: '#2DD4BF', fontWeight: 600 }}>High (P ≥ 35%)</span>
            <span style={{ color: 'var(--text-dim)' }}>— Predictable token</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'rgba(251, 191, 36, 0.25)', border: '1px solid #FBBF24' }}></span>
            <span style={{ color: '#FBBF24', fontWeight: 600 }}>Medium (10% ≤ P &lt; 35%)</span>
            <span style={{ color: 'var(--text-dim)' }}>— Alternative branch</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: 'rgba(244, 63, 94, 0.25)', border: '1px solid #FB7185' }}></span>
            <span style={{ color: '#FB7185', fontWeight: 600 }}>Low (P &lt; 10%)</span>
            <span style={{ color: 'var(--text-dim)' }}>— Surprising / high heat token</span>
          </span>
        </div>
      )}

      {/* Samples Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: samples.length > 1 ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
          gap: '14px',
        }}
      >
        {samples.map((s, idx) => (
          <SampleCard
            key={idx}
            sample={s}
            prompt={prompt}
            temperature={temperature}
            index={idx + 1}
            showConfidence={showConfidence}
            onToggleConfidence={onToggleConfidence}
            isLocked={isDeterministic}
          />
        ))}
      </div>
    </div>
  );
}
