/**
 * Thermal Utility Functions for The Sampling Lab.
 * Maps temperature [0.0 - 2.0] to colors, descriptors, and mathematical characteristics.
 */

// Key thermal color anchors
const THERMAL_STOPS = [
  { temp: 0.0, color: [56, 189, 248], hex: "#38BDF8" },   // Ice blue (Frozen/Deterministic)
  { temp: 0.3, color: [45, 212, 191], hex: "#2DD4BF" },   // Teal (Focused)
  { temp: 0.7, color: [251, 191, 36], hex: "#FBBF24" },   // Amber (Balanced)
  { temp: 1.2, color: [251, 113, 133], hex: "#FB7185" },  // Coral (Creative)
  { temp: 2.0, color: [244, 63, 94], hex: "#F43F5E" }     // Molten red (Chaotic)
];

/**
 * Returns RGB interpolated hex color string for any temperature between 0.0 and 2.0.
 */
export function getTemperatureColor(temp) {
  const t = Math.max(0.0, Math.min(2.0, Number(temp) || 0.0));

  // Find surrounding stops
  let lower = THERMAL_STOPS[0];
  let upper = THERMAL_STOPS[THERMAL_STOPS.length - 1];

  for (let i = 0; i < THERMAL_STOPS.length - 1; i++) {
    if (t >= THERMAL_STOPS[i].temp && t <= THERMAL_STOPS[i + 1].temp) {
      lower = THERMAL_STOPS[i];
      upper = THERMAL_STOPS[i + 1];
      break;
    }
  }

  if (lower.temp === upper.temp) {
    return lower.hex;
  }

  // Linear interpolation factor
  const factor = (t - lower.temp) / (upper.temp - lower.temp);
  const r = Math.round(lower.color[0] + factor * (upper.color[0] - lower.color[0]));
  const g = Math.round(lower.color[1] + factor * (upper.color[1] - lower.color[1]));
  const b = Math.round(lower.color[2] + factor * (upper.color[2] - lower.color[2]));

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Returns semantic heat details for temperature value.
 */
export function getHeatInfo(temp) {
  const t = Number(temp);
  if (t <= 0.05) {
    return {
      label: "Frozen",
      sublabel: "Deterministic",
      description: "Always picks the single most likely token (argmax). Identical outputs across runs.",
      icon: "❄️",
      tier: "cold"
    };
  }
  if (t < 0.5) {
    return {
      label: "Focused",
      sublabel: "Mild Variation",
      description: "Low entropy, tight probability distribution. Highly coherent, ideal for factual queries.",
      icon: "🧊",
      tier: "cool"
    };
  }
  if (t <= 0.9) {
    return {
      label: "Balanced",
      sublabel: "Optimal Cadence",
      description: "Natural linguistic variety and syntactic structure. Recommended general default.",
      icon: "⚖️",
      tier: "warm"
    };
  }
  if (t <= 1.4) {
    return {
      label: "Creative",
      sublabel: "Stochastic Exploration",
      description: "Flattened distribution allows surprising tail tokens. Higher diversity, occasional drift.",
      icon: "🔥",
      tier: "hot"
    };
  }
  return {
    label: "Chaotic",
    sublabel: "High Entropy",
    description: "Near-uniform distribution. High risk of gibberish, hallucination, or looping tokens.",
    icon: "🌋",
    tier: "molten"
  };
}
