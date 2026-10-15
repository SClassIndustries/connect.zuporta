export function launchAction(href) {
  try {
    const url = new URL(href);
    if (url.origin !== 'https://connect.zuporta.com' || url.username || url.password) return null;
    return ({ '/open/check-in': 'check-in', '/open/breathe': 'breathe', '/open/coaches': 'coaches' })[url.pathname] || null;
  } catch { return null; }
}
