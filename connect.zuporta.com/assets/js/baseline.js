/* ============================================================
   Personal Baseline
   (internal programme name: Neurobehavioral Response Intelligence)

   The loop, exactly as briefed:

     check in -> establish a baseline -> recognise a change
     -> ask the person to confirm -> offer support -> measure the response

   Two deliberate restraints:

   1. The member-facing name is "Personal Baseline". Revision 1 §12 said
      keep neuroscience claims out of the consumer product, and this
      brief agrees that neuro interpretation, speech analysis, cognitive
      testing and wearables stay research features until evaluated. The
      internal name is recorded, not displayed as a claim.

   2. Change detection is a transparent arithmetic rule, shown to the
      member in the product. No model, no inference, nothing the person
      cannot check themselves.
   ============================================================ */

import { registerModule, track } from './modules.js';
import { SIGNALS, BASELINE_MIN } from './care.js';

/** Adverse change threshold, on the 1-5 scale. Stated in the UI. */
const DELTA = 1.0;

const BLANK = () => ({
  stage: 'landing',
  consent: false,
  checkins: [],        // { at, values: { signalId: 1..5 } }
  draft: {},           // in-progress check-in
  flagged: null,       // { signals: [], at }
  confirmed: null,     // 'yes' | 'no' | 'unsure'
  supportKind: null,   // 'guided' | 'coach' | 'none'
  measured: null,      // 1..4
  helpful: null,
});

function slice(ctx) {
  if (!ctx.state.modules) ctx.state.modules = {};
  if (!ctx.state.modules.baseline) ctx.state.modules.baseline = BLANK();
  return ctx.state.modules.baseline;
}

/* ---------- the transparent rule ---------- */

/** Mean of each signal across all but the most recent two check-ins. */
function baselineOf(checkins) {
  if (checkins.length < BASELINE_MIN) return null;
  const base = checkins.slice(2);           // older entries form the baseline
  if (!base.length) return null;
  const out = {};
  SIGNALS.forEach((s) => {
    const vals = base.map((c) => c.values[s.id]).filter((v) => typeof v === 'number');
    if (vals.length) out[s.id] = vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  return out;
}

/** Mean of the two most recent check-ins. */
function recentOf(checkins) {
  const recent = checkins.slice(0, 2);
  if (!recent.length) return null;
  const out = {};
  SIGNALS.forEach((s) => {
    const vals = recent.map((c) => c.values[s.id]).filter((v) => typeof v === 'number');
    if (vals.length) out[s.id] = vals.reduce((a, b) => a + b, 0) / vals.length;
  });
  return out;
}

/**
 * Which signals have moved adversely by at least DELTA.
 * Stress is inverted: higher is worse, so the sign flips.
 */
function detectChange(checkins) {
  const base = baselineOf(checkins);
  const recent = recentOf(checkins);
  if (!base || !recent) return [];
  return SIGNALS
    .map((s) => {
      if (base[s.id] == null || recent[s.id] == null) return null;
      const delta = recent[s.id] - base[s.id];
      return { id: s.id, adverse: s.inverted ? delta : -delta };
    })
    .filter((x) => x && x.adverse >= DELTA)
    .sort((a, b) => b.adverse - a.adverse)   // biggest mover first
    .map((x) => x.id);
}

/* ============================================================ */

function render(ctx) {
  const { el } = ctx;
  const m = slice(ctx);
  const wrap = el('div', 'stack');
  wrap.appendChild(head(ctx));

  if (!m.consent) { wrap.appendChild(consentStage(ctx, m)); return wrap; }

  const stage = {
    landing: dashboard, checkin: checkinStage, confirm: confirmStage,
    support: supportStage, measure: measureStage,
  }[m.stage] || dashboard;
  wrap.appendChild(stage(ctx, m));
  wrap.appendChild(ruleCard(ctx, m));
  return wrap;
}

function head(ctx) {
  const { el } = ctx;
  const h = el('header', 'mod-head');
  h.appendChild(el('p', 'mod-head__kicker', 'Personal Baseline'));
  h.appendChild(el('h2', 'mod-head__title', 'Compared with you, not with anyone else'));
  return h;
}

/* ---------- consent ---------- */

function consentStage(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  const c = card('card--accent');
  c.appendChild(el('p', 'card__title', 'Before you start tracking'));
  c.appendChild(el('p', 'card__body',
    'Personal Baseline records short self-ratings over time so changes are visible to you. It compares you with your own history and nothing else.'));
  const ul = el('ul', 'ticks');
  [
    'These are self-ratings, not measurements of anything clinical',
    'No diagnosis, no score about your brain, no inference about a condition',
    'Change detection is simple arithmetic, shown to you in full',
    'Nothing is sent anywhere — it stays on this device in this prototype',
    'You will always be asked whether a detected change is real before anything is offered',
  ].forEach((t) => { const li = el('li'); li.append(ctx.icon('i-check'), document.createTextNode(t)); ul.appendChild(li); });
  c.appendChild(ul);
  const cta = el('div', 'card__cta');
  cta.appendChild(btn('btn btn--sm', 'Start tracking', () => {
    m.consent = true;
    track('baseline', 'consent_completed', { consented: true });
    ctx.commit();
  }));
  c.appendChild(cta);
  wrap.appendChild(c);
  return wrap;
}

/* ---------- dashboard ---------- */

function dashboard(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  const n = m.checkins.length;
  const base = baselineOf(m.checkins);

  const status = card();
  status.appendChild(el('p', 'card__k', 'Baseline status'));
  if (n < BASELINE_MIN) {
    status.appendChild(el('p', 'card__title', `${n} of ${BASELINE_MIN} check-ins`));
    status.appendChild(el('p', 'card__body',
      'A baseline is built from repeated observations, not one questionnaire. After three check-ins there is enough to compare against.'));
    status.appendChild(progress(ctx, n / BASELINE_MIN));
  } else {
    status.appendChild(el('p', 'card__title', 'Baseline established'));
    status.appendChild(el('p', 'card__body',
      `Built from ${Math.max(0, n - 2)} earlier check-in(s), compared against your most recent two.`));
  }
  const cta = el('div', 'card__cta');
  cta.appendChild(btn('btn btn--sm', 'Check in now', () => {
    m.draft = {}; m.stage = 'checkin'; ctx.commit();
  }));
  status.appendChild(cta);
  wrap.appendChild(status);

  if (base) wrap.appendChild(trendCard(ctx, m, base));

  if (m.flagged && !m.confirmed) {
    const f = card('card--accent');
    f.appendChild(el('p', 'card__k', 'A change to check'));
    f.appendChild(el('p', 'card__title', changeSentence(m.flagged.signals)));
    f.appendChild(el('p', 'card__body', 'Does this reflect how you feel?'));
    const row = el('div', 'card__cta');
    row.appendChild(btn('btn btn--sm', 'Review', () => { m.stage = 'confirm'; ctx.commit(); }));
    f.appendChild(row);
    wrap.appendChild(f);
  }

  if (n) wrap.appendChild(historyCard(ctx, m));
  return wrap;
}

function progress(ctx, frac) {
  const bar = ctx.el('div', 'progress');
  const fill = ctx.el('div', 'progress__fill');
  fill.style.width = Math.round(Math.min(1, frac) * 100) + '%';
  bar.appendChild(fill);
  return bar;
}

function trendCard(ctx, m, base) {
  const { el, card } = ctx;
  const recent = recentOf(m.checkins);
  const c = card();
  c.appendChild(el('p', 'card__k', 'Your trend'));
  c.appendChild(el('p', 'card__body', 'Recent two check-ins against your own baseline.'));
  const wrap = el('div', 'vector');
  SIGNALS.forEach((s) => {
    if (base[s.id] == null) return;
    const r = recent[s.id];
    const delta = r - base[s.id];
    const adverse = s.inverted ? delta : -delta;
    const row = el('div', 'vector__row');
    row.appendChild(el('span', 'vector__k', s.label));
    const track2 = el('div', 'vector__track');
    const fill = el('div', 'vector__fill');
    fill.style.width = Math.round((r / 5) * 100) + '%';
    if (adverse >= DELTA) fill.style.background = 'var(--danger)';
    track2.appendChild(fill);
    row.appendChild(track2);
    const d = delta === 0 ? 'same' : (delta > 0 ? '+' : '') + delta.toFixed(1);
    row.appendChild(el('span', 'vector__v', d));
    wrap.appendChild(row);
  });
  c.appendChild(wrap);
  return c;
}

function historyCard(ctx, m) {
  const { el, card } = ctx;
  const c = card();
  c.appendChild(el('p', 'card__k', 'Check-in history'));
  const list = el('div', 'evlog');
  m.checkins.slice(0, 8).forEach((ci) => {
    const row = el('div', 'evlog__row');
    row.appendChild(el('span', 'evlog__name', new Date(ci.at).toLocaleDateString()));
    row.appendChild(el('span', 'evlog__props',
      SIGNALS.map((s) => `${s.label.toLowerCase()}=${ci.values[s.id] ?? '-'}`).join('  ')));
    list.appendChild(row);
  });
  c.appendChild(list);
  return c;
}

/* ---------- check-in ---------- */

function checkinStage(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('Quick check-in', 'Six ratings, about thirty seconds. Rate today, not this month.'));

  SIGNALS.forEach((s) => {
    const c = card();
    c.appendChild(el('p', 'card__title', s.label));
    const row = el('div', 'scale');
    for (let n = 1; n <= 5; n++) {
      const b = btn('scale__btn' + (m.draft[s.id] === n ? ' scale__btn--picked' : ''), String(n), () => {
        m.draft[s.id] = n; ctx.commit();
      });
      b.setAttribute('aria-label', `${s.label}: ${n} of 5`);
      row.appendChild(b);
    }
    c.appendChild(row);
    const ends = el('div', 'scale__ends');
    ends.append(el('span', null, s.low), el('span', null, s.high));
    c.appendChild(ends);
    wrap.appendChild(c);
  });

  const done = SIGNALS.every((s) => m.draft[s.id]);
  const cta = el('div', 'stack__cta');
  const save = btn('btn', 'Save check-in', () => {
    m.checkins.unshift({ at: Date.now(), values: { ...m.draft } });
    m.checkins = m.checkins.slice(0, 60);
    m.draft = {};
    track('baseline', 'checkin_logged', { count: m.checkins.length });

    if (m.checkins.length === BASELINE_MIN) track('baseline', 'baseline_established', { count: m.checkins.length });

    const changed = detectChange(m.checkins);
    if (changed.length) {
      m.flagged = { signals: changed, at: Date.now() };
      m.confirmed = null; m.supportKind = null; m.measured = null;
      changed.forEach((sig) => track('baseline', 'change_detected', { signal: sig }));
      m.stage = 'confirm';
    } else {
      m.stage = 'landing';
      ctx.toast('Saved. Nothing unusual against your baseline.');
    }
    ctx.commit();
  });
  save.disabled = !done;
  cta.appendChild(save);
  cta.appendChild(btn('btn btn--ghost', 'Cancel', () => { m.draft = {}; m.stage = 'landing'; ctx.commit(); }));
  wrap.appendChild(cta);
  if (!done) wrap.appendChild(el('p', 'card__meta', 'Rate all six to save.'));
  return wrap;
}

/* ---------- confirm ---------- */

function changeSentence(signals) {
  // Naming six things at once reads as noise. Name the three that moved
  // most and count the rest; the full detail is in the evidence list.
  const shown = signals.slice(0, 3)
    .map((id) => (SIGNALS.find((s) => s.id === id) || {}).label.toLowerCase());
  const extra = signals.length - shown.length;
  const list = shown.length === 1 ? shown[0]
    : shown.slice(0, -1).join(', ') + ' and ' + shown[shown.length - 1];
  const tail = extra > 0 ? `, along with ${extra} other${extra === 1 ? '' : 's'}` : '';
  return `Your ${list} ratings have changed${tail}.`;
}

function confirmStage(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('Does this match how you feel?',
    'The app noticed a change in the numbers. Only you can say whether it means anything.'));

  const c = card('card--accent');
  c.appendChild(el('p', 'card__title', changeSentence(m.flagged.signals)));
  const base = baselineOf(m.checkins);
  const recent = recentOf(m.checkins);
  const dl = el('dl', 'record');
  m.flagged.signals.forEach((id) => {
    const s = SIGNALS.find((x) => x.id === id);
    dl.appendChild(el('dt', null, s.label));
    dl.appendChild(el('dd', null,
      `baseline ${base[id].toFixed(1)} → recent ${recent[id].toFixed(1)}`));
  });
  c.appendChild(dl);
  wrap.appendChild(c);

  const ask = card();
  const row = el('div', 'quicks quicks--stack');
  [
    ['yes', 'Yes, that is how it feels'],
    ['no', 'No, the numbers are off'],
    ['unsure', 'I am not sure'],
  ].forEach(([id, label]) => {
    row.appendChild(btn('quick', label, () => {
      m.confirmed = id;
      track('baseline', 'change_confirmed', { answer: id, signals: m.flagged.signals.length });
      m.stage = id === 'no' ? 'landing' : 'support';
      if (id === 'no') ctx.toast('Noted — nothing will be offered on the back of it.');
      ctx.commit();
    }));
  });
  ask.appendChild(row);
  wrap.appendChild(ask);
  return wrap;
}

/* ---------- support ---------- */

function supportStage(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('What would help?',
    'Offered because you confirmed the change, not because a number moved.'));

  track('baseline', 'support_offered', { signals: m.flagged ? m.flagged.signals.length : 0 });

  const opts = [
    ['guided', 'A short guided activity', 'Five minutes, structured, in Zuporta+.'],
    ['coach', 'Talk to a professional', 'A certified coach from the marketplace.'],
    ['none', 'Nothing right now', 'Just keep tracking.'],
  ];
  opts.forEach(([id, title, body]) => {
    const c = card();
    c.appendChild(el('p', 'card__title', title));
    c.appendChild(el('p', 'card__body', body));
    const cta = el('div', 'card__cta');
    cta.appendChild(btn('btn btn--sm', 'Choose', () => {
      m.supportKind = id;
      track('baseline', 'support_accepted', { kind: id });
      if (id === 'none') { m.stage = 'landing'; ctx.toast('Fine — the trend stays visible whenever you want it.'); }
      else m.stage = 'measure';
      if (id === 'guided') ctx.toast('Prototype — this would open a guided activity.');
      if (id === 'coach') ctx.toast('Prototype — this would open coach matching.');
      ctx.commit();
    }));
    c.appendChild(cta);
    wrap.appendChild(c);
  });
  return wrap;
}

/* ---------- measure the response ---------- */

function measureStage(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('Did that help?',
    'Measuring after support is the part that makes the next suggestion better.'));

  const c = card();
  const row = el('div', 'quicks quicks--stack');
  [[4, 'Much better'], [3, 'A little better'], [2, 'About the same'], [1, 'Worse']].forEach(([score, label]) => {
    row.appendChild(btn('quick' + (m.measured === score ? ' quick--picked' : ''), label, () => {
      m.measured = score;
      track('baseline', 'response_measured', { score, kind: m.supportKind });
      ctx.onPlanSaved('baseline', { intensity: score });
      m.stage = 'landing';
      ctx.toast('Recorded against this change.');
      ctx.commit();
    }));
  });
  c.appendChild(row);
  wrap.appendChild(c);
  return wrap;
}

/* ---------- the rule, shown rather than hidden ---------- */

function ruleCard(ctx, m) {
  const { el, card } = ctx;
  const c = card();
  c.appendChild(el('p', 'card__k', 'How change detection works'));
  c.appendChild(el('p', 'card__body',
    `Your baseline is the average of each rating across your check-ins, excluding the most recent two. A change is flagged when the average of your last two check-ins moves at least ${DELTA.toFixed(1)} points in the unhelpful direction on the 1 to 5 scale. That is the whole rule — there is no model and nothing hidden.`));
  c.appendChild(el('p', 'card__meta',
    'Internally this programme is Neurobehavioral Response Intelligence. Neuroscience-based interpretation, speech analysis, cognitive testing and wearable signals are research features and are deliberately not in this product.'));
  return c;
}

/* ---------- registration ---------- */

export default registerModule({
  id: 'baseline',
  name: 'Personal Baseline',
  tagline: 'Short repeated check-ins that show change against your own history',
  icon: 'i-activity',
  audience: 'Any Zuporta member who wants continuity rather than starting from scratch',
  buyer: 'Platform capability — underpins employer, health plan and research offerings',
  outcome: 'A confirmed change, matched support, and a measured response',

  inScope: [
    'Self-reported ratings compared only with the member’s own history',
    'Transparent arithmetic change detection, shown in the product',
    'Member confirmation before any support is offered',
  ],
  outOfScope: [
    'No diagnosis, screening or clinical interpretation',
    'No neuroscience, speech analysis or cognitive testing claims',
    'No wearable or passive signals in this build',
    'Not a substitute for clinical assessment of any kind',
  ],

  events: [
    'consent_completed', 'checkin_logged', 'baseline_established', 'change_detected',
    'change_confirmed', 'support_offered', 'support_accepted', 'response_measured',
    'feedback_given', 'safety_route_opened',
  ],

  enums: {
    signal: SIGNALS.map((s) => s.id),
    answer: ['yes', 'no', 'unsure'],
    kind: ['guided', 'coach', 'none'],
  },

  pilotGaps: [
    'Validated instruments if any claim beyond self-report is ever made',
    'Encrypted server-side storage, retention, deletion/export and audit trail',
    'Separate research consent before any trend data leaves the device',
    'Clinical governance on what a flagged change may and may not trigger',
    'Evaluation of the detection rule against real data before it is tuned',
    'Explicit guardrails so trends are never shown to an employer or insurer',
    'Legal, privacy and jurisdiction review before pilot',
  ],

  connect: {
    topic: 'growth', context: 'personal',
    intervention: 'Baseline-triggered support',
    followupLabel: 'at your next check-in',
    followupMs: 2 * 24 * 60 * 60 * 1000,
  },

  render,
});
