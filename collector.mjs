export const feedKey = 'official-notices-v1';
export const sources = [
  { store: 'Amazon', url: 'https://www.aboutamazon.jp/news/retail', path: /^\/news\/retail\//, keywords: /セール|ブラックフライデー|プライムデー|ポイントアップ|初売り/ },
  { store: '楽天市場', url: 'https://event.rakuten.co.jp/', path: /^\/(?:campaign\/point-up\/|card\/pointday\/)/, keywords: /セール|SALE|ブラックフライデー|マラソン|ポイント|買いまわり/i },
];

export function toNotice(source, href, label) {
  try {
    const url = new URL(href, source.url);
    const title = label.replace(/\s+/g, ' ').trim();
    if (url.origin !== new URL(source.url).origin || !source.path.test(url.pathname) || !source.keywords.test(title) || title.length > 160) return null;
    url.hash = '';
    url.search = '';
    return { store: source.store, url: url.href, title };
  } catch {
    return null;
  }
}

async function readSource(source) {
  const response = await fetch(source.url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!response.ok || !response.headers.get('Content-Type')?.includes('text/html')) throw Error('source unavailable');
  const results = new Map();
  let appendLabel;
  const rewritten = new HTMLRewriter().on('a[href]', {
    element(anchor) {
      const href = anchor.getAttribute('href');
      let title = anchor.getAttribute('aria-label') || '';
      appendLabel = chunk => { title += chunk; };
      anchor.onEndTag(() => {
        const notice = toNotice(source, href, title);
        if (notice && !results.has(notice.url)) results.set(notice.url, notice);
        appendLabel = undefined;
      });
    },
    text(chunk) { appendLabel?.(chunk.text); },
  }).on('a[href] img[alt]', {
    element(image) {
      appendLabel?.(' ' + (image.getAttribute('alt') || ''));
    },
  }).transform(response);
  await rewritten.arrayBuffer();
  if (!results.size) throw Error('no matching links found');
  return [...results.values()].slice(0, 8);
}

export default {
  async scheduled(_event, env) {
    const previous = await env.NOTICES.get(feedKey, 'json');
    const reads = await Promise.allSettled(sources.map(readSource));
    const checkedAt = new Date().toISOString();
    const notices = reads.flatMap((result, index) => result.status === 'fulfilled'
      ? result.value
      : (previous?.notices ?? []).filter(notice => notice.store === sources[index].store));
    const partial = reads.some(result => result.status === 'rejected');
    for (const [index, result] of reads.entries()) {
      if (result.status === 'rejected') console.warn(sources[index].store, result.reason.message);
    }
    await env.NOTICES.put(feedKey, JSON.stringify({ checkedAt, notices, partial }));
  },
};
