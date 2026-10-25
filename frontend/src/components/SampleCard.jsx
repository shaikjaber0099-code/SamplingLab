import React, { useState } from 'react';
import { Copy, Check, Sparkles, Clock, BarChart2 } from 'lucide-react';
import { getTemperatureColor, getHeatInfo } from '../theme/thermalUtils';
import TokenChips from './TokenChips';

export default function SampleCard({
  sample,
  prompt = '',
  temperature = 0.7,
  index = 1,
  showConfidence = false,
  onToggleConfidence,
  isLocked = false
}) {
  const [copied, setCopied] = useState(false);
  const tempColor = getTemperatureColor(temperature);
  const heat = getHeatInfo(temperature);

  const text = typeof sample === 'string' ? sample : (sample.text || '');
  const promptText = (typeof sample === 'object' && sample.prompt) ? sample.prompt : prompt;
  const fullText = (typeof sample === 'object' && sample.full_text) ? sample.full_text : (promptText ? `${promptText} ${text}` : text);
  const tokensCount = typeof sample === 'object' ? (sample.tokens_count || text.split(/\s+/).filter(Boolean).length) : text.split(/\s+/).filter(Boolean).length;
  const ppl = typeof sample === 'object' ? sample.perplexity : null;
  const timeMs = typeof sample === 'object' ? sample.generation_time_ms : null;
  const tokensWithProbs = typeof sample === 'object' ? sample.tokens_with_probs : null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surface-2)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        borderTop: `3px solid ${tempColor}`,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Card Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'rgba(11, 15, 23, 0.4)',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="font-mono"
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: `${tempColor}20`,
              color: tempColor,
              fontWeight: 700,
            }}
          >
            T = {Number(temperature).toFixed(1)}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>Sample #{index}</span>
          {isLocked && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                fontSize: '10px',
                fontWeight: 600,
              }}
              title="All samples are 100% identical at zero temperature due to deterministic greedy argmax decoding"
            >
              🔒 Identical (Argmax)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tokensWithProbs && tokensWithProbs.length > 0 && (
            <button
              type="button"
              onClick={onToggleConfidence}
              style={{
                background: showConfidence ? `${tempColor}25` : 'transparent',
                border: `1px solid ${showConfidence ? tempColor : 'var(--border)'}`,
                color: showConfidence ? tempColor : 'var(--text-muted)',
                borderRadius: '4px',
                padding: '3px 7px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Toggle token-by-token sampling probability highlights"
            >
              <Sparkles size={11} />
              <span>Token Confidence</span>
            </button>
          )}

          <button
            type="button"
            onClick={copyToClipboard}
            style={{
              background: 'transparent',
              border: 'none',
              color: copied ? '#10B981' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              fontSize: '11px',
            }}
            title="Copy full sample text"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Generated Content Body with Prompt Context */}
      <div
        className="font-mono"
        style={{
          padding: '12px 14px',
          fontSize: '13px',
          color: 'var(--text)',
          minHeight: '80px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: '1.6',
          flex: 1,
        }}
      >
        {promptText && (
          <div
            style={{
              marginBottom: '8px',
              paddingBottom: '8px',
              borderBottom: '1px dashed var(--border)',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <span style={{ color: 'var(--text-dim)', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Prompt:
            </span>{' '}
            <span style={{ fontStyle: 'italic' }}>"{promptText}"</span>
          </div>
        )}

        <div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: tempColor, fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Continuation:
            </span>
          </div>
          {showConfidence && tokensWithProbs ? (
            <TokenChips tokensWithProbs={tokensWithProbs} rawText={text} />
          ) : (
            <span style={{ color: 'var(--text)' }}>
              {text.trim() ? text : <em style={{ color: 'var(--text-dim)' }}>(No continuation generated)</em>}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Readout Badges */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 12px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'rgba(11, 15, 23, 0.25)',
          fontSize: '11px',
          color: 'var(--text-dim)',
        }}
      >
        <div style={{ display: 'flex', gap: '12px' }}>
          <span>
            Tokens: <strong style={{ color: 'var(--text-muted)' }}>{tokensCount}</strong>
          </span>
          {ppl !== null && ppl !== undefined && (
            <span title="Exponentiated cross-entropy loss (lower indicates higher language model confidence)">
              Perplexity: <strong style={{ color: ppl < 20 ? '#2DD4BF' : '#FBBF24' }}>{ppl}</strong>
            </span>
          )}
        </div>

        {timeMs && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={11} />
            <span>{timeMs} ms</span>
          </div>
        )}
      </div>
    </div>
  );
}
