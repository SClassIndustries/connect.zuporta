/* ============================================================
   Zuporta module system
   ------------------------------------------------------------
   Zuporta+ is the shell. Verticals ("modular MVPs") register here
   and the shell routes to them at #/m/<id>. A vertical owns its
   own flow, copy, consent and analytics contract, but reuses the
   shell's chrome, measurement layer and safety routing.

   Every vertical registers against the contract below.
   ============================================================ */

const REGISTRY = new Map();

/**
 * @typedef {Object} ZuportaModule
 * @property {string} id            route id, used in #/m/<id>
 * @property {string} name
 * @property {string} tagline
 * @property {string} icon          sprite symbol id
 * @property {string} audience      who the member is
 * @property {string} buyer         who pays
 * @property {string} outcome       the one thing a session must deliver
 * @property {string[]} inScope
 * @property {string[]} outOfScope  stated plainly, in the product
 * @property {string[]} events      the only analytics events it may emit
 * @property {Object} enums         allowed categorical values per property
 * @property {string[]} pilotGaps   what a real pilot still needs
 * @property {Function} render      (ctx) => HTMLElement
 */

export function registerModule(mod) {
  REGISTRY.set(mod.id, mod);
  return mod;
}

export const modules = () => [...REGISTRY.values()];
export const moduleById = (id) => REGISTRY.get(id);

/* ============================================================
   Analytics
   ------------------------------------------------------------
   The module brief requires: "No event should contain
   conversation text or the plan itself."

   That is enforced here rather than left to discipline. An event
   is rejected unless its name is declared by the module, and every
   property value must be a number, a boolean, or a string the
   module declared as an allowed enum value. Free text cannot get
   through, because there is no shape for it to travel in.
   ============================================================ */

const LOG_KEY = 'zuporta.analytics';
const MAX_LOG = 200;

function readLog() {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }
  catch (e) { return []; }
}

function writeLog(rows) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(rows.slice(0, MAX_LOG))); }
  catch (e) { /* storage unavailable: analytics are best effort */ }
}

/**
 * Record one analytics event. Returns what was actually accepted,
 * so a caller (or a reviewer) can see what was stripped.
 */
export function track(moduleId, event, props = {}) {
  const mod = moduleById(moduleId);
  if (!mod || !mod.events.includes(event)) {
    return { ok: false, reason: 'event not declared by module', event };
  }

  const accepted = {};
  const rejected = [];
  for (const [key, value] of Object.entries(props)) {
    const allowed = mod.enums && mod.enums[key];
    const isNumber = typeof value === 'number' && Number.isFinite(value);
    const isBool = typeof value === 'boolean';
    const isAllowedString = typeof value === 'string' && Array.isArray(allowed) && allowed.includes(value);

    if (isNumber || isBool || isAllowedString) accepted[key] = value;
    else rejected.push(key);
  }

  const row = { at: Date.now(), module: moduleId, event, props: accepted };
  if (rejected.length) row.rejected = rejected;

  const rows = readLog();
  rows.unshift(row);
  writeLog(rows);
  return { ok: true, ...row };
}

export const analyticsLog = () => readLog();

export function clearAnalytics() {
  writeLog([]);
}

/** Every event the shell knows about, for the transparency panel. */
export function declaredEvents() {
  return modules().flatMap((m) => m.events.map((e) => ({ module: m.id, event: e })));
}

/* ============================================================
   Lazy loading
   ------------------------------------------------------------
   Every vertical imported eagerly cost first paint, and the cost
   grew with each one. The shell now ships with metadata only and
   pulls a module's code when it is actually opened, with an idle
   prefetch so the directory feels instant anyway.
   ============================================================ */

/** Metadata the shell can show without loading a module's code. */
export const MANIFEST = [
  { id: 'caregiver',    name: 'Caregiver Load',         icon: 'i-heart',
    tagline: 'Weekly check-ins for people caring for an adult family member',
    load: () => import('./caregiver.js') },
  { id: 'career',       name: 'Career Decision Sprint', icon: 'i-target',
    tagline: 'A time-boxed sprint for one career decision you keep deferring',
    load: () => import('./career.js') },
  { id: 'nightshift',   name: 'Night-Shift Reset',      icon: 'i-moon',
    tagline: 'Recovery check-ins for night and rotating shift workers',
    load: () => import('./nightshift.js') },
  { id: 'parentbridge', name: 'Parent Bridge',          icon: 'i-users',
    tagline: 'Check-ins for working parents, built around the work-to-home seam',
    load: () => import('./parentbridge.js') },
  { id: 'nurseguide',   name: 'Nurse Guidance',         icon: 'i-clipboard',
    tagline: 'Understand your instructions and prepare questions, with a matched nurse',
    load: () => import('./nurseguide.js') },
  { id: 'baseline',     name: 'Personal Baseline',      icon: 'i-activity',
    tagline: 'Short repeated check-ins that show change against your own history',
    load: () => import('./baseline.js') },
  { id: 'navigator',    name: 'Support Navigation',     icon: 'i-compass',
    tagline: 'A verified directory, eligibility help, and referral follow-through',
    load: () => import('./navigator.js') },
];

export const manifestById = (id) => MANIFEST.find((m) => m.id === id);

const loading = new Map();

/** Load one module's code if it is not already registered. */
export function ensureModule(id) {
  if (REGISTRY.has(id)) return Promise.resolve(REGISTRY.get(id));
  const entry = manifestById(id);
  if (!entry) return Promise.resolve(null);
  if (!loading.has(id)) loading.set(id, entry.load().then(() => REGISTRY.get(id)));
  return loading.get(id);
}

/** Load everything — used by the directory and the instrumentation panel. */
export function ensureAllModules() {
  return Promise.all(MANIFEST.map((m) => ensureModule(m.id))).then(() => modules());
}

/** Warm the cache once the app is idle, so opening a module feels instant. */
export function prefetchModules() {
  const go = () => MANIFEST.forEach((m) => ensureModule(m.id));
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 4000 });
  else setTimeout(go, 1500);
}
