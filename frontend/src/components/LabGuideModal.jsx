import React from 'react';
import { X, Sparkles, Sliders, BarChart2, Layers, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

export default function LabGuideModal({ isOpen, onClose, onSelectPreset }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '88vh',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--surface)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>
                Beginner's Guide to The Sampling Lab
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Understand how sampling parameters shape language model probability distributions
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Core Concept */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: '#FBBF24' }} />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                What Happens When an AI Generates Text?
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              A language model does not output words all at once. At each step, it assigns raw numerical scores (called <strong>logits</strong>) to every possible word in its vocabulary. The <strong>Softmax function</strong> turns these logits into percentages (probabilities), and sampling algorithms choose which word comes next!
            </p>
          </div>

          {/* Section 2: Key Parameters Visualized */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Core Sampling Parameters
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {/* Temperature */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🌡️</span>
                  <strong style={{ fontSize: '13px', color: '#F43F5E' }}>Temperature (T)</strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Controls the sharpness of probabilities by dividing logits by <em>T</em> before softmax:
                </p>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  <li><strong>T = 0.0 (Frozen):</strong> Pure greedy argmax. The #1 top token is chosen 100% of the time. Output is completely deterministic.</li>
                  <li><strong>T = 0.7 (Balanced):</strong> Preserves natural linguistic variety without chaotic errors. Ideal for chat and essays.</li>
                  <li><strong>T = 1.5+ (Chaotic):</strong> Flattens distribution toward uniform randomness. Generates surreal, creative, or ungrammatical text.</li>
                </ul>
              </div>

              {/* Top-p */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🎯</span>
                  <strong style={{ fontSize: '13px', color: '#38BDF8' }}>Top-p (Nucleus Sampling)</strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Dynamically cuts off the "unlikely tail" of words. If <strong>p = 0.90</strong>, the model collects the top candidates until their cumulative probability reaches 90%, discarding the bottom 10% of improbable gibberish.
                </p>
              </div>

              {/* Top-k */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid rgba(45, 212, 191, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🔢</span>
                  <strong style={{ fontSize: '13px', color: '#2DD4BF' }}>Top-k Limit</strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  A hard ceiling that forces the model to choose only from the <em>k</em> highest-scoring words (e.g. top 50), regardless of their individual probability. Set to 0 to disable.
                </p>
              </div>

              {/* Seed */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🎲</span>
                  <strong style={{ fontSize: '13px', color: '#FBBF24' }}>Random Seed</strong>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  An integer initializing the random number generator. Using the exact same seed, prompt, and parameters allows you to reproduce the exact same random choices.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: How to Read the Metrics */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Quantitative Lab Metrics Explained
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '12px' }}>
                <strong style={{ color: '#38BDF8' }}>Distinct-1 & Distinct-2:</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  Ratio of unique unigrams and bigrams to total tokens. Measures lexical richness and vocabulary breadth.
                </span>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '12px' }}>
                <strong style={{ color: '#FBBF24' }}>Pairwise Self-Similarity:</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  TF-IDF Cosine similarity between repeated samples. 1.0 means identical outputs; lower values show divergent creative paths.
                </span>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '12px' }}>
                <strong style={{ color: '#FB7185' }}>Repetition Rate:</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  Percentage of repeated 3-gram phrases. Low temperature models often get stuck in repetitive loops.
                </span>
              </div>

              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: '12px' }}>
                <strong style={{ color: '#2DD4BF' }}>Shannon Entropy:</strong>
                <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                  Measures uncertainty in bits: <em>H = -Σ p log₂(p)</em>. Low entropy = sharp distribution; high entropy = flat distribution.
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Recommended 3-Step Experiment */}
          <div
            style={{
              padding: '18px',
              borderRadius: '12px',
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#38BDF8' }}>
              🧪 Try This 3-Step Guided Experiment
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: 'var(--text)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#38BDF8', color: '#0B0F17', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px' }}>1</span>
                <div>
                  <strong>Freeze the Temperature to T = 0.0:</strong> Select preset <em>"Factual"</em>, drag temperature to 0.0, and click <strong>"Run Experiment"</strong>. Notice all N=3 samples are 100% identical with Self-Similarity: 1.000.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#FBBF24', color: '#0B0F17', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px' }}>2</span>
                <div>
                  <strong>Run a Temperature Sweep:</strong> Click the <strong>"Temperature Sweep"</strong> tab and run the 5-point sweep. Watch the 15 generated sample cards and see Distinct-2 rise while Self-Similarity drops on the interactive chart.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#F43F5E', color: '#0B0F17', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px' }}>3</span>
                <div>
                  <strong>Inspect Next-Token Distributions:</strong> Click <strong>"Probability Distribution"</strong> and toggle between T=0.2, T=1.0, and T=2.0 to see the real Softmax probabilities flatten and Shannon entropy climb.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'var(--surface)',
            position: 'sticky',
            bottom: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
              backgroundColor: '#38BDF8',
              color: '#0B0F17',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Start Experimenting
          </button>
        </div>
      </div>
    </div>
  );
}
