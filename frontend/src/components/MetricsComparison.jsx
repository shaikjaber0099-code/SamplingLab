import React, { useState } from 'react';
import { getTemperatureColor, getHeatInfo } from '../theme/thermalUtils';
import { TrendingUp, BarChart3, HelpCircle } from 'lucide-react';

export default function MetricsComparison({ runs = [] }) {
  const [activeChart, setActiveChart] = useState('diversity'); // diversity, similarity, length

  if (!runs || runs.length === 0) {
    return null;
  }

  const sortedRuns = [...runs].sort((a, b) => a.temperature - b.temperature);

  // Chart data points
  const points = sortedRuns.map((r) => ({
    temp: r.temperature,
    distinct1: r.metrics?.distinct_1 ?? 0,
    distinct2: r.metrics?.distinct_2 ?? 0,
    similarity: r.metrics?.self_similarity ?? 1.0,
    repRate: r.metrics?.repetition_rate ?? 0,
    avgWords: r.metrics?.avg_words ?? 0,
    ppl: r.metrics?.perplexity ?? null,
  }));

  // SVG Chart Dimensions
  const width = 640;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const minT = points[0].temp;
  const maxT = points[points.length - 1].temp;
  const tRange = Math.max(0.1, maxT - minT);

  const getX = (t) => padding.left + ((t - minT) / tRange) * innerW;

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
      {/* Header and Chart Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
            Quantitative Metrics & Diversity Curves
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Empirical evidence of probability flattening across the temperature spectrum.
          </p>
        </div>

        {/* Chart View Selector */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setActiveChart('diversity')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: activeChart === 'diversity' ? 'var(--surface-hover)' : 'transparent',
              border: `1px solid ${activeChart === 'diversity' ? '#38BDF8' : 'var(--border)'}`,
              color: activeChart === 'diversity' ? '#38BDF8' : 'var(--text-muted)',
            }}
          >
            Diversity (Distinct-1/2)
          </button>

          <button
            type="button"
            onClick={() => setActiveChart('similarity')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: activeChart === 'similarity' ? 'var(--surface-hover)' : 'transparent',
              border: `1px solid ${activeChart === 'similarity' ? '#FBBF24' : 'var(--border)'}`,
              color: activeChart === 'similarity' ? '#FBBF24' : 'var(--text-muted)',
            }}
          >
            Self-Similarity Decay
          </button>

          <button
            type="button"
            onClick={() => setActiveChart('length')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 500,
              backgroundColor: activeChart === 'length' ? 'var(--surface-hover)' : 'transparent',
              border: `1px solid ${activeChart === 'length' ? '#2DD4BF' : 'var(--border)'}`,
              color: activeChart === 'length' ? '#2DD4BF' : 'var(--text-muted)',
            }}
          >
            Output Length
          </button>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div
        style={{
          backgroundColor: 'var(--surface-2)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          padding: '12px',
          overflowX: 'auto',
        }}
      >
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac, i) => {
            const y = padding.top + innerH * (1 - frac);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  fill="var(--text-dim)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  textAnchor="end"
                >
                  {activeChart === 'length'
                    ? Math.round(frac * 80)
                    : (frac).toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* X Axis Temperature Labels */}
          {points.map((p, i) => {
            const x = getX(p.temp);
            return (
              <g key={i}>
                <line x1={x} y1={padding.top} x2={x} y2={padding.top + innerH} stroke="var(--border)" strokeDasharray="2 2" />
                <text
                  x={x}
                  y={height - 10}
                  fill="var(--text-muted)"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                >
                  T={p.temp.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Data Lines based on active tab */}
          {activeChart === 'diversity' && (
            <>
              {/* Distinct-1 Line */}
              <polyline
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                points={points
                  .map((p) => `${getX(p.temp)},${padding.top + innerH * (1 - Math.min(1, p.distinct1))}`)
                  .join(' ')}
              />
              {/* Distinct-2 Line */}
              <polyline
                fill="none"
                stroke="#F43F5E"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                points={points
                  .map((p) => `${getX(p.temp)},${padding.top + innerH * (1 - Math.min(1, p.distinct2))}`)
                  .join(' ')}
              />
              {/* Data points */}
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={getX(p.temp)}
                  cy={padding.top + innerH * (1 - Math.min(1, p.distinct1))}
                  r="4"
                  fill="#38BDF8"
                  stroke="#0B0F17"
                  strokeWidth="2"
                />
              ))}
            </>
          )}

          {activeChart === 'similarity' && (
            <>
              {/* Self-Similarity Decay Line */}
              <polyline
                fill="none"
                stroke="#FBBF24"
                strokeWidth="2.5"
                points={points
                  .map((p) => `${getX(p.temp)},${padding.top + innerH * (1 - Math.min(1, p.similarity))}`)
                  .join(' ')}
              />
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={getX(p.temp)}
                  cy={padding.top + innerH * (1 - Math.min(1, p.similarity))}
                  r="4"
                  fill="#FBBF24"
                  stroke="#0B0F17"
                  strokeWidth="2"
                />
              ))}
            </>
          )}

          {activeChart === 'length' && (
            <>
              <polyline
                fill="none"
                stroke="#2DD4BF"
                strokeWidth="2.5"
                points={points
                  .map((p) => `${getX(p.temp)},${padding.top + innerH * (1 - Math.min(1, p.avgWords / 80))}`)
                  .join(' ')}
              />
              {points.map((p, idx) => (
                <circle
                  key={idx}
                  cx={getX(p.temp)}
                  cy={padding.top + innerH * (1 - Math.min(1, p.avgWords / 80))}
                  r="4"
                  fill="#2DD4BF"
                  stroke="#0B0F17"
                  strokeWidth="2"
                />
              ))}
            </>
          )}
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '6px', fontSize: '11px' }}>
          {activeChart === 'diversity' && (
            <>
              <span style={{ color: '#38BDF8' }}>● Distinct-1 (Unigram Variety)</span>
              <span style={{ color: '#F43F5E' }}>┄ Distinct-2 (Bigram Breadth)</span>
            </>
          )}
          {activeChart === 'similarity' && (
            <span style={{ color: '#FBBF24' }}>● Pairwise Cosine Self-Similarity (Decays as T increases)</span>
          )}
          {activeChart === 'length' && (
            <span style={{ color: '#2DD4BF' }}>● Average Output Word Count</span>
          )}
        </div>
      </div>

      {/* Comparison Metrics Data Table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            textAlign: 'left',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border)',
                color: 'var(--text-muted)',
                backgroundColor: 'rgba(11, 15, 23, 0.3)',
              }}
            >
              <th style={{ padding: '8px 12px' }}>Temperature</th>
              <th style={{ padding: '8px 12px' }}>Heat State</th>
              <th style={{ padding: '8px 12px' }} title="Distinct Unigrams / Total Unigrams (Lexical Diversity)">Distinct-1</th>
              <th style={{ padding: '8px 12px' }} title="Distinct Bigrams / Total Bigrams (Phrase Breadth)">Distinct-2</th>
              <th style={{ padding: '8px 12px' }} title="Pairwise TF-IDF Cosine Similarity across samples (Decays with Heat)">Self-Similarity</th>
              <th style={{ padding: '8px 12px' }} title="Share of repeated trigrams within samples">Repetition</th>
              <th style={{ padding: '8px 12px' }} title="Mean tokens generated per sample">Avg Tokens</th>
              <th style={{ padding: '8px 12px' }} title="Model surprise (NLL exponentiated). Available for local models.">Perplexity</th>
              <th style={{ padding: '8px 12px' }} title="Distinct sample outputs out of total N runs">Unique / N</th>
            </tr>
          </thead>
          <tbody>
            {sortedRuns.map((r, i) => {
              const t = r.temperature;
              const tColor = getTemperatureColor(t);
              const heat = getHeatInfo(t);
              const m = r.metrics || {};
              const samples = r.samples || [];

              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      className="font-mono"
                      style={{
                        color: tColor,
                        fontWeight: 700,
                        padding: '2px 6px',
                        backgroundColor: `${tColor}15`,
                        borderRadius: '4px',
                      }}
                    >
                      T = {t.toFixed(1)}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text)' }}>
                    <span>{heat.icon} {heat.label}</span>
                  </td>
                  <td className="font-mono" style={{ padding: '8px 12px', color: 'var(--text)' }}>
                    {m.distinct_1 != null ? Number(m.distinct_1).toFixed(3) : 'N/A'}
                  </td>
                  <td className="font-mono" style={{ padding: '8px 12px', color: 'var(--text)' }}>
                    {m.distinct_2 != null ? Number(m.distinct_2).toFixed(3) : 'N/A'}
                  </td>
                  <td className="font-mono" style={{ padding: '8px 12px', color: 'var(--text)' }}>
                    {m.self_similarity != null ? Number(m.self_similarity).toFixed(3) : 'N/A'}
                  </td>
                  <td className="font-mono" style={{ padding: '8px 12px', color: 'var(--text)' }}>
                    {m.repetition_rate != null ? `${(Number(m.repetition_rate) * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="font-mono" style={{ padding: '8px 12px', color: 'var(--text)' }}>
                    {m.avg_tokens != null ? Number(m.avg_tokens).toFixed(1) : (m.avg_words != null ? Number(m.avg_words).toFixed(1) : 'N/A')}
                  </td>
                  <td className="font-mono" style={{ padding: '8px 12px', color: m.perplexity != null ? (m.perplexity < 20 ? '#2DD4BF' : '#FBBF24') : 'var(--text-dim)' }}>
                    {m.perplexity != null ? Number(m.perplexity).toFixed(2) : 'N/A'}
                  </td>
                  <td className="font-mono" style={{ padding: '8px 12px', color: 'var(--text)' }}>
                    {m.unique_samples ?? 1} / {samples.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
