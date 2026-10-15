// Self-reported signals used by Personal Baseline; no illustrative service data.
export const SIGNALS = [
  { id: 'mood',        label: 'Mood',             low: 'Low',       high: 'Good' },
  { id: 'sleep',       label: 'Sleep',            low: 'Poor',      high: 'Rested' },
  { id: 'stress',      label: 'Stress',           low: 'Calm',      high: 'Overwhelmed', inverted: true },
  { id: 'focus',       label: 'Focus',            low: 'Scattered', high: 'Sharp' },
  { id: 'energy',      label: 'Energy',           low: 'Depleted',  high: 'Energised' },
  { id: 'functioning', label: 'Getting things done', low: 'Barely', high: 'Easily' },
];

/** How many check-ins before a baseline is meaningful at all. */
export const BASELINE_MIN = 3;
