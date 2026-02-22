export async function onRequest(context) {
  const { request, env } = context;

  // Allow only POST
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();

    if (!body.message) {
      return new Response(
        JSON.stringify({ success: false, error: "Message missing" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: body.message,
        }),
      }
    );

    if (!telegramResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Telegram API failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
