/* ============================================================
   Career Decision Sprint — people stuck on one career decision.

   The product is a decision, not a feeling. The outcome is a named
   criterion plus a dated next step, because what keeps people stuck
   is usually an unnamed trade-off rather than missing information.
   ============================================================ */

import { defineModule } from './flow.js';

export default defineModule({
  id: 'career',
  name: 'Career Decision Sprint',
  icon: 'i-target',
  headline: 'Stop re-running the decision. Name the trade-off.',
  tagline: 'A time-boxed sprint for one career decision you keep deferring',

  audience: 'Professionals stuck on a specific career decision',
  buyer: 'Employers and retention programmes, outplacement firms, professional bodies, university alumni services',
  outcome: 'One named decision criterion and one dated next step, with a fallback',

  intro: 'A short, deliberately time-boxed sprint on one decision you keep re-running. You leave with the trade-off named and one dated next step — not a pros-and-cons list you will never read again.',

  inScope: [
    'Non-clinical coaching on how you are deciding',
    'Naming the trade-off you are actually making',
    'One concrete next step with a date on it',
  ],
  outOfScope: [
    'Not employment, contract or legal advice',
    'Not representation in negotiation, grievance or disputes',
    'Not therapy or treatment for anxiety about work',
    'Not a recruiter, and not advice on a specific employer',
  ],

  consent: {
    scope: {
      title: 'What this service covers',
      body: 'Career Decision Sprint coaches how you decide. It does not tell you what to decide, and it is not advice.',
      bullets: [
        'I understand this is not employment, contract or legal advice',
        'I understand nobody here represents me in a negotiation or dispute',
        'I understand this is not therapy or treatment',
        'The decision stays mine — this helps me make it, not make it for me',
      ],
    },
    privacy: {
      title: 'Who can see this',
      body: 'People hide career decisions from their employer for good reason. This does not expose you.',
      bullets: [
        'Your employer never learns you are considering leaving',
        'If your employer funds this, they see counts across a cohort, never individuals',
        'Reports are withheld below a minimum group size',
        'Nothing here reaches your manager, HR or a recruiter',
      ],
    },
  },

  checkin: {
    title: 'Which decision are you stuck on?',
    help: 'Pick the one you have re-run most often in the last month.',
    scaleTitle: 'How stuck does it feel?',
    scaleLow: 'Nearly decided',
    scaleHigh: 'Completely stuck',
  },

  pressures: [
    { id: 'stayleave', label: 'Stay or leave my current job' },
    { id: 'offer',     label: 'Accept or decline an offer' },
    { id: 'promotion', label: 'Push for a promotion or step back' },
    { id: 'pivot',     label: 'Change field entirely' },
    { id: 'study',     label: 'Go back to study or retrain' },
    { id: 'venture',   label: 'Start something of my own' },
    { id: 'exit',      label: 'Redundancy or exit terms on the table' },
    { id: 'drift',     label: 'No decision in front of me, but I am drifting' },
  ],

  coaches: [
    { id: 'omar', name: 'Omar B.', initials: 'OB', title: 'Career Decision Coach',
      cred: 'ICF PCC · 10 yrs · decision and transition work',
      focus: ['Trade-offs', 'Stay-or-go decisions', 'Clarity under pressure'],
      for: ['stayleave', 'offer', 'drift'] },
    { id: 'claire', name: 'Claire N.', initials: 'CN', title: 'Executive Transition Coach',
      cred: 'ICF PCC · 14 yrs · senior and leadership moves',
      focus: ['Promotion decisions', 'Exit terms', 'Leadership identity'],
      for: ['promotion', 'exit'] },
    { id: 'ife', name: 'Ife A.', initials: 'IA', title: 'Reinvention Coach',
      cred: '8 yrs · career changers and founders',
      focus: ['Field changes', 'Retraining', 'Starting something'],
      for: ['pivot', 'study', 'venture'] },
  ],

  session: {
    intro: 'One question. Most stuck decisions are not short of information — they are short of a named priority.',
    title: 'What are you actually optimising for right now?',
    help: 'Not what you should want. What you would genuinely protect first if you could only protect one.',
    options: [
      { id: 'money',     label: 'Money and security', mine: true },
      { id: 'time',      label: 'Time and control over it', mine: true },
      { id: 'growth',    label: 'Growth and skill', mine: true },
      { id: 'meaning',   label: 'Meaning in the work', mine: true },
      { id: 'people',    label: 'The people I work with', mine: true },
      { id: 'external',  label: 'Honestly, what other people will think', mine: false },
    ],
    reflectMine: 'Good — that is a real criterion, and it does most of the work. From here the question is not "which option is better" but "which option protects that one", which is a far easier question.',
    reflectNotMine: 'That is worth saying out loud, because it is extremely common and almost never survives being named. It tends to shrink once it is on the page next to the things you actually want.',
  },

  plan: {
    buildLabel: 'Set my next step',
    title: 'One step, with a date',
    help: 'Sprints end. Pick the smallest step that produces new information, and put a date on it.',
    doneTitle: 'Next step',
    actionLabel: 'One next step',
    fallbackLabel: 'If that does not happen',
    tellLabel: 'Optional — who you will tell the deadline to',
    tellPlaceholder: 'A name, or leave it blank',
    actions: {
      stayleave: [
        'Write the one condition under which I would stay, and the date I check it',
        'Have one honest conversation with my manager about that condition',
        'Give myself a decision date and put it in the calendar',
      ],
      offer: [
        'List what the offer protects and what it costs, against my one criterion',
        'Ask the hiring manager the one question I am avoiding',
        'Set the date I will answer by, and tell them',
      ],
      promotion: [
        'Ask what the gap is between me and the role, specifically',
        'Name the part of the role I do not want, out loud',
        'Decide whether I am chasing the title or the work',
      ],
      pivot: [
        'Talk to one person already doing the thing, this month',
        'Cost the transition honestly — months and money',
        'Test the smallest real version of the work before committing',
      ],
      study: [
        'Write what the qualification is actually for, in one sentence',
        'Find one person who did it and ask if it was worth it',
        'Check whether the thing I want needs the qualification at all',
      ],
      venture: [
        'Define the smallest thing I could sell in 30 days',
        'Set the runway number below which I stop',
        'Talk to one potential customer before building anything',
      ],
      exit: [
        'Get the terms reviewed by someone qualified before I respond',
        'Separate the money question from the identity question',
        'Decide what I need the next role to give me',
      ],
      drift: [
        'Write what I would change if nothing were at stake',
        'Name one thing I have outgrown',
        'Book one conversation that might open a door',
      ],
    },
    fallbacks: [
      'If I miss the date, I move it once and only once',
      'If the conversation is impossible, I write the answer down instead',
      'If I learn nothing new, that is information — I decide anyway',
      'If I stall again, I bring it back here and name why',
    ],
  },

  done: {
    note: 'Your employer sees that a sprint happened. Not which decision, not your criterion, not this plan.',
  },

  safety: {
    link: 'This is more than a career decision',
    title: 'Career Decision Sprint is not advice or therapy',
    body: 'Some of what sits under a career decision needs a qualified person, not a coach.',
    bullets: [
      'An employment lawyer or your union for contracts, exit terms or disputes',
      'A financial adviser for anything that turns on money you cannot afford to lose',
      'Your doctor, if work has stopped you sleeping or functioning',
      'findahelpline.com if things feel worse than a hard decision',
    ],
    footer: 'Nothing here is advice about a specific employer, contract or offer. If the stakes are legal or financial, get them reviewed by someone qualified before you act.',
  },

  connect: {
    topic: 'work', context: 'work',
    intervention: 'Career Decision Sprint',
    followupLabel: 'on your decision date',
    followupMs: 7 * 24 * 60 * 60 * 1000,
  },

  pilotGaps: [
    'Participant eligibility and employer or alumni cohort enrollment',
    'Real coach availability, routing and secure messaging',
    'Country-aware referral to employment law, union and financial advice',
    'Encrypted server-side data model, retention, deletion/export, audit trail, separate AI/research consent',
    'Aggregate employer reporting with minimum group thresholds and strict flight-risk protection',
    'Notification delivery and opt-out controls',
    'Legal, privacy, accessibility, security and jurisdiction review before pilot',
  ],
});
