/* ============================================================
   Shared data for the care-side modules:
     Nonclinical Nurse Guidance
     Personal Baseline  (internally: Neurobehavioral Response Intelligence)
     Accessible Support Navigation

   Everything here is ILLUSTRATIVE prototype content. No nurse,
   social worker or service listed below is real.
   ============================================================ */

/* ---------- nurse guidance pathways ---------- */

export const PATHWAYS = [
  {
    id: 'nicu',
    label: 'NICU family',
    blurb: 'We came home from the NICU and it is a lot.',
    detail: 'Organising discharge instructions, preparing questions, and the transition home.',
  },
  {
    id: 'pediatric',
    label: 'Pediatric family',
    blurb: 'I am managing a child’s care alongside everything else.',
    detail: 'Routines, appointments, school support and questions for the care team.',
  },
  {
    id: 'adult',
    label: 'Adult or caregiver',
    blurb: 'I am managing care for myself or an adult.',
    detail: 'Understanding existing instructions, preparing for appointments, finding services.',
  },
];

export const pathwayLabel = (id) => (PATHWAYS.find((p) => p.id === id) || {}).label || '';

/* ---------- professionals, by role ---------- */

export const NURSES = [
  { id: 'marta', name: 'Marta C.', initials: 'MC', role: 'nurse',
    title: 'Registered Nurse · NICU family support',
    cred: 'RN · 14 yrs neonatal · discharge education',
    focus: ['NICU discharge', 'Feeding and monitoring routines', 'Transition home'],
    for: ['nicu'] },
  { id: 'devon', name: 'Devon K.', initials: 'DK', role: 'nurse',
    title: 'Registered Nurse · Pediatric family support',
    cred: 'RN, BSN · 10 yrs paediatrics · school health liaison',
    focus: ['Appointment preparation', 'School support plans', 'Daily routines'],
    for: ['pediatric'] },
  { id: 'yusuf', name: 'Yusuf A.', initials: 'YA', role: 'nurse',
    title: 'Registered Nurse · Adult and caregiver support',
    cred: 'RN · 16 yrs medical-surgical · caregiver education',
    focus: ['Understanding instructions', 'Appointment preparation', 'Caregiver teaching'],
    for: ['adult'] },
];

export const SOCIAL_WORKERS = [
  { id: 'rosa', name: 'Rosa M.', initials: 'RM', role: 'social_worker',
    title: 'Licensed Social Worker · Benefits and eligibility',
    cred: 'LCSW · 12 yrs · public benefits navigation',
    focus: ['Eligibility', 'Applications', 'Appeals'],
    languages: ['English', 'Spanish'] },
  { id: 'wei', name: 'Wei L.', initials: 'WL', role: 'social_worker',
    title: 'Social Worker · Family and child services',
    cred: 'MSW · 8 yrs · family services navigation',
    focus: ['Family services', 'Childcare and respite', 'School liaison'],
    languages: ['English', 'Mandarin'] },
  { id: 'amina', name: 'Amina O.', initials: 'AO', role: 'social_worker',
    title: 'Social Worker · Older adults and carers',
    cred: 'MSW · 11 yrs · eldercare navigation',
    focus: ['Home care', 'Respite', 'Transport and equipment'],
    languages: ['English', 'Arabic'] },
];

/* ---------- appointment-question builder ---------- */

export const QUESTION_BANK = {
  nicu: [
    'Which of these instructions matter most in the first week?',
    'What would make you want us to call, rather than wait?',
    'How do we know feeding is going well enough?',
    'Which appointments are essential and which are flexible?',
    'What should we expect to be hard that is still normal?',
    'Who do we contact out of hours, and for what?',
  ],
  pediatric: [
    'What should we watch for between now and the next appointment?',
    'Which part of this routine matters most if we cannot do all of it?',
    'What can the school be asked to put in place?',
    'How will we know this is working?',
    'What is the plan if things get worse at the weekend?',
    'Is there anything in these instructions we can simplify?',
  ],
  adult: [
    'Can you put the main instruction in one sentence I can repeat?',
    'What is the most common thing people get wrong with this?',
    'Which of these matters most if I can only manage one?',
    'What would make you want to see me sooner?',
    'Is there support available that I have not been told about?',
    'Who do I call between appointments, and when?',
  ],
};

/* ---------- baseline signals ---------- */

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

/* ---------- resource directory ---------- */

export const RESOURCE_TYPES = [
  { id: 'respite',   label: 'Respite care' },
  { id: 'financial', label: 'Financial help' },
  { id: 'counsel',   label: 'Counselling' },
  { id: 'transport', label: 'Transport' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'childcare', label: 'Childcare' },
  { id: 'food',      label: 'Food support' },
];

export const COSTS = [
  { id: 'free',     label: 'Free' },
  { id: 'sliding',  label: 'Sliding scale' },
  { id: 'insured',  label: 'Covered by insurance' },
  { id: 'paid',     label: 'Paid' },
];

export const LANGUAGES = ['English', 'Spanish', 'Mandarin', 'Arabic', 'Tagalog'];

/**
 * Every record carries eligibility, cost, contact, service area and the
 * date it was last verified — a directory without a verification date is
 * how people get sent to services that closed two years ago.
 */
export const RESOURCES = [
  {
    id: 'r1', name: 'Community Respite Hours', type: 'respite',
    org: 'County Family Services',
    eligibility: 'Unpaid carers of an adult living in the county',
    cost: 'free', costNote: 'Free, up to 8 hours a month',
    contact: '(555) 0100 · respite@example.org',
    area: 'County-wide', languages: ['English', 'Spanish'],
    verified: '2026-08-14', waitlist: 'About 2 weeks',
  },
  {
    id: 'r2', name: 'Caregiver Relief Grant', type: 'financial',
    org: 'State Aging Services',
    eligibility: 'Household income below the state median; carer of an adult 60+',
    cost: 'free', costNote: 'Grant, not a loan',
    contact: 'apply.example.gov/relief',
    area: 'Statewide', languages: ['English', 'Spanish', 'Tagalog'],
    verified: '2026-09-02', waitlist: 'Decisions in about 6 weeks',
  },
  {
    id: 'r3', name: 'Parent Peer Counselling', type: 'counsel',
    org: 'Family Health Network',
    eligibility: 'Parents and carers of children under 18',
    cost: 'sliding', costNote: 'Sliding scale from $0',
    contact: '(555) 0144 · peers@example.org',
    area: 'Metro area', languages: ['English', 'Mandarin'],
    verified: '2026-07-30', waitlist: 'Usually within a week',
  },
  {
    id: 'r4', name: 'Medical Appointment Transport', type: 'transport',
    org: 'Regional Transit Access',
    eligibility: 'Medicaid enrolled, or a disability travel pass holder',
    cost: 'insured', costNote: 'Covered for eligible trips',
    contact: '(555) 0188',
    area: 'Within 40 miles of the metro area', languages: ['English', 'Spanish'],
    verified: '2026-09-18', waitlist: 'Book 3 days ahead',
  },
  {
    id: 'r5', name: 'Home Equipment Loan Closet', type: 'equipment',
    org: 'Neighbourhood Health Coalition',
    eligibility: 'Open to anyone with a clinical need letter',
    cost: 'free', costNote: 'Free loan, refundable deposit',
    contact: 'closet@example.org',
    area: 'City only', languages: ['English', 'Arabic'],
    verified: '2026-06-11', waitlist: 'Depends on item',
  },
  {
    id: 'r6', name: 'Emergency Childcare Vouchers', type: 'childcare',
    org: 'City Family Support',
    eligibility: 'Working parents below 200% of the federal poverty level',
    cost: 'sliding', costNote: 'Voucher covers most of the cost',
    contact: '(555) 0162 · childcare@example.gov',
    area: 'City only', languages: ['English', 'Spanish', 'Tagalog'],
    verified: '2026-08-29', waitlist: 'Same week for emergencies',
  },
  {
    id: 'r7', name: 'Weekly Food Pantry', type: 'food',
    org: 'Eastside Mutual Aid',
    eligibility: 'No eligibility check, no documents required',
    cost: 'free', costNote: 'Free',
    contact: 'Walk in, Saturdays 9-1',
    area: 'Eastside neighbourhoods', languages: ['English', 'Spanish', 'Mandarin', 'Arabic'],
    verified: '2026-09-26', waitlist: 'None',
  },
  {
    id: 'r8', name: 'Overnight Respite Beds', type: 'respite',
    org: 'St. Mary Community Care',
    eligibility: 'Carer of an adult with assessed high needs; referral required',
    cost: 'insured', costNote: 'Covered by most plans, deposit may apply',
    contact: '(555) 0171 · intake@example.org',
    area: 'County-wide', languages: ['English'],
    verified: '2026-05-04', waitlist: 'About 6 weeks',
  },
];

/** Application steps, so "help me complete this" is a real checklist. */
export const CHECKLISTS = {
  financial: [
    'Proof of identity for the applicant',
    'Proof of address from the last 3 months',
    'Income evidence — payslips or benefit letter',
    'Relationship to the person you care for',
    'Bank details for payment',
  ],
  respite: [
    'Referral or needs assessment, if required',
    'Details of the person you care for',
    'Dates and hours you are requesting',
    'Emergency contact',
  ],
  childcare: [
    'Proof of employment or study',
    'Income evidence',
    'Child’s date of birth and any care needs',
    'Preferred provider, if you have one',
  ],
  default: [
    'Proof of identity',
    'Proof of address',
    'Anything the service listed as required',
    'A phone number they can reach you on',
  ],
};

export const REFERRAL_STATES = [
  { id: 'saved',     label: 'Saved' },
  { id: 'contacted', label: 'Contacted them' },
  { id: 'applied',   label: 'Applied' },
  { id: 'accessed',  label: 'Got the service' },
  { id: 'blocked',   label: 'Hit a barrier' },
];
