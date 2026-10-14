/* ============================================================
   Zuporta+ Assistant — the guided interaction engine.

   This is deliberately NOT an open-ended chatbot (Revision 1 §4).
   Every turn routes through a safety + scope check (§13), then into
   a standardized, bounded interaction with response measurement (§5).

        Need → Understand → Guide → Measure → Learn
             → Personalize → Connect → Continue

   Responses are deterministic and produced on the
   device. There is no model call. `respondToText` / `respondToAction`
   are the seam where Zuporta Connect™ would sit.
   ============================================================ */

import { ACTIVITIES, activityFor, topicLabel, CONTEXTS, COPING } from './data.js';

/* ---------- block helpers ---------- */

const p = (text) => ({ t: 'p', text });
const choices = (items) => ({ t: 'choices', items });
const quicks = (items) => ({ t: 'quicks', items });

/* ---------- safety + scope routing (§13) ---------- */

const CRISIS_RE = /\b(kill myself|end my life|suicid\w*|take my own life|want to die|hurt myself|harm myself|self[- ]harm|overdose|no reason to live|better off without me)\b/i;

const OUT_OF_SCOPE = [
  { kind: 'medical', re: /\b(diagnos\w*|prescri\w*|medication|dosage|antidepressant|side effects?|symptoms? of|is this cancer|chest pain|blood pressure|my doctor said)\b/i },
  { kind: 'harm',    re: /\b(abus\w*|assault\w*|violent|hitting me|threaten\w* me|unsafe at home|domestic)\b/i },
  { kind: 'legal',   re: /\b(lawyer|solicitor|sue|lawsuit|custody battle|court case|legal advice)\b/i },
  { kind: 'money',   re: /\b(debt|bankrupt\w*|evict\w*|cannot pay rent|foreclos\w*)\b/i },
];

const WANTS_HUMAN = /\b(real person|a human|talk to someone|see a professional|professional|coach|therapist|book|speak to a person)\b/i;

const TOPIC_RE = [
  ['stress',        /\b(stress\w*|overwhelm\w*|too much|drowning|cannot cope|can'?t cope|burn(t|ed)? ?out|anx\w*|panic|worry|worried)\b/i],
  ['work',          /\b(work|job|career|boss|manager|deadline|colleague|office|monday|workload|switch off|promotion)\b/i],
  ['relationships', /\b(relationship|partner|husband|wife|boyfriend|girlfriend|marriage|friend|argument|lonely|breakup)\b/i],
  ['parenting',     /\b(kid|kids|child|children|son|daughter|parent\w*|toddler|teenager)\b/i],
  ['sleep',         /\b(sleep|insomnia|awake|tired|exhaust\w*|3\s?am|rest|routine)\b/i],
  ['confidence',    /\b(confiden\w*|self[- ]doubt|doubt myself|not good enough|imposter|insecure)\b/i],
  ['habits',        /\b(habit|routine|drinking|smoking|exercise|eating|screen time|procrastinat\w*)\b/i],
  ['growth',        /\b(growth|purpose|direction|stuck|goal|meaning|change my life)\b/i],
];

/** Classify a message before anything else runs. */
export function route(text) {
  if (CRISIS_RE.test(text)) return { lane: 'crisis' };
  for (const s of OUT_OF_SCOPE) if (s.re.test(text)) return { lane: 'scope', kind: s.kind };
  if (WANTS_HUMAN.test(text)) return { lane: 'human', topic: detectTopic(text) };
  return { lane: 'wellness', topic: detectTopic(text) };
}

export function detectTopic(text) {
  for (const [id, re] of TOPIC_RE) if (re.test(text)) return id;
  return 'talk';
}

/* ---------- the opening (§4) ---------- */

export const OPENERS = [
  { label: 'I need someone to talk to',        send: 'I need someone to talk to' },
  { label: "I'm feeling stressed or overwhelmed", send: 'I am feeling stressed and overwhelmed' },
  { label: 'Help me think something through',  send: 'Help me think something through' },
  { label: 'Help me with a goal',              send: 'Help me with a goal' },
  { label: "I'd like a guided wellness activity", send: 'I would like a guided wellness activity' },
  { label: "I'd rather talk to a professional", send: 'I would rather talk to a professional' },
];

export const openingBlocks = () => [
  p('What would feel most helpful right now?'),
];

/* ---------- reflections ---------- */

const REFLECT = {
  stress: 'That sounds like a lot to carry.',
  work: 'That sounds like a lot to carry, and work has a way of following you home.',
  relationships: 'That sounds hard. The people closest to us move us the most.',
  parenting: 'That sounds relentless, and most people carry it quietly.',
  sleep: 'That sounds draining, and it colours everything the next day.',
  confidence: 'That sounds heavy, and that voice is very good at sounding like fact.',
  habits: 'That makes sense. Habits are learned patterns rather than character flaws.',
  growth: 'That is worth taking seriously rather than pushing down.',
  talk: 'Thank you for saying it plainly. I am listening.',
};

/* ---------- the four paths (§4) ---------- */

export const PATHS = [
  { action: 'path:talk',  icon: 'i-book',   label: 'Talk It Through', sub: 'Organize what is on your mind.' },
  { action: 'path:reset', icon: 'i-wind',   label: 'Guided Reset',    sub: 'Try a short structured wellness exercise.' },
  { action: 'path:work',  icon: 'i-target', label: 'Work Through It', sub: 'Explore what is contributing and possible next steps.' },
  { action: 'path:pro',   icon: 'i-user',   label: 'Talk to Someone', sub: 'Connect with a certified professional.' },
];

/* ---------- free-text turns ---------- */

export function respondToText(text, session) {
  const r = route(text);

  if (r.lane === 'crisis') {
    session.step = 'open';
    return [
      p('I am really glad you told me. What you are describing needs more than this app should hold on its own, and you deserve immediate human support.'),
      { t: 'crisis' },
    ];
  }

  if (r.lane === 'scope') {
    session.step = 'open';
    return [...scopeBlocks(r.kind), ...offerAfterScope()];
  }

  if (r.lane === 'human') {
    session.topic = r.topic;
    session.step = 'matching';
    return [p('Of course. Let me find someone who fits what you are dealing with.'), { t: 'matching', topic: r.topic }];
  }

  // Wellness lane
  switch (session.step) {
    case 'talking': {
      // "Talk it through" — a bounded reflective exchange, not an endless chat
      session.turns = (session.turns || 0) + 1;
      if (session.turns >= 2) {
        session.step = 'understand';
        return [
          p('Thank you for laying that out. Saying it in order is already doing something.'),
          p('From here, what would help most?'),
          choices(PATHS.filter((x) => x.action !== 'path:talk')),
        ];
      }
      return [
        p('That makes sense. Keep going if there is more.'),
        p('What part of it sits heaviest?'),
      ];
    }

    case 'working': {
      session.workStep = (session.workStep || 0) + 1;
      const qs = [
        'And if that changed tomorrow, what would be different for you?',
        'What is one thing inside your control here, however small?',
      ];
      if (session.workStep >= qs.length) {
        session.step = 'understand';
        return [
          p('That is a clearer picture than when we started.'),
          p('Would you like to lock in that step, or talk it through with a professional?'),
          choices([PATHS[1], PATHS[3]]),
        ];
      }
      return [p(qs[session.workStep - 1])];
    }

    default: {
      session.topic = r.topic;
      session.step = 'understand';
      return [
        p(REFLECT[r.topic] || REFLECT.talk),
        p('What would be most helpful right now?'),
        choices(PATHS),
      ];
    }
  }
}

/* ---------- card / button actions ---------- */

export function respondToAction(action, payload, session) {
  const topic = session.topic || 'talk';

  switch (action) {
    case 'path:talk':
      session.step = 'talking';
      session.turns = 0;
      return [
        p('Let us put it in order together. Nothing here is recorded anywhere but your own device.'),
        p('Start wherever it is loudest — what has been going on?'),
      ];

    case 'path:work':
      session.step = 'working';
      session.workStep = 0;
      return [
        p('Let us look at what is actually feeding this.'),
        p(`What do you think is contributing most to the ${topicLabel(topic).toLowerCase()} at the moment?`),
      ];

    case 'path:pro':
      session.step = 'matching';
      return [{ t: 'matching', topic }];

    /* ---- the standardized interaction (§5) ---- */

    case 'path:reset': {
      session.step = 'checkin';
      session.activityId = activityFor(topic).id;
      return [
        p('Before we begin, a quick check-in. This is what lets us tell afterwards whether it actually helped.'),
        { t: 'scale', label: `How ${scaleWord(topic)} do you feel right now?`, low: 'Not at all', high: 'Completely' },
      ];
    }

    case 'checkin': {
      session.before = payload;
      session.step = 'context';
      return [
        p(`Noted — ${payload} out of 10.`),
        p('One more thing, and it is the one that makes the rest useful later.'),
        { t: 'pick', label: 'Where is most of this coming from?', action: 'context', items: CONTEXTS },
      ];
    }

    // Context is the ZHED trigger: it is what turns "felt stressed" into
    // "felt stressed about X, tried Y, recovered in Z".
    case 'context': {
      session.context = payload;
      session.step = 'activity';
      const act = ACTIVITIES[session.activityId] || activityFor(topic);
      session.activityId = act.id;
      return [
        p('Thank you. Let us try something short and structured.'),
        p(act.intro),
        { t: 'activity', id: act.id },
      ];
    }

    case 'activity:done':
      session.step = 'reassess';
      return [
        p('That is the activity finished. Well done for staying with it.'),
        { t: 'reassess', label: 'How are you feeling now?' },
      ];

    case 'reassess': {
      session.after = payload.score;
      session.helped = payload.value === 'much' || payload.value === 'little';
      session.outcome = payload.value;
      session.step = 'coping';
      return [
        p('Recorded. One last question — this is the behaviour half, and it is the part almost nobody captures.'),
        { t: 'pick', label: 'Before today, what had you already tried?', action: 'coping', items: COPING },
      ];
    }

    // Behaviour closes the loop: state -> intervention -> state -> what the
    // person actually did -> what happens over the following days.
    case 'coping': {
      session.coping = payload;
      session.step = 'decide';
      const tail = session.helped ? decidedHelped(session) : decidedNotHelped(session);
      return [
        p('That is the whole picture for this one.'),
        { t: 'event' },
        ...tail,
      ];
    }

    case 'decide:continue':
      session.step = 'understand';
      return [
        p('Good. What would you like to do next?'),
        choices(PATHS.filter((x) => x.action !== 'path:reset')),
      ];

    case 'decide:save':
      session.step = 'open';
      return [
        p('Saved in your device history. With personalization on, Home can suggest activities you rated helpful.'),
        quicks([
          { label: 'Talk to a professional', action: 'path:pro' },
          { label: 'Something else', action: 'restart' },
        ]),
      ];

    case 'decide:different': {
      session.step = 'activity';
      const alt = topic === 'work' ? activityFor('stress') : activityFor('work');
      session.activityId = alt.id;
      return [
        p('That is useful to know — it tells us what does not fit you, which is just as informative.'),
        p(`Let us try a different shape of activity: ${alt.name}.`),
        { t: 'activity', id: alt.id },
      ];
    }

    case 'restart':
      session.step = 'open';
      session.turns = 0;
      return [p('Of course. What would feel most helpful right now?')];

    default:
      return [p('Let us pick that up again. What would feel most helpful right now?')];
  }
}

/* ---------- decision branch (§5 step 4) ---------- */

function decidedHelped(session) {
  return [
    p(session.outcome === 'much'
      ? 'Glad that helped.'
      : 'That helped a little — worth knowing.'),
    p('Would you like to continue, save this activity for later, or talk with someone?'),
    choices([
      { action: 'decide:continue', icon: 'i-spark',  label: 'Continue',        sub: 'Keep going with something else.' },
      { action: 'decide:save',     icon: 'i-check',  label: 'Save for later',  sub: 'Add it to My Wellness.' },
      { action: 'path:pro',        icon: 'i-user',   label: 'Talk with someone', sub: 'Connect with a certified professional.' },
    ]),
  ];
}

function decidedNotHelped(session) {
  return [
    p('It sounds like this did not give you the support you were looking for.'),
    p('Would you like to try something different, or connect with a professional?'),
    choices([
      { action: 'decide:different', icon: 'i-wind', label: 'Try something different', sub: 'A different kind of activity.' },
      { action: 'path:pro',         icon: 'i-user', label: 'Talk to a professional',  sub: 'Real human support.' },
    ]),
  ];
}

/* ---------- out-of-scope routing (§13) ---------- */

function scopeBlocks(kind) {
  const map = {
    medical: 'That is a medical question, and it sits outside what Zuporta can help with. A doctor or pharmacist is the right person — they can see your history, and I cannot.',
    harm: 'What you are describing sounds like it may not be safe, and that needs specialist support rather than a wellness activity.',
    legal: 'That needs proper legal advice, which is outside what Zuporta covers. A qualified adviser will serve you far better here.',
    money: 'That sounds genuinely stressful, and it needs practical financial help rather than a wellness exercise — many countries have free debt advice services.',
  };
  return [p(map[kind] || map.medical), { t: 'scope', kind }];
}

function offerAfterScope() {
  return [
    p('I can still stay with the weight of it, if that would help.'),
    quicks([
      { label: 'Help me with how it feels', action: 'path:talk' },
      { label: 'Talk to a professional', action: 'path:pro' },
    ]),
  ];
}

/* ---------- helpers ---------- */

function scaleWord(topic) {
  return ({
    stress: 'overwhelmed', work: 'overwhelmed', sleep: 'tired',
    confidence: 'unsure of yourself', relationships: 'strained',
    parenting: 'stretched', habits: 'stuck', growth: 'stuck', talk: 'weighed down',
  })[topic] || 'overwhelmed';
}

export function matchRationale(topic) {
  return `Based on the support you are looking for, these professionals focus on ${matchFocus(topic)}.`;
}

function matchFocus(topic) {
  return ({
    stress: 'work stress, overwhelm and personal growth',
    work: 'work stress, boundaries and career pressure',
    relationships: 'relationships, communication and boundaries',
    parenting: 'parenting, family routines and patience',
    sleep: 'sleep, routines and recovery',
    confidence: 'confidence, self-belief and personal growth',
    habits: 'habits, routines and motivation',
    growth: 'personal growth, direction and goals',
    talk: 'listening, stress and personal growth',
  })[topic] || 'stress, overwhelm and personal growth';
}
