// File: functions/api/chat.js
// This runs on Cloudflare Pages - no separate Worker needed!
// The NVIDIA_API_KEY comes from Cloudflare Pages Environment Variables

export async function onRequestPost(context) {
  const { env, request } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Call NVIDIA API using the env variable from Pages settings
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.NVIDIA_API_KEY}` // From Pages env vars
      },
      body: JSON.stringify({
        model: 'qwen/qwq-32b',
        messages: messages,
        temperature: 0.6,
        top_p: 0.7,
        max_tokens: 4096,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('NVIDIA API error:', error);
      return new Response('AI service error', { 
        status: 502,
        headers: corsHeaders
      });
    }

    // Stream the response back to client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response('Internal error', { 
      status: 500,
      headers: corsHeaders
    });
  }
}

// Also handle GET for testing
export async function onRequestGet() {
  return new Response('Chat API is running. Use POST to chat.', { status: 200 });
}
