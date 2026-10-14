/* ============================================================
   Accessible Support Navigation.

   Built around the five barriers people actually hit:
     cannot afford it · do not know what I qualify for ·
     cannot complete the application · referral went nowhere ·
     nothing in my language

   The directory is the product. Every record carries eligibility,
   cost, contact, service area and a verification date, because a
   directory without verification dates is how people get sent to
   services that closed two years ago.

   Referral tracking exists so "did they actually get it" is
   answerable — which is the metric that matters.
   ============================================================ */

import { registerModule, track } from './modules.js';
import {
  RESOURCES, RESOURCE_TYPES, COSTS, LANGUAGES, CHECKLISTS,
  REFERRAL_STATES, SOCIAL_WORKERS,
} from './care.js';

const BLANK = () => ({
  stage: 'browse',
  filters: { type: null, cost: null, language: null, area: null },
  referrals: [],      // { id, resourceId, status, at, checklist: [] }
  swRequested: null,
  helpful: null,
});

function slice(ctx) {
  if (!ctx.state.modules) ctx.state.modules = {};
  if (!ctx.state.modules.navigator) ctx.state.modules.navigator = BLANK();
  return ctx.state.modules.navigator;
}

const resourceById = (id) => RESOURCES.find((r) => r.id === id);
const labelOf = (list, id) => (list.find((x) => x.id === id) || {}).label || '';

function matching(f) {
  return RESOURCES.filter((r) => {
    if (f.type && r.type !== f.type) return false;
    if (f.cost && r.cost !== f.cost) return false;
    if (f.language && !r.languages.includes(f.language)) return false;
    return true;
  });
}

/* ============================================================ */

function render(ctx) {
  const { el } = ctx;
  const m = slice(ctx);
  const wrap = el('div', 'stack');
  wrap.appendChild(head(ctx));

  const tabs = el('div', 'segmented');
  [['browse', 'Find support'], ['tracked', `Referrals (${m.referrals.length})`], ['help', 'Get help applying']]
    .forEach(([id, label]) => {
      const b = ctx.btn('segmented__btn', label, () => { m.stage = id; ctx.commit(); });
      b.setAttribute('aria-pressed', String(m.stage === id));
      tabs.appendChild(b);
    });
  wrap.appendChild(tabs);

  const stage = { browse, tracked, help }[m.stage] || browse;
  wrap.appendChild(stage(ctx, m));
  wrap.appendChild(ctx.demoNote(
    'Every listing here is illustrative. A real directory needs named owners and a re-verification schedule, or it rots.'));
  return wrap;
}

function head(ctx) {
  const { el } = ctx;
  const h = el('header', 'mod-head');
  h.appendChild(el('p', 'mod-head__kicker', 'Support Navigation'));
  h.appendChild(el('h2', 'mod-head__title', 'Find it, qualify for it, actually get it'));
  return h;
}

/* ---------- browse + filters ---------- */

function browse(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');

  const f = card();
  f.appendChild(el('p', 'card__k', 'Narrow it down'));
  f.appendChild(filterRow(ctx, m, 'type', 'What kind', RESOURCE_TYPES));
  f.appendChild(filterRow(ctx, m, 'cost', 'Cost', COSTS));
  f.appendChild(filterRow(ctx, m, 'language', 'Language',
    LANGUAGES.map((l) => ({ id: l, label: l }))));
  const clear = el('div', 'card__cta');
  clear.appendChild(btn('btn btn--ghost btn--sm', 'Clear filters', () => {
    m.filters = { type: null, cost: null, language: null, area: null };
    ctx.commit();
  }));
  f.appendChild(clear);
  wrap.appendChild(f);

  const results = matching(m.filters);
  wrap.appendChild(ctx.section(`${results.length} service${results.length === 1 ? '' : 's'}`,
    results.length ? null : 'Nothing matches all of those. Try removing a filter — or ask a social worker, who will know what is not listed.'));

  results.forEach((r) => wrap.appendChild(resourceCard(ctx, m, r)));

  if (!results.length) {
    const cta = el('div', 'stack__cta');
    cta.appendChild(btn('btn', 'Ask a social worker', () => { m.stage = 'help'; ctx.commit(); }));
    wrap.appendChild(cta);
  }
  return wrap;
}

function filterRow(ctx, m, key, label, options) {
  const { el, btn } = ctx;
  const wrap = el('div', 'filter');
  wrap.appendChild(el('p', 'filter__label', label));
  const row = el('div', 'quicks');
  options.forEach((o) => {
    const on = m.filters[key] === o.id;
    row.appendChild(btn('quick quick--sm' + (on ? ' quick--picked' : ''), o.label, () => {
      m.filters[key] = on ? null : o.id;
      if (!on) track('navigator', 'filter_applied', { filter: key });
      ctx.commit();
    }));
  });
  wrap.appendChild(row);
  return wrap;
}

function resourceCard(ctx, m, r) {
  const { el, btn, card } = ctx;
  const saved = m.referrals.find((x) => x.resourceId === r.id);
  const c = card();
  c.appendChild(el('p', 'card__title', r.name));
  c.appendChild(el('p', 'card__body', r.org));

  const dl = el('dl', 'record');
  [
    ['Who qualifies', r.eligibility],
    ['Cost', r.costNote],
    ['Area', r.area],
    ['Languages', r.languages.join(', ')],
    ['Contact', r.contact],
    ['Wait', r.waitlist],
  ].forEach(([k, v]) => { dl.appendChild(el('dt', null, k)); dl.appendChild(el('dd', null, v)); });
  c.appendChild(dl);

  const v = el('p', 'verified');
  v.append(ctx.icon('i-check'), document.createTextNode('Last verified ' + r.verified));
  c.appendChild(v);

  const cta = el('div', 'card__cta');
  cta.appendChild(btn(saved ? 'btn btn--ghost btn--sm' : 'btn btn--sm',
    saved ? 'Saved' : 'Save and track', () => {
      if (saved) { m.stage = 'tracked'; ctx.commit(); return; }
      m.referrals.unshift({
        id: 'ref-' + Math.random().toString(36).slice(2, 8),
        resourceId: r.id, status: 'saved', at: Date.now(), checklist: [],
      });
      track('navigator', 'referral_saved', { resource_type: r.type, cost: r.cost });
      ctx.toast('Saved. You can track whether you actually got it.');
      ctx.commit();
    }));
  cta.appendChild(btn('btn btn--ghost btn--sm', 'What I need to apply', () => openChecklist(ctx, m, r)));
  c.appendChild(cta);
  return c;
}

/* ---------- application checklist ---------- */

function openChecklist(ctx, m, r) {
  const items = CHECKLISTS[r.type] || CHECKLISTS.default;
  track('navigator', 'checklist_opened', { resource_type: r.type });
  ctx.openSheet('What you need for ' + r.name, (body) => {
    const c = ctx.el('div', 'card');
    c.appendChild(ctx.el('p', 'card__body', r.eligibility));
    const ol = ctx.el('ol', 'steps');
    items.forEach((t) => ol.appendChild(ctx.el('li', null, t)));
    c.appendChild(ol);
    c.appendChild(ctx.el('p', 'card__meta',
      'If any of this is the blocker, a social worker can often do it with you rather than send you away to do it alone.'));
    const cta = ctx.el('div', 'card__cta');
    cta.appendChild(ctx.btn('btn btn--sm', 'Ask a social worker', () => {
      ctx.closeSheet(); m.stage = 'help'; ctx.commit();
    }));
    c.appendChild(cta);
    body.appendChild(c);
  });
}

/* ---------- referral tracking ---------- */

function tracked(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('Did you actually get it?',
    'A referral is not an outcome. This tracks whether the service was reached.'));

  if (!m.referrals.length) {
    const c = card();
    c.appendChild(el('p', 'card__body', 'Nothing tracked yet. Save a service from Find support and it appears here.'));
    wrap.appendChild(c);
    return wrap;
  }

  m.referrals.forEach((ref) => {
    const r = resourceById(ref.resourceId);
    if (!r) return;
    const c = card(ref.status === 'accessed' ? 'card--accent' : '');
    c.appendChild(el('p', 'card__title', r.name));
    c.appendChild(el('p', 'card__body', r.org + ' · ' + r.contact));

    const row = el('div', 'quicks quicks--stack');
    REFERRAL_STATES.forEach((s) => {
      const on = ref.status === s.id;
      row.appendChild(btn('quick' + (on ? ' quick--picked' : ''), s.label, () => {
        ref.status = s.id;
        track('navigator', 'referral_updated', { status: s.id, resource_type: r.type });
        if (s.id === 'accessed') {
          track('navigator', 'resource_accessed', { resource_type: r.type, cost: r.cost });
          ctx.toast('That is the outcome that counts.');
        }
        if (s.id === 'blocked') {
          track('navigator', 'barrier_reported', { resource_type: r.type });
          ctx.toast('Noted — a social worker is the next step.');
        }
        ctx.commit();
      }));
    });
    c.appendChild(row);

    if (ref.status === 'blocked') {
      const cta = el('div', 'card__cta');
      cta.appendChild(btn('btn btn--sm', 'Get help with this', () => { m.stage = 'help'; ctx.commit(); }));
      c.appendChild(cta);
    }
    wrap.appendChild(c);
  });

  const got = m.referrals.filter((x) => x.status === 'accessed').length;
  const sum = card();
  sum.appendChild(el('p', 'card__k', 'Follow-through'));
  sum.appendChild(el('p', 'card__body',
    `${got} of ${m.referrals.length} tracked service(s) actually reached. Zuporta will check back on the rest.`));
  wrap.appendChild(sum);
  return wrap;
}

/* ---------- social worker matching ---------- */

function help(ctx, m) {
  const { el, btn, card } = ctx;
  const wrap = el('div', 'stack');
  wrap.appendChild(ctx.section('Help from a social worker',
    'For eligibility, applications, appeals and the referrals that go nowhere.'));

  SOCIAL_WORKERS.forEach((sw) => {
    const c = card(m.swRequested === sw.id ? 'card--accent' : '');
    const h = el('div', 'pro__head');
    h.append(el('div', 'pro__avatar', sw.initials));
    const idb = el('div', 'pro__id');
    idb.append(el('p', 'pro__name', sw.name), el('p', 'pro__title', sw.title));
    h.appendChild(idb);
    c.appendChild(h);
    c.appendChild(el('p', 'pro__focus', sw.cred));
    c.appendChild(el('p', 'card__body', 'Helps with ' + sw.focus.join(', ').toLowerCase() + '.'));
    c.appendChild(el('p', 'card__meta', 'Speaks ' + sw.languages.join(', ')));
    const cta = el('div', 'card__cta');
    cta.appendChild(btn(m.swRequested === sw.id ? 'btn btn--ghost btn--sm' : 'btn btn--sm',
      m.swRequested === sw.id ? 'Request sent' : 'Request help', () => {
        if (m.swRequested === sw.id) return;
        m.swRequested = sw.id;
        track('navigator', 'socialworker_requested', { worker: sw.id });
        ctx.toast('Prototype — secure messaging is not connected yet.');
        ctx.commit();
      }));
    c.appendChild(cta);
    wrap.appendChild(c);
  });

  wrap.appendChild(feedback(ctx, m));
  return wrap;
}

function feedback(ctx, m) {
  const { el, btn, card } = ctx;
  const c = card();
  c.appendChild(el('p', 'card__k', 'Was this helpful?'));
  const row = el('div', 'quicks');
  [[1, 'Not really'], [2, 'A little'], [3, 'Yes'], [4, 'Very']].forEach(([score, label]) => {
    row.appendChild(btn('quick' + (m.helpful === score ? ' quick--picked' : ''), label, () => {
      m.helpful = score;
      track('navigator', 'feedback_given', { helpfulness: score });
      ctx.toast('Thank you.');
      ctx.commit();
    }));
  });
  c.appendChild(row);
  return c;
}

/* ---------- registration ---------- */

export default registerModule({
  id: 'navigator',
  name: 'Support Navigation',
  tagline: 'A verified directory, eligibility help, and tracking of whether you actually got the service',
  icon: 'i-compass',
  audience: 'Anyone blocked by cost, eligibility, paperwork or language',
  buyer: 'Health plans, health systems, counties and public programmes, employer benefits',
  outcome: 'A tracked referral that is followed through to access, not just given',

  inScope: [
    'A directory where every record carries eligibility, cost, area and a verification date',
    'Filtering by what actually blocks people: cost, eligibility, language, area',
    'Application checklists, social-worker matching and referral follow-through',
  ],
  outOfScope: [
    'No benefits determination — only the agency can decide eligibility',
    'No legal or immigration advice',
    'No clinical assessment or treatment',
    'Not an emergency or crisis service',
  ],

  events: [
    'filter_applied', 'checklist_opened', 'referral_saved', 'referral_updated',
    'resource_accessed', 'barrier_reported', 'socialworker_requested',
    'feedback_given', 'safety_route_opened',
  ],

  enums: {
    filter: ['type', 'cost', 'language', 'area'],
    resource_type: RESOURCE_TYPES.map((t) => t.id),
    cost: COSTS.map((c) => c.id),
    status: REFERRAL_STATES.map((s) => s.id),
    worker: SOCIAL_WORKERS.map((s) => s.id),
  },

  pilotGaps: [
    'Real directory data with named owners and a re-verification schedule',
    'Verified social-worker licensure and jurisdiction-correct scope',
    'Secure messaging and warm handoff to the service, not just a phone number',
    'Eligibility rules kept current as programmes change, with versioning',
    'Translation and interpretation, not just a language tag on a record',
    'Encrypted server-side data model, retention, deletion/export and audit trail',
    'Legal, privacy, accessibility and jurisdiction review before pilot',
  ],

  connect: {
    topic: 'growth', context: 'personal',
    intervention: 'Support navigation session',
    followupLabel: 'to check you got it',
    followupMs: 7 * 24 * 60 * 60 * 1000,
  },

  render,
});
