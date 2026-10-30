export const officialLayer = '/rest/services/ech/MapServer/ch.bfs.gebaeude_wohnungs_register/';
export function officialResource(value: string): string | null {
  try {
    const url = new URL(value, 'https://api3.geo.admin.ch');
    if (url.origin !== 'https://api3.geo.admin.ch' || url.username || url.password || url.hash || !new RegExp('^' + officialLayer.replace(/\./g, '\\.') + '\\d+_\\d+$').test(url.pathname)) return null;
    if ([...url.searchParams].some(([key, value]) => key !== 'returnGeometry' || value !== 'false')) return null;
    url.search = '?returnGeometry=false'; return url.href;
  } catch { return null; }
}
