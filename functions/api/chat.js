// File: functions/api/chat.js
// Uses mistral-small-3.1-24b-instruct-2503 - no thinking, clean responses

export async function onRequestPost(context) {
  const { env, request } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid format', { status: 400, headers: corsHeaders });
    }

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistralai/mistral-small-3.1-24b-instruct-2503',
        messages: messages,
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 1024,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('NVIDIA API error:', error);
      return new Response('AI service error', { status: 502, headers: corsHeaders });
    }

    // Simple passthrough - no processing needed for this model
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response('Internal error', { status: 500, headers: corsHeaders });
  }
}

export async function onRequestGet() {
  return new Response('Chat API running', { status: 200 });
}
