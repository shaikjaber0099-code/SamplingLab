import React, { useState } from 'react';

/**
 * TokenChips component renders generated text with tokens color-coded by their sampling probability.
 * High probability (>= 35%): cyan/green bright
 * Medium probability (10-35%): amber
 * Low/surprising probability (< 10%): coral/dim
 */
export default function TokenChips({ tokensWithProbs = [], rawText = '' }) {
  const [hoveredToken, setHoveredToken] = useState(null);

  if (!tokensWithProbs || tokensWithProbs.length === 0) {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{rawText}</span>;
  }

  const getTokenStyle = (prob) => {
    if (prob >= 0.35) {
      // High confidence (predictable)
      return {
        bg: 'rgba(45, 212, 191, 0.15)',
        border: 'rgba(45, 212, 191, 0.4)',
        color: '#2DD4BF',
      };
    } else if (prob >= 0.10) {
      // Medium confidence
      return {
        bg: 'rgba(251, 191, 36, 0.15)',
        border: 'rgba(251, 191, 36, 0.4)',
        color: '#FBBF24',
      };
    } else {
      // Low confidence (creative / surprising / high T token)
      return {
        bg: 'rgba(244, 63, 94, 0.15)',
        border: 'rgba(244, 63, 94, 0.4)',
        color: '#FB7185',
      };
    }
  };

  return (
    <div style={{ position: 'relative', lineHeight: '1.8' }}>
      {/* Floating tooltip */}
      {hoveredToken && (
        <div
          className="font-mono"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            transform: 'translateY(-4px)',
            backgroundColor: '#0B0F17',
            border: '1px solid var(--border)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            color: 'var(--text)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          Token: <span style={{ color: '#38BDF8' }}>"{hoveredToken.token}"</span> (ID: {hoveredToken.token_id}) · P = {(hoveredToken.prob * 100).toFixed(1)}% ({hoveredToken.confidence_tier})
        </div>
      )}

      {tokensWithProbs.map((t, idx) => {
        const style = getTokenStyle(t.prob);
        return (
          <span
            key={idx}
            onMouseEnter={() => setHoveredToken(t)}
            onMouseLeave={() => setHoveredToken(null)}
            style={{
              display: 'inline-block',
              padding: '1px 3px',
              margin: '1px 1px',
              backgroundColor: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: '3px',
              color: style.color,
              cursor: 'help',
              transition: 'background-color 0.15s ease',
            }}
          >
            {t.token}
          </span>
        );
      })}
    </div>
  );
}
