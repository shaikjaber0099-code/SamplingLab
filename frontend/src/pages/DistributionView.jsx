import React from 'react';
import ProbabilityBars from '../components/ProbabilityBars';
import EntropyGauge from '../components/EntropyGauge';
import { getTemperatureColor } from '../theme/thermalUtils';
import { Cpu, Zap } from 'lucide-react';

export default function DistributionView({
  distributionData = null,
  temperature = 1.0,
  topP = 1.0,
  topK = 0,
  onTemperatureSelect,
  isLoading = false
}) {
  const tColor = getTemperatureColor(temperature);

  const candidates = distributionData?.candidates || [];
  const baseEntropy = distributionData?.base_entropy || 0;
  const tempEntropy = distributionData?.temp_entropy || 0;
  const finalEntropy = distributionData?.final_entropy || 0;
  const maxEntropy = distributionData?.max_entropy || 15.6;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner with Quick Comparison Buttons and Entropy Meter */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Quick Comparative Presets */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Quick Thermal Comparison
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginTop: '2px' }}>
              Compare Softmax Reshaping
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 12px 0' }}>
              Jump directly between key thermodynamic states to inspect how exponent scaling shifts the next-token probability mass.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onTemperatureSelect(0.2)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: Math.abs(temperature - 0.2) < 0.05 ? 'rgba(56, 189, 248, 0.2)' : 'var(--surface-2)',
                border: `1px solid ${Math.abs(temperature - 0.2) < 0.05 ? '#38BDF8' : 'var(--border)'}`,
                color: Math.abs(temperature - 0.2) < 0.05 ? '#38BDF8' : 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              ❄️ T = 0.2 (Frozen)
            </button>

            <button
              type="button"
              onClick={() => onTemperatureSelect(1.0)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: Math.abs(temperature - 1.0) < 0.05 ? 'rgba(251, 191, 36, 0.2)' : 'var(--surface-2)',
                border: `1px solid ${Math.abs(temperature - 1.0) < 0.05 ? '#FBBF24' : 'var(--border)'}`,
                color: Math.abs(temperature - 1.0) < 0.05 ? '#FBBF24' : 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              ⚖️ T = 1.0 (Balanced)
            </button>

            <button
              type="button"
              onClick={() => onTemperatureSelect(2.0)}
              style={{
                flex: 1,
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: Math.abs(temperature - 2.0) < 0.05 ? 'rgba(244, 63, 94, 0.2)' : 'var(--surface-2)',
                border: `1px solid ${Math.abs(temperature - 2.0) < 0.05 ? '#F43F5E' : 'var(--border)'}`,
                color: Math.abs(temperature - 2.0) < 0.05 ? '#F43F5E' : 'var(--text)',
                fontSize: '11.5px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              🌋 T = 2.0 (Chaotic)
            </button>
          </div>
        </div>

        {/* Entropy Gauge Meter */}
        <EntropyGauge
          entropy={finalEntropy || tempEntropy}
          maxEntropy={maxEntropy}
          temperature={temperature}
        />
      </div>

      {/* Main Interactive Probability Bars */}
      <ProbabilityBars
        candidates={candidates}
        temperature={temperature}
        topP={topP}
        topK={topK}
        baseEntropy={baseEntropy}
        tempEntropy={tempEntropy}
        finalEntropy={finalEntropy}
      />
    </div>
  );
}
