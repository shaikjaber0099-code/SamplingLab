import React from 'react';
import SweepStrip from '../components/SweepStrip';
import MetricsComparison from '../components/MetricsComparison';
import { Plus, X, Play } from 'lucide-react';
import { getTemperatureColor } from '../theme/thermalUtils';

export default function SweepView({
  temperatures = [0.0, 0.3, 0.7, 1.0, 1.5],
  onTemperaturesChange,
  runs = [],
  prompt = '',
  isSweeping = false,
  onRunSweep,
  showConfidence = false,
  onToggleConfidence
}) {
  const handleAddTemp = () => {
    if (temperatures.length >= 8) return;
    const nextVal = Math.min(2.0, (temperatures[temperatures.length - 1] || 1.0) + 0.2);
    onTemperaturesChange([...temperatures, Number(nextVal.toFixed(1))].sort((a, b) => a - b));
  };

  const handleRemoveTemp = (indexToRemove) => {
    if (temperatures.length <= 2) return;
    onTemperaturesChange(temperatures.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTempEdit = (index, newVal) => {
    const num = Math.max(0.0, Math.min(2.0, parseFloat(newVal) || 0.0));
    const updated = [...temperatures];
    updated[index] = Number(num.toFixed(1));
    onTemperaturesChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Temperature List Editor Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Sweep Heat Points (T):
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {temperatures.map((t, idx) => {
              const tColor = getTemperatureColor(t);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    backgroundColor: 'var(--surface-2)',
                    border: `1px solid ${tColor}60`,
                    borderRadius: '6px',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: tColor }} />
                  <input
                    type="number"
                    min="0.0"
                    max="2.0"
                    step="0.1"
                    value={t}
                    onChange={(e) => handleTempEdit(idx, e.target.value)}
                    className="font-mono"
                    style={{
                      width: '42px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text)',
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: 0,
                      textAlign: 'center',
                    }}
                  />
                  {temperatures.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTemp(idx)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        padding: '1px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove temperature point"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}

            {temperatures.length < 8 && (
              <button
                type="button"
                onClick={handleAddTemp}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px dashed var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                }}
                title="Add temperature point"
              >
                <Plus size={12} />
                <span>Add T</span>
              </button>
            )}
          </div>
        </div>

        {/* Sweep Action Button */}
        <button
          type="button"
          disabled={isSweeping}
          onClick={onRunSweep}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--t-warm)',
            color: '#0B0F17',
            fontWeight: 700,
            fontSize: '13px',
            borderRadius: '6px',
            border: 'none',
            boxShadow: '0 0 12px rgba(251, 191, 36, 0.3)',
            opacity: isSweeping ? 0.7 : 1,
          }}
        >
          <Play size={15} fill="#0B0F17" />
          <span>{isSweeping ? 'Sweeping Temperatures...' : 'Run Temperature Sweep'}</span>
        </button>
      </div>

      {/* Sweep Strip Columns (Cold to Hot) */}
      <SweepStrip
        runs={runs}
        prompt={prompt}
        showConfidence={showConfidence}
        onToggleConfidence={onToggleConfidence}
      />

      {/* Metrics & Diversity Charts */}
      {runs.length > 0 && <MetricsComparison runs={runs} />}
    </div>
  );
}
