/* ============================================================
   Nonclinical Nurse Guidance.

   The hard line, and it runs through every screen: this helps people
   UNDERSTAND and ORGANISE instructions they already have, and prepare
   questions for the team who gave them. It never assesses symptoms,
   recommends treatment, or changes a care plan.

   Account holders are adults. Services directed at children need a
   separate product design, so a child is never a user here.
   ============================================================ */

import { registerModule, track } from './modules.js';
import { PATHWAYS, pathwayLabel, NURSES, QUESTION_BANK } from './care.js';

const BLANK = () => ({
  stage: 'landing',
  consent: { scope: false, privacy: false },
  pathway: null,
  items: [],          // instructions the member has organised, locally
  questions: [],      // chosen question texts
  priority: [],       // their top three
  nurseId: null,
  requested: false,
  helpful: null,
  repeats: 0,
});

function slice(ctx) {
  if (!ctx.state.modules) ctx.state.modules = {};
  if (!ctx.state.modules.nurseguide) ctx.state.modules.nurseguide = BLANK();
  return ctx.state.modules.nurseguide;
}

const nurseFor = (pathway) => NURSES.find((n) => n.for.includes(pathway)) || NURSES[2];

/* ============================================================ */

function render(ctx) {
  const { el } = ctx;
  const m = slice(ctx);
  const wrap = el('div', 'stack');
  wrap.appendChild(head(ctx, m));
  const stage = { landing, consent, pathway, organise, questions, match, done }[m.stage] || landing;
  wrap.appendChild(stage(ctx, m));
  wrap.appendChild(boundaryStrip(ctx));
  wrap.appendChild(safety(ctx));
  return wrap;
}

function head(ctx, m) {
  const { el } = ctx;
  const h = el('header', 'mod-head');
  h.appendChild(el('p', 'mod-head__kicker', 'Nurse Guidance'));
  h.appendChild(el('h2', 'mod-head__title', 'Understand what you were told. Ask better questions.'));
  const order = ['consent', 'pathway', 'organise', 'questions', 'match', 'done'];
  const at = order.indexOf(m.stage);
  if (m.stage !== 'landing') {
    const bar = el('ol', 'stepper');
    ['Consent', 'Pathway', 'Organise', 'Questions', 'Nurse'].forEach((s, i) => {
      const li = el('li', 'stepper__i', s);
      if (at > i) li.classList.add('stepper__i--done');
      if (at === i) li.classList.add('stepper__i--now');
      bar.appendChild(li);
    });
    h.appendChild(bar);
  }
  return h;
}

/** Always on screen, at every stage. This is the whole product boundary. */
function boundaryStrip(ctx) {
  const { el } = ctx;
  const s = el('p', 'boundary');
  s.append(ctx.icon('i-shield'), document.createTextNode(
    'Education and navigation only. Nothing here assesses symptoms, recommends treatment, or changes your care plan.'));
  return s;
}

/* ---------- landing ---------- */

function landing(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  const c = card();
  c.appendChild(el('p', 'card__body',
    'Most people leave an appointment holding instructions they half understood and questions they thought of too late. This helps you organise what you were already given, build the questions you want to ask, and talk to a nurse experienced in your situation.'));
  wrap.appendChild(c);

  const s = card();
  s.appendChild(el('p', 'card__k', 'What a nurse here will do'));
  s.appendChild(ticks(ctx, [
    'Help you understand instructions you already have',
    'Help you prepare questions for your own care team',
    'Point you to approved, plain-language educational material',
    'Help you organise appointments, routines and support needs',
  ], 'i-check'));
  s.appendChild(el('p', 'card__k', 'What a nurse here will not do'));
  s.appendChild(ticks(ctx, [
    'Assess symptoms or tell you what is wrong',
    'Recommend or change any treatment or medication',
    'Alter a care plan your clinical team has set',
    'Replace your doctor, your clinic or emergency care',
  ], 'i-close', 'ticks--no'));
  wrap.appendChild(s);

  const cta = el('div', 'stack__cta');
  cta.appendChild(btn('btn', m.repeats ? 'Start another session' : 'Get started', () => {
    track('nurseguide', 'session_started', { repeat: m.repeats > 0 });
    m.stage = 'consent';
    ctx.commit();
  }));
  wrap.appendChild(cta);
  return wrap;
}

function ticks(ctx, items, iconId, extra) {
  const ul = ctx.el('ul', 'ticks' + (extra ? ' ' + extra : ''));
  items.forEach((t) => {
    const li = ctx.el('li');
    li.append(ctx.icon(iconId), document.createTextNode(t));
    ul.appendChild(li);
  });
  return ul;
}

/* ---------- consent ---------- */

function consent(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('Before we start', 'Two agreements, both specific.'));

  const block = (key, title, body, bullets) => {
    const c = card(m.consent[key] ? 'card--accent' : '');
    c.appendChild(el('p', 'card__title', title));
    c.appendChild(el('p', 'card__body', body));
    c.appendChild(ticks(ctx, bullets, 'i-check'));
    const cta = el('div', 'card__cta');
    const b = btn(m.consent[key] ? 'btn btn--sm' : 'btn btn--ghost btn--sm',
      m.consent[key] ? 'Agreed' : 'I agree', () => { m.consent[key] = !m.consent[key]; ctx.commit(); });
    b.setAttribute('aria-pressed', String(m.consent[key]));
    cta.appendChild(b);
    c.appendChild(cta);
    return c;
  };

  wrap.appendChild(block('scope', 'What this service is',
    'Nonclinical nurse guidance: education and navigation, not care.', [
      'I am an adult account holder, over 18',
      'I understand nobody here assesses symptoms or diagnoses anything',
      'I understand nobody here recommends or changes treatment',
      'I understand my own care team remains responsible for my care plan',
      'For anything urgent I will contact my clinical team or emergency services',
    ]));

  wrap.appendChild(block('privacy', 'What happens to what you enter',
    'Health information deserves more care than a prototype can give it.', [
      'In this prototype nothing you type leaves your device',
      'Document upload is deliberately not built — it needs the encrypted backend first',
      'A nurse would only see what you choose to share with them',
      'Nothing is shared with your employer, your insurer or your clinical team without you',
    ]));

  const ready = m.consent.scope && m.consent.privacy;
  const cta = el('div', 'stack__cta');
  const next = btn('btn', 'Continue', () => {
    track('nurseguide', 'consent_completed', { scope: true, privacy: true });
    m.stage = 'pathway';
    ctx.commit();
  });
  next.disabled = !ready;
  cta.appendChild(next);
  wrap.appendChild(cta);
  if (!ready) wrap.appendChild(el('p', 'card__meta', 'Both are required to continue.'));
  return wrap;
}

/* ---------- pathway ---------- */

function pathway(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('Which situation fits you?',
    'This decides which nurse you are matched with and which questions we start from.'));

  PATHWAYS.forEach((p) => {
    const c = card(m.pathway === p.id ? 'card--accent' : '');
    c.appendChild(el('p', 'card__title', p.label));
    c.appendChild(el('p', 'card__body', '“' + p.blurb + '”'));
    c.appendChild(el('p', 'card__meta', p.detail));
    const cta = el('div', 'card__cta');
    cta.appendChild(btn(m.pathway === p.id ? 'btn btn--sm' : 'btn btn--ghost btn--sm',
      m.pathway === p.id ? 'Selected' : 'Choose this', () => {
        m.pathway = p.id;
        track('nurseguide', 'pathway_selected', { pathway: p.id });
        ctx.commit();
      }));
    c.appendChild(cta);
    wrap.appendChild(c);
  });

  if (m.pathway) {
    const cta = el('div', 'stack__cta');
    cta.appendChild(btn('btn', 'Next', () => { m.stage = 'organise'; ctx.commit(); }));
    wrap.appendChild(cta);
  }
  return wrap;
}

/* ---------- organise existing instructions ---------- */

function organise(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('What were you told to do?',
    'List the instructions you already have, in your own words. Short lines are fine — this is to get them out of your head and in one place.'));

  const c = card();
  if (m.items.length) {
    const ul = el('ul', 'itemlist');
    m.items.forEach((t, i) => {
      const li = el('li', 'itemlist__i');
      li.appendChild(el('span', null, t));
      li.appendChild(btn('icon-btn itemlist__x', null, () => {
        m.items.splice(i, 1); ctx.commit();
      }));
      const x = li.lastChild;
      x.setAttribute('aria-label', 'Remove this instruction');
      x.appendChild(ctx.icon('i-close'));
      ul.appendChild(li);
    });
    c.appendChild(ul);
  } else {
    c.appendChild(el('p', 'card__meta', 'Nothing added yet.'));
  }

  const id = 'ng-' + Math.random().toString(36).slice(2, 8);
  const lab = el('label', 'field__label', 'Add an instruction');
  lab.htmlFor = id;
  const row = el('div', 'addrow');
  const input = el('input', 'field__input');
  input.id = id;
  input.type = 'text';
  input.placeholder = 'e.g. Weigh her every morning before the first feed';
  const add = () => {
    const v = input.value.trim();
    if (!v) return;
    m.items.push(v.slice(0, 160));
    input.value = '';
    track('nurseguide', 'instruction_added', { count: m.items.length });
    ctx.commit();
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  row.append(input, btn('btn btn--sm', 'Add', add));
  c.append(lab, row);
  c.appendChild(el('p', 'card__meta',
    'Uploading the actual discharge paperwork is a pilot feature — it needs encrypted storage and a retention policy before anyone should put real documents into it.'));
  wrap.appendChild(c);

  const cta = el('div', 'stack__cta');
  cta.appendChild(btn('btn', 'Build my questions', () => {
    track('nurseguide', 'instructions_organised', { count: m.items.length });
    m.stage = 'questions';
    ctx.commit();
  }));
  wrap.appendChild(cta);
  return wrap;
}

/* ---------- appointment-question builder ---------- */

function questions(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('Questions for your care team',
    'Pick the ones you want to ask, then mark your top three. Appointments are short, and the first three are the ones you will actually get through.'));

  const bank = QUESTION_BANK[m.pathway] || QUESTION_BANK.adult;
  const c = card();
  const list = el('div', 'quicks quicks--stack');
  bank.forEach((q) => {
    const on = m.questions.includes(q);
    const b = btn('quick' + (on ? ' quick--picked' : ''), q, () => {
      const i = m.questions.indexOf(q);
      if (i >= 0) { m.questions.splice(i, 1); m.priority = m.priority.filter((p) => p !== q); }
      else m.questions.push(q);
      ctx.commit();
    });
    list.appendChild(b);
  });
  c.appendChild(list);

  const id = 'nq-' + Math.random().toString(36).slice(2, 8);
  const lab = el('label', 'field__label', 'Add your own question');
  lab.htmlFor = id;
  const row = el('div', 'addrow');
  const input = el('input', 'field__input');
  input.id = id; input.type = 'text';
  input.placeholder = 'Something you keep meaning to ask';
  const add = () => {
    const v = input.value.trim();
    if (!v) return;
    m.questions.push(v.slice(0, 200));
    input.value = '';
    ctx.commit();
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
  row.append(input, btn('btn btn--sm', 'Add', add));
  c.append(lab, row);
  wrap.appendChild(c);

  if (m.questions.length) {
    const p = card();
    p.appendChild(el('p', 'card__k', 'Your top three'));
    p.appendChild(el('p', 'card__body', 'Tap up to three to put them first.'));
    const plist = el('div', 'quicks quicks--stack');
    m.questions.forEach((q) => {
      const on = m.priority.includes(q);
      const b = btn('quick' + (on ? ' quick--picked' : ''), (on ? (m.priority.indexOf(q) + 1) + '. ' : '') + q, () => {
        const i = m.priority.indexOf(q);
        if (i >= 0) m.priority.splice(i, 1);
        else if (m.priority.length < 3) m.priority.push(q);
        else ctx.toast('Three is the limit — that is the point.');
        ctx.commit();
      });
      plist.appendChild(b);
    });
    p.appendChild(plist);
    const cta = el('div', 'card__cta');
    cta.appendChild(btn('btn btn--ghost btn--sm', 'Copy list', async () => {
      try { await navigator.clipboard.writeText(questionText(m)); ctx.toast('Questions copied.'); }
      catch (e) { ctx.toast('Copy is unavailable in this browser.'); }
    }));
    cta.appendChild(btn('btn btn--ghost btn--sm', 'Download', () => {
      downloadText(ctx, questionText(m), 'appointment-questions.txt');
      track('nurseguide', 'questions_exported', { count: m.questions.length, prioritised: m.priority.length });
    }));
    p.appendChild(cta);
    wrap.appendChild(p);

    const next = el('div', 'stack__cta');
    next.appendChild(btn('btn', 'Match me with a nurse', () => {
      track('nurseguide', 'questions_built', { count: m.questions.length, prioritised: m.priority.length });
      m.nurseId = nurseFor(m.pathway).id;
      m.stage = 'match';
      ctx.commit();
    }));
    wrap.appendChild(next);
  }
  return wrap;
}

function questionText(m) {
  const rest = m.questions.filter((q) => !m.priority.includes(q));
  return [
    'Questions for my care team — ' + pathwayLabel(m.pathway),
    '',
    ...m.priority.map((q, i) => `${i + 1}. ${q}`),
    ...(rest.length ? ['', 'If there is time:'] : []),
    ...rest.map((q) => '- ' + q),
    ...(m.items.length ? ['', 'Instructions I already have:', ...m.items.map((t) => '- ' + t)] : []),
    '',
    'Prepared with Zuporta nurse guidance. Education and navigation only.',
  ].join('\n');
}

function downloadText(ctx, text, filename) {
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    ctx.toast('Downloaded.');
  } catch (e) { ctx.toast('Download is blocked here — use Copy instead.'); }
}

/* ---------- nurse match ---------- */

function match(ctx, m) {
  const { el, btn, card } = ctx;
  const nurse = NURSES.find((n) => n.id === m.nurseId) || NURSES[2];
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('Matched by experience',
    'Matched on the situation you chose, not on who is free.'));

  const c = card();
  const h = el('div', 'pro__head');
  h.append(el('div', 'pro__avatar', nurse.initials));
  const idb = el('div', 'pro__id');
  idb.append(el('p', 'pro__name', nurse.name), el('p', 'pro__title', nurse.title));
  h.appendChild(idb);
  c.appendChild(h);
  c.appendChild(el('p', 'pro__focus', nurse.cred));
  c.appendChild(el('p', 'card__body', 'Works with families on ' + nurse.focus.join(', ').toLowerCase() + '.'));
  c.appendChild(el('p', 'card__meta', 'Matched to: ' + pathwayLabel(m.pathway)));

  const cta = el('div', 'card__cta');
  cta.appendChild(btn('btn btn--sm', m.requested ? 'Request sent' : 'Request a conversation', () => {
    if (m.requested) return;
    m.requested = true;
    track('nurseguide', 'nurse_requested', { pathway: m.pathway, nurse: nurse.id, questions: m.questions.length });
    ctx.toast('Prototype — secure messaging is not connected yet.');
    ctx.commit();
  }));
  c.appendChild(cta);
  wrap.appendChild(c);

  const share = card();
  share.appendChild(el('p', 'card__k', 'What they would see'));
  share.appendChild(el('p', 'card__body',
    'Only what you choose to send: your question list, and the instructions you organised. Nothing else from your Zuporta account.'));
  wrap.appendChild(share);

  const next = el('div', 'stack__cta');
  next.appendChild(btn('btn', 'Finish', () => { m.stage = 'done'; m.repeats += 1; ctx.commit(); }));
  wrap.appendChild(next);
  return wrap;
}

/* ---------- done + follow-up + feedback ---------- */

function done(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');

  const c = card('card--accent');
  c.appendChild(el('p', 'card__k', 'Ready for your appointment'));
  c.appendChild(el('p', 'card__title', m.priority.length
    ? m.priority.length + ' priority questions, ' + m.questions.length + ' in total'
    : m.questions.length + ' questions ready'));
  if (m.priority.length) {
    const ol = el('ol', 'steps');
    m.priority.forEach((q) => ol.appendChild(el('li', null, q)));
    c.appendChild(ol);
  }
  const cta = el('div', 'card__cta');
  cta.appendChild(btn('btn btn--sm', 'Download', () => downloadText(ctx, questionText(m), 'appointment-questions.txt')));
  cta.appendChild(btn('btn btn--ghost btn--sm', 'Copy', async () => {
    try { await navigator.clipboard.writeText(questionText(m)); ctx.toast('Copied.'); }
    catch (e) { ctx.toast('Copy unavailable.'); }
  }));
  c.appendChild(cta);
  wrap.appendChild(c);

  const f = card();
  f.appendChild(el('p', 'card__k', 'Follow-up'));
  f.appendChild(el('p', 'card__body',
    'Zuporta will check back after your appointment to ask what you still did not get answered.'));
  wrap.appendChild(f);

  wrap.appendChild(feedbackCard(ctx, m, 'nurseguide'));

  const again = el('div', 'stack__cta');
  again.appendChild(btn('btn btn--ghost', 'Start another session', () => {
    const repeats = m.repeats;
    Object.assign(m, BLANK(), { repeats });
    ctx.commit();
  }));
  wrap.appendChild(again);
  return wrap;
}

/** Feedback after each interaction — one of the first-release requirements. */
export function feedbackCard(ctx, m, moduleId) {
  const { el, btn, card } = ctx;
  const c = card();
  c.appendChild(el('p', 'card__k', 'Was this helpful?'));
  const row = el('div', 'quicks');
  [[1, 'Not really'], [2, 'A little'], [3, 'Yes'], [4, 'Very']].forEach(([score, label]) => {
    const b = btn('quick' + (m.helpful === score ? ' quick--picked' : ''), label, () => {
      m.helpful = score;
      track(moduleId, 'feedback_given', { helpfulness: score });
      ctx.toast('Thank you.');
      ctx.commit();
    });
    row.appendChild(b);
  });
  c.appendChild(row);
  return c;
}

/* ---------- escalation ---------- */

function safety(ctx) {
  const { el, btn } = ctx;
  const row = el('div', 'safety-route');
  row.appendChild(btn('linkish', 'This feels urgent', () => {
    track('nurseguide', 'safety_route_opened', {});
    ctx.openSheet('Urgent support', (body) => {
      const c = el('div', 'card');
      c.appendChild(el('p', 'card__title', 'Zuporta is not urgent or emergency care'));
      c.appendChild(el('p', 'card__body',
        'Nobody here can assess what is happening. If something is wrong now, use one of these.'));
      c.appendChild(ticks(ctx, [
        'Your local emergency number, if it is an emergency',
        'The out-of-hours number your care team gave you',
        'Your clinic, GP or the ward that discharged you',
        'A nurse advice line if your health system runs one',
      ], 'i-shield'));
      c.appendChild(el('p', 'card__meta',
        'Documented escalation: anything describing a symptom, a deterioration or a medication question is routed to the member’s own clinical team. Zuporta staff never assess, advise or triage it.'));
      body.appendChild(c);
    });
  }));
  return row;
}

/* ---------- registration ---------- */

export default registerModule({
  id: 'nurseguide',
  name: 'Nurse Guidance',
  tagline: 'Understand your instructions and prepare questions, with a nurse matched to your situation',
  icon: 'i-clipboard',
  audience: 'Adult parents and caregivers — NICU, paediatric and adult pathways',
  buyer: 'Health systems, childrens hospitals, health plans, employer family benefits',
  outcome: 'An organised question list for the next appointment, and a matched nurse',

  inScope: [
    'Understanding instructions the member already has',
    'Preparing questions for their own care team',
    'Plain-language educational material and service navigation',
  ],
  outOfScope: [
    'No symptom assessment or diagnosis',
    'No treatment or medication recommendations',
    'No changes to a care plan set by a clinical team',
    'Not for under-18 account holders; services directed at children need a separate product',
  ],

  events: [
    'session_started', 'consent_completed', 'pathway_selected', 'instruction_added',
    'instructions_organised', 'questions_built', 'questions_exported', 'nurse_requested',
    'safety_route_opened', 'feedback_given',
  ],

  enums: {
    pathway: PATHWAYS.map((p) => p.id),
    nurse: NURSES.map((n) => n.id),
  },

  pilotGaps: [
    'Encrypted document upload with retention, deletion and audit trail — deliberately not built here',
    'Verified nurse licensure, scope-of-practice controls and supervision',
    'Secure messaging that meets health-information requirements in each jurisdiction',
    'Approved, reviewed educational content library with provenance and review dates',
    'Documented urgent-support escalation with named clinical partners',
    'Role-based access so a nurse sees only what the member shared',
    'Legal, privacy, clinical-governance and jurisdiction review before pilot',
  ],

  connect: {
    topic: 'health', context: 'health',
    intervention: 'Nurse guidance session',
    followupLabel: 'after your appointment',
    followupMs: 3 * 24 * 60 * 60 * 1000,
  },

  render,
});
