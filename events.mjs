const amazon = 'https://www.aboutamazon.jp/news/retail/amazon-black-friday-2026';
const pointday = 'https://event.rakuten.co.jp/card/pointday/';
const rakutenBlackFriday = 'https://event.rakuten.co.jp/campaign/point-up/blackfriday/20261119jfpze/';

export const events = [
  { id: 'amazon-early', store: 'Amazon', kind: 'セール', title: 'ブラックフライデー先行セール', start: '2026-11-27T00:00:00+09:00', end: '2026-11-30T00:00:00+09:00', note: '本セールに先がけて対象商品をセール価格で販売。', source: amazon },
  { id: 'amazon-black-friday', store: 'Amazon', kind: 'セール', title: 'ブラックフライデー', start: '2026-11-30T00:00:00+09:00', end: '2026-12-08T00:00:00+09:00', note: '家電、日用品、食品などの対象商品がセール価格に。', source: amazon },
  { id: 'amazon-pointup', store: 'Amazon', kind: 'ポイント', title: 'ブラックフライデー ポイントアップ', start: '2026-11-27T00:00:00+09:00', end: '2026-12-08T00:00:00+09:00', entry: '2026-11-19T10:00:00+09:00', note: '要エントリー。対象期間中に合計10,000円（税込）以上の購入が条件。追加分は上限10,000ポイント。', source: amazon + '#ポイントアップキャンペーン', action: 'https://www.amazon.co.jp/events/pointupcampaign/' },
  { id: 'rakuten-black-friday', store: '楽天市場', kind: 'ポイント', title: 'ブラックフライデー 買いまわり', start: '2026-11-19T20:00:00+09:00', end: '2026-11-25T02:00:00+09:00', entry: '2026-11-12T10:00:00+09:00', note: '要エントリー。対象期間中に1ショップあたり合計1,000円（税込）以上が買いまわりの条件。', source: rakutenBlackFriday },
];

const day = 86400000;
const jstDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });

export function recurringEvents(now) {
  const result = [];
  for (let offset = -14; offset <= 35; offset += 1) {
    const date = jstDate.format(now + offset * day);
    if (!['05', '10', '15', '20', '25', '30'].includes(date.slice(-2))) continue;
    const start = date + 'T00:00:00+09:00';
    result.push({ id: 'rakuten-pointday-' + date, store: '楽天市場', kind: 'ポイント', title: '5と0のつく日', start, end: new Date(Date.parse(start) + day).toISOString(), entry: start, note: '要エントリー・楽天カードでの支払い。適用条件と獲得上限は公式ページで確認。', source: pointday, recurring: true });
  }
  return result;
}

export function statusOf(event, now) {
  if (now >= Date.parse(event.end)) return 'ended';
  if (now >= Date.parse(event.start)) return 'live';
  return 'upcoming';
}
