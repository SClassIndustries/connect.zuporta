/* ============================================================
   Zuporta+ — app shell, router and views.
   Vanilla ES modules, no framework, no build step.
   Everything a member enters stays in localStorage on the device.
   ============================================================ */

import {
  TOPICS, topicLabel, ACTIVITIES, activityFor,
  CONTEXTS, COPING, FOLLOWUPS, CONSENT_LAYERS, CRISIS,
} from './data.js';
import {
  OPENERS, PATHS, respondToText, respondToAction, matchRationale,
} from './assistant.js';
import {
  modules, moduleById, clearAnalytics,
  MANIFEST, manifestById, ensureModule, ensureAllModules, prefetchModules,
} from './modules.js';
import {
  fetchPros, cachedPros, matchLivePros, SIGN_IN_URL, SIGN_UP_URL, COACHES_URL,
} from './zuporta-api.js';

/* ---------- helpers ---------- */

const $ = (sel, root = document) => root.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const icon = (id, cls) => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  if (cls) svg.setAttribute('class', cls);
  svg.setAttribute('viewBox', id === 'i-mark' ? '0 0 64 64' : '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#' + id);
  svg.appendChild(use);
  return svg;
};
const btn = (cls, label, onClick) => {
  const b = el('button', cls, label);
  b.type = 'button';
  if (onClick) b.addEventListener('click', onClick);
  return b;
};
const uid = () => Math.random().toString(36).slice(2, 10);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- state ---------- */

const KEY = 'zuporta.v2.state';

const freshChat = () => ({ messages: [], session: { step: 'open', topic: null } });

const defaults = () => ({
  profile: { name: '' },
  consent: null,          // null = not asked, else { personalize }
  events: [],             // ZHED-style records: context -> state -> intervention -> state -> behaviour
  followups: [],          // scheduled longitudinal check-backs
  chat: freshChat(),
  checkIns: [],           // { at, score } daily mood
  responses: [],          // { at, activity, before, after, rating }
  saved: [],              // saved activity ids
  program: null,          // enrolled program id
  installDismissed: false,
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const loaded = Object.assign(defaults(), JSON.parse(raw));
      // Preserve the working preference, dropping legacy choices with no data flow.
      if (loaded.consent != null) {
        loaded.consent = { personalize: typeof loaded.consent === 'boolean'
          ? loaded.consent : loaded.consent.personalize === true };
        try { localStorage.setItem(KEY, JSON.stringify(loaded)); }
        catch (e) { /* keep readable history when storage is full or read-only */ }
      }
      return loaded;
    }
  } catch (e) { /* unreadable storage: start fresh */ }
  return defaults();
}

function save() {
  try {
    if (state.chat.messages.length > 60) state.chat.messages = state.chat.messages.slice(-60);
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) { /* private mode or quota: the session still works */ }
}

/* ---------- navigation ---------- */

const NAV = [
  { id: 'home',          label: 'Home',        icon: 'i-home' },
  { id: 'assistant',     label: 'Zuporta+',    icon: 'i-spark' },
  { id: 'modules',       label: 'Modules',     icon: 'i-grid' },
  { id: 'wellness',      label: 'My Wellness', icon: 'i-target' },
  { id: 'professionals', label: 'Professionals', icon: 'i-users' },
  { id: 'sessions',      label: 'Sessions',    icon: 'i-clock' },
  { sep: true },
  { id: 'profile',       label: 'Profile',     icon: 'i-user' },
  { id: 'settings',      label: 'Settings',    icon: 'i-settings' },
];

const TABS = ['home', 'assistant', 'professionals', 'wellness', 'more'];

const TITLES = {
  home: 'Home', assistant: 'Zuporta+', wellness: 'My Wellness',
  professionals: 'Professionals', sessions: 'Sessions',
  profile: 'Profile', settings: 'Settings', modules: 'Modules',
};

let view = 'home';

const viewEl = $('#view');
const composerZone = $('#composer-zone');
const inputEl = $('#composer-input');
const sendBtn = $('#send-btn');

function availableView(id) {
  return Object.prototype.hasOwnProperty.call(TITLES, id) || (id.startsWith('m/') && manifestById(id.slice(2))) ? id : 'home';
}

function go(next) {
  next = availableView(next);
  view = next;
  if (location.hash !== '#/' + next) location.hash = '#/' + next;
  render();
  closeDrawer();
  viewEl.scrollTop = 0;
}

window.addEventListener('hashchange', () => {
  let id = location.hash.replace('#/', '') || 'home';
  // A route for a module that no longer exists — a bookmark, or an installed
  // shortcut from an earlier build — lands on Home rather than a blank shell.
  id = availableView(id);
  if (id !== view) { view = id; render(); }
});

/* ============================================================
   Render
   ============================================================ */

function render() {
  // Verticals route at #/m/<id> and render themselves inside the shell.
  const mod = view.startsWith('m/') ? moduleById(view.slice(2)) : null;
  const meta = view.startsWith('m/') ? manifestById(view.slice(2)) : null;
  $('#view-title').textContent = (mod && mod.name) || (meta && meta.name) || TITLES[view] || 'Zuporta+';
  renderNav();
  renderTabs();
  composerZone.hidden = view !== 'assistant';

  viewEl.replaceChildren();
  if (view.startsWith('m/')) {
    const id = view.slice(2);
    if (mod) { viewEl.appendChild(mod.render(moduleCtx())); return; }
    if (manifestById(id)) {
      viewEl.appendChild(loadingCard(manifestById(id).name));
      ensureModule(id).then(() => { if (view === 'm/' + id) render(); });
      return;
    }
  }
  const build = {
    home: viewHome, assistant: viewAssistant, wellness: viewWellness,
    professionals: viewProfessionals, sessions: viewSessions,
    profile: viewProfile, settings: viewSettings, modules: viewModules,
  }[view] || viewHome;
  viewEl.appendChild(build());
}

function renderNav() {
  const list = $('#nav-list');
  list.replaceChildren();
  for (const item of NAV) {
    if (item.sep) {
      const li = el('li');
      li.appendChild(el('div', 'nav__sep'));
      list.appendChild(li);
      continue;
    }
    const li = el('li');
    const b = btn('nav__item', null, () => go(item.id));
    b.setAttribute('aria-current', String(item.id === view));
    b.append(icon(item.icon), el('span', null, item.label));
    li.appendChild(b);
    list.appendChild(li);
  }
}

function renderTabs() {
  const bar = $('#tabbar');
  bar.replaceChildren();
  const meta = {
    home: ['Home', 'i-home'], assistant: ['Zuporta+', 'i-spark'],
    professionals: ['People', 'i-users'], wellness: ['Wellness', 'i-target'],
    more: ['More', 'i-more'],
  };
  for (const id of TABS) {
    const [label, ic] = meta[id];
    const b = btn('tab', null, () => (id === 'more' ? openMore() : go(id)));
    b.setAttribute('aria-current', String(id === view));
    b.append(icon(ic), el('span', 'tab__label', label));
    bar.appendChild(b);
  }
}

function openMore() {
  openSheet('More', (body) => {
    ['programs', 'sessions', 'plus', 'profile', 'settings'].forEach((id) => {
      const item = NAV.find((n) => n.id === id)
        || { id: 'plus', label: 'Zuporta+ membership', icon: 'i-heart' };
      body.appendChild(rowCard(item.icon, item.label, '', () => { closeSheet(); go(id); }));
    });
  });
}

/* ---------- shared blocks ---------- */

function section(title, sub) {
  const s = el('section', 'sect');
  if (title) s.appendChild(el('h2', 'sect__h', title));
  if (sub) s.appendChild(el('p', 'sect__sub', sub));
  return s;
}

function card(cls) { return el('div', 'card' + (cls ? ' ' + cls : '')); }

function rowCard(iconId, title, desc, onClick) {
  const b = btn('rowcard', null, onClick);
  const i = el('span', 'rowcard__icon');
  i.appendChild(icon(iconId));
  const tx = el('span', 'rowcard__text');
  tx.appendChild(el('span', 'rowcard__t', title));
  if (desc) tx.appendChild(el('span', 'rowcard__d', desc));
  b.append(i, tx, icon('i-right', 'rowcard__chev'));
  return b;
}

function demoNote(text) {
  const n = el('p', 'demo-note');
  n.append(icon('i-shield'), document.createTextNode(text));
  return n;
}

/* ============================================================
   HOME  (§2 + §10)
   ============================================================ */

function viewHome() {
  const wrap = el('div', 'stack');
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = state.profile.name.trim();

  // greeting + daily check-in
  const greet = el('header', 'greet');
  greet.appendChild(el('p', 'greet__hi', name ? `${part}, ${name}` : part));
  greet.appendChild(el('h2', 'greet__q', 'How are you feeling today?'));
  greet.appendChild(moodRow());
  wrap.appendChild(greet);

  // the three doors
  const hero = el('section', 'hero');
  hero.appendChild(el('h2', 'hero__title', 'Need Someone to Talk To?'));
  hero.appendChild(el('p', 'hero__sub', 'How can we support you today?'));
  const doors = el('div', 'doors');
  [
    { icon: 'i-spark', t: 'Talk to Zuporta+', d: 'Personalized wellness support, anytime.',
      cta: 'Start a conversation', run: () => go('assistant') },
    { icon: 'i-users', t: 'Talk to a Professional', d: 'Connect with a certified wellness professional for real human support.',
      cta: 'Find someone', run: () => go('professionals') },
    { icon: 'i-target', t: 'Continue My Wellness Journey', d: 'Check in, work toward your goals, or continue where you left off.',
      cta: 'My Wellness', run: () => go('wellness') },
  ].forEach((d) => {
    const b = btn('door', null, d.run);
    const i = el('span', 'door__icon');
    i.appendChild(icon(d.icon));
    b.append(i, el('span', 'door__t', d.t), el('span', 'door__d', d.d));
    const cta = el('span', 'door__cta');
    cta.append(document.createTextNode(d.cta), icon('i-right'));
    b.appendChild(cta);
    doors.appendChild(b);
  });
  hero.appendChild(doors);
  wrap.appendChild(hero);

  const modCard = moduleHomeCard();
  if (modCard) wrap.appendChild(modCard);

  // support topics
  const topics = section('What would you like support with?');
  const chips = el('div', 'chips');
  TOPICS.forEach((t) => {
    chips.appendChild(btn('chip', t.label, () => startFromTopic(t.id)));
  });
  topics.appendChild(chips);
  wrap.appendChild(topics);

  // consent invitation (§11), plus any follow-up that has come due
  if (state.consent === null) wrap.appendChild(consentCard());
  const due = dueFollowup();
  if (due) wrap.appendChild(followupCard(due));

  const focus = section('Your check-ins');
  const fc = card();
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);
  const days = new Set(state.checkIns.filter((c) => c.at >= since.getTime())
    .map((c) => new Date(c.at).toDateString())).size;
  fc.appendChild(el('p', 'card__body', `You have checked in on ${days} ${days === 1 ? 'day' : 'days'} in the past 7 days.`));
  const fcta = el('div', 'card__cta');
  fcta.appendChild(btn('btn btn--sm', 'Check In', () => {
    document.querySelector('.mood__btn')?.focus();
    viewEl.scrollTo({ top: 0, behavior: reduceMotion() ? 'auto' : 'smooth' });
  }));
  fc.appendChild(fcta);
  focus.appendChild(fc);
  wrap.appendChild(focus);

  const rec = section('Try a guided activity');
  const previous = consented('personalize') && state.responses.find((r) =>
    r.helpful && Object.values(ACTIVITIES).some((a) => a.name === r.activity));
  const act = (previous && Object.values(ACTIVITIES).find((a) => a.name === previous.activity))
    || ACTIVITIES.reset;
  const rc = card();
  rc.appendChild(el('p', 'card__title', act.name));
  rc.appendChild(el('p', 'card__body', previous
    ? 'You rated this activity helpful before.'
    : 'A short exercise you can try on this device.'));
  const rcta = el('div', 'card__cta');
  rcta.appendChild(btn('btn btn--sm', 'Start', () => startActivityDirect(act.id)));
  rc.appendChild(rcta);
  rec.appendChild(rc);
  wrap.appendChild(rec);

  wrap.appendChild(poweredNote());
  return wrap;
}

function moodRow() {
  const faces = [
    ['\u{1F616}', 'Rough'], ['\u{1F641}', 'Low'], ['\u{1F610}', 'Okay'],
    ['\u{1F642}', 'Good'], ['\u{1F604}', 'Great'],
  ];
  const row = el('div', 'mood');
  const todayKey = new Date().toDateString();
  const done = state.checkIns.find((c) => new Date(c.at).toDateString() === todayKey);
  faces.forEach(([face, label], i) => {
    const b = btn('mood__btn', null, () => {
      state.checkIns.unshift({ at: Date.now(), score: i + 1, label });
      state.checkIns = state.checkIns.slice(0, 120);
      save();
      render();
      toast(`Checked in — ${label.toLowerCase()}. Thank you.`);
    });
    b.setAttribute('aria-pressed', String(!!done && done.label === label));
    b.setAttribute('aria-label', label);
    b.append(el('span', 'mood__face', face), el('span', 'mood__label', label));
    row.appendChild(b);
  });
  return row;
}

function progressBar(frac) {
  const bar = el('div', 'progress');
  const fill = el('div', 'progress__fill');
  fill.style.width = Math.round(Math.min(1, Math.max(0, frac)) * 100) + '%';
  bar.appendChild(fill);
  return bar;
}

function poweredNote() {
  const p = el('p', 'powered');
  p.append(document.createTextNode('Powered by '), el('strong', null, 'Zuporta Connect™'));
  return p;
}

function consentCard() {
  const c = card('card--accent');
  c.appendChild(el('p', 'card__title', 'Make Zuporta More Personal'));
  c.appendChild(el('p', 'card__body',
    'Choose whether Home suggests guided activities you have rated helpful. This happens only on your device. You can use the app with personalization off.'));
  const cta = el('div', 'card__cta');
  cta.appendChild(btn('btn btn--sm', 'Choose personalization', openConsentSheet));
  cta.appendChild(btn('btn btn--ghost btn--sm', 'Not Now', () => {
    state.consent = { personalize: false };
    save(); render(); toast('Nothing shared. You can change this any time in Settings.');
  }));
  c.appendChild(cta);
  return c;
}

/** Only expose preferences backed by an implemented on-device behavior. */
function consentRow(layer) {
  const row = card();
  row.appendChild(el('p', 'card__title', layer.title));
  row.appendChild(el('p', 'card__body', layer.body));
  const cta = el('div', 'card__cta');
  if (layer.required) {
    const tag = el('span', 'badge');
    tag.textContent = 'Always on — needed for the app to work';
    cta.appendChild(tag);
  } else {
    const on = consented(layer.id);
    const b = btn(on ? 'btn btn--sm' : 'btn btn--ghost btn--sm', on ? 'On' : 'Off', () => {
      setConsent(layer.id, !on);
      render();
      if (!sheetEl.hidden) openConsentSheet();
    });
    b.setAttribute('aria-pressed', String(on));
    cta.appendChild(b);
  }
  row.appendChild(cta);
  return row;
}

function openConsentSheet() {
  if (!state.consent) state.consent = { personalize: false };
  openSheet('Personalization and storage', (body) => {
    CONSENT_LAYERS.forEach((l) => body.appendChild(consentRow(l)));
    body.appendChild(demoNote('You can change these permissions at any time. Your choices and wellness data stay on this device.'));
  });
  save();
}

function startFromTopic(topicId) {
  const chat = state.chat;
  chat.session = { step: 'understand', topic: topicId };
  chat.messages = [
    { role: 'user', text: topicLabel(topicId) },
    { id: uid(), role: 'bot', blocks: [
      { t: 'p', text: `Let us look at ${topicLabel(topicId).toLowerCase()} together.` },
      { t: 'p', text: 'What would be most helpful right now?' },
      { t: 'choices', items: PATHS },
    ] },
  ];
  save();
  go('assistant');
}

function startActivityDirect(activityId) {
  const chat = state.chat;
  chat.session = { step: 'checkin', topic: chat.session.topic || 'stress', activityId };
  chat.messages.push({ id: uid(), role: 'bot', blocks: [
    { t: 'p', text: 'Before we begin, a quick check-in. This is what lets us tell afterwards whether it actually helped.' },
    { t: 'scale', label: 'How overwhelmed do you feel right now?', low: 'Not at all', high: 'Completely' },
  ] });
  save();
  go('assistant');
}

/* ============================================================
   ASSISTANT  (§4, §5)
   ============================================================ */

function viewAssistant() {
  ensureLivePros();
  const wrap = el('div', 'thread');
  const inner = el('div', 'thread__inner');
  inner.id = 'thread-inner';
  inner.setAttribute('role', 'log');
  inner.setAttribute('aria-live', 'polite');
  inner.setAttribute('aria-label', 'Conversation with Zuporta+');
  wrap.appendChild(inner);

  if (!state.chat.messages.length) {
    inner.appendChild(assistantIntro());
  } else {
    state.chat.messages.forEach((m) => {
      inner.appendChild(m.role === 'user' ? userMsg(m.text) : botMsg(m, false));
    });
  }
  requestAnimationFrame(() => { wrap.scrollTop = wrap.scrollHeight; });
  return wrap;
}

function assistantIntro() {
  const wrap = el('div', 'intro');
  const mark = icon('i-mark', 'intro__mark');
  mark.setAttribute('width', '48'); mark.setAttribute('height', '48');
  wrap.append(mark);
  wrap.appendChild(el('h2', 'intro__title', 'Zuporta+'));
  wrap.appendChild(el('p', 'intro__sub', 'Your personal wellness companion. Personalized wellness support when you need it, with meaningful human connection when you want it.'));
  wrap.appendChild(el('p', 'intro__q', 'What would feel most helpful right now?'));
  const list = el('div', 'openers');
  OPENERS.forEach((o) => list.appendChild(btn('opener', o.label, () => sendText(o.send))));
  wrap.appendChild(list);
  wrap.appendChild(demoNote('Guided wellness support. Not diagnosis, therapy or medical care.'));
  return wrap;
}

function userMsg(text) {
  const m = el('div', 'msg msg--user');
  m.appendChild(el('div', 'msg__body', text));
  return m;
}

function botMsg(message, animate) {
  const m = el('div', 'msg msg--bot');
  const av = el('div', 'msg__avatar');
  av.appendChild(icon('i-mark'));
  const body = el('div', 'msg__body');
  m.append(av, body);
  const blocks = message.blocks;
  if (animate && !reduceMotion()) typeOut(body, blocks, message);
  else blocks.forEach((b) => body.appendChild(blockNode(b, message)));
  return m;
}

function typeOut(body, blocks, message) {
  let i = 0;
  const next = () => {
    if (i >= blocks.length) return;
    const b = blocks[i++];
    if (b.t !== 'p') { body.appendChild(blockNode(b, message)); scrollThread(); setTimeout(next, 80); return; }
    const node = el('p');
    body.appendChild(node);
    let pos = 0;
    const step = () => {
      pos = Math.min(b.text.length, pos + 3);
      node.textContent = b.text.slice(0, pos);
      scrollThread();
      if (pos < b.text.length) setTimeout(step, 12);
      else setTimeout(next, 130);
    };
    step();
  };
  next();
}

function scrollThread() {
  const t = $('.thread');
  if (t) t.scrollTop = t.scrollHeight;
}

/* ---------- assistant blocks ---------- */

function blockNode(b, message) {
  switch (b.t) {
    case 'p': return el('p', null, b.text);

    case 'choices': {
      const wrap = el('div', 'choices');
      b.items.forEach((c) => {
        const x = btn('choice', null, () => {
          if (b.answered) return;
          b.answered = c.label;
          save();
          act(c.action, null, c.label);
        });
        if (b.answered) {
          x.disabled = true;
          x.classList.toggle('choice--picked', b.answered === c.label);
        }
        const i = el('span', 'choice__icon');
        i.appendChild(icon(c.icon || 'i-spark'));
        const tx = el('span', 'choice__text');
        tx.append(el('span', 'choice__t', c.label), el('span', 'choice__d', c.sub || ''));
        x.append(i, tx);
        wrap.appendChild(x);
      });
      return wrap;
    }

    case 'quicks': {
      const wrap = el('div', 'quicks');
      b.items.forEach((q) => {
        const x = btn('quick', q.label, () => {
          if (b.answered) return;
          b.answered = q.label; save();
          if (q.action) act(q.action, null, q.label);
          else sendText(q.send);
        });
        if (b.answered) { x.disabled = true; x.classList.toggle('quick--picked', b.answered === q.label); }
        wrap.appendChild(x);
      });
      return wrap;
    }

    case 'scale': return scaleWidget(b);
    case 'activity': return activityWidget(b);
    case 'reassess': return reassessWidget(b);
    case 'measure': return measureWidget(b.before, b.after);
    case 'matching': return matchingWidget(b);
    case 'pick': return pickWidget(b);
    case 'event': return eventWidget();
    case 'crisis': return crisisCard();
    case 'scope': return scopeCard(b.kind);
    default: return el('div');
  }
}

/* Step 1 — Check In (1–10) */
function scaleWidget(b) {
  const c = el('div', 'wcard');
  c.appendChild(labelRow('Check in', 'i-heart'));
  c.appendChild(el('p', 'wcard__title', b.label));
  const row = el('div', 'scale');
  for (let n = 1; n <= 10; n++) {
    const x = btn('scale__btn', String(n), () => {
      if (b.answered) return;
      b.answered = n; save();
      act('checkin', n, String(n));
    });
    x.setAttribute('aria-label', `${n} out of 10`);
    if (b.answered) { x.disabled = true; x.classList.toggle('scale__btn--picked', b.answered === n); }
    row.appendChild(x);
  }
  c.appendChild(row);
  const ends = el('div', 'scale__ends');
  ends.append(el('span', null, b.low || 'Not at all'), el('span', null, b.high || 'Completely'));
  c.appendChild(ends);
  return c;
}

/* Step 2 — the standardized guided interaction */
function activityWidget(b) {
  const act0 = ACTIVITIES[b.id] || ACTIVITIES.reset;
  const c = el('div', 'wcard wcard--activity');
  c.appendChild(labelRow('Guided wellness experience', 'i-wind'));
  c.appendChild(el('p', 'wcard__title', act0.name));
  c.appendChild(el('p', 'wcard__meta', `${act0.steps.length} steps · about ${act0.duration}`));

  const bar = progressBar(0);
  c.appendChild(bar);
  const fill = bar.firstChild;

  const stepBox = el('div', 'astep');
  const stepT = el('p', 'astep__t');
  const stepB = el('p', 'astep__b');
  stepBox.append(stepT, stepB);
  const breathHost = el('div');
  stepBox.appendChild(breathHost);
  c.appendChild(stepBox);

  const nav = el('div', 'astep__nav');
  const back = btn('btn btn--ghost btn--sm', 'Back', () => show(idx - 1));
  const nextB = btn('btn btn--sm', 'Next', () => {
    if (idx < act0.steps.length - 1) show(idx + 1);
    else finish();
  });
  nav.append(back, nextB);
  c.appendChild(nav);

  let idx = 0;
  function show(n) {
    idx = Math.max(0, Math.min(act0.steps.length - 1, n));
    const s = act0.steps[idx];
    stepT.textContent = `${idx + 1}. ${s.title}`;
    stepB.textContent = s.body;
    fill.style.width = Math.round(((idx + 1) / act0.steps.length) * 100) + '%';
    back.disabled = idx === 0;
    nextB.textContent = idx === act0.steps.length - 1 ? 'Finish' : 'Next';
    breathHost.replaceChildren();
    if (s.breathe) breathHost.appendChild(breathe());
  }
  function finish() {
    if (b.answered) return;
    b.answered = true; save();
    nav.replaceChildren(el('p', 'astep__done', 'Activity complete'));
    act('activity:done', act0.id, null);
  }

  show(0);
  if (b.answered) {
    show(act0.steps.length - 1);
    nav.replaceChildren(el('p', 'astep__done', 'Activity complete'));
  }
  return c;
}

function breathe() {
  const wrap = el('div', 'breathe');
  const ring = el('div', 'breathe__ring');
  const word = el('p', 'breathe__word', 'Ready');
  ring.appendChild(word);
  const b = btn('btn btn--ghost btn--sm', 'Start', () => {
    if (running) { stop(); return; }
    running = true; b.textContent = 'Stop'; run(1);
  });
  let timers = []; let running = false;
  const stop = () => {
    running = false; timers.forEach(clearTimeout); timers = [];
    ring.removeAttribute('data-phase'); word.textContent = 'Ready'; b.textContent = 'Start';
  };
  const run = (round) => {
    if (round > 5) { word.textContent = 'Done'; b.textContent = 'Again'; running = false; ring.removeAttribute('data-phase'); return; }
    const phases = [['in', 'Breathe in', 4000], ['out', 'Breathe out', 6000]];
    let t = 0;
    phases.forEach(([phase, label, ms]) => {
      timers.push(setTimeout(() => { if (!running) return; ring.dataset.phase = phase; word.textContent = label; }, t));
      t += ms;
    });
    timers.push(setTimeout(() => { if (running) run(round + 1); }, t));
  };
  wrap.append(ring, b);
  return wrap;
}

/* Step 3 — Reassess */
function reassessWidget(b) {
  const c = el('div', 'wcard');
  c.appendChild(labelRow('Response check', 'i-target'));
  c.appendChild(el('p', 'wcard__title', b.label || 'How are you feeling now?'));
  c.appendChild(el('p', 'wcard__meta', 'Rate the intensity now: 1 = not at all; 10 = completely. Then choose how it changed.'));
  const scoreRow = el('div', 'scale');
  for (let n = 1; n <= 10; n++) {
    const scoreButton = btn('scale__btn', String(n), () => {
      if (b.answered) return;
      b.score = n;
      save();
      [...scoreRow.children].forEach((button, i) => {
        button.setAttribute('aria-pressed', String(i + 1 === n));
        button.classList.toggle('scale__btn--picked', i + 1 === n);
      });
      row.hidden = false;
    });
    scoreButton.setAttribute('aria-label', `After: ${n} out of 10`);
    scoreButton.setAttribute('aria-pressed', String(b.score === n));
    scoreButton.classList.toggle('scale__btn--picked', b.score === n);
    scoreButton.disabled = !!b.answered;
    scoreRow.appendChild(scoreButton);
  }
  c.appendChild(scoreRow);
  const opts = [
    { value: 'much', label: 'Much better' },
    { value: 'little', label: 'A little better' },
    { value: 'same', label: 'About the same' },
    { value: 'worse', label: 'Worse' },
  ];
  const row = el('div', 'quicks');
  row.hidden = !b.score && !b.answered;
  opts.forEach((o) => {
    const x = btn('quick', o.label, () => {
      if (b.answered) return;
      b.answered = o.label; save();
      act('reassess', { value: o.value, score: b.score }, o.label);
    });
    if (b.answered) { x.disabled = true; x.classList.toggle('quick--picked', b.answered === o.label); }
    row.appendChild(x);
  });
  c.appendChild(row);
  return c;
}

/* Response measurement, made visible (§5, §6) */
function measureWidget(before, after) {
  const c = el('div', 'wcard');
  c.appendChild(labelRow('Measured response', 'i-check'));
  const row = el('div', 'measure');
  [['Before', before], ['After', after]].forEach(([k, v]) => {
    const col = el('div', 'measure__col');
    col.appendChild(el('span', 'measure__k', k));
    col.appendChild(el('span', 'measure__v', `${v}/10`));
    const track = el('div', 'measure__track');
    const fill = el('div', 'measure__fill');
    fill.style.width = (v * 10) + '%';
    track.appendChild(fill);
    col.appendChild(track);
    row.appendChild(col);
  });
  c.appendChild(row);
  c.appendChild(el('p', 'wcard__meta', 'This is the response signal Zuporta Connect™ learns from.'));
  return c;
}

/* Intelligent human matching (§8) */
function matchingWidget(b) {
  const c = el('div', 'wcard');
  c.appendChild(labelRow('Finding support', 'i-users'));
  const status = el('p', 'wcard__title', 'Finding support for you…');
  c.appendChild(status);
  const dots = el('div', 'typing');
  dots.append(el('span'), el('span'), el('span'));
  c.appendChild(dots);

  const reveal = async () => {
    if (!b.answered) await sleep(reduceMotion() ? 0 : 1400);
    b.answered = true;
    dots.remove();
    status.textContent = 'Here are professionals who may fit what you are looking for.';
    c.appendChild(el('p', 'wcard__meta', matchRationale(b.topic || 'stress')));
    const pool = prosAreLive()
      ? matchLivePros(livePros, b.topic || 'stress', 3)
      : [];
    if (!pool.length) {
      status.textContent = 'The coach directory could not be loaded. You can browse coaches on zuporta.com.';
    }
    pool.forEach((p) => c.appendChild(proCard(p, true)));
    const more = el('div', 'card__cta');
    more.appendChild(btn('btn btn--ghost btn--sm', 'See all professionals', () => go('professionals')));
    c.appendChild(more);
    scrollThread();
  };
  reveal();
  return c;
}

function labelRow(text, iconId) {
  const l = el('span', 'wcard__label');
  l.append(icon(iconId), document.createTextNode(text));
  return l;
}

function crisisCard() {
  const c = el('div', 'crisis');
  const t = el('p', 'crisis__title');
  t.append(icon('i-shield'), document.createTextNode('Please reach a person now'));
  c.appendChild(t);
  c.appendChild(el('p', null, CRISIS.emergency));
  const p2 = el('p');
  p2.append(
    document.createTextNode(CRISIS.directoryText + ' '),
    Object.assign(el('a'), {
      href: CRISIS.directoryUrl, target: '_blank', rel: 'noopener noreferrer',
      textContent: CRISIS.directoryLabel,
    }),
    document.createTextNode('.'),
  );
  c.appendChild(p2);
  if (CRISIS.lines.length) {
    const p3 = el('p');
    p3.textContent = CRISIS.lines.map((l) => `In ${l.where}, ${l.how}.`).join(' ');
    c.appendChild(p3);
  }
  return c;
}

function scopeCard(kind) {
  const map = {
    medical: ['Outside wellness support', 'A doctor, pharmacist or your local health service is the right place for this.'],
    harm: ['Your safety comes first', 'A domestic abuse or victim support service can help confidentially. If you are in danger, call your local emergency number.'],
    legal: ['Outside wellness support', 'A qualified legal adviser, or a free legal aid service, will serve you better here.'],
    money: ['Outside wellness support', 'Many countries have free, independent debt advice services that can act quickly.'],
  };
  const [title, body] = map[kind] || map.medical;
  const c = el('div', 'scopecard');
  const t = el('p', 'scopecard__title');
  t.append(icon('i-shield'), document.createTextNode(title));
  c.append(t, el('p', null, body));
  return c;
}

/* ---------- conversation driving ---------- */

let busy = false;

/* The real coach roster from api.zuporta.com. Null until it loads;
   the bundled sample list in data.js is only a fallback. */
var livePros = cachedPros();
var liveTried = false;

function ensureLivePros() {
  if (liveTried) return;
  liveTried = true;
  fetchPros().then((pros) => {
    if (!pros || !pros.length) return;
    livePros = pros;
    if (view === 'professionals' || view === 'assistant') render();
  });
}

/** Never substitute invented professionals when the directory is unavailable. */
const currentPros = () => (livePros && livePros.length ? livePros : []);
const prosAreLive = () => !!(livePros && livePros.length);

function pushUser(text) {
  state.chat.messages.push({ role: 'user', text });
  const inner = $('#thread-inner');
  if (inner) {
    if (inner.querySelector('.intro')) inner.replaceChildren();
    inner.appendChild(userMsg(text));
  }
  scrollThread();
}

async function pushBot(blocks) {
  const message = { id: uid(), role: 'bot', blocks };
  const inner = $('#thread-inner');
  if (inner) {
    if (inner.querySelector('.intro')) inner.replaceChildren();
    const thinking = thinkingBubble();
    inner.appendChild(thinking);
    scrollThread();
    await sleep(reduceMotion() ? 0 : 480 + Math.random() * 320);
    thinking.remove();
  }
  state.chat.messages.push(message);
  save();
  if (inner) { inner.appendChild(botMsg(message, true)); scrollThread(); }
}

function thinkingBubble() {
  const m = el('div', 'msg msg--bot');
  const av = el('div', 'msg__avatar');
  av.appendChild(icon('i-mark'));
  const body = el('div', 'msg__body');
  const dots = el('div', 'typing');
  dots.append(el('span'), el('span'), el('span'));
  body.appendChild(dots);
  m.append(av, body);
  return m;
}

async function sendText(text) {
  const clean = String(text).trim();
  if (!clean || busy) return;
  busy = true;
  pushUser(clean);
  inputEl.value = ''; autosize(); sendBtn.disabled = true;
  const blocks = respondToText(clean, state.chat.session);
  await pushBot(blocks);
  recordEvent(blocks);
  busy = false;
}

async function act(action, payload, echo) {
  if (busy) return;
  busy = true;
  if (echo) pushUser(echo);
  if (action === 'checkin') state.chat.session.before = payload;
  const blocks = respondToAction(action, payload, state.chat.session);
  await pushBot(blocks);
  recordEvent(blocks);
  busy = false;
}

/** Persist a completed guided interaction so My Wellness is real, not fake. */
/**
 * Persist one completed interaction as a structured event.
 *
 * This is the whole point of the measurement layer: not "user felt
 * stressed", but context -> state before -> intervention -> state after
 * -> what they had already tried -> what happens over the next month.
 * Follow-ups are scheduled here so the record can actually close.
 */
function recordEvent(blocks) {
  if (!blocks.some((b) => b.t === 'event')) return;
  const s = state.chat.session;
  const activity = (ACTIVITIES[s.activityId] || activityFor(s.topic)).name;
  const id = uid();

  state.events.unshift({
    id,
    at: Date.now(),
    topic: s.topic,
    context: s.context,
    before: s.before,
    after: s.after,
    intervention: activity,
    coping: s.coping,
    outcome: s.outcome,
    helped: !!s.helped,
    followups: [],
  });
  state.events = state.events.slice(0, 100);

  // Keep the simpler responses list in step, so existing views still work.
  state.responses.unshift({
    at: Date.now(), activity, before: s.before, after: s.after, helpful: !!s.helped,
  });
  state.responses = state.responses.slice(0, 50);

  // Schedule the longitudinal check-backs.
  FOLLOWUPS.forEach((f) => {
    state.followups.push({ eventId: id, step: f.id, label: f.label, due: Date.now() + f.ms, done: false });
  });
  save();
}

/* ============================================================
   PROFESSIONALS  (§7)
   ============================================================ */

let proFilter = 'now';

function viewProfessionals() {
  ensureLivePros();
  const wrap = el('div', 'stack');
  const head = section('Talk to a Professional', 'Sometimes you just want to talk to a person.');
  wrap.appendChild(head);

  const filters = el('div', 'segmented');
  [['now', 'Available Now'], ['today', 'Available Today'], ['schedule', 'Schedule']].forEach(([id, label]) => {
    const b = btn('segmented__btn', label, () => { proFilter = id; render(); });
    b.setAttribute('aria-pressed', String(proFilter === id));
    filters.appendChild(b);
  });
  wrap.appendChild(filters);

  const order = { now: 0, today: 1, schedule: 2 };
  const list = currentPros().filter((p) => (proFilter === 'schedule' ? true : p.availability === proFilter))
    .sort((a, b) => order[a.availability] - order[b.availability]);

  const grid = el('div', 'pro-grid');
  list.forEach((p) => grid.appendChild(proCard(p, false)));
  if (!list.length) {
    grid.appendChild(el('p', 'card__body', currentPros().length
      ? 'No coaches match this filter. Choose Schedule to see the directory.'
      : 'The coach directory is unavailable. Reconnect or browse coaches on zuporta.com.'));
  }
  wrap.appendChild(grid);
  wrap.appendChild(accountCard());
  wrap.appendChild(prosAreLive()
    ? demoNote('Coach profiles from zuporta.com. Confirm current availability and prices on the booking site.')
    : demoNote('No sample profiles are substituted when the directory is unavailable.'));
  return wrap;
}

function proCard(pro, compact) {
  const c = el('article', 'pro' + (compact ? ' pro--compact' : ''));
  const head = el('div', 'pro__head');
  const av = el('div', 'pro__avatar', pro.photo ? null : pro.initials);
  if (pro.photo) {
    const img = el('img', 'pro__photo');
    img.src = pro.photo;
    img.alt = '';
    img.loading = 'lazy';
    img.width = 46; img.height = 46;
    img.addEventListener('error', () => { img.remove(); av.textContent = pro.initials; });
    av.appendChild(img);
  }
  const tx = el('div', 'pro__id');
  tx.appendChild(el('p', 'pro__name', pro.name));
  tx.appendChild(el('p', 'pro__title', pro.title));
  head.append(av, tx);
  c.appendChild(head);

  c.appendChild(el('p', 'pro__focus', pro.focus.join(' · ')));
  if (!compact) c.appendChild(el('p', 'pro__bio', pro.bio));

  const meta = el('div', 'pro__meta');
  const badge = el('span', 'badge' + (pro.availability === 'now' ? ' badge--live' : ''));
  if (pro.availability === 'now') badge.appendChild(el('span', 'dot'));
  badge.appendChild(document.createTextNode(pro.slot));
  meta.appendChild(badge);
  meta.appendChild(el('span', 'pro__price',
    [pro.length, pro.price].filter(Boolean).join(' · ')));
  if (pro.rating) meta.appendChild(el('span', 'pro__price', '★ ' + pro.rating));
  c.appendChild(meta);

  // Live coaches carry no session-mode field, and inventing one would be a
  // claim about how they actually work. Only sample profiles declare modes.
  if (Array.isArray(pro.modes) && pro.modes.length) {
    const modes = el('div', 'pro__modes');
    pro.modes.forEach((m) => {
      const tag = el('span', 'mode');
      tag.append(icon(m === 'Video' ? 'i-video' : m === 'Voice' ? 'i-mic' : 'i-message'), document.createTextNode(m));
      modes.appendChild(tag);
    });
    c.appendChild(modes);
  }

  const cta = el('div', 'card__cta');
  if (pro.live) {
    const go = el('a', 'btn btn--sm');
    go.href = COACHES_URL;
    go.target = '_blank';
    go.rel = 'noopener noreferrer';
    go.textContent = pro.availability === 'now' ? 'Connect Now' : 'Book a time';
    cta.appendChild(go);
  }
  c.appendChild(cta);
  return c;
}

/* ============================================================
   MY WELLNESS  (§6)
   ============================================================ */

function viewWellness() {
  const wrap = el('div', 'stack');
  wrap.appendChild(section('Your Wellness Journey'));

  if (state.consent === null) wrap.appendChild(consentCard());
  else if (!consented('personalize')) {
    const c = card('card--accent');
    c.appendChild(el('p', 'card__title', 'Personalization is off'));
    c.appendChild(el('p', 'card__body', 'Zuporta is not using your responses to shape what it offers you. You can turn this on without turning on anything else.'));
    const cta = el('div', 'card__cta');
    cta.appendChild(btn('btn btn--sm', 'Turn on personalization', () => { setConsent('personalize', true); render(); }));
    cta.appendChild(btn('btn btn--ghost btn--sm', 'All permissions', openConsentSheet));
    c.appendChild(cta);
    wrap.appendChild(c);
  }

  const dueHere = dueFollowup();
  if (dueHere) wrap.appendChild(followupCard(dueHere));

  wrap.appendChild(stateVectorCard());
  if (state.events.length) wrap.appendChild(latestEventCard());

  // recent check-ins
  const scores = state.checkIns.length
    ? state.checkIns.slice(0, 8).map((c) => c.score * 2).reverse()
    : [];
  const ci = card();
  ci.appendChild(el('p', 'card__k', 'Recent check-ins'));
  const spark = el('div', 'spark');
  scores.forEach((s) => {
    const col = el('div', 'spark__col');
    const bar = el('div', 'spark__bar');
    bar.style.height = Math.max(8, s * 9) + 'px';
    col.append(bar, el('span', 'spark__n', String(s)));
    spark.appendChild(col);
  });
  ci.appendChild(spark);
  if (!scores.length) ci.appendChild(el('p', 'card__body', 'Your mood check-ins will appear here after you check in on Home.'));
  wrap.appendChild(ci);

  // what has helped
  const h = card();
  h.appendChild(el('p', 'card__k', 'What has helped'));
  const ul = el('ul', 'ticks');
  const helped = state.responses.filter((r) => r.helpful).map((r) => r.activity);
  const uniq = [...new Set(helped)].slice(0, 4);
  uniq.forEach((t) => {
    const li = el('li');
    li.append(icon('i-check'), document.createTextNode(t));
    ul.appendChild(li);
  });
  h.appendChild(ul);
  if (!uniq.length) h.appendChild(el('p', 'card__body', 'Complete a guided activity and rate how it helped to start your history.'));
  wrap.appendChild(h);

  // preferences + response
  const pref = card();
  pref.appendChild(el('p', 'card__k', 'Your Support Preferences'));
  pref.appendChild(el('p', 'card__body', consented('personalize')
    ? 'Home can suggest guided activities you have rated helpful. These suggestions stay on your device.'
    : 'Home suggests a standard guided activity. Turn on personalization to use your helpful activity history.'));
  wrap.appendChild(pref);

  const resp = card();
  resp.appendChild(el('p', 'card__k', 'Recent Response'));
  const real = state.responses.slice(0, 5);
  resp.appendChild(el('p', 'card__body', real.length
    ? `${real.filter((r) => r.helpful).length} of your last ${real.length} guided ${real.length === 1 ? 'interaction' : 'interactions'} ${real.length === 1 ? 'was' : 'were'} rated helpful.`
    : 'No guided activities recorded yet.'));
  wrap.appendChild(resp);

  const cta = el('div', 'stack__cta');
  cta.appendChild(btn('btn', 'Continue My Journey', () => go('assistant')));
  wrap.appendChild(cta);

  wrap.appendChild(demoNote('These are your own check-ins and activity ratings, stored on this device. They are not a clinical assessment.'));
  return wrap;
}

/* ============================================================
   PROGRAMS / SESSIONS / PROFILE / SETTINGS / ZUPORTA+
   ============================================================ */

function viewSessions() {
  const wrap = el('div', 'stack');
  wrap.appendChild(section('Sessions', 'Everything you have done, in one place.'));
  const mine = state.responses.map((r) => ({
    kind: 'guided', title: r.activity, when: relTime(r.at),
    outcome: r.helpful ? 'Helped' : 'No change', before: r.before, after: r.after,
  }));
  const rows = mine;
  if (!rows.length) {
    wrap.appendChild(el('p', 'card__body', 'Your completed guided activities will appear here.'));
    wrap.appendChild(btn('btn', 'Try a guided activity', () => startActivityDirect('reset')));
  }
  rows.forEach((s) => {
    const c = card('card--row');
    const i = el('span', 'rowcard__icon');
    i.appendChild(icon(s.kind === 'pro' ? 'i-users' : 'i-wind'));
    const tx = el('div');
    tx.appendChild(el('p', 'card__title', s.title));
    const meta = [s.when, s.outcome, s.before != null ? `${s.before}/10 → ${s.after}/10` : s.length]
      .filter(Boolean).join(' · ');
    tx.appendChild(el('p', 'card__body', meta));
    c.append(i, tx);
    wrap.appendChild(c);
  });
  wrap.appendChild(demoNote('Only activities recorded on this device appear here.'));
  return wrap;
}

function viewProfile() {
  const wrap = el('div', 'stack');
  wrap.appendChild(section('Profile'));
  const c = card();
  const id = 'name-' + uid();
  const lab = el('label', 'field__label', 'What should Zuporta call you?');
  lab.htmlFor = id;
  const input = el('input', 'field__input');
  input.id = id; input.type = 'text'; input.value = state.profile.name;
  input.placeholder = 'Your first name';
  input.addEventListener('change', () => {
    state.profile.name = input.value.slice(0, 30); save(); toast('Saved.');
  });
  c.append(lab, input);
  wrap.appendChild(c);

  wrap.appendChild(rowCard('i-settings', 'Settings', 'Personalization, data and sharing', () => go('settings')));
  wrap.appendChild(poweredNote());
  return wrap;
}

function viewSettings() {
  const wrap = el('div', 'stack');
  wrap.appendChild(section('Settings'));

  const c = card();
  c.appendChild(el('p', 'card__k', 'Permissions'));
  c.appendChild(el('p', 'card__body',
    'Choose whether your helpful guided activity history is used for suggestions on Home. Your wellness entries stay on this device.'));
  const permRow = el('div', 'card__cta');
  permRow.appendChild(btn('btn btn--sm', 'Manage permissions', openConsentSheet));
  c.appendChild(permRow);
  const summary = el('ul', 'ticks');
  CONSENT_LAYERS.filter((l) => !l.required).forEach((l) => {
    const li = el('li');
    li.append(icon(consented(l.id) ? 'i-check' : 'i-close'),
      document.createTextNode(l.title + ' — ' + (consented(l.id) ? 'on' : 'off')));
    summary.appendChild(li);
  });
  c.appendChild(summary);
  wrap.appendChild(c);

  wrap.appendChild(demoNote('This app does not send your wellness entries to coaches, research projects or model training.'));

  const data = card();
  data.appendChild(el('p', 'card__k', 'My Data'));
  data.appendChild(el('p', 'card__body',
    'Everything you enter here — check-ins, responses and conversations — is stored only on this device. Nothing is sent to a server.'));
  const dcta = el('div', 'card__cta');
  dcta.appendChild(btn('btn btn--ghost btn--sm', 'Delete My Wellness History', () => {
    openSheet('Delete wellness history?', (body) => {
      body.appendChild(el('p', 'sheet__text',
        'This removes your check-ins, guided responses and conversation from this device. It cannot be undone.'));
      const row = el('div', 'card__cta');
      row.appendChild(btn('btn btn--sm btn--danger', 'Delete wellness history', () => {
        const keepName = state.profile.name;
        state = defaults();
        state.profile.name = keepName;
        clearAnalytics();
        save(); closeSheet(); go('home'); toast('Wellness history deleted.');
      }));
      row.appendChild(btn('btn btn--ghost btn--sm', 'Cancel', closeSheet));
      body.appendChild(row);
    });
  }));
  data.appendChild(dcta);
  wrap.appendChild(data);

  const about = card();
  about.appendChild(el('p', 'card__k', 'About'));
  about.appendChild(el('p', 'card__body',
    'Zuporta+ is the personal wellness companion from Zuporta, powered by Zuporta Connect™. Guided responses are generated on your device. Booking and payment for coaching sessions happen on zuporta.com.'));
  const link = el('a', 'link', 'zuporta.com');
  link.href = 'https://zuporta.com'; link.target = '_blank'; link.rel = 'noopener noreferrer';
  const ap = el('p', 'card__body');
  ap.append(document.createTextNode('A Zuporta product · '), link);
  about.appendChild(ap);
  const privacy = el('a', 'link', 'Privacy Policy');
  privacy.href = 'privacy.html';
  const terms = el('a', 'link', 'Terms of Use');
  terms.href = 'terms.html';
  const legal = el('p', 'card__body');
  legal.append(privacy, document.createTextNode(' · '), terms);
  about.appendChild(legal);
  const support = el('p', 'card__body');
  const supportLink = el('a', 'link', 'Contact support');
  supportLink.href = 'https://zuporta.com/#contact';
  supportLink.target = '_blank'; supportLink.rel = 'noopener noreferrer';
  const deletionLink = el('a', 'link', 'Website account deletion instructions');
  deletionLink.href = 'https://zuporta.com/privacy#your-rights';
  deletionLink.target = '_blank'; deletionLink.rel = 'noopener noreferrer';
  support.append(supportLink, document.createTextNode(' · '), deletionLink);
  about.appendChild(support);
  wrap.appendChild(about);
  return wrap;
}

function relTime(ts) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}

/* ============================================================
   Composer
   ============================================================ */

function autosize() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
}
inputEl.addEventListener('input', () => { autosize(); sendBtn.disabled = !inputEl.value.trim(); });
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendText(inputEl.value); }
});
$('#composer').addEventListener('submit', (e) => { e.preventDefault(); sendText(inputEl.value); });

/* ============================================================
   Chrome: drawer, sheet, toasts, theme, install
   ============================================================ */

const navEl = $('#nav');
const scrimEl = $('#scrim');
const sheetEl = $('#sheet');
const sheetBody = $('#sheet-body');
let lastFocus = null;

function openDrawer() {
  navEl.classList.add('is-open'); scrimEl.hidden = false;
  $('#menu-btn').setAttribute('aria-expanded', 'true');
  $('#nav-close').focus();
}
function closeDrawer() {
  if (!navEl.classList.contains('is-open')) return;
  navEl.classList.remove('is-open'); scrimEl.hidden = true;
  $('#menu-btn').setAttribute('aria-expanded', 'false');
}
$('#menu-btn').addEventListener('click', openDrawer);
$('#nav-close').addEventListener('click', closeDrawer);
scrimEl.addEventListener('click', closeDrawer);
$('#talk-btn').addEventListener('click', () => go('professionals'));
$('#talk-btn-top').addEventListener('click', () => go('professionals'));

function openSheet(title, build) {
  lastFocus = document.activeElement;
  $('#sheet-title').textContent = title;
  sheetBody.replaceChildren();
  build(sheetBody);
  sheetEl.hidden = false;
  (sheetBody.querySelector('button, a, input') || $('[data-sheet-close]', sheetEl)).focus();
}
function closeSheet() {
  if (sheetEl.hidden) return;
  sheetEl.hidden = true;
  if (lastFocus) lastFocus.focus();
}
sheetEl.addEventListener('click', (e) => { if (e.target.closest('[data-sheet-close]')) closeSheet(); });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!sheetEl.hidden) closeSheet(); else closeDrawer();
});

function toast(text) {
  const t = el('div', 'toast', text);
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ---------- theme ---------- */

const themeBtn = $('#theme-toggle');
const currentTheme = () => document.documentElement.dataset.theme
  || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

function syncThemeBtn() {
  const dark = currentTheme() === 'dark';
  $('#theme-label').textContent = dark ? 'Light' : 'Dark';
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  themeBtn.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
}
themeBtn.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('zuporta.theme', next); } catch (e) { /* ignore */ }
  syncThemeBtn();
});

/* ---------- install (§ mobile installability) ---------- */

const installBtn = $('#install-btn');
const banner = $('#install-banner');

const isStandalone = () => matchMedia('(display-mode: standalone)').matches
  || matchMedia('(display-mode: window-controls-overlay)').matches
  || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = () => /android/i.test(navigator.userAgent);

/**
 * Which browser this is on iOS.
 * Every iOS browser runs WebKit, but Add to Home Screen is an OS capability
 * Apple exposes reliably only through Safari — so on Chrome, Firefox or Edge
 * the honest advice is "open this in Safari", not "tap Share".
 */
function iosBrowser() {
  const ua = navigator.userAgent;
  if (/CriOS/i.test(ua)) return 'Chrome';
  if (/FxiOS/i.test(ua)) return 'Firefox';
  if (/EdgiOS/i.test(ua)) return 'Edge';
  if (/OPiOS|OPT\//i.test(ua)) return 'Opera';
  if (/\bGSA\b/i.test(ua)) return 'the Google app';
  return 'Safari';
}
const isIOSSafari = () => isIOS() && iosBrowser() === 'Safari';

function refreshInstallUI() {
  if (isStandalone()) {
    installBtn.hidden = true;
    banner.hidden = true;
    return;
  }
  installBtn.hidden = false;
  // Show the banner when we can actually install, or on iOS where the browser
  // never offers a prompt and the only route is Share → Add to Home Screen.
  const canPrompt = !!window.__zupInstall;
  const show = !state.installDismissed && (canPrompt || isIOS() || isAndroid());
  if (isIOS() && !canPrompt) {
    const inSafari = isIOSSafari();
    $('#install-banner-text').textContent = inSafari
      ? 'Add Zuporta+ to your Home Screen'
      : 'Open in Safari to install Zuporta+';
    $('#install-banner-btn').textContent = inSafari ? 'How' : 'Open';
  } else {
    $('#install-banner-text').textContent = 'Install Zuporta+ for offline access';
    $('#install-banner-btn').textContent = 'Install';
  }
  banner.hidden = !show;
}

window.addEventListener('zup:installable', refreshInstallUI);
window.addEventListener('appinstalled', () => {
  window.__zupInstall = null;
  refreshInstallUI();
prefetchModules();
ensureLivePros();
  toast('Zuporta+ is installed. It works offline too.');
});

async function doInstall() {
  const deferred = window.__zupInstall;
  if (deferred) {
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    window.__zupInstall = null;
    if (outcome === 'accepted') { banner.hidden = true; installBtn.hidden = true; }
    return;
  }
  showInstallHelp();
}

function showInstallHelp() {
  closeDrawer();
  openSheet('Install Zuporta+', (body) => {
    const c = el('div', 'card');
    if (isIOS() && !isIOSSafari()) {
      // Apple only exposes Add to Home Screen through Safari, so the useful
      // thing here is getting the person into Safari, not listing steps they
      // cannot follow in the browser they are holding.
      const browser = iosBrowser();
      c.appendChild(el('p', 'card__title', `Installing from ${browser}`));
      c.appendChild(el('p', 'card__body',
        `Zuporta+ runs fine in ${browser}. Adding it to your Home Screen is the one thing Apple keeps to Safari, so that step has to happen there.`));
      c.appendChild(el('p', 'card__body', 'Open this page in Safari, then Share → Add to Home Screen.'));

      const cta = el('div', 'card__cta');
      cta.appendChild(btn('btn btn--sm', 'Open in Safari', () => {
        // iOS-only scheme that hands the current URL to Safari.
        window.location.href = 'x-safari-' + window.location.href;
      }));
      cta.appendChild(btn('btn btn--ghost btn--sm', 'Copy link', async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          toast('Link copied. Paste it into Safari.');
        } catch {
          toast(window.location.host + ' — open this in Safari');
        }
      }));
      c.appendChild(cta);
      c.appendChild(el('p', 'card__meta',
        'If the button does nothing, use Copy link and paste it into Safari yourself.'));
    } else if (isIOS()) {
      c.appendChild(el('p', 'card__title', 'On iPhone and iPad'));
      c.appendChild(el('p', 'card__body', 'Safari never shows an install pop-up — Apple only allows the manual route.'));
      const ol = el('ol', 'steps');
      [
        'Tap the Share button at the bottom of the screen.',
        'Scroll down and tap "Add to Home Screen".',
        'Tap Add. Zuporta+ then opens like an app, full screen and offline.',
      ].forEach((s) => ol.appendChild(el('li', null, s)));
      c.appendChild(ol);
      const hint = el('p', 'card__meta');
      hint.append(icon('i-share-ios'), document.createTextNode('  This is the Share icon to look for.'));
      c.appendChild(hint);
    } else if (isAndroid()) {
      c.appendChild(el('p', 'card__title', 'On Android'));
      const ol = el('ol', 'steps');
      [
        'Open this page in Chrome.',
        'Tap the ⋮ menu, top right.',
        'Tap "Add to Home screen" or "Install app".',
        'Confirm. Zuporta+ then opens in its own window and works offline.',
      ].forEach((s) => ol.appendChild(el('li', null, s)));
      c.appendChild(ol);
      c.appendChild(el('p', 'card__meta',
        'Chrome sometimes waits until you have used the page briefly before offering to install.'));
    } else {
      c.appendChild(el('p', 'card__title', 'On desktop'));
      const ol = el('ol', 'steps');
      [
        'Look for the install icon in the browser address bar.',
        'Or open the browser menu and choose "Install Zuporta+".',
        'It then opens in its own window and works offline.',
      ].forEach((s) => ol.appendChild(el('li', null, s)));
      c.appendChild(ol);
    }
    body.appendChild(c);
  });
}

installBtn.addEventListener('click', doInstall);
$('#install-banner-btn').addEventListener('click', doInstall);
$('#install-banner-x').addEventListener('click', () => {
  state.installDismissed = true; save(); banner.hidden = true;
});


/* ============================================================
   Measurement layer widgets
   ============================================================ */

/** One-tap categorical answer (context, coping). */
function pickWidget(b) {
  const c = el('div', 'wcard');
  c.appendChild(labelRow('Measurement', 'i-target'));
  c.appendChild(el('p', 'wcard__title', b.label));
  const row = el('div', 'quicks');
  b.items.forEach((item) => {
    const x = btn('quick', item.label, () => {
      if (b.answered) return;
      b.answered = item.label;
      save();
      act(b.action, item.id, item.label);
    });
    if (b.answered) { x.disabled = true; x.classList.toggle('quick--picked', b.answered === item.label); }
    row.appendChild(x);
  });
  c.appendChild(row);
  return c;
}

function labelOf(list, id) { return (list.find((x) => x.id === id) || {}).label || '—'; }

/** The structured record, shown to the member rather than hidden from them. */
function eventWidget() {
  const s = state.chat.session;
  const c = el('div', 'wcard');
  c.appendChild(labelRow('Recorded', 'i-check'));
  c.appendChild(el('p', 'wcard__title', 'What we learned from this'));

  const rows = [
    ['Context', labelOf(CONTEXTS, s.context)],
    ['Before', s.before != null ? `${s.before}/10` : '—'],
    ['Tried', s.intervention || (ACTIVITIES[s.activityId] || activityFor(s.topic)).name],
    ['After', s.after != null ? `${s.after}/10` : '—'],
    ['Already tried', labelOf(COPING, s.coping)],
  ];
  const dl = el('dl', 'record');
  rows.forEach(([k, v]) => {
    dl.appendChild(el('dt', null, k));
    dl.appendChild(el('dd', null, v));
  });
  c.appendChild(dl);

  if (s.before != null && s.after != null) c.appendChild(measureWidget(s.before, s.after));

  const note = el('p', 'wcard__meta');
  note.textContent = 'This record stays on your device. It is not shared with researchers or coaches.';
  c.appendChild(note);

  const fu = el('p', 'wcard__meta');
  fu.textContent = 'Follow-up questions will appear when you return after 1 hour, 24 hours, 7 days and 30 days. These are not notifications.';
  c.appendChild(fu);
  return c;
}

/* ---------- consent ---------- */

function consented(layer) {
  return !!(state.consent && state.consent[layer]);
}

function setConsent(layer, value) {
  if (layer !== 'personalize') return;
  if (!state.consent) state.consent = { personalize: false };
  state.consent[layer] = value;
  save();
}

/* ---------- follow-ups (the longitudinal loop) ---------- */

function dueFollowup() {
  const now = Date.now();
  return state.followups.find((f) => !f.done && f.due <= now);
}

function followupCard(f) {
  const ev = state.events.find((e) => e.id === f.eventId);
  const c = card('card--accent');
  c.appendChild(el('p', 'card__k', `Follow-up · ${f.label} later`));
  c.appendChild(el('p', 'card__title',
    ev ? `You tried ${ev.intervention} for ${labelOf(CONTEXTS, ev.context).toLowerCase()}.` : 'How are things now?'));
  c.appendChild(el('p', 'card__body', 'Where is it now, compared with then?'));

  const row = el('div', 'quicks');
  [['better', 'Better'], ['same', 'About the same'], ['worse', 'Worse']].forEach(([id, label]) => {
    row.appendChild(btn('quick', label, () => {
      f.done = true;
      f.answer = id;
      f.answeredAt = Date.now();
      if (ev) ev.followups.push({ step: f.step, answer: id, at: Date.now() });
      save();
      render();
      toast('Thank you — that is the part that makes the data worth anything.');
    }));
  });
  c.appendChild(row);
  return c;
}

/* ---------- Human State Vector ---------- */

function stateVectorCard() {
  const ev = state.events.find((e) => !e.module && e.after != null);
  const c = card();
  c.appendChild(el('p', 'card__k', 'Latest guided check-in'));
  c.appendChild(el('p', 'card__body', ev
    ? `You rated how overwhelmed you felt ${ev.before}/10 before and ${ev.after}/10 after ${ev.intervention}.`
    : 'Complete a guided activity to compare your before and after self-ratings.'));
  c.appendChild(el('p', 'card__meta', 'Self-reported wellness ratings, not a diagnosis.'));
  return c;
}

/** The most recent structured event, with whatever follow-ups have closed. */
function latestEventCard() {
  const ev = state.events[0];
  const c = card();
  c.appendChild(el('p', 'card__k', 'Most recent record'));
  const dl = el('dl', 'record');
  [
    ['Context', labelOf(CONTEXTS, ev.context)],
    ['Before', ev.before != null ? (ev.module ? String(ev.before) : `${ev.before}/10`) : '—'],
    ['Intervention', ev.intervention],
    ['After', ev.after != null ? (ev.module ? String(ev.after) : `${ev.after}/10`) : '—'],
    ['Already tried', labelOf(COPING, ev.coping)],
    ['Outcome', ev.helped == null ? 'Not rated' : ev.helped ? 'Helped' : 'No change'],
  ].forEach(([k, v]) => { dl.appendChild(el('dt', null, k)); dl.appendChild(el('dd', null, v)); });
  c.appendChild(dl);

  c.appendChild(el('p', 'card__k', 'Follow-up'));
  const ul = el('ul', 'ticks');
  FOLLOWUPS.forEach((f) => {
    const hit = ev.followups.find((x) => x.step === f.id);
    const li = el('li');
    li.append(icon(hit ? 'i-check' : 'i-clock'),
      document.createTextNode(`${f.label} — ${hit ? hit.answer : 'pending'}`));
    ul.appendChild(li);
  });
  c.appendChild(ul);
  c.appendChild(el('p', 'card__meta',
    'This record and its follow-up answers stay on your device.'));
  return c;
}


/* ============================================================
   Module system — the shell side
   ============================================================ */

/** Everything a vertical is allowed to use from the shell. */
function moduleCtx() {
  return {
    el, btn, icon, card, section, demoNote, toast, openSheet, closeSheet, go, startActivityDirect,
    state,
    commit() { save(); render(); },
    onPlanSaved: moduleToConnect,
  };
}

/**
 * A vertical feeding the shared measurement layer.
 *
 * The check-in intensity is a state reading and the session is the
 * intervention. Each module names its own follow-up horizon, because a
 * nurse thinks in shifts, a carer in weeks and a shift worker in
 * rotations. No plan or conversation text crosses this boundary.
 */
function moduleToConnect(moduleId, m) {
  const mod = moduleById(moduleId);
  const c = (mod && mod.connect) || {};
  const id = uid();
  state.events.unshift({
    id,
    at: Date.now(),
    module: moduleId,
    topic: c.topic || 'work',
    context: c.context || 'work',
    before: m.intensity,
    after: null,
    intervention: c.intervention || (mod ? mod.name : 'Module check-in'),
    coping: null,
    outcome: null,
    helped: null,
    followups: [],
  });
  state.events = state.events.slice(0, 100);
  state.followups.push({
    eventId: id,
    step: moduleId,
    label: c.followupLabel || 'later this week',
    due: Date.now() + (c.followupMs || 5 * 24 * 60 * 60 * 1000),
    done: false,
  });
  save();
}

var modulesLoaded = false;   // var: hoisted, so bootstrap order cannot trap it

function viewModules() {
  const wrap = el('div', 'stack');
  if (!modulesLoaded) {
    ensureAllModules().then(() => { modulesLoaded = true; if (view === 'modules') render(); });
  }
  wrap.appendChild(section('Modules',
    'Tools for private check-ins and reflection on this device.'));

  // Always present in manifest order; the registry fills in load order.
  const loaded = modules();
  const list = loaded.length === MANIFEST.length
    ? MANIFEST.map((m) => moduleById(m.id) || m)
    : MANIFEST;
  list.forEach((m) => {
    const c = card();
    const head = el('div', 'mod-card__head');
    const ic = el('span', 'rowcard__icon');
    ic.appendChild(icon(m.icon));
    const tx = el('div');
    tx.append(el('p', 'card__title', m.name), el('p', 'card__body', m.tagline));
    head.append(ic, tx);
    c.appendChild(head);

    const cta = el('div', 'card__cta');
    cta.appendChild(btn('btn btn--sm', 'Open', () => go('m/' + m.id)));
    if (m.inScope) cta.appendChild(btn('btn btn--ghost btn--sm', 'About this tool', () => openModuleScope(m)));
    c.appendChild(cta);
    wrap.appendChild(c);
  });

  return wrap;
}

function openModuleScope(m) {
  openSheet(m.name, (body) => {
    const a = el('div', 'card');
    a.appendChild(el('p', 'card__k', 'In scope'));
    const ul = el('ul', 'ticks');
    m.inScope.forEach((t) => { const li = el('li'); li.append(icon('i-check'), document.createTextNode(t)); ul.appendChild(li); });
    a.appendChild(ul);
    a.appendChild(el('p', 'card__k', 'Explicitly out of scope'));
    const ul2 = el('ul', 'ticks ticks--no');
    m.outOfScope.forEach((t) => { const li = el('li'); li.append(icon('i-close'), document.createTextNode(t)); ul2.appendChild(li); });
    a.appendChild(ul2);
    body.appendChild(a);

  });
}

/** Shown for the moment a module's code is in flight. */
function loadingCard(name) {
  const c = card();
  c.appendChild(el('p', 'card__k', 'Opening'));
  c.appendChild(el('p', 'card__title', name));
  const dots = el('div', 'typing');
  dots.append(el('span'), el('span'), el('span'));
  c.appendChild(dots);
  return c;
}

/** Entry point on Home, so verticals are reachable without hunting. */
function moduleHomeCard() {
  const all = MANIFEST;
  if (!all.length) return null;
  const slices = state.modules || {};
  const started = all.filter((x) => slices[x.id] && slices[x.id].repeats > 0);
  const show = started[0] || all[0];
  const mine = slices[show.id];

  const c = card();
  c.appendChild(el('p', 'card__k', 'Private check-ins'));
  c.appendChild(el('p', 'card__title', show.name));
  c.appendChild(el('p', 'card__body', mine && mine.completedAt
    ? 'Your plan is saved. Start another check-in whenever you need one.'
    : show.tagline));
  const cta = el('div', 'card__cta');
  cta.appendChild(btn('btn btn--sm', mine && mine.completedAt ? 'New check-in' : 'Start check-in',
    () => go('m/' + show.id)));
  cta.appendChild(btn('btn btn--ghost btn--sm', 'Browse tools', () => go('modules')));
  c.appendChild(cta);
  return c;
}

/* ---------- go ---------- */

view = (location.hash.replace('#/', '') || 'home');
// Check the manifest, not the registry: module code has not loaded yet.
view = availableView(view);
syncThemeBtn();
render();
autosize();
refreshInstallUI();

// manifest shortcuts
const tool = new URLSearchParams(location.search).get('tool');
if (tool === 'breathe') { startActivityDirect('reset'); history.replaceState(null, '', location.pathname); }
else if (tool === 'match') { go('professionals'); history.replaceState(null, '', location.pathname); }
else if (tool === 'mood') { go('home'); history.replaceState(null, '', location.pathname); }

/* ============================================================
   Real accounts
   ------------------------------------------------------------
   Zuporta already has sign-in and registration on the main
   platform. Building a second account system here would split
   members across two incompatible logins, so this links out to
   the real one instead.
   ============================================================ */

function accountCard() {
  const c = card('card--accent');
  c.appendChild(el('p', 'card__k', 'Your Zuporta account'));
  c.appendChild(el('p', 'card__body',
    'Booking a session uses your Zuporta account on the main site. Your check-ins and plans in this app stay private on this device either way.'));
  const cta = el('div', 'card__cta');
  const link = (href, label, cls) => {
    const a = el('a', cls);
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = label;
    return a;
  };
  cta.appendChild(link(COACHES_URL, 'Browse coaches', 'btn btn--sm'));
  cta.appendChild(link(SIGN_IN_URL, 'Sign in', 'btn btn--ghost btn--sm'));
  cta.appendChild(link(SIGN_UP_URL, 'Create an account', 'btn btn--ghost btn--sm'));
  c.appendChild(cta);
  return c;
}
