export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { type, name, contact, details, budget } = await request.json();

    if (!name || !contact || !type) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const msg =
      `New Demo Request from Astrux Marketing\n\n` +
      `Type: ${type}\n` +
      `Name: ${name}\n` +
      `Contact: ${contact}\n` +
      `Details: ${details || 'Not provided'}\n` +
      `Budget: ${budget || 'Not specified'}`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: msg }),
      }
    );

    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return new Response(JSON.stringify({ ok: false, error: tgData.description }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
