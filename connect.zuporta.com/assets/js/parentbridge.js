/* ============================================================
   Parent Bridge — working parents, at the seam between work and home.

   The unit of work is the handover: drop-off, pick-up, the first ten
   minutes home. Hard boundary: nothing here assesses a child, and
   any safeguarding concern routes straight out.
   ============================================================ */

import { defineModule } from './flow.js';

export default defineModule({
  id: 'parentbridge',
  name: 'Parent Bridge',
  icon: 'i-users',
  headline: 'The handover is where it breaks. Start there.',
  tagline: 'Check-ins for working parents, built around the work-to-home seam',

  audience: 'Working parents, especially returning from leave or through a school transition',
  buyer: 'Employers with parental benefits, schools and districts, family service providers',
  outcome: 'One bridge ritual for the coming week, and a fallback',

  intro: 'A short check-in built around the seam between work and home — drop-off, pick-up, the first ten minutes through the door. You leave with one small ritual to try this week, and a fallback for the evening that falls apart.',

  inScope: [
    'Non-clinical coaching for you, the parent — you are the member, not your child',
    'The handover between work and home, not parenting in general',
    'One small ritual at a time, sized for a working week',
  ],
  outOfScope: [
    'Not for under-18s — the member is always the adult parent or carer',
    'Not an assessment of your child, and not developmental or clinical advice',
    'Not family therapy or couples counselling',
    'Not custody, legal or child-protection advice',
    'Not school advocacy or educational placement advice',
  ],

  consent: {
    scope: {
      title: 'What this service covers',
      body: 'Parent Bridge coaches you, the adult. Your child is never a user of this service and is never assessed by it.',
      bullets: [
        'I confirm I am the adult parent or carer, and over 18',
        'I understand nothing here assesses my child or their development',
        'I understand this is not family therapy or couples counselling',
        'I understand this is not custody, legal or child-protection advice',
        'If my child needs support, Zuporta points me to the right service',
      ],
    },
    privacy: {
      title: 'Who can see this',
      body: 'Parents get judged for this stuff. Nothing here exposes you or your family.',
      bullets: [
        'Your employer never learns anything about your child or your home',
        'If your employer funds this, they see counts across a cohort, never individuals',
        'Reports are withheld below a minimum group size',
        'Nothing is shared with a school, a co-parent or a family member',
        'No details about a child are collected or stored — please do not enter any',
      ],
    },
  },

  checkin: {
    title: 'Where is the week breaking?',
    help: 'Pick the moment that goes wrong most often, not the one that bothers you most in hindsight.',
    scaleTitle: 'How stretched do you feel right now?',
    scaleLow: 'Holding it together',
    scaleHigh: 'Completely stretched',
  },

  pressures: [
    { id: 'mornings',  label: 'Mornings and drop-off are chaos' },
    { id: 'present',   label: 'I am there but not really there' },
    { id: 'struggle',  label: 'My child is struggling and I cannot fix it' },
    { id: 'guilt',     label: 'Guilt about the hours I work' },
    { id: 'coparent',  label: 'My co-parent and I are out of sync' },
    { id: 'couple',    label: 'There is nothing left for us as a couple' },
    { id: 'me',        label: 'There is nothing left for me at all' },
    { id: 'good',      label: 'A good moment I would like more of' },
  ],

  coaches: [
    { id: 'bea', name: 'Bea L.', initials: 'BL', title: 'Working Parent Coach',
      cred: '10 yrs · return-to-work and parental transitions',
      focus: ['Return to work', 'Guilt', 'Sustainable weeks'],
      for: ['guilt', 'me', 'present'] },
    { id: 'sam', name: 'Sam I.', initials: 'SI', title: 'Family Routines Coach',
      cred: '8 yrs · household routines and transitions',
      focus: ['Mornings', 'Handovers', 'Evening routines'],
      for: ['mornings', 'good'] },
    { id: 'mo', name: 'Mo A.', initials: 'MA', title: 'Family Partnership Coach',
      cred: '12 yrs · co-parenting and partnership',
      focus: ['Co-parenting', 'Shared load', 'Couple time'],
      for: ['coparent', 'couple', 'struggle'] },
  ],

  session: {
    intro: 'One question, then one small ritual. Parenting advice fails when it arrives as a project; this is sized for a Tuesday.',
    title: 'Which part of the seam is actually in your hands this week?',
    help: 'Some of it is the job, the school and the clock. Some of it is yours. The second list is shorter than it feels, and more movable.',
    options: [
      { id: 'arrival',   label: 'How I arrive — the first ten minutes home', mine: true },
      { id: 'attention', label: 'Where my attention is when I am with them', mine: true },
      { id: 'routine',   label: 'One repeatable thing in the routine', mine: true },
      { id: 'ask',       label: 'What I ask my co-parent or partner for', mine: true },
      { id: 'hours',     label: 'My working hours themselves', mine: false },
      { id: 'child',     label: 'What my child is going through', mine: false },
    ],
    reflectMine: 'That one is genuinely in your hands, and it is the kind of thing children register far more than the hours. Small and repeated beats big and occasional here.',
    reflectNotMine: 'That part is not yours to control, and carrying it as though it were is where a lot of parental guilt comes from. We will build around it rather than against it.',
  },

  plan: {
    buildLabel: 'Build my bridge',
    title: 'One bridge ritual',
    help: 'One small repeatable thing, and a fallback for the evening that goes wrong. Small enough to survive a bad week.',
    doneTitle: 'This week',
    actionLabel: 'One ritual',
    fallbackLabel: 'When the evening falls apart',
    tellLabel: 'Optional — which adult you will tell',
    tellPlaceholder: 'A co-parent, partner or friend — not a child’s name',
    actions: {
      mornings: [
        'Everything that can be done the night before, gets done the night before',
        'One job each, same job every morning, written on the wall',
        'Leave five minutes earlier and accept being early',
      ],
      present: [
        'Phone in a drawer for the first twenty minutes home',
        'Change clothes before I speak to anyone — a physical end to work',
        'Ask one specific question instead of "how was your day"',
      ],
      struggle: [
        'Ten minutes, same time, no agenda and no fixing',
        'Write down what I notice this week rather than acting on it',
        'Ask the school what they see, before I decide what it is',
      ],
      guilt: [
        'Name the trade-off out loud once instead of carrying it silently',
        'Protect one thing I always make, and stop apologising for the rest',
        'Ask them what they actually want more of — the answer is usually small',
      ],
      coparent: [
        'Fifteen minutes on Sunday to agree who does what',
        'Make one specific ask instead of hoping it is noticed',
        'Agree one handover rule we both keep',
      ],
      couple: [
        'Thirty minutes in the diary this week that is not logistics',
        'One conversation that is not about the children',
        'Agree one night where the house closes early',
      ],
      me: [
        'Twenty minutes that belong to me, in the diary, defended',
        'Hand one recurring task to someone else this week',
        'Go to bed before midnight three nights running',
      ],
      good: [
        'Write down what made it good so it is repeatable',
        'Put the same thing in the diary for next week',
        'Tell them it was a good evening',
      ],
    },
    fallbacks: [
      'If the evening is a write-off, I do the ten-second version',
      'If I miss it, I start again tomorrow without a post-mortem',
      'If the ask is refused, I ask once more and then plan around it',
      'If the week is impossible, I protect one evening instead of five',
    ],
  },

  done: {
    note: 'Nothing about your child or your household leaves this device. Your employer sees that a check-in happened and nothing else.',
  },

  safety: {
    link: 'This is more than a hard week',
    title: 'Parent Bridge is not clinical or child support',
    body: 'Some things need a qualified person, and some need one today.',
    bullets: [
      'If a child is at risk of harm, contact your local child protection service or emergency number now',
      'Your doctor or health visitor if you are worried about your child’s development or wellbeing',
      'Your doctor if you have felt low, numb or hopeless since becoming a parent',
      'findahelpline.com lists free crisis lines by country',
    ],
    footer: 'For school placement or special educational needs, your school’s designated lead. For custody or legal questions, a family law adviser. Nothing here is an assessment of your child.',
  },

  connect: {
    topic: 'parenting', context: 'family',
    intervention: 'Parent Bridge check-in',
    followupLabel: 'end of this week',
    followupMs: 5 * 24 * 60 * 60 * 1000,
  },

  pilotGaps: [
    'Participant eligibility and employer benefit enrollment',
    'Real coach availability, routing and secure messaging',
    'Country-aware child safeguarding, perinatal mental health and family service referral',
    'Encrypted server-side data model, retention, deletion/export, audit trail, separate AI/research consent',
    'Aggregate employer reporting with minimum group thresholds and parental-status protection',
    'Notification delivery and opt-out controls',
    'Legal, privacy, safeguarding, accessibility, security and jurisdiction review before pilot',
  ],
});
