/* ============================================================
   Caregiver Load — working people caring for an adult family member.

   The defining feature of this load is that it is invisible and has
   no end date, so the outcome is deliberately subtractive: one thing
   handed off or dropped, not one more thing added.
   ============================================================ */

import { defineModule } from './flow.js';

export default defineModule({
  id: 'caregiver',
  name: 'Caregiver Load',
  icon: 'i-heart',
  headline: 'The load is real, even when nobody sees it',
  tagline: 'Weekly check-ins for people caring for an adult family member',

  audience: 'Working adults caring for an ageing parent, partner or relative',
  buyer: 'Employers with caregiver benefits, health plans, home-care and senior-living providers',
  outcome: 'One thing handed off or dropped this week, and a fallback',

  intro: 'A short check-in for people carrying a caring role alongside a job. You leave with one thing to hand off, delegate or let go this week — not another task on the pile — and a fallback for when nobody else steps up.',

  inScope: [
    'Non-clinical coaching about your load, not their condition',
    'Private to you — nothing goes to your employer or your family',
    'Subtractive by design: we look for what can come off the list',
  ],
  outOfScope: [
    'Not medical advice about the person you care for',
    'Not therapy, diagnosis or bereavement counselling',
    'Not legal, financial, benefits or estate advice',
    'Not a substitute for a care plan or a social worker',
  ],

  consent: {
    scope: {
      title: 'What this service covers',
      body: 'Caregiver Load is coaching for you, the carer. It never advises on the care of the person you look after.',
      bullets: [
        'I understand this gives no medical or care advice about my relative',
        'I understand this is not therapy, diagnosis or bereavement counselling',
        'I understand this is not legal, financial or benefits advice',
        'For those, Zuporta will point me to the right place instead',
      ],
    },
    privacy: {
      title: 'Who can see this',
      body: 'Caring is often hidden at work on purpose. Nothing here changes that without you.',
      bullets: [
        'Your employer never learns that you are a carer from this app',
        'If your employer funds it, they see counts across a cohort, never individuals',
        'Reports are withheld below a minimum group size',
        'Nothing is shared with the person you care for, or with family members',
      ],
    },
  },

  checkin: {
    title: 'What is heaviest this week?',
    help: 'Pick the closest one. Carers routinely under-report, so take the heavier option if you are unsure.',
    scaleTitle: 'How heavy is the load right now?',
    scaleLow: 'Manageable',
    scaleHigh: 'At capacity',
  },

  pressures: [
    { id: 'notime',    label: 'There is no time that is mine' },
    { id: 'guilt',     label: 'Guilt whichever way I choose' },
    { id: 'alone',     label: 'Family are not sharing the load' },
    { id: 'medical',   label: 'Medical tasks I was never trained for' },
    { id: 'money',     label: 'The money side is frightening' },
    { id: 'decline',   label: 'They are declining and I cannot say it out loud' },
    { id: 'work',      label: 'I am hiding this at work' },
    { id: 'good',      label: 'Something good happened and I want more of it' },
  ],

  coaches: [
    { id: 'joan', name: 'Joan R.', initials: 'JR', title: 'Family Caregiver Coach',
      cred: 'Former carer · 9 yrs supporting family carers',
      focus: ['Boundaries', 'Guilt', 'Asking family for help'],
      for: ['guilt', 'alone', 'notime'] },
    { id: 'tomas', name: 'Tomás V.', initials: 'TV', title: 'Eldercare Navigator Coach',
      cred: 'Care navigation background · 12 yrs',
      focus: ['Coordinating services', 'Practical load', 'Planning ahead'],
      for: ['medical', 'money', 'decline'] },
    { id: 'hana', name: 'Hana K.', initials: 'HK', title: 'Working Carer Coach',
      cred: 'Workplace carer programmes · 7 yrs',
      focus: ['Work and care together', 'Disclosure', 'Sustainable pace'],
      for: ['work', 'good'] },
  ],

  session: {
    intro: 'One question, then we find something to take off you. This is short on purpose — your time is the scarcest thing here.',
    title: 'Of everything you are carrying, which part could in principle be carried by someone else?',
    help: 'Carers tend to treat the whole load as indivisible. It almost never is — but seeing the seam takes a moment of distance.',
    options: [
      { id: 'admin',     label: 'Admin, calls and paperwork', mine: false },
      { id: 'transport', label: 'Transport and appointments', mine: false },
      { id: 'household', label: 'Shopping, cooking, household', mine: false },
      { id: 'siblings',  label: 'Things family could do but do not', mine: false },
      { id: 'presence',  label: 'Just being there — only I can do it', mine: true },
      { id: 'standards', label: 'The standard I hold myself to', mine: true },
    ],
    reflectMine: 'That one really is yours, and naming it matters — because it means everything else on the list is negotiable. Protect this, and let something else go.',
    reflectNotMine: 'That part is transferable, even if nobody has offered. The next step is making one specific ask rather than hoping someone notices.',
  },

  plan: {
    buildLabel: 'Find one thing to hand off',
    title: 'One thing off your plate',
    help: 'One handoff, and a fallback for when it does not happen. Subtraction, not another task.',
    doneTitle: 'This week',
    actionLabel: 'One thing to hand off or drop',
    fallbackLabel: 'If nobody steps up',
    tellLabel: 'Optional — who you will ask',
    tellPlaceholder: 'A name, or leave it blank',
    actions: {
      notime: [
        'Block ninety minutes that belong to me and tell one person it is blocked',
        'Move one recurring task to a delivery or a service',
        'Say no to one non-essential thing this week',
      ],
      guilt: [
        'Write the choice down and name what I am actually trading off',
        'Do the lower-guilt option once and notice nothing collapsed',
        'Tell one person the choice I made, out loud',
      ],
      alone: [
        'Make one specific ask of one family member, with a date',
        'Send the list of what I do in a week so it is visible',
        'Ask for money toward a service instead of their time',
      ],
      medical: [
        'Ask the clinical team to show me the one task I dread',
        'Write the steps down so I am not holding it in my head',
        'Ask who I call when it goes wrong at 2am',
      ],
      money: [
        'Book one call with a benefits or welfare adviser',
        'List the three costs I am most afraid of, to size them',
        'Ask the care provider what is funded that I am paying for',
      ],
      decline: [
        'Say the sentence out loud to one person I trust',
        'Ask the clinical team what the next six months usually look like',
        'Write down what I would want to have said',
      ],
      work: [
        'Find out what carer leave or flexibility actually exists',
        'Tell one trusted colleague, so one person knows',
        'Move one recurring appointment out of core hours',
      ],
      good: [
        'Write down what made it good so it is repeatable',
        'Put the same thing in the diary for next week',
        'Tell the person I care for that it was good',
      ],
    },
    fallbacks: [
      'If nobody takes it, I drop it rather than absorb it',
      'If the ask is refused, I ask a different person once',
      'If this week is impossible, I do it next week and say so',
      'If it does not happen, I note why rather than blame myself',
    ],
  },

  done: {
    note: 'Nobody is told you used this. Not your employer, not your family, not the person you care for.',
  },

  safety: {
    link: 'This is more than a heavy week',
    title: 'Caregiver Load is not crisis or clinical support',
    body: 'Carer burnout is serious, and some things need a person rather than an app.',
    bullets: [
      'Your local emergency number if you or they are in danger',
      'Your doctor, if you have stopped sleeping or coping',
      'A carers organisation in your country — most offer free advice and respite help',
      'findahelpline.com lists free crisis lines by country',
    ],
    footer: 'For anything medical about the person you care for, their clinical team. For benefits, money or legal questions, a qualified adviser. If you are worried about their safety, contact adult social services or the equivalent where you live.',
  },

  connect: {
    topic: 'relationships', context: 'family',
    intervention: 'Caregiver Load check-in',
    followupLabel: 'end of this week',
    followupMs: 5 * 24 * 60 * 60 * 1000,
  },

  pilotGaps: [
    'Carer eligibility and employer benefit enrollment',
    'Real coach availability, routing and secure messaging',
    'Country-aware carer, respite and adult-safeguarding referral directories',
    'Encrypted server-side data model, retention, deletion/export, audit trail, separate AI/research consent',
    'Aggregate employer reporting with minimum group thresholds and carer-status protection',
    'Notification delivery and opt-out controls',
    'Legal, privacy, accessibility, security and jurisdiction review before pilot',
  ],
});
