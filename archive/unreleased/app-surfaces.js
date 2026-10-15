// Archived unfinished surfaces; require the app shell and are not standalone.

function viewPrograms() {
  const wrap = el('div', 'stack');
  wrap.appendChild(section('Programs', 'Multi-day guided experiences that build a habit rather than a one-off fix.'));
  PROGRAMS.forEach((p) => {
    const c = card();
    c.appendChild(el('p', 'card__title', p.name));
    c.appendChild(el('p', 'card__body', p.blurb));
    const enrolled = state.program === p.id || (p.day > 0 && !state.program);
    if (enrolled) {
      c.appendChild(el('p', 'card__k', `Day ${p.day || 1} of ${p.days}`));
      c.appendChild(progressBar((p.day || 1) / p.days));
    } else {
      c.appendChild(el('p', 'card__k', `${p.days} days`));
    }
    const cta = el('div', 'card__cta');
    cta.appendChild(btn('btn btn--sm', enrolled ? 'Continue' : 'Start program', () => {
      state.program = p.id; save(); render();
      toast(enrolled ? 'Daily program content is not available yet.' : `Started ${p.name}.`);
    }));
    c.appendChild(cta);
    wrap.appendChild(c);
  });
  return wrap;
}


function viewPlus() {
  const wrap = el('div', 'stack');
  const head = section('Zuporta+', 'Your personal wellness companion.');
  wrap.appendChild(head);
  PLUS_FEATURES.forEach((f) => {
    const c = card('card--row');
    const i = el('span', 'rowcard__icon');
    i.appendChild(icon(f.icon));
    const tx = el('div');
    tx.appendChild(el('p', 'card__title', f.title));
    tx.appendChild(el('p', 'card__body', f.body));
    c.append(i, tx);
    wrap.appendChild(c);
  });
  const cta = el('div', 'stack__cta');
  cta.appendChild(btn('btn', 'Start Zuporta+', () => toast('Membership plans are not available for purchase in this app.')));
  wrap.appendChild(cta);
  wrap.appendChild(poweredNote());
  return wrap;
}


/**
 * Shows exactly what instrumentation would send. The contract says no
 * event may contain conversation text or the plan, so the panel exists
 * to make that checkable rather than claimed.
 */
function analyticsPanel() {
  const c = card();
  c.appendChild(el('p', 'card__k', 'Pilot instrumentation'));
  c.appendChild(el('p', 'card__body',
    'Events are rejected unless the module declared them, and property values must be numbers, booleans, or a declared category. Free text has no shape to travel in, so transcripts and plans cannot be emitted even by mistake.'));

  const log = analyticsLog();
  if (!log.length) {
    c.appendChild(el('p', 'card__meta',
      `No events captured yet. ${declaredEvents().length} declared so far, across ${MANIFEST.length} module(s).`));
    return c;
  }

  const t = el('div', 'evlog');
  log.slice(0, 12).forEach((row) => {
    const line = el('div', 'evlog__row');
    line.appendChild(el('span', 'evlog__name', row.event));
    const props = Object.entries(row.props).map(([k, v]) => `${k}=${v}`).join(' ');
    line.appendChild(el('span', 'evlog__props', props || '—'));
    if (row.rejected) line.appendChild(el('span', 'evlog__rej', 'stripped: ' + row.rejected.join(', ')));
    t.appendChild(line);
  });
  c.appendChild(t);

  const cta = el('div', 'card__cta');
  cta.appendChild(btn('btn btn--ghost btn--sm', 'Clear log', () => { clearAnalytics(); render(); }));
  c.appendChild(cta);
  return c;
}
