/* ============================================================
   Live connection to the real Zuporta platform.

   Zuporta already runs a backend at api.zuporta.com with real,
   verified coaches — names, photos, specialities, prices and
   live availability. This file pulls them in so the app stops
   showing invented people.

   The endpoint is public and CORS-open, so this works from any
   origin with no key and no backend of our own:

     GET https://api.zuporta.com/nurse?page=1

   Accounts live on the real platform too (zuporta.com/login and
   /register). We deliberately do NOT build a second sign-in here —
   see SIGN_IN_URL below.
   ============================================================ */

const API = 'https://api.zuporta.com';
const CACHE_KEY = 'zuporta.coaches.cache';
const CACHE_TTL = 6 * 60 * 60 * 1000;   // six hours

export const SIGN_IN_URL = 'https://zuporta.com/login';
export const SIGN_UP_URL = 'https://zuporta.com/register';
export const COACHES_URL = 'https://zuporta.com/coaches';

/** The platform uses ULIDs; older or incomplete cached cards use the directory. */
export function coachProfileUrl(id) {
  return typeof id === 'string' && /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(id)
    ? `${COACHES_URL}/${encodeURIComponent(id)}`
    : COACHES_URL;
}

/* ---------- mapping the platform's shape to this app's ---------- */

const initialsOf = (name) => (name || '')
  .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

/** Map a coach's own words onto the topics this app routes by. */
const TOPIC_RULES = [
  ['stress',        /stress|overwhelm|burnout|anxiet|calm|resilien/i],
  ['work',          /work|career|leader|executive|professional|business/i],
  ['relationships', /relationship|couple|family|communicat|connection/i],
  ['parenting',     /parent|child|mother|father|famil/i],
  ['sleep',         /sleep|rest|fatigue|energy/i],
  ['confidence',    /confiden|self[- ]esteem|imposter|belief|worth/i],
  ['habits',        /habit|nutrition|fitness|lifestyle|behavior|behaviour|health/i],
  ['growth',        /purpose|clarity|growth|mindset|goal|direction|meaning/i],
];

function topicsFor(coach) {
  const hay = [coach.category, ...(coach.specialities || []), coach.bio, coach.support_description]
    .filter(Boolean).join(' ');
  const hits = TOPIC_RULES.filter(([, re]) => re.test(hay)).map(([id]) => id);
  return hits.length ? hits : ['talk'];
}

const money = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? '$' + (n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)) : null;
};

/**
 * Normalise one API coach into the shape the app's cards expect.
 * Nothing is invented: a field the platform does not provide is left out
 * rather than filled with a plausible-looking value.
 */
export function toPro(c) {
  const available = c.is_busy !== true && (c.online === true || c.availability_status === 'available');
  return {
    id: c.id,
    name: c.name,
    initials: initialsOf(c.name),
    photo: c.avatar_url || null,
    title: 'Coach',
    cred: c.category ? String(c.category).replace(/_/g, ' ') : '',
    focus: (c.specialities || []).slice(0, 4),
    topics: topicsFor(c),
    availability: available ? 'now' : 'today',
    slot: available ? 'Available now' : 'Currently busy',
    length: '15 min',
    price: money(c.price_15_min) || '',
    price30: money(c.price_30_min),
    bio: c.bio || c.support_description || '',
    rating: Number(c.average_rating) > 0 ? Number(c.average_rating).toFixed(1) : null,
    reviews: Array.isArray(c.reviews) ? c.reviews.length : 0,
    live: true,
  };
}

/* ---------- fetching ---------- */

function readCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (raw && Array.isArray(raw.pros) && raw.pros.length) return raw;
  } catch (e) { /* unreadable cache */ }
  return null;
}

function writeCache(pros) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), pros })); }
  catch (e) { /* storage unavailable */ }
}

/** Coaches from the last successful fetch, however old. */
export const cachedPros = () => (readCache() || {}).pros || null;

/**
 * Fetch the real coach roster.
 *
 * Returns cached data immediately when it is fresh. On any network or
 * server failure it falls back to the last good cache, and only then to
 * null — so the caller can decide whether to show bundled sample data.
 */
export async function fetchPros({ pages = 2, force = false } = {}) {
  const cache = readCache();
  if (!force && cache && Date.now() - cache.at < CACHE_TTL) return cache.pros;

  try {
    const out = [];
    for (let page = 1; page <= pages; page++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      let json;
      try {
        const res = await fetch(`${API}/nurse?page=${page}`, { headers: { Accept: 'application/json' }, signal: controller.signal });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        json = await res.json();
      } finally { clearTimeout(timeout); }
      const items = (json && json.data && json.data.items) || [];
      out.push(...items.filter((c) => c && c.is_active !== false && !c.is_restricted).map(toPro));
      if (!json.data.has_more_pages) break;
    }
    if (!out.length) throw new Error('empty roster');
    // The API's paging is not stable between requests, so the same coach can
    // come back on two pages. Deduplicate by id before anything is shown.
    const seen = new Set();
    const unique = out.filter((p) => !seen.has(p.id) && seen.add(p.id));
    // Available coaches first — that is the whole point of real-time support.
    unique.sort((a, b) => (a.availability === 'now' ? -1 : 1) - (b.availability === 'now' ? -1 : 1));
    writeCache(unique);
    return unique;
  } catch (e) {
    return cache ? cache.pros : null;
  }
}

/** Rank real coaches against what the member said they need. */
export function matchLivePros(pros, topic, limit = 3) {
  const scored = pros.map((p) => {
    let score = p.topics.includes(topic) ? 2 : 0;
    if (p.availability === 'now') score += 1.5;
    return { p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.p);
}
