import React from 'react';
import { getTemperatureColor } from '../theme/thermalUtils';

/**
 * EntropyGauge renders an instrument pressure dial / semicircle gauge
 * representing Shannon Entropy H(P) in bits.
 */
export default function EntropyGauge({ entropy = 0.0, maxEntropy = 15.6, temperature = 1.0 }) {
  const tColor = getTemperatureColor(temperature);
  const clampedEntropy = Math.max(0, Math.min(maxEntropy, Number(entropy) || 0));
  const ratio = maxEntropy > 0 ? clampedEntropy / maxEntropy : 0;

  // Arc math: 180 degrees from -180 to 0 (top semicircle)
  // Needle angle: -90deg (far left, zero entropy) to +90deg (far right, max entropy)
  const needleAngle = -90 + ratio * 180;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '12px',
        minWidth: '160px',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Entropy Gauge
      </div>

      <div style={{ position: 'relative', width: '120px', height: '65px', marginTop: '6px' }}>
        {/* SVG Gauge Dial */}
        <svg viewBox="0 0 100 55" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Background track arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Active thermal colored gradient arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={tColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.66"
            strokeDashoffset={125.66 * (1 - ratio)}
            style={{
              transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease',
              filter: `drop-shadow(0 0 6px ${tColor}60)`,
            }}
          />
          {/* Center pivot point */}
          <circle cx="50" cy="50" r="4" fill="var(--text)" />
        </svg>

        {/* Needle pointer */}
        <div
          style={{
            position: 'absolute',
            bottom: '5px',
            left: '50%',
            width: '2px',
            height: '38px',
            backgroundColor: '#FFFFFF',
            transformOrigin: 'bottom center',
            transform: `translateX(-50%) rotate(${needleAngle}deg)`,
            transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
            boxShadow: '0 0 4px rgba(255, 255, 255, 0.8)',
            borderRadius: '1px',
          }}
        />
      </div>

      {/* Numerical readout */}
      <div className="font-mono" style={{ textAlign: 'center', marginTop: '4px' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: tColor }}>
          {clampedEntropy.toFixed(2)}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '4px' }}>
          bits / {maxEntropy.toFixed(1)} max
        </span>
      </div>

      <div style={{ fontSize: '10px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '2px' }}>
        {ratio < 0.2 ? 'Peak Sharpness (Near Greedy)' : (ratio < 0.6 ? 'Moderate Uncertainty' : 'High Stochastic Spread')}
      </div>
    </div>
  );
}
