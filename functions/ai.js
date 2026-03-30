export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  const resp = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.NVIDIA_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  return new Response(resp.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
