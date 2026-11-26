import { events, recurringEvents, statusOf } from './events.mjs';

const get = id => document.getElementById(id);
const controls = ['store', 'kind', 'status'].map(get);
const dateTime = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const weekday = new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', weekday: 'short' });
const dateKey = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
const labels = { live: '開催中', upcoming: '開催予定', ended: '終了' };
let selectedDay = '';
const element = (tag, value, className) => {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
};
function link(text, href) {
  const item = element('a', text);
  item.href = href;
  return item;
}
function overlaps(event, day) {
  const start = Date.parse(day + 'T00:00:00+09:00');
  return Date.parse(event.start) < start + 86400000 && Date.parse(event.end) > start;
}
function card(event, now) {
  const state = statusOf(event, now);
  const box = element('article', '', 'card' + (event.store === '楽天市場' ? ' rakuten' : ''));
  const tags = element('div', '', 'tags');
  const endingToday = state === 'live' && dateKey.format(now) === dateKey.format(Date.parse(event.end) - 1);
  tags.append(element('span', event.store, 'tag'), element('span', event.kind, 'tag'), element('span', endingToday ? '今日終了' : labels[state], 'tag ' + state));
  const time = dateTime.format(Date.parse(event.start)) + ' 〜 ' + dateTime.format(Date.parse(event.end) - 60000);
  box.append(tags, element('h3', event.title), element('p', time, 'time'), element('p', event.note, 'note'));
  if (event.entry && state === 'upcoming') {
    const entry = Date.parse(event.entry);
    box.append(element('p', entry <= now ? 'エントリー受付中' : 'エントリー開始 ' + dateTime.format(entry), 'time'));
  }
  const actions = element('div');
  actions.append(link('公式の詳細 ↗', event.source));
  if (event.action && state !== 'ended') actions.append(link('エントリー先 ↗', event.action));
  box.append(actions);
  return box;
}
function render() {
  const now = Date.now();
  const all = [...events, ...recurringEvents(now)];
  const [store, kind, status] = controls.map(control => control.value);
  const week = get('week');
  const focusedDay = week.contains(document.activeElement) ? document.activeElement.dataset.date : '';
  const matching = all.filter(event => (!store || event.store === store) && (!kind || event.kind === kind));
  const dates = Array.from({ length: 7 }, (_, i) => now + i * 86400000);
  if (selectedDay && !dates.some(date => dateKey.format(date) === selectedDay)) selectedDay = '';
  week.replaceChildren(...dates.map(date => {
    const day = dateKey.format(date);
    const button = element('button');
    button.type = 'button';
    button.dataset.date = day;
    button.setAttribute('aria-pressed', String(day === selectedDay));
    button.setAttribute('aria-label', day + ' のイベント');
    button.append(element('small', weekday.format(date)), element('span', day.slice(-2)));
    button.addEventListener('click', () => { selectedDay = selectedDay === day ? '' : day; render(); });
    return button;
  }));
  if (focusedDay) [...week.children].find(button => button.dataset.date === focusedDay)?.focus();
  get('week-summary').textContent = selectedDay ? selectedDay.replaceAll('-', '/') + ' のイベントを表示中' : '日付を押すと、その日のイベントを表示';
  const shown = matching.filter(event => {
    const state = statusOf(event, now);
    return (status ? state === status : state !== 'ended') && (!selectedDay || overlaps(event, selectedDay));
  }).sort((a, b) => status === 'ended' ? Date.parse(b.end) - Date.parse(a.end) : Date.parse(a.start) - Date.parse(b.start));
  get('cards').replaceChildren(...(shown.length ? shown.map(event => card(event, now)) : [element('p', '条件に合う掲載イベントはありません。', 'empty')]));
  get('count').textContent = shown.length + '件';
  get('reset').hidden = !selectedDay && !controls.some(control => control.value);
}
controls.forEach(control => control.addEventListener('change', render));
get('reset').addEventListener('click', event => {
  event.preventDefault();
  controls.forEach(control => { control.value = ''; });
  selectedDay = '';
  controls[0].focus();
  render();
});
render();
setInterval(render, 60000);

const officialHosts = new Set(['www.aboutamazon.jp', 'event.rakuten.co.jp']);
async function loadNotices() {
  const section = get('feed');
  try {
    const response = await fetch('/api/notices', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw Error('notices unavailable');
    const data = await response.json();
    const list = element('ul');
    for (const item of data.notices) {
      const url = new URL(item.url);
      if (url.protocol !== 'https:' || !officialHosts.has(url.hostname)) continue;
      const row = element('li');
      row.append(link(item.title + ' ↗', url.href), element('small', ' · ' + item.store));
      list.append(row);
    }
    const checked = data.checkedAt ? dateTime.format(Date.parse(data.checkedAt)) : null;
    section.replaceChildren(element('p', list.children.length ? '公式ページで見つかった関連のお知らせ' : '自動確認で取得した告知はまだありません。'));
    if (list.children.length) section.append(list);
    if (checked) section.append(element('small', '最終チェック ' + checked + (data.partial ? '（一部の情報源を取得できませんでした）' : '')));
  } catch {
    section.textContent = '告知の自動取得は利用できません。公式サイトから確認できます。';
  }
}
loadNotices();
