/* ============================================================
   Night-Shift Reset — people working nights and rotations.

   Hard boundary: this is habit and routine coaching, not sleep
   medicine. Suspected sleep disorders and drowsy driving route out
   immediately, and nothing here ever comments on fitness for duty.
   ============================================================ */

import { defineModule } from './flow.js';

export default defineModule({
  id: 'nightshift',
  name: 'Night-Shift Reset',
  icon: 'i-moon',
  headline: 'Nights cost something. Make the next rotation cost less.',
  tagline: 'Recovery check-ins for night and rotating shift workers',

  audience: 'Night and rotating shift workers — clinical, logistics, security, transport, hospitality',
  buyer: 'Hospitals, logistics and warehousing, security firms, transport operators, any 24/7 employer',
  outcome: 'One recovery anchor for the next rotation, and a fallback',

  intro: 'A short check-in for people who work nights. You leave with one anchor to hold through the next rotation — light, food, caffeine, sleep window or commute — and a fallback for the rotation that goes sideways.',

  inScope: [
    'Non-clinical coaching on routines around shifts',
    'One movable anchor per rotation, not a whole lifestyle',
    'Private to you — never used to judge your fitness for duty',
  ],
  outOfScope: [
    'Not sleep medicine, and not a diagnosis of any sleep disorder',
    'Not advice on medication, stimulants or sleep aids',
    'Not a fitness-for-duty assessment, and never reported as one',
    'Not therapy or treatment',
  ],

  consent: {
    scope: {
      title: 'What this service covers',
      body: 'Night-Shift Reset is habit coaching around your shifts. It is not sleep medicine.',
      bullets: [
        'I understand this does not diagnose or treat any sleep disorder',
        'I understand this gives no advice on medication or sleep aids',
        'I understand this is not an assessment of my fitness to work',
        'If something clinical is going on, Zuporta points me to a doctor',
      ],
    },
    privacy: {
      title: 'Who can see this',
      body: 'Fatigue data can be used against shift workers. This is built so it cannot be.',
      bullets: [
        'Nothing here goes to your manager, your roster or any safety file',
        'Your employer sees counts across a cohort, never individuals',
        'Reports are withheld below a minimum group size',
        'Nothing here is ever framed as whether you are fit to work a shift',
      ],
    },
  },

  checkin: {
    title: 'What is nights doing to you right now?',
    help: 'Pick the closest. Shift workers normalise a lot, so take the heavier option if you are unsure.',
    scaleTitle: 'How tired are you, honestly?',
    scaleLow: 'Rested',
    scaleHigh: 'Running on nothing',
  },

  pressures: [
    { id: 'fallasleep', label: 'I cannot fall asleep after a night' },
    { id: 'wakeearly',  label: 'I wake after three hours and that is it' },
    { id: 'commute',    label: 'The drive home frightens me' },
    { id: 'household',  label: 'The house is awake while I am trying to sleep' },
    { id: 'eating',     label: 'Eating at 3am and feeling it' },
    { id: 'flip',       label: 'Flipping back for days off wrecks me' },
    { id: 'dread',      label: 'I am dreading the next rotation' },
    { id: 'working',    label: 'Something is working and I want to keep it' },
  ],

  coaches: [
    { id: 'dee', name: 'Dee M.', initials: 'DM', title: 'Shift-Work Recovery Coach',
      cred: '9 yrs · worked nights for 11 before that',
      focus: ['Sleep windows', 'Wind-down after nights', 'Household negotiation'],
      for: ['fallasleep', 'wakeearly', 'household'] },
    { id: 'raf', name: 'Raf S.', initials: 'RS', title: 'Circadian Habits Coach',
      cred: '7 yrs · light, timing and routine coaching',
      focus: ['Light timing', 'Eating windows', 'Caffeine strategy'],
      for: ['eating', 'flip', 'working'] },
    { id: 'nina', name: 'Nina O.', initials: 'NO', title: 'Rotation Coach',
      cred: '11 yrs · 24/7 operations and rostering',
      focus: ['Rotation planning', 'Commute safety habits', 'Pacing a block'],
      for: ['commute', 'dread'] },
  ],

  session: {
    intro: 'One question, then one anchor. Changing everything at once is how people give up by day three.',
    title: 'Which anchor is genuinely movable for you this rotation?',
    help: 'Most shift advice fails because it assumes you control your roster. Pick something you actually control.',
    options: [
      { id: 'light',    label: 'Light — what I let my eyes see, and when', mine: true },
      { id: 'window',   label: 'My sleep window — when I lie down', mine: true },
      { id: 'caffeine', label: 'Caffeine — the cut-off time', mine: true },
      { id: 'food',     label: 'Food timing across the shift', mine: true },
      { id: 'roster',   label: 'The roster itself', mine: false },
      { id: 'house',    label: 'What the rest of the household does', mine: false },
    ],
    reflectMine: 'Good — that one is yours, and one anchor held for a whole rotation beats five changed for two days. We will build the plan around that single thing.',
    reflectNotMine: 'That one is largely outside your control, and most shift-work advice quietly pretends otherwise. We will plan around it instead, and pick an anchor you can actually hold.',
  },

  plan: {
    buildLabel: 'Set my anchor',
    title: 'One anchor for this rotation',
    help: 'One thing held across the whole block, and a fallback for the night it falls apart.',
    doneTitle: 'This rotation',
    actionLabel: 'One anchor',
    fallbackLabel: 'When the rotation goes sideways',
    tellLabel: 'Optional — who at home needs to know',
    tellPlaceholder: 'A name, or leave it blank',
    actions: {
      fallasleep: [
        'Dark glasses for the last hour of the shift and the whole way home',
        'Same wind-down order every morning, even when I am wired',
        'No screens in the hour before I lie down, after nights',
      ],
      wakeearly: [
        'Blackout the room properly, including the gaps',
        'Treat the second block of sleep as planned, not as failure',
        'Same lie-down time after every night of the block',
      ],
      commute: [
        'If I feel myself going, I pull over — no exceptions, no deadline beats it',
        'Caffeine timed for the drive, not for the shift',
        'Arrange a lift or transport for the last night of the block',
      ],
      household: [
        'Agree quiet hours with the house, in writing on the fridge',
        'Phone goes on do-not-disturb with two people allowed through',
        'A sign on the door so nobody has to guess',
      ],
      eating: [
        'One real meal before the shift, lighter through the night',
        'Stop eating two hours before I plan to sleep',
        'Water first, every break, before anything else',
      ],
      flip: [
        'Keep one anchor the same on days off instead of flipping fully',
        'Protect the first day off for sleep, not errands',
        'Plan the flip rather than letting it happen to me',
      ],
      dread: [
        'Prepare food and clothes before the block starts',
        'Pick the one night I expect to be worst and plan only for that',
        'Tell one colleague I am finding this block hard',
      ],
      working: [
        'Write down exactly what I am doing so I can repeat it',
        'Hold the same anchor for one more rotation before changing anything',
        'Tell someone else on nights what worked',
      ],
    },
    fallbacks: [
      'If one night ruins it, I restart the next night rather than abandon it',
      'If the roster changes, I keep the anchor and move the timing',
      'If I am too tired to do it properly, I do the smallest version',
      'If it is not working by the end of the block, I pick a different anchor',
    ],
  },

  done: {
    note: 'Nothing here reaches your roster, your manager or any safety record. Your employer sees that a check-in happened — not how tired you said you were.',
  },

  safety: {
    link: 'This is more than a rough rotation',
    title: 'Night-Shift Reset is not sleep medicine',
    body: 'Some of what looks like shift fatigue is not, and a coach is the wrong person for it.',
    bullets: [
      'If you are falling asleep at the wheel, stop driving — that is a safety issue, not a coaching one',
      'See a doctor if you snore heavily, stop breathing in your sleep, or fall asleep without warning',
      'See a doctor if you have been sleeping badly for months regardless of shifts',
      'Your employer’s Employee Assistance Programme, and findahelpline.com for crisis lines',
    ],
    footer: 'Use your workplace fatigue-risk process for anything that affects safety at work. Nothing here is an opinion on whether you are fit to work a shift.',
  },

  connect: {
    topic: 'sleep', context: 'work',
    intervention: 'Night-Shift Reset check-in',
    followupLabel: 'end of this rotation',
    followupMs: 4 * 24 * 60 * 60 * 1000,
  },

  pilotGaps: [
    'Worker eligibility and employer cohort enrollment',
    'Real coach availability, routing and secure messaging',
    'Country-aware clinical referral for suspected sleep disorders',
    'Encrypted server-side data model, retention, deletion/export, audit trail, separate AI/research consent',
    'Aggregate employer reporting with minimum group thresholds, firewalled from rostering and safety files',
    'Notification delivery and opt-out controls, timed around shifts',
    'Legal, privacy, accessibility, security, occupational-health and jurisdiction review before pilot',
  ],
});
