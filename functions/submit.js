export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const msg = body.msg || 'New request (no details)';
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg })
    });
  } catch(err) {}
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
