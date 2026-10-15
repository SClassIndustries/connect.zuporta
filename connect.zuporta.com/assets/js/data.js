/* Zuporta+ release content: guided activities, local preferences and support routes. */

// Verify US crisis resources against official providers before release.
export const CRISIS = {
  emergency: 'If you are in immediate danger, call your local emergency number.',
  directoryText: 'Find crisis support for your country:',
  directoryUrl: 'https://findahelpline.com',
  directoryLabel: 'findahelpline.com',
  lines: [
    { where: 'United States', how: 'call or text 988' },
  ],
};

/* ---------- what people come here for (§2) ---------- */

export const TOPICS = [
  { id: 'stress',      label: 'Stress & Overwhelm' },
  { id: 'work',        label: 'Work' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'parenting',   label: 'Parenting' },
  { id: 'habits',      label: 'Healthy Habits' },
  { id: 'growth',      label: 'Personal Growth' },
  { id: 'confidence',  label: 'Confidence' },
  { id: 'sleep',       label: 'Sleep & Routines' },
  { id: 'talk',        label: 'I Just Need to Talk' },
];

export const topicLabel = (id) => (TOPICS.find((t) => t.id === id) || {}).label || 'what is going on';

/* ---------- guided wellness experiences (§5) ---------- */

export const ACTIVITIES = {
  reset: {
    id: 'reset',
    name: '3-Minute Reset',
    duration: '3 min',
    forTopics: ['stress', 'work', 'talk'],
    intro: 'A short structured reset. Five steps, about three minutes. I will stay with you.',
    steps: [
      { title: 'Land', body: 'Put both feet flat on the floor and let your shoulders drop away from your ears. Nothing to fix yet.' },
      { title: 'Breathe', body: 'In through the nose for 4, out through the mouth for 6. Five rounds. The longer out-breath is what does the work.', breathe: true },
      { title: 'Name it', body: 'Name the three things pulling at you right now. Say them silently, in plain words.' },
      { title: 'Sort it', body: 'Of those three, which one is actually yours to carry today? The other two can wait without anything falling apart.' },
      { title: 'One step', body: 'One small thing you could do about it in the next hour. Small enough that you will actually do it.' },
    ],
  },
  boundary: {
    id: 'boundary',
    name: 'Switching Off From Work',
    duration: '4 min',
    forTopics: ['work', 'sleep'],
    intro: 'A structured wind-down for a mind that is still at the desk.',
    steps: [
      { title: 'Close the loop', body: 'Write down the first thing you will pick up tomorrow. Your head keeps rehearsing it because it does not trust you to remember.' },
      { title: 'Mark the edge', body: 'Choose one physical signal that work is done — closing the laptop, changing clothes, a walk to the end of the road.' },
      { title: 'Breathe', body: 'In for 4, out for 6, five rounds. This is the handover between the two halves of your day.', breathe: true },
      { title: 'Reclaim', body: 'Name one thing in this evening that belongs to you rather than to anyone else.' },
    ],
  },
  ground: {
    id: 'ground',
    name: 'Grounding Reset',
    duration: '2 min',
    forTopics: ['stress', 'talk', 'relationships'],
    intro: 'A short practice for when your attention is everywhere at once.',
    steps: [
      { title: 'Look', body: 'Find five things you can see. Take them in slowly, one at a time.' },
      { title: 'Feel', body: 'Four things you can feel — the chair, your feet, fabric, the air.' },
      { title: 'Hear', body: 'Three things you can hear, including the quietest one.' },
      { title: 'Breathe', body: 'One slow breath out, longer than the breath in.', breathe: true },
    ],
  },
};

/** The activity best suited to a topic. */
export function activityFor(topic) {
  const hit = Object.values(ACTIVITIES).find((a) => a.forTopics.includes(topic));
  return hit || ACTIVITIES.reset;
}

export const CONTEXTS = [
  { id: 'work',         label: 'Work' },
  { id: 'family',       label: 'Family' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'health',       label: 'Health' },
  { id: 'finance',      label: 'Money' },
  { id: 'personal',     label: 'Something personal' },
];

/** What the person actually did — behaviour, not just feeling. */
export const COPING = [
  { id: 'talked',   label: 'Talked to someone' },
  { id: 'rested',   label: 'Rested or slept' },
  { id: 'moved',    label: 'Moved or exercised' },
  { id: 'avoided',  label: 'Avoided it' },
  { id: 'planned',  label: 'Made a plan' },
  { id: 'pushed',   label: 'Pushed through' },
  { id: 'nothing',  label: 'Nothing yet' },
];

/** Longitudinal follow-up schedule. The point of the whole exercise. */
export const FOLLOWUPS = [
  { id: '1h',  label: '1 hour',   ms: 60 * 60 * 1000 },
  { id: '24h', label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { id: '7d',  label: '7 days',   ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: '30 days',  ms: 30 * 24 * 60 * 60 * 1000 },
];

/** Local storage is required; activity-history personalization is optional. */
export const CONSENT_LAYERS = [
  {
    id: 'service',
    title: 'Use Zuporta+',
    body: 'Your check-ins and conversations are stored on your device so the app works at all.',
    required: true,
  },
  {
    id: 'personalize',
    title: 'Personalize my support',
    body: 'Use guided activities you have rated helpful for suggestions on Home. This stays on your device; turning it off restores the standard activity suggestion.',
  },

];
