export async function onRequestGet({ env }) {
  if (!env.NOTICES) return Response.json({ checkedAt: null, notices: [] });
  try {
    const saved = await env.NOTICES.get('official-notices-v1', 'json');
    return Response.json(saved ?? { checkedAt: null, notices: [] }, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch {
    return Response.json({ message: 'Notices unavailable' }, { status: 503 });
  }
}
