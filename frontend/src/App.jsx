import React, { useState, useEffect, useRef } from 'react';
import Thermometer from './components/Thermometer';
import StatusLED from './components/StatusLED';
import DiceButton from './components/DiceButton';
import LabNotes from './components/LabNotes';
import LabGuideModal from './components/LabGuideModal';
import SingleRunView from './pages/SingleRunView';
import SweepView from './pages/SweepView';
import DistributionView from './pages/DistributionView';
import { getTemperatureColor, getHeatInfo } from './theme/thermalUtils';
import {
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Layers,
  BarChart2,
  HelpCircle,
  Sun,
  Moon,
  FlaskConical,
  Cpu,
  BookOpen,
  AlertTriangle,
  Info
} from 'lucide-react';

const PROMPT_PRESETS = [
  {
    label: 'Factual',
    prompt: 'The capital of France is Paris, and the principal river running through it is the'
  },
  {
    label: 'Creative',
    prompt: 'The astronaut looked out the window and noticed an impossible celestial constellation shaped like'
  },
  {
    label: 'Code',
    prompt: 'def compute_fibonacci(n: int) -> int:\n    """Return the nth Fibonacci number efficiently."""\n'
  },
  {
    label: 'Question',
    prompt: 'Why does water expand when it freezes into ice, and what would happen to marine life if it did not?'
  },
  {
    label: 'Concept',
    prompt: 'The fundamental reason temperature scaling reshapes the softmax probability distribution is'
  }
];

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.port === '5173' ? 'http://127.0.0.1:8000' : '');

export default function App() {
  // Theme state: dark lab console by default
  const [theme, setTheme] = useState('dark');

  // Active tab: 'single' | 'sweep' | 'distribution'
  const [activeTab, setActiveTab] = useState('single');

  // New user guide modal state
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Validation error state
  const [promptError, setPromptError] = useState(null);

  // Control Panel parameters
  const [prompt, setPrompt] = useState(PROMPT_PRESETS[0].prompt);
  const [provider, setProvider] = useState('local');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1.0);
  const [topK, setTopK] = useState(0);
  const [maxTokens, setMaxTokens] = useState(80);
  const [samplesN, setSamplesN] = useState(3);
  const [seed, setSeed] = useState(42);
  const [repetitionPenalty, setRepetitionPenalty] = useState(1.15);
  const [noRepeatNgramSize, setNoRepeatNgramSize] = useState(3);

  // Sweep parameters
  const [sweepTemperatures, setSweepTemperatures] = useState([0.0, 0.3, 0.7, 1.0, 1.5]);

  // System & Execution state
  const [status, setStatus] = useState('idle'); // idle, generating, done, error
  const [statusMessage, setStatusMessage] = useState('Instrument Standby');
  const [providersList, setProvidersList] = useState([]);
  const [showConfidence, setShowConfidence] = useState(true);

  // Results state
  const [singleResults, setSingleResults] = useState(null);
  const [sweepResults, setSweepResults] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [userNotes, setUserNotes] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const tColor = getTemperatureColor(temperature);
  const heat = getHeatInfo(temperature);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch available providers on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/providers`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.providers) {
          setProvidersList(data.providers);
        }
      })
      .catch((err) => {
        console.warn('Backend not yet reachable on mount:', err);
      });
  }, []);

  // Update live distribution when on Distribution tab or when parameters change
  useEffect(() => {
    if (activeTab === 'distribution') {
      fetchDistribution(prompt, temperature, topP, topK);
    }
  }, [activeTab, prompt, temperature, topP, topK]);

  // Fetch Next-Token Distribution
  const fetchDistribution = async (pText, tVal, pVal, kVal) => {
    try {
      const res = await fetch(`${API_BASE}/api/distribution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: pText,
          provider: provider,
          temperature: tVal,
          top_p: pVal,
          top_k: kVal,
          top_n: 10
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDistributionData(data);
      }
    } catch (e) {
      console.error('Failed to fetch probability distribution:', e);
    }
  };

  // Run Single Generation
  const handleRunSingle = async () => {
    if (!prompt || !prompt.trim()) {
      setPromptError('Please enter a prompt or select a preset above before running generation.');
      setStatus('error');
      setStatusMessage('Validation: Prompt cannot be empty.');
      return;
    }
    setPromptError(null);
    setStatus('generating');
    setStatusMessage(`Generating ${samplesN} samples at T=${temperature.toFixed(2)}...`);
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          provider,
          temperature,
          top_p: topP,
          top_k: provider === 'groq' ? 0 : topK,
          max_tokens: maxTokens,
          repetition_penalty: repetitionPenalty,
          no_repeat_ngram_size: noRepeatNgramSize,
          seed: provider === 'gemini' ? null : seed,
          n: samplesN
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Generation failed');
      }

      const data = await res.json();
      setSingleResults(data);
      setStatus('done');
      if (data.warning) {
        setStatusMessage(`Completed: ${data.warning}`);
      } else {
        setStatusMessage(`Completed ${data.samples.length} samples at T=${temperature.toFixed(2)}`);
      }
    } catch (e) {
      setStatus('error');
      setStatusMessage(`Error: ${e.message}`);
    }
  };

  // Run Temperature Sweep
  const handleRunSweep = async () => {
    if (!prompt || !prompt.trim()) {
      setPromptError('Please enter a prompt or select a preset above before running sweep.');
      setStatus('error');
      setStatusMessage('Validation: Prompt cannot be empty.');
      return;
    }
    setPromptError(null);
    setStatus('generating');
    setStatusMessage(`Running sweep across ${sweepTemperatures.length} temperatures...`);
    try {
      const res = await fetch(`${API_BASE}/api/sweep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          provider,
          temperatures: sweepTemperatures,
          top_p: topP,
          top_k: provider === 'groq' ? 0 : topK,
          max_tokens: maxTokens,
          repetition_penalty: repetitionPenalty,
          no_repeat_ngram_size: noRepeatNgramSize,
          seed: provider === 'gemini' ? null : seed,
          n: samplesN
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Sweep failed');
      }

      const data = await res.json();
      setSweepResults(data);
      if (data.observations?.conclusion_template && !conclusion) {
        setConclusion(data.observations.conclusion_template);
      }
      setStatus('done');
      if (data.warning) {
        setStatusMessage(`Sweep complete: ${data.warning}`);
      } else {
        setStatusMessage(`Sweep complete: ${data.runs.length} temperatures analyzed`);
      }
    } catch (e) {
      setStatus('error');
      setStatusMessage(`Error: ${e.message}`);
    }
  };

  // Export report
  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      // Build export payload combining sweep or single data
      let exportRuns = [];
      if (activeTab === 'sweep' && sweepResults) {
        exportRuns = sweepResults.runs;
      } else if (singleResults) {
        exportRuns = [
          {
            temperature: singleResults.temperature,
            samples: singleResults.samples,
            metrics: singleResults.metrics
          }
        ];
      }

      const payload = {
        prompt,
        provider,
        model: provider === 'local' ? 'distilgpt2' : provider,
        top_p: topP,
        top_k: topK,
        repetition_penalty: repetitionPenalty,
        no_repeat_ngram_size: noRepeatNgramSize,
        seed,
        runs: exportRuns,
        observations: activeTab === 'sweep' ? (sweepResults?.observations || {}) : { bullet_points: singleResults?.observations || [] },
        user_notes: userNotes,
        conclusion: conclusion
      };

      const res = await fetch(`${API_BASE}/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, payload })
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sampling_lab_export.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert(`Export error: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Get active provider details
  const currentProviderInfo = providersList.find(p => p.id === provider);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
      }}
    >
      {/* 1. TOP BAR */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #38BDF8, #F43F5E)',
              color: '#0B0F17',
              boxShadow: `0 0 14px ${tColor}40`,
            }}
          >
            <FlaskConical size={20} strokeWidth={2.5} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                The Sampling Lab
              </h1>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: '#38BDF8',
                  textTransform: 'uppercase',
                }}
              >
                v1.0 Pro
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Text Generation Parameter Explorer & Probability Visualizer
            </span>
          </div>
        </div>

        {/* Center / Right status & controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Active Model Engine Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            <Cpu size={13} style={{ color: '#2DD4BF' }} />
            <span>Model:</span>
            <strong style={{ color: 'var(--text)' }}>
              {provider === 'local' ? 'Local GPT-2 (DistilGPT2)' : (provider === 'groq' ? 'Groq Cloud (Qwen 3.8 / Llama)' : 'Google Gemini (3.1 Flash)')}
            </strong>
          </div>

          {/* Instrument Status LED */}
          <StatusLED status={status} message={statusMessage} />

          {/* Guide for Beginners Button */}
          <button
            type="button"
            onClick={() => setIsGuideOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38BDF8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Open interactive beginner's guide explaining sampling parameters"
          >
            <BookOpen size={14} />
            <span>Guide for Beginners</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            title={`Switch to ${theme === 'dark' ? 'Daylight Lab' : 'Dark Lab Console'}`}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* 2. MAIN LAYOUT (2 Columns: Left Control Panel + Right Stage) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '350px 1fr',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {/* LEFT CONTROL PANEL (Fixed technical instrument column) */}
        <aside
          style={{
            padding: '20px',
            backgroundColor: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 61px)',
          }}
        >
          {/* Control Panel Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} style={{ color: tColor }} />
              <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Control Panel
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
              title="Parameter help"
            >
              <HelpCircle size={13} />
              <span>Help</span>
            </button>
          </div>

          {/* Prompt Input with Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
              <label htmlFor="prompt-input" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Input Prompt</span>
                <span title="The starting text given to the model for autoregressive continuation" style={{ cursor: 'help', color: 'var(--text-dim)' }}>ⓘ</span>
              </label>
              {/* Presets Chips */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {PROMPT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPrompt(p.prompt);
                      setPromptError(null);
                    }}
                    style={{
                      background: prompt === p.prompt ? `${tColor}20` : 'transparent',
                      border: `1px solid ${prompt === p.prompt ? tColor : 'transparent'}`,
                      borderRadius: '4px',
                      padding: '2px 5px',
                      fontSize: '10px',
                      color: prompt === p.prompt ? tColor : 'var(--text-dim)',
                      fontWeight: prompt === p.prompt ? 700 : 400,
                      cursor: 'pointer',
                    }}
                    title={`Load preset: ${p.label}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inline validation alert if prompt is empty */}
            {promptError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid #F43F5E',
                  color: '#FB7185',
                  fontSize: '11px',
                }}
              >
                <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                <span>{promptError}</span>
              </div>
            )}

            <textarea
              id="prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (e.target.value.trim()) setPromptError(null);
              }}
              placeholder="Enter starting prompt text..."
              className="font-mono"
              style={{
                fontSize: '12px',
                padding: '8px 10px',
                resize: 'vertical',
                minHeight: '65px',
                border: promptError ? '1px solid #F43F5E' : '1px solid var(--border)',
              }}
            />
          </div>

          {/* Model Provider Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="provider-select" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Model Provider
              </label>
              <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 600 }}>● Cached & Ready</span>
            </div>
            <select
              id="provider-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{
                padding: '7px 10px',
                fontSize: '12px',
                backgroundColor: 'var(--surface-2)',
                color: 'var(--text)',
                borderRadius: '6px',
                border: '1px solid var(--border)',
              }}
            >
              <option value="local">Local GPT-2 (DistilGPT-2 · Full Logits & 100% Offline)</option>
              <option value="groq">Groq Cloud (Qwen 3.8 / Llama · Ultra Fast)</option>
              <option value="gemini">Google Gemini (Gemini 3.1 Flash-Lite)</option>
            </select>
            {provider !== 'local' && (
              <div style={{ fontSize: '11px', color: '#FBBF24', padding: '2px 4px' }}>
                ℹ️ Note: Cloud APIs do not expose internal logits. Probability distributions are powered by local DistilGPT-2.
              </div>
            )}
          </div>

          {/* SIGNATURE COMPONENT: Vertical Glass Thermometer */}
          <Thermometer
            value={temperature}
            onChange={(val) => setTemperature(val)}
            min={0.0}
            max={2.0}
            step={0.05}
          />

          {/* Secondary Sampling Controls: Top-p and Top-k */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '12px',
              backgroundColor: 'var(--surface-2)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            {/* Top-p (Nucleus) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Top-p (Nucleus)</span>
                <span className="font-mono" style={{ color: '#38BDF8', fontWeight: 600 }}>{topP.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#38BDF8' }}
                title="Nucleus sampling: cumulative probability mass threshold (e.g. 0.9 keeps top 90% mass)"
              />
            </div>

            {/* Top-k */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Top-k Limit</span>
                <span className="font-mono" style={{ color: '#2DD4BF', fontWeight: 600 }}>
                  {provider === 'groq' ? 'N/A' : (topK === 0 ? 'Off' : topK)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                disabled={provider === 'groq'}
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#2DD4BF', opacity: provider === 'groq' ? 0.4 : 1 }}
                title={provider === 'groq' ? 'Top-k is unsupported by Groq API' : 'Limits candidate selection to top-k highest logit tokens'}
              />
            </div>
          </div>

          {/* Max Tokens & Samples Count N */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}
          >
            {/* Max tokens */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Tokens</span>
                <span className="font-mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{maxTokens}</span>
              </div>
              <input
                type="range"
                min="20"
                max="250"
                step="10"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: tColor }}
                title="Maximum new tokens generated before stopping"
              />
            </div>

            {/* Samples N */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Samples (N)</span>
                <span className="font-mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{samplesN}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={samplesN}
                onChange={(e) => setSamplesN(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: tColor }}
                title="Number of independent sample generations per setting"
              />
            </div>
          </div>

          {/* Repetition & Degeneracy Controls */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '10px 12px',
              backgroundColor: 'var(--surface-2)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <RotateCcw size={12} /> Repetition Controls
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: repetitionPenalty > 1.0 || noRepeatNgramSize > 0 ? '#10B981' : 'var(--text-dim)',
                  fontWeight: 600,
                  backgroundColor: repetitionPenalty > 1.0 || noRepeatNgramSize > 0 ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                {repetitionPenalty > 1.0 || noRepeatNgramSize > 0 ? 'Active' : 'Off'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Repetition Penalty Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span style={{ color: 'var(--text-dim)' }} title="Scales down logits for repeated tokens to prevent looping">Penalty</span>
                  <span className="font-mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{repetitionPenalty.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="1.00"
                  max="1.50"
                  step="0.05"
                  value={repetitionPenalty}
                  onChange={(e) => setRepetitionPenalty(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#10B981' }}
                  title="Repetition penalty: 1.00 = raw unpenalized logits, 1.15-1.20 = natural balance"
                />
              </div>

              {/* No-Repeat N-Gram Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                  <span style={{ color: 'var(--text-dim)' }} title="Strictly forbids identical n-token phrase repetitions">No-Repeat N</span>
                  <span className="font-mono" style={{ color: 'var(--text)', fontWeight: 600 }}>{noRepeatNgramSize === 0 ? 'Off' : `${noRepeatNgramSize}-gram`}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={noRepeatNgramSize}
                  onChange={(e) => setNoRepeatNgramSize(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: '#10B981' }}
                  title="No-repeat n-gram: 0 = disabled, 3 = prevents repeated 3-token phrases"
                />
              </div>
            </div>
          </div>

          {/* Seed + Roll Dice */}
          <DiceButton
            seed={seed}
            onChange={(newSeed) => setSeed(newSeed)}
            disabled={provider === 'gemini'}
          />

          {/* Main Action Run Experiment Button */}
          <button
            type="button"
            disabled={status === 'generating'}
            onClick={activeTab === 'sweep' ? handleRunSweep : handleRunSingle}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: tColor,
              color: '#0B0F17',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              boxShadow: `0 0 16px ${tColor}40`,
              marginTop: 'auto',
              cursor: status === 'generating' ? 'not-allowed' : 'pointer',
              opacity: status === 'generating' ? 0.75 : 1,
            }}
          >
            <Play size={16} fill="#0B0F17" />
            <span>
              {status === 'generating'
                ? 'Sampling in Progress...'
                : (activeTab === 'sweep' ? 'Run Temperature Sweep' : 'Run Experiment')}
            </span>
          </button>
        </aside>

        {/* RIGHT MAIN STAGE */}
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '24px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 61px)',
          }}
        >
          {/* STAGE HEADER TABS */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '12px',
            }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('single')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'single' ? 'var(--surface)' : 'transparent',
                  border: `1px solid ${activeTab === 'single' ? tColor : 'transparent'}`,
                  color: activeTab === 'single' ? tColor : 'var(--text-muted)',
                }}
              >
                1. Single Run (N={samplesN})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sweep')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'sweep' ? 'var(--surface)' : 'transparent',
                  border: `1px solid ${activeTab === 'sweep' ? '#FBBF24' : 'transparent'}`,
                  color: activeTab === 'sweep' ? '#FBBF24' : 'var(--text-muted)',
                }}
              >
                2. Temperature Sweep (Core)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('distribution')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: activeTab === 'distribution' ? 'var(--surface)' : 'transparent',
                  border: `1px solid ${activeTab === 'distribution' ? '#38BDF8' : 'transparent'}`,
                  color: activeTab === 'distribution' ? '#38BDF8' : 'var(--text-muted)',
                }}
              >
                3. Probability Distribution
              </button>
            </div>

            {/* Quick confidence badge toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={showConfidence}
                onChange={(e) => setShowConfidence(e.target.checked)}
                style={{ accentColor: tColor }}
              />
              <span>Show Token Confidence</span>
            </label>
          </div>

          {/* TAB 1: SINGLE RUN */}
          {activeTab === 'single' && (
            <SingleRunView
              samples={singleResults?.samples || []}
              prompt={singleResults?.prompt || prompt}
              temperature={singleResults?.temperature ?? temperature}
              isGenerating={status === 'generating'}
              showConfidence={showConfidence}
              onToggleConfidence={() => setShowConfidence(!showConfidence)}
              onRegenerate={handleRunSingle}
            />
          )}

          {/* TAB 2: TEMPERATURE SWEEP */}
          {activeTab === 'sweep' && (
            <SweepView
              temperatures={sweepTemperatures}
              onTemperaturesChange={setSweepTemperatures}
              runs={sweepResults?.runs || []}
              prompt={sweepResults?.prompt || prompt}
              isSweeping={status === 'generating'}
              onRunSweep={handleRunSweep}
              showConfidence={showConfidence}
              onToggleConfidence={() => setShowConfidence(!showConfidence)}
            />
          )}

          {/* TAB 3: PROBABILITY DISTRIBUTION VISUALIZER */}
          {activeTab === 'distribution' && (
            <DistributionView
              distributionData={distributionData}
              temperature={temperature}
              topP={topP}
              topK={topK}
              onTemperatureSelect={(t) => setTemperature(t)}
              isLoading={status === 'generating'}
            />
          )}

          {/* BOTTOM ZONE: LAB NOTES & AUTO OBSERVATIONS & EXPORTS */}
          <LabNotes
            observations={
              activeTab === 'sweep'
                ? (sweepResults?.observations || {})
                : { bullet_points: singleResults?.observations || [] }
            }
            userNotes={userNotes}
            onUserNotesChange={setUserNotes}
            conclusion={conclusion}
            onConclusionChange={setConclusion}
            onExport={handleExport}
            isExporting={isExporting}
          />
        </main>
      </div>

      {/* 3. BEGINNER'S GUIDE MODAL */}
      <LabGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
    </div>
  );
}
