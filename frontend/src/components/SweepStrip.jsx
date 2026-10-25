import React from 'react';
import { getTemperatureColor, getHeatInfo } from '../theme/thermalUtils';
import SampleCard from './SampleCard';

export default function SweepStrip({ runs = [], prompt = '', showConfidence = false, onToggleConfidence }) {
  if (!runs || runs.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          backgroundColor: 'var(--surface)',
          borderRadius: '12px',
          border: '1px dashed var(--border)',
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '15px', fontWeight: 500, margin: '0 0 6px 0' }}>
          No sweep data collected yet.
        </p>
        <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-dim)' }}>
          Configure your temperature range in the control panel and click <strong>"Run Temperature Sweep"</strong>.
        </p>
      </div>
    );
  }

  // Ensure ordered from cold to hot
  const sortedRuns = [...runs].sort((a, b) => a.temperature - b.temperature);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${sortedRuns.length}, minmax(280px, 1fr))`,
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '12px',
      }}
    >
      {sortedRuns.map((r, colIdx) => {
        const temp = r.temperature;
        const tempColor = getTemperatureColor(temp);
        const heat = getHeatInfo(temp);
        const samples = r.samples || [];
        const metrics = r.metrics || {};
        const isDeterministic = metrics.is_deterministic || (metrics.unique_samples === 1 && samples.length > 1);

        return (
          <div
            key={colIdx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Column Heat Header */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--surface-2)',
                borderBottom: `2px solid ${tempColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '16px' }}>{heat.icon}</span>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: tempColor,
                    }}
                  >
                    T = {Number(temp).toFixed(1)}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: `${tempColor}20`,
                    color: tempColor,
                  }}
                >
                  {heat.label}
                </span>
              </div>

              {/* Column quick metrics badges */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
                }}
              >
                <span>Distinct-2: <strong style={{ color: 'var(--text)' }}>{metrics.distinct_2 ?? '--'}</strong></span>
                <span>Similarity: <strong style={{ color: 'var(--text)' }}>{metrics.self_similarity ?? '--'}</strong></span>
                <span>Words: <strong style={{ color: 'var(--text)' }}>{metrics.avg_words ?? '--'}</strong></span>
              </div>

              {/* Deterministic / Identical chip at T=0 */}
              {isDeterministic && (
                <div
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38BDF8',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    textAlign: 'center',
                    marginTop: '2px',
                  }}
                >
                  🔒 Deterministic: All {samples.length} runs identical
                </div>
              )}
            </div>

            {/* Column Samples Stack */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '12px',
                flex: 1,
              }}
            >
              {samples.map((sample, sIdx) => (
                <SampleCard
                  key={sIdx}
                  sample={sample}
                  prompt={sample.prompt || prompt}
                  temperature={temp}
                  index={sIdx + 1}
                  showConfidence={showConfidence}
                  onToggleConfidence={onToggleConfidence}
                  isLocked={isDeterministic}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
