/* ============================================================
   Zuporta — product data for the prototype.

   Hierarchy (Revision 1 §1):
     Zuporta          the platform / marketplace
     Zuporta+         the premium consumer membership
     Zuporta+ Assistant   the AI experience inside Zuporta+
     Zuporta Connect™     the underlying intelligence layer
     Professionals    real certified wellness professionals

   Every professional, rating and reading below is ILLUSTRATIVE demo
   content for the prototype. None of these are real practitioners.
   ============================================================ */

/* ============================================================
   ⚠️  CRISIS RESOURCES — EDIT THIS BLOCK FOR YOUR COUNTRY  ⚠️

   This is the ONLY place the generic crisis lines are written.
   Change them here and every screen in the app updates.

   findahelpline.com is listed first on purpose: it covers every
   country, so it is correct no matter where a member is. The
   country lines below it are clearly labelled as examples —
   add yours, and delete any that do not apply to you.

   Verify every number on the provider's own website before you
   publish. Do not take any AI's word for a crisis number.
   ============================================================ */

export const CRISIS = {
  emergency: 'If you are in immediate danger, call your local emergency number.',
  directoryText: 'Free, 24/7 crisis lines for every country:',
  directoryUrl: 'https://findahelpline.com',
  directoryLabel: 'findahelpline.com',
  // Add or replace these with the lines for the countries you serve.
  lines: [
    { where: 'United States', how: 'call or text 988' },
    { where: 'United Kingdom and Ireland', how: 'call 116 123' },
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

/* ---------- certified professionals (§7) ---------- */

export const PROS = [
  {
    id: 'sarah-m',
    name: 'Sarah M.', initials: 'SM',
    title: 'Certified Wellness Coach',
    focus: ['Stress', 'Work-Life Balance', 'Personal Growth'],
    topics: ['stress', 'work', 'growth', 'talk'],
    availability: 'now', slot: 'Available now',
    length: '30 min', price: '$45',
    modes: ['Video', 'Voice', 'Chat'],
    bio: 'Works with people carrying too much at once, on boundaries and sustainable pace.',
  },
  {
    id: 'daniel-o',
    name: 'Daniel O.', initials: 'DO',
    title: 'Certified Hypnotherapist',
    focus: ['Habits', 'Confidence', 'Sleep'],
    topics: ['habits', 'confidence', 'sleep'],
    availability: 'now', slot: 'Available now',
    length: '60 min', price: '$85',
    modes: ['Video', 'Voice'],
    bio: 'Structured relaxation and suggestion work for habit change and performance.',
  },
  {
    id: 'aisha-r',
    name: 'Aisha R.', initials: 'AR',
    title: 'Parenting Coach',
    focus: ['Parenting', 'Family Routines', 'Patience'],
    topics: ['parenting', 'relationships', 'habits'],
    availability: 'today', slot: 'Available today, 7:00 PM',
    length: '45 min', price: '$55',
    modes: ['Video', 'Chat'],
    bio: 'Practical support for the days that get away from you, without the guilt.',
  },
  {
    id: 'marcus-l',
    name: 'Marcus L.', initials: 'ML',
    title: 'Lifestyle & Habit Coach',
    focus: ['Healthy Habits', 'Routines', 'Motivation'],
    topics: ['habits', 'sleep', 'growth'],
    availability: 'today', slot: 'Available today, 4:30 PM',
    length: '30 min', price: '$40',
    modes: ['Video', 'Voice', 'Chat'],
    bio: 'Small, repeatable changes that survive a bad week.',
  },
  {
    id: 'nadia-h',
    name: 'Nadia H.', initials: 'NH',
    title: 'Stress & Resilience Coach',
    focus: ['Stress', 'Overwhelm', 'Burnout'],
    topics: ['stress', 'work', 'talk'],
    availability: 'now', slot: 'Available now',
    length: '30 min', price: '$50',
    modes: ['Video', 'Voice', 'Chat'],
    bio: 'Helps people step out of survival mode and rebuild capacity.',
  },
  {
    id: 'james-o',
    name: 'James O.', initials: 'JO',
    title: 'Career & Leadership Coach',
    focus: ['Work', 'Leadership', 'Difficult Conversations'],
    topics: ['work', 'confidence', 'growth'],
    availability: 'schedule', slot: 'Next opening Thursday, 12:00 PM',
    length: '60 min', price: '$95',
    modes: ['Video'],
    bio: 'Thinking partner for decisions you keep going round on.',
  },
  {
    id: 'lena-f',
    name: 'Lena F.', initials: 'LF',
    title: 'Mindfulness Teacher',
    focus: ['Focus', 'Calm', 'Sleep & Routines'],
    topics: ['sleep', 'stress', 'growth'],
    availability: 'schedule', slot: 'Next opening tomorrow, 7:00 AM',
    length: '45 min', price: '$45',
    modes: ['Video', 'Voice'],
    bio: 'Short practices that fit a real day rather than an ideal one.',
  },
  {
    id: 'priya-n',
    name: 'Priya N.', initials: 'PN',
    title: 'Relationship Coach',
    focus: ['Relationships', 'Communication', 'Boundaries'],
    topics: ['relationships', 'parenting', 'talk'],
    availability: 'today', slot: 'Available today, 8:30 PM',
    length: '45 min', price: '$60',
    modes: ['Video', 'Chat'],
    bio: 'For the conversations that keep going wrong in the same place.',
  },
];

export const proById = (id) => PROS.find((p) => p.id === id);

/** Rank professionals against what the member said they need (§8). */
export function matchPros(topic, limit = 3) {
  const scored = PROS.map((p) => {
    let score = p.topics.includes(topic) ? 2 : 0;
    if (p.availability === 'now') score += 1.5;
    else if (p.availability === 'today') score += 0.75;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.p);
}

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

/* ---------- programs (§10) ---------- */

export const PROGRAMS = [
  { id: 'boundaries', name: 'Building Better Work Boundaries', days: 7, day: 3, topic: 'work',
    blurb: 'Protect your evenings without letting anything drop.' },
  { id: 'burnout', name: 'Burnout Recovery', days: 21, day: 0, topic: 'stress',
    blurb: 'Rebuild capacity in small steps, starting with subtraction.' },
  { id: 'sleep', name: 'Better Sleep', days: 14, day: 0, topic: 'sleep',
    blurb: 'A repeatable wind-down and a steadier morning.' },
  { id: 'confidence', name: 'Self-Confidence', days: 14, day: 0, topic: 'confidence',
    blurb: 'Evidence over self-criticism, one situation at a time.' },
];

/* ---------- illustrative wellness history (§6) ---------- */

export const DEMO_WELLNESS = {
  focus: 'Managing work-related stress',
  checkIns: [7, 5, 4],
  helped: ['Guided reflection', 'Short wellness resets', 'Goal planning'],
  preference: 'You are finding short, structured wellness activities more helpful than longer reflection exercises.',
  response: '4 of your last 5 guided interactions were rated helpful.',
  daysThisWeek: 4,
};

export const DEMO_SESSIONS = [
  { kind: 'guided', title: '3-Minute Reset', when: 'Yesterday', outcome: 'A little better', before: 8, after: 6 },
  { kind: 'pro', title: 'Session with Sarah M.', when: '3 days ago', outcome: 'Completed', length: '30 min' },
  { kind: 'guided', title: 'Grounding Reset', when: '4 days ago', outcome: 'Much better', before: 7, after: 3 },
  { kind: 'guided', title: 'Switching Off From Work', when: 'Last week', outcome: 'About the same', before: 6, after: 6 },
];

/* ---------- Zuporta+ membership (§9) ---------- */

export const PLUS_FEATURES = [
  { icon: 'i-spark',    title: '24/7 Wellness Assistant', body: 'Personalized support whenever you need it.' },
  { icon: 'i-wind',     title: 'Guided Wellness Experiences', body: 'Structured interactions for everyday challenges.' },
  { icon: 'i-target',   title: 'My Wellness Journey', body: 'Goals, check-ins, reflections and progress.' },
  { icon: 'i-heart',    title: 'Personalized Support', body: 'Experiences adapt based on what you find helpful.' },
  { icon: 'i-calendar', title: 'Guided Programs', body: 'Build habits and work toward wellness goals.' },
  { icon: 'i-user',     title: 'Professional Matching', body: 'Find the right human support when you want it.' },
  { icon: 'i-book',     title: 'Session Continuity', body: 'Keep your wellness journey connected between professional sessions.' },
];

/* ============================================================
   Measurement + governance layer
   ------------------------------------------------------------
   From the behavioural-data strategy. The wedge is deliberately
   narrow — Stress -> Coping -> Behaviour -> Recovery — because it
   intersects work, parenting, relationships, money, sleep and
   performance without ever needing a clinical question.

   Nothing here is a diagnosis and nothing is inferred medically.
   ============================================================ */

/** Where the pressure is coming from (ZHED "context"). */
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

/**
 * The Human State Vector, sampled either side of an intervention.
 * Self-reported only: these are wellness readings, not measurements
 * of anything clinical.
 */
export const STATE_DIMS = [
  { id: 'stress',     label: 'Stress',     low: 'Calm',      high: 'Overwhelmed' },
  { id: 'energy',     label: 'Energy',     low: 'Depleted',  high: 'Energised' },
  { id: 'motivation', label: 'Motivation', low: 'Stuck',     high: 'Driven' },
  { id: 'control',    label: 'Control',    low: 'None',      high: 'In control' },
  { id: 'social',     label: 'Connection', low: 'Alone',     high: 'Supported' },
];

/** Longitudinal follow-up schedule. The point of the whole exercise. */
export const FOLLOWUPS = [
  { id: '1h',  label: '1 hour',   ms: 60 * 60 * 1000 },
  { id: '24h', label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { id: '7d',  label: '7 days',   ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: '30 days',  ms: 30 * 24 * 60 * 60 * 1000 },
];

/**
 * Layered consent. Agreeing to be coached is not agreeing to be
 * studied, and agreeing to one study is not a lifetime licence to
 * train models. Each layer is opt-in and independently revocable.
 */
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
    body: 'Use what has helped you before to choose what Zuporta+ offers you next.',
  },
  {
    id: 'research',
    title: 'Contribute to wellness research',
    body: 'Include my de-identified responses in aggregate research on how people cope and recover. Withdrawable at any time.',
  },
  {
    id: 'professional',
    title: 'Share with my professional',
    body: 'Let a coach I book see my recent check-ins so I do not have to repeat myself. Off by default.',
  },
  {
    id: 'model',
    title: 'Help improve the models',
    body: 'Allow de-identified interaction patterns to improve future versions. Separate from research, and separate from the two above.',
  },
];
