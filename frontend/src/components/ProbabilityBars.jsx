import React from 'react';
import { getTemperatureColor } from '../theme/thermalUtils';
import { Filter, Info } from 'lucide-react';

export default function ProbabilityBars({
  candidates = [],
  temperature = 1.0,
  topP = 1.0,
  topK = 0,
  baseEntropy = 0,
  tempEntropy = 0,
  finalEntropy = 0
}) {
  const tColor = getTemperatureColor(temperature);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Header & Live Formula */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              Next-Token Probability Distribution
            </h3>
            <span
              className="font-mono"
              style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: `${tColor}20`,
                color: tColor,
                fontWeight: 700,
              }}
            >
              T = {Number(temperature).toFixed(2)}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Real-time transformation of unnormalized logits into categorical probabilities.
          </p>
        </div>

        {/* Live Mathematical Formula Callout */}
        <div
          className="font-mono"
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '1px solid var(--border)',
            padding: '8px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Formula:</span>
          <span>
            P(w<sub>i</sub>) =
          </span>
          <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', margin: '0 4px' }}>
            <span>exp(z<sub>i</sub> / <strong style={{ color: tColor }}>{temperature <= 1e-5 ? '→0' : Number(temperature).toFixed(2)}</strong>)</span>
            <span style={{ borderTop: '1px solid var(--text-dim)', width: '100%' }}></span>
            <span>Σ exp(z<sub>j</sub> / <strong style={{ color: tColor }}>{temperature <= 1e-5 ? '→0' : Number(temperature).toFixed(2)}</strong>)</span>
          </span>
        </div>
      </div>

      {/* Explanation Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          fontSize: '12px',
          color: 'var(--text)',
        }}
      >
        <Info size={16} style={{ color: '#38BDF8', marginTop: '2px', flexShrink: 0 }} />
        <div>
          {temperature <= 0.05 ? (
            <span>
              <strong>Frozen Argmax State:</strong> As T → 0, the probability of the maximum logit approaches 1.0 (100%), rendering the generation completely deterministic and identical across repeated trials.
            </span>
          ) : temperature < 0.7 ? (
            <span>
              <strong>Sharpened Distribution:</strong> Low temperature amplifies differences between logits. The top tokens dominate while tail tokens receive vanishingly small probability.
            </span>
          ) : temperature <= 1.2 ? (
            <span>
              <strong>Balanced Distribution:</strong> Softmax preserves the natural ratio of log-likelihoods, balancing high-probability coherence with natural linguistic diversity.
            </span>
          ) : (
            <span>
              <strong>Flattened (High Heat) Distribution:</strong> As T increases, differences between logits diminish. The distribution approaches a uniform spread, allowing rare or chaotic tokens to be sampled.
            </span>
          )}
        </div>
      </div>

      {/* Probability Bars List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        {candidates.map((cand) => {
          const isKept = cand.is_kept;
          const prob = cand.final_prob;
          const widthPct = Math.min(100, Math.max(1, Math.round(prob * 100)));
          const rawLogit = cand.raw_logit;

          return (
            <div
              key={cand.token_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 140px 1fr 140px',
                alignItems: 'center',
                gap: '12px',
                opacity: isKept ? 1 : 0.45,
                transition: 'all 0.25s ease',
              }}
            >
              {/* Rank */}
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                #{cand.rank}
              </span>

              {/* Token label chip */}
              <div
                className="font-mono"
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: isKept ? 'var(--surface-2)' : 'rgba(36, 48, 73, 0.3)',
                  border: `1px solid ${isKept ? 'var(--border)' : 'transparent'}`,
                  fontSize: '12px',
                  fontWeight: 600,
                  color: isKept ? 'var(--text)' : 'var(--text-dim)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={`Token: "${cand.token}" (ID: ${cand.token_id})`}
              >
                "{cand.token}"
              </div>

              {/* Horizontal animated probability bar */}
              <div
                style={{
                  position: 'relative',
                  height: '24px',
                  backgroundColor: 'rgba(11, 15, 23, 0.6)',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {/* Bar fill */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${widthPct}%`,
                    backgroundColor: isKept ? tColor : 'var(--text-dim)',
                    opacity: isKept ? 0.85 : 0.25,
                    boxShadow: isKept ? `0 0 10px ${tColor}60` : 'none',
                    transition: 'width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.3s ease',
                  }}
                />

                {/* Percentage label inside/outside bar */}
                <span
                  className="font-mono"
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    marginLeft: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: widthPct > 40 ? '#0B0F17' : 'var(--text)',
                    textShadow: widthPct > 40 ? 'none' : '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {(prob * 100).toFixed(2)}%
                </span>
              </div>

              {/* Filtered or Logit status tag */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  z = {rawLogit.toFixed(2)}
                </span>
                {!isKept && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      color: '#EF4444',
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                    title={`Filtered out by ${cand.filtered_by}`}
                  >
                    <Filter size={10} />
                    <span>Cut ({cand.filtered_by})</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
