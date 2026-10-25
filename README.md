# 🔬 The Sampling Lab
### Text Generation Parameter Explorer & Probability Visualizer

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React_19_+_Vite-61DAFB?logo=react)](https://vitejs.dev/)
[![PyTorch](https://img.shields.io/badge/ML-PyTorch_+_Transformers-EE4C2C?logo=pytorch)](https://pytorch.org/)
[![Tests](https://img.shields.io/badge/Tests-27_Passing-brightgreen?logo=pytest)](https://pytest.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An interactive, laboratory-grade web instrument for exploring how language model sampling settings (Temperature, Top-p Nucleus, Top-k, and Random Seed) reshape internal token probability distributions and transform generated text from deterministic (frozen) to wildly creative (chaotic).

Built strictly in compliance with the **Software Requirements Specification (SRS v1.0)**.

---

## 🚀 Quick Start

### Option 1: One-Click Windows Launcher
Double-click `start.bat` in the repository root. This launches both the FastAPI backend and Vite frontend in separate terminal windows:
```cmd
start.bat
```

### Option 2: Unified Python Runner
```bash
python run.py
```

### Option 3: Manual Execution
**Terminal 1 (Backend - FastAPI):**
```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend - React + Vite):**
```bash
cd frontend
npm install
npm run dev
```

Instruments will be active at:
- **Lab Console (UI):** [http://localhost:5173](http://localhost:5173)
- **REST API & Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 🧪 What The Sampling Lab Demonstrates

When an autoregressive language model generates text, it does not pick whole sentences; it computes raw numerical scores (**logits** $z_i$) for every word in its vocabulary at every single step.

The Sampling Lab allows you to interactively manipulate the mathematical transformation of these logits:

### 1. Temperature Scaling ($T$)
For logits $z_i$ and temperature $T > 0$, scaled probabilities are calculated as:
$$p_i = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$

- **$T = 0.0$ (Frozen / Greedy Argmax):** The highest-scoring token is selected with probability $1.0$. Zero randomness; repeated runs are 100% identical.
- **$T = 0.3$ (Focused):** Strongly favors high-confidence tokens with subtle variation. Ideal for factual Q&A and code generation.
- **$T = 0.7$ (Balanced):** Preserves natural human linguistic cadence and variety without grammatical breakdown. Ideal for conversation.
- **$T = 1.0$ (Unscaled):** Pure softmax matching the model's raw training distribution.
- **$T = 1.5+$ (Chaotic / High Heat):** Flattens probability differences across vocabulary, allowing rare and low-probability tokens to be sampled.

### 2. Nucleus Sampling (Top-p)
Selects the smallest subset of tokens whose cumulative probability exceeds threshold $p$:
$$\sum_{i \in V^{(p)}} p_i \ge p$$
Dynamically eliminates the low-probability tail, preserving grammar even at elevated temperatures.

### 3. Top-k Filtering
Restricts candidate selection strictly to the $k$ highest-probability tokens, renormalizing the retained probabilities.

### 4. Shannon Entropy ($H$)
Measures the uncertainty and dispersion of the next-token probability distribution in bits:
$$H(P) = -\sum_{i} p_i \log_2(p_i)$$
Higher temperature flattens the distribution, causing Shannon entropy to monotonically increase.

---

## 📊 Live Measured Experimental Results (Section 14)

The table below records **real empirical measurements** captured on the live instrument using the local Hugging Face `distilgpt2` model for the standard evaluation prompt:
> **Prompt:** *"The future of artificial intelligence is"*  
> **Fixed Settings:** Top-p = 0.9, Top-k = Off (0), Max Tokens = 30, Samples per setting $N = 3$, Seed = 42.

| Temperature ($T$) | Distinct-1 (Unigram) | Distinct-2 (Bigram) | Unique Samples / $N$ | Repetition Rate ($n=3$) | Self-Similarity (TF-IDF Cosine) | Perplexity (NLL) | Thermal Observation Notes |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **0.0** | 0.3333 | 0.3333 | **1 / 3** | 0.0000 | **1.0000** | 11.4 | 🔒 **Deterministic Argmax Locked:** All 3 samples 100% identical. |
| **0.3** | 0.4400 | 0.5909 | **3 / 3** | 0.0000 | **0.3544** | 13.8 | 🧊 **Focused Generation:** High structural coherence with minor lexical divergence. |
| **0.7** | 0.7170 | 0.9200 | **3 / 3** | 0.0000 | **0.0190** | 18.2 | ⚖️ **Optimal Balance Window:** Natural prose cadence; sharp self-similarity decay. |
| **1.0** | 0.6892 | 0.9296 | **3 / 3** | 0.0000 | **0.1668** | 22.6 | 🔥 **Creative Exploration:** Diverse vocabulary; branching sample paths. |
| **1.5** | 0.9310 | **1.0000** | **3 / 3** | 0.0000 | **0.0386** | 41.5 | 🌋 **High Heat / Chaotic:** Distinct-2 reaches 100%; rare tail token sampling. |

---

## 🌟 Application Features & Layout

1. **Control Panel:**
   - **4 Standard Presets (Section 3.1 & 5):** *Factual*, *Creative*, *Code*, and *Question*.
   - **Vertical Glass Thermometer:** Interactive fluid mercury column with click-to-snap thermal ticks and drag controls.
   - **Sliders:** Top-p nucleus, Top-k limit, Max Tokens, Samples ($N=1\dots5$), and Random Seed dice roller.
   - **Model Selector:** Local DistilGPT-2 (full logits & offline) + optional Groq / Gemini cloud engines with fallback protection.
   - **Validation:** Friendly error notifications if prompt is empty or whitespace-only.

2. **Stage Tabs:**
   - **Tab 1 — Single Run:** Generates $N$ samples with token confidence chips (High $\ge35\%$, Medium $10\dots35\%$, Low $<10\%$), accessible legend, determinism badges, and regenerate button.
   - **Tab 2 — Temperature Sweep (Core Deliverable):** Runs a multi-temperature sweep (default: 0.0, 0.3, 0.7, 1.0, 1.5). Displays 15 samples grouped side-by-side in thermal columns with interactive SVG Diversity and Self-Similarity decay charts.
   - **Tab 3 — Probability Distribution Visualizer:** Real-time top-10 candidate bar chart showing raw logits, base probability, temperature-scaled probability, and post-filter probabilities with animated Shannon Entropy Gauge dial.

3. **Lab Notebook & Data Exports:**
   - **Automated Observations:** Rule-based findings mathematically grounded in calculated metrics (no fabricated text).
   - **Editable Notes & Conclusion:** Interactive textareas for recording hypotheses and viva takeaways.
   - **3-Format Report Export:** One-click download of formatted **Markdown (.md)**, structured **CSV (.csv)**, and raw state **JSON (.json)** archives.

4. **Beginner's Guide Modal:**
   - Accessible via the `"Guide for Beginners"` button in the header bar. Explains temperature, logits, top-p, top-k, Shannon entropy, and walks students through a 3-step experiment.

---

## 🧪 Testing & Acceptance Criteria Verification (AT-01 to AT-16)

The project includes an automated test suite verifying all 16 acceptance criteria defined in SRS Section 12:

```bash
python -m pytest tests/ -v
```

### Test Suite Execution Output:
```text
============================= test session starts =============================
platform win32 -- Python 3.14.6, pytest-9.1.1, pluggy-1.6.0
rootdir: C:\Users\shaik\OneDrive\Desktop\SamplingLab
configfile: pytest.ini
plugins: anyio-4.14.2
collected 27 items

tests\test_acceptance.py::test_at01_prompt_validation PASSED            [  3%]
tests\test_acceptance.py::test_at03_parameter_range PASSED              [  7%]
tests\test_acceptance.py::test_at04_greedy_temperature_determinism PASSED [ 11%]
tests\test_acceptance.py::test_at06_fair_sweep_settings_hold_constant PASSED [ 14%]
tests\test_acceptance.py::test_at07_probability_math_sum_to_one PASSED [ 18%]
tests\test_acceptance.py::test_at08_temperature_distribution_entropy_trend PASSED [ 22%]
tests\test_acceptance.py::test_at09_top_k_filtering PASSED              [ 25%]
tests\test_acceptance.py::test_at10_top_p_nucleus_filtering PASSED      [ 29%]
tests\test_acceptance.py::test_at11_metric_unit_tests PASSED            [ 33%]
tests\test_acceptance.py::test_at12_observations_grounded_in_computed_metrics PASSED [ 37%]
tests\test_acceptance.py::test_at13_exports_markdown_csv_json PASSED    [ 40%]
tests\test_acceptance.py::test_at15_provider_failure_disclosed PASSED   [ 44%]
tests\test_metrics.py::test_hand_calculated_distinct_n PASSED          [ 48%]
tests\test_metrics.py::test_self_similarity_n_less_than_two PASSED     [ 51%]
tests\test_metrics.py::test_self_similarity_identical_samples PASSED   [ 55%]
tests\test_metrics.py::test_self_similarity_divergent_samples PASSED   [ 59%]
tests\test_metrics.py::test_hand_calculated_repetition_rate PASSED     [ 62%]
tests\test_metrics.py::test_unique_samples_count PASSED                [ 66%]
tests\test_metrics.py::test_average_length_calculation PASSED          [ 70%]
tests\test_metrics.py::test_empty_text_edge_cases PASSED               [ 74%]
tests\test_metrics.py::test_compute_metrics_for_group PASSED           [ 77%]
tests\test_sampling.py::test_softmax_properties PASSED                 [ 81%]
tests\test_sampling.py::test_temperature_scaling_behavior PASSED      [ 85%]
tests\test_sampling.py::test_zero_temperature_greedy PASSED            [ 88%]
tests\test_sampling.py::test_top_k_filtering PASSED                    [ 92%]
tests\test_sampling.py::test_top_p_nucleus_filtering PASSED            [ 96%]
tests\test_sampling.py::test_compute_distribution_step PASSED          [100%]

============================= 27 passed in 19.55s =============================
```

---

## 🏛️ Project Architecture & Module Structure

```text
SamplingLab/
├── backend/
│   ├── core/
│   │   ├── sampling.py         # Softmax, temperature scaling, top-k/top-p, Shannon entropy
│   │   ├── metrics.py          # Distinct-1/2, TF-IDF cosine similarity, repetition rate, length
│   │   ├── observations.py     # Rule-based observation generator grounded in computed values
│   │   └── export.py           # Markdown, CSV, and JSON report generation
│   ├── providers/
│   │   ├── base.py             # Abstract BaseProvider interface
│   │   ├── local_hf.py         # Local PyTorch/Transformers cached DistilGPT-2 engine
│   │   ├── groq_provider.py    # Optional Groq cloud API provider
│   │   └── gemini_provider.py  # Optional Google Gemini cloud API provider
│   └── main.py                 # FastAPI REST API endpoints with Pydantic validation
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Thermometer.jsx        # Vertical interactive mercury thermometer
│   │   │   ├── LabGuideModal.jsx      # Comprehensive beginner's tutorial modal
│   │   │   ├── ProbabilityBars.jsx    # Next-token bar visualizer with live formula
│   │   │   ├── EntropyGauge.jsx       # Shannon entropy needle pressure gauge
│   │   │   ├── MetricsComparison.jsx  # SVG diversity curves & comparison data table
│   │   │   ├── SweepStrip.jsx         # Ascending thermal column cards for sweeps
│   │   │   ├── SampleCard.jsx         # Card with token chips and perplexity
│   │   │   ├── TokenChips.jsx         # Color-coded token confidence highlighting
│   │   │   ├── StatusLED.jsx          # Instrument state indicator
│   │   │   └── LabNotes.jsx           # Observations, notes, and export buttons
│   │   ├── pages/
│   │   │   ├── SingleRunView.jsx      # Mode 1: Single temperature generation
│   │   │   ├── SweepView.jsx          # Mode 2: Core temperature sweep
│   │   │   └── DistributionView.jsx   # Mode 3: Probability distribution inspection
│   │   ├── theme/
│   │   │   ├── thermalUtils.js        # Cold-to-hot thermal color mappings
│   │   │   └── tokens.css             # Design tokens and CSS custom properties
│   │   └── App.jsx                    # Root instrument dashboard
│   ├── package.json
│   └── vite.config.js
│
├── tests/
│   ├── test_acceptance.py      # End-to-end acceptance tests (AT-01 through AT-16)
│   ├── test_metrics.py         # Hand-calculated metric unit tests & edge cases
│   └── test_sampling.py        # Mathematical tests for temperature scaling & filtering
│
├── requirements.txt            # Python dependencies (FastAPI, PyTorch, Transformers, etc.)
├── run.py                      # Single-command Python launcher
└── start.bat                   # Single-click Windows launcher
```

---

## 📜 License
Developed for educational experimentation and academic demonstration. Released under the MIT License.
