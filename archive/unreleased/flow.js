/* ============================================================
   Vertical flow engine.

   Every Zuporta vertical runs the same spine:

     landing -> scope/privacy consent -> check-in (what + how heavy)
     -> coach match -> bounded session -> plan (action + fallback)
     -> private completion

   That spine is here once. A vertical supplies vocabulary, copy,
   coaches, options and its analytics contract, and gets the flow.
   Adding the next module is a spec file, not a rewrite.
   ============================================================ */

import { registerModule, track } from './modules.js';

const BLANK = () => ({
  stage: 'landing',
  consent: { scope: false, privacy: false },
  pressure: null,
  intensity: null,
  coachId: null,
  own: null,
  plan: { action: '', fallback: '', tell: '' },
  completedAt: null,
  repeats: 0,
});

export function defineModule(spec) {
  const labelOfOpt = (list, id) => (list.find((x) => x.id === id) || {}).label || '';
  const coachFor = (pressure) =>
    spec.coaches.find((c) => c.for.includes(pressure)) || spec.coaches[0];

  function slice(ctx) {
    if (!ctx.state.modules) ctx.state.modules = {};
    if (!ctx.state.modules[spec.id]) ctx.state.modules[spec.id] = BLANK();
    return ctx.state.modules[spec.id];
  }

  function render(ctx) {
    const { el } = ctx;
    const m = slice(ctx);
    const wrap = el('div', 'stack');
    wrap.appendChild(header(ctx, m));
    const stage = {
      landing, consent, checkin, match, session, plan, done,
    }[m.stage] || landing;
    wrap.appendChild(stage(ctx, m));
    wrap.appendChild(safetyRoute(ctx));
    wrap.appendChild(ctx.demoNote(spec.demoNote
      || 'Prototype. Coaches shown are illustrative, nothing is sent to an employer, and everything stays on this device.'));
    return wrap;
  }

  /* ---------- header + stepper ---------- */

  function header(ctx, m) {
    const { el } = ctx;
    const head = el('header', 'mod-head');
    head.appendChild(el('p', 'mod-head__kicker', spec.name));
    head.appendChild(el('h2', 'mod-head__title', spec.headline));
    const order = ['consent', 'checkin', 'match', 'session', 'plan', 'done'];
    const at = order.indexOf(m.stage);
    if (m.stage !== 'landing') {
      const bar = el('ol', 'stepper');
      ['Consent', 'Check-in', 'Match', 'Session', 'Plan'].forEach((s, i) => {
        const li = el('li', 'stepper__i', s);
        if (at > i) li.classList.add('stepper__i--done');
        if (at === i) li.classList.add('stepper__i--now');
        bar.appendChild(li);
      });
      head.appendChild(bar);
    }
    return head;
  }

  /* ---------- 1. landing ---------- */

  function landing(ctx, m) {
    const { el, btn, card } = ctx;
    const wrap = el('div', 'stack');

    const c = card();
    c.appendChild(el('p', 'card__body', spec.intro));
    wrap.appendChild(c);

    const s = card();
    s.appendChild(el('p', 'card__k', 'What this is'));
    s.appendChild(tickList(ctx, spec.inScope, 'i-check'));
    s.appendChild(el('p', 'card__k', 'What this is not'));
    s.appendChild(tickList(ctx, spec.outOfScope, 'i-close', 'ticks--no'));
    wrap.appendChild(s);

    const cta = el('div', 'stack__cta');
    cta.appendChild(btn('btn', m.repeats ? 'Start another check-in' : spec.startLabel || 'Start my check-in', () => {
      track(spec.id, 'checkin_started', { repeat: m.repeats > 0, repeats: m.repeats });
      if (m.repeats > 0) track(spec.id, 'checkin_repeated', { repeats: m.repeats });
      m.stage = 'consent';
      ctx.commit();
    }));
    wrap.appendChild(cta);
    return wrap;
  }

  function tickList(ctx, items, iconId, extra) {
    const ul = ctx.el('ul', 'ticks' + (extra ? ' ' + extra : ''));
    items.forEach((t) => {
      const li = ctx.el('li');
      li.append(ctx.icon(iconId), document.createTextNode(t));
      ul.appendChild(li);
    });
    return ul;
  }

  /* ---------- 2. consent ---------- */

  function consent(ctx, m) {
    const { el, btn, card } = ctx;
    const wrap = el('div', 'stack');
    wrap.appendChild(ctx.section('Before we start',
      'Two things to agree to. Both are specific, and neither is buried.'));

    const block = (key, def) => {
      const c = card(m.consent[key] ? 'card--accent' : '');
      c.appendChild(el('p', 'card__title', def.title));
      c.appendChild(el('p', 'card__body', def.body));
      c.appendChild(tickList(ctx, def.bullets, 'i-check'));
      const cta = el('div', 'card__cta');
      const b = btn(m.consent[key] ? 'btn btn--sm' : 'btn btn--ghost btn--sm',
        m.consent[key] ? 'Agreed' : 'I agree', () => {
          m.consent[key] = !m.consent[key];
          ctx.commit();
        });
      b.setAttribute('aria-pressed', String(m.consent[key]));
      cta.appendChild(b);
      c.appendChild(cta);
      return c;
    };

    wrap.appendChild(block('scope', spec.consent.scope));
    wrap.appendChild(block('privacy', spec.consent.privacy));

    const ready = m.consent.scope && m.consent.privacy;
    const cta = el('div', 'stack__cta');
    const next = btn('btn', 'Continue', () => {
      track(spec.id, 'consent_completed', { scope: true, privacy: true });
      m.stage = 'checkin';
      ctx.commit();
    });
    next.disabled = !ready;
    cta.appendChild(next);
    wrap.appendChild(cta);
    if (!ready) wrap.appendChild(el('p', 'card__meta', 'Both are required to continue.'));
    return wrap;
  }

  /* ---------- 3. check-in ---------- */

  function checkin(ctx, m) {
    const { el, btn, card } = ctx;
    const wrap = el('div', 'stack');
    wrap.appendChild(ctx.section(spec.checkin.title, spec.checkin.help));

    const list = el('div', 'quicks quicks--stack');
    spec.pressures.forEach((pr) => {
      const b = btn('quick', pr.label, () => {
        m.pressure = pr.id;
        track(spec.id, 'pressure_selected', { pressure: pr.id });
        ctx.commit();
      });
      if (m.pressure === pr.id) b.classList.add('quick--picked');
      list.appendChild(b);
    });
    wrap.appendChild(list);

    if (m.pressure) {
      const c = card();
      c.appendChild(el('p', 'card__title', spec.checkin.scaleTitle));
      const row = el('div', 'scale');
      for (let n = 1; n <= 10; n++) {
        const b = btn('scale__btn', String(n), () => { m.intensity = n; ctx.commit(); });
        b.setAttribute('aria-label', `${n} out of 10`);
        if (m.intensity === n) b.classList.add('scale__btn--picked');
        row.appendChild(b);
      }
      c.appendChild(row);
      const ends = el('div', 'scale__ends');
      ends.append(el('span', null, spec.checkin.scaleLow), el('span', null, spec.checkin.scaleHigh));
      c.appendChild(ends);
      wrap.appendChild(c);
    }

    if (m.pressure && m.intensity) {
      const cta = el('div', 'stack__cta');
      cta.appendChild(btn('btn', 'Find my coach', () => {
        m.coachId = coachFor(m.pressure).id;
        m.stage = 'match';
        ctx.commit();
      }));
      wrap.appendChild(cta);
    }
    return wrap;
  }

  /* ---------- 4. coach match ---------- */

  function match(ctx, m) {
    const { el, btn, card } = ctx;
    const coach = spec.coaches.find((c) => c.id === m.coachId) || spec.coaches[0];
    const wrap = el('div', 'stack');
    wrap.appendChild(ctx.section('Your coach for this check-in'));

    const c = card();
    const head = el('div', 'pro__head');
    head.append(el('div', 'pro__avatar', coach.initials));
    const id = el('div', 'pro__id');
    id.append(el('p', 'pro__name', coach.name), el('p', 'pro__title', coach.title));
    head.appendChild(id);
    c.appendChild(head);
    c.appendChild(el('p', 'pro__focus', coach.cred));
    c.appendChild(el('p', 'card__body', `Works with people on ${coach.focus.join(', ').toLowerCase()}.`));
    c.appendChild(el('p', 'card__meta',
      `Matched because you chose "${labelOfOpt(spec.pressures, m.pressure).toLowerCase()}".`));
    wrap.appendChild(c);

    const cta = el('div', 'stack__cta');
    cta.appendChild(btn('btn', 'Start the session', () => {
      track(spec.id, 'match_completed', { coach: coach.id, pressure: m.pressure });
      m.stage = 'session';
      ctx.commit();
    }));
    wrap.appendChild(cta);
    return wrap;
  }

  /* ---------- 5. bounded session ---------- */

  function session(ctx, m) {
    const { el, btn, card } = ctx;
    const coach = spec.coaches.find((c) => c.id === m.coachId) || spec.coaches[0];
    const wrap = el('div', 'stack');

    const intro = card();
    intro.appendChild(el('p', 'card__k', `${coach.name} · structured session`));
    intro.appendChild(el('p', 'card__body', spec.session.intro));
    wrap.appendChild(intro);

    const q = card();
    q.appendChild(el('p', 'card__title', spec.session.title));
    q.appendChild(el('p', 'card__body', spec.session.help));
    const list = el('div', 'quicks quicks--stack');
    spec.session.options.forEach((o) => {
      const b = btn('quick', o.label, () => {
        m.own = o.id;
        track(spec.id, 'session_engaged', { ownership: o.id, mine: !!o.mine });
        ctx.commit();
      });
      if (m.own === o.id) b.classList.add('quick--picked');
      list.appendChild(b);
    });
    q.appendChild(list);
    wrap.appendChild(q);

    if (m.own) {
      const chosen = spec.session.options.find((o) => o.id === m.own);
      const r = card('card--accent');
      r.appendChild(el('p', 'card__body',
        chosen.mine ? spec.session.reflectMine : spec.session.reflectNotMine));
      wrap.appendChild(r);
      const cta = el('div', 'stack__cta');
      cta.appendChild(btn('btn', spec.plan.buildLabel || 'Build my plan', () => {
        m.stage = 'plan';
        ctx.commit();
      }));
      wrap.appendChild(cta);
    }
    return wrap;
  }

  /* ---------- 6. the plan ---------- */

  function plan(ctx, m) {
    const { el, btn, card } = ctx;
    const wrap = el('div', 'stack');
    wrap.appendChild(ctx.section(spec.plan.title, spec.plan.help));

    const opts = spec.plan.actions[m.pressure] || Object.values(spec.plan.actions)[0];

    const a = card();
    a.appendChild(el('p', 'card__k', spec.plan.actionLabel));
    const list = el('div', 'quicks quicks--stack');
    opts.forEach((text) => {
      const b = btn('quick', text, () => { m.plan.action = text; ctx.commit(); });
      if (m.plan.action === text) b.classList.add('quick--picked');
      list.appendChild(b);
    });
    a.appendChild(list);
    a.appendChild(freeField(ctx, 'Or write your own', m.plan.action, opts, (v) => { m.plan.action = v; }));
    wrap.appendChild(a);

    const f = card();
    f.appendChild(el('p', 'card__k', spec.plan.fallbackLabel));
    const flist = el('div', 'quicks quicks--stack');
    spec.plan.fallbacks.forEach((text) => {
      const b = btn('quick', text, () => { m.plan.fallback = text; ctx.commit(); });
      if (m.plan.fallback === text) b.classList.add('quick--picked');
      flist.appendChild(b);
    });
    f.appendChild(flist);
    wrap.appendChild(f);

    const t = card();
    t.appendChild(el('p', 'card__k', spec.plan.tellLabel));
    t.appendChild(freeField(ctx, spec.plan.tellPlaceholder, m.plan.tell, [], (v) => { m.plan.tell = v; }));
    wrap.appendChild(t);

    const ready = !!(m.plan.action && m.plan.fallback);
    const cta = el('div', 'stack__cta');
    const save = btn('btn', 'Save my plan', () => {
      m.completedAt = Date.now();
      m.repeats += 1;
      m.stage = 'done';
      // What kind of plan it was. Never the plan text.
      track(spec.id, 'plan_saved', {
        pressure: m.pressure,
        intensity: m.intensity,
        ownership: m.own,
        custom_action: !opts.includes(m.plan.action),
        has_person: !!m.plan.tell,
      });
      ctx.onPlanSaved(spec.id, m);
      ctx.commit();
    });
    save.disabled = !ready;
    cta.appendChild(save);
    wrap.appendChild(cta);
    if (!ready) wrap.appendChild(el('p', 'card__meta', 'Pick an action and a fallback to save.'));
    return wrap;
  }

  /** A plain text field whose value never reaches analytics. */
  function freeField(ctx, label, value, presets, onChange) {
    const { el } = ctx;
    const wrap = el('div');
    const id = 'f-' + Math.random().toString(36).slice(2, 8);
    const lab = el('label', 'field__label', label);
    lab.htmlFor = id;
    const input = el('input', 'field__input');
    input.id = id;
    input.type = 'text';
    input.value = presets.includes(value) ? '' : (value || '');
    input.addEventListener('change', () => { onChange(input.value.trim()); ctx.commit(); });
    wrap.append(lab, input);
    return wrap;
  }

  /* ---------- 7. completion ---------- */

  function done(ctx, m) {
    const { el, btn, card } = ctx;
    const wrap = el('div', 'stack');

    const c = card('card--accent');
    c.appendChild(el('p', 'card__k', 'Saved — private to you'));
    c.appendChild(el('p', 'card__title', spec.plan.doneTitle || 'Your plan'));
    const dl = el('dl', 'record');
    [['Action', m.plan.action], ['If not', m.plan.fallback]]
      .concat(m.plan.tell ? [['Tell', m.plan.tell]] : [])
      .forEach(([k, v]) => { dl.appendChild(el('dt', null, k)); dl.appendChild(el('dd', null, v)); });
    c.appendChild(dl);
    wrap.appendChild(c);

    const cta = el('div', 'card__cta');
    cta.appendChild(btn('btn btn--sm', 'Download', () => download(ctx, m)));
    cta.appendChild(btn('btn btn--ghost btn--sm', 'Copy', async () => {
      try { await navigator.clipboard.writeText(planText(m)); ctx.toast('Plan copied.'); }
      catch (e) { ctx.toast('Copy is unavailable in this browser.'); }
    }));
    cta.appendChild(btn('btn btn--ghost btn--sm', 'New check-in', () => {
      const repeats = m.repeats;
      Object.assign(m, BLANK(), { repeats });
      ctx.commit();
    }));
    wrap.appendChild(cta);
    wrap.appendChild(ctx.demoNote(spec.done.note));
    return wrap;
  }

  function planText(m) {
    return [
      `${spec.name} — ${spec.plan.doneTitle || 'plan'}`,
      '',
      'Action:   ' + m.plan.action,
      'If not:   ' + m.plan.fallback,
      m.plan.tell ? 'Tell:     ' + m.plan.tell : '',
      '',
      'Private to you. Non-clinical coaching, not medical advice.',
    ].filter(Boolean).join('\n');
  }

  function download(ctx, m) {
    try {
      const blob = new Blob([planText(m)], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = spec.id + '-plan.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      track(spec.id, 'plan_downloaded', { pressure: m.pressure });
      ctx.toast('Plan downloaded.');
    } catch (e) {
      ctx.toast('Download is blocked here — use Copy instead.');
    }
  }

  /* ---------- safety routing: points out, never handles ---------- */

  function safetyRoute(ctx) {
    const { el, btn } = ctx;
    const row = el('div', 'safety-route');
    row.appendChild(btn('linkish', spec.safety.link, () => {
      track(spec.id, 'safety_route_opened', {});
      ctx.openSheet('Getting the right support', (body) => {
        const c = el('div', 'card');
        c.appendChild(el('p', 'card__title', spec.safety.title));
        c.appendChild(el('p', 'card__body', spec.safety.body));
        const ul = el('ul', 'ticks');
        spec.safety.bullets.forEach((t) => {
          const li = el('li');
          li.append(ctx.icon('i-shield'), document.createTextNode(t));
          ul.appendChild(li);
        });
        c.appendChild(ul);
        c.appendChild(el('p', 'card__meta', spec.safety.footer));
        body.appendChild(c);
      });
    }));
    return row;
  }

  /* ---------- registration ---------- */

  return registerModule({
    id: spec.id,
    name: spec.name,
    tagline: spec.tagline,
    icon: spec.icon,
    audience: spec.audience,
    buyer: spec.buyer,
    outcome: spec.outcome,
    inScope: spec.inScope,
    outOfScope: spec.outOfScope,
    pilotGaps: spec.pilotGaps,
    connect: spec.connect,

    events: [
      'checkin_started', 'consent_completed', 'pressure_selected', 'match_completed',
      'session_engaged', 'plan_saved', 'plan_downloaded', 'safety_route_opened', 'checkin_repeated',
    ],

    // The only string values any event may carry. Conversation text and the
    // plan itself have no enum to travel in, so they cannot be emitted.
    enums: {
      pressure: spec.pressures.map((p) => p.id),
      ownership: spec.session.options.map((o) => o.id),
      coach: spec.coaches.map((c) => c.id),
    },

    render,
  });
}
