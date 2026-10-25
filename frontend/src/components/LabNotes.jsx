import React, { useState } from 'react';
import { Download, FileText, Table, Code, CheckSquare, Edit3 } from 'lucide-react';

export default function LabNotes({
  observations = {},
  userNotes = '',
  onUserNotesChange,
  conclusion = '',
  onConclusionChange,
  onExport,
  isExporting = false
}) {
  const bulletPoints = observations.bullet_points || [];

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
      {/* Header & Export Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>📋</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>
              Lab Notebook & Automated Observations
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Empirical findings quantified from generation diversity, self-similarity, and perplexity.
            </span>
          </div>
        </div>

        {/* Download Buttons for Markdown, CSV, and JSON */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            disabled={isExporting}
            onClick={() => onExport('markdown')}
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
            title="Download formatted lab report as Markdown"
          >
            <FileText size={14} style={{ color: '#38BDF8' }} />
            <span>Export Markdown</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => onExport('csv')}
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
            title="Download raw metrics and samples as CSV dataset"
          >
            <Table size={14} style={{ color: '#2DD4BF' }} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => onExport('json')}
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
            title="Download full experiment state as JSON"
          >
            <Code size={14} style={{ color: '#FBBF24' }} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Auto-Drafted Checklist Observations */}
      <div>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}
        >
          Automated Empirical Findings
        </div>

        {bulletPoints.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {bulletPoints.map((obs, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  fontSize: '12.5px',
                  color: 'var(--text)',
                  lineHeight: '1.5',
                }}
              >
                <CheckSquare size={16} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
                <span>{obs}</span>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-dim)',
              fontSize: '12px',
              fontStyle: 'italic',
            }}
          >
            Run an experiment or temperature sweep to generate data-grounded observations.
          </div>
        )}
      </div>

      {/* Editable Lab Notes Textarea */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Edit3 size={13} style={{ color: 'var(--text-muted)' }} />
            <label
              htmlFor="lab-notes-input"
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}
            >
              Experimenter Lab Notes (Editable)
            </label>
          </div>
          <textarea
            id="lab-notes-input"
            rows={4}
            value={userNotes}
            onChange={(e) => onUserNotesChange(e.target.value)}
            placeholder="Record your viva/lab notes, unexpected generations, parameter hypotheses..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '12px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Fill-in Conclusion Template */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <FileText size={13} style={{ color: 'var(--text-muted)' }} />
            <label
              htmlFor="conclusion-input"
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}
            >
              Conclusion & Practical Takeaways (Editable)
            </label>
          </div>
          <textarea
            id="conclusion-input"
            rows={4}
            value={conclusion}
            onChange={(e) => onConclusionChange(e.target.value)}
            placeholder="Draft conclusion based on temperature scaling and probability reshaping..."
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '12px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text)',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    </div>
  );
}
