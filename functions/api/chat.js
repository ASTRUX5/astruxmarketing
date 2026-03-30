// File: functions/api/chat.js
// Strips Qwen thinking tags and ensures proper responses

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

    // Modify system message to ensure proper output
    const modifiedMessages = messages.map(m => {
      if (m.role === 'system') {
        return {
          ...m,
          content: m.content + "\n\nIMPORTANT: Reply naturally to greetings. Do not say 'Okay' or 'Alright'. Give a proper helpful response."
        };
      }
      return m;
    });

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen/qwq-32b',
        messages: modifiedMessages,
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 1024,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('NVIDIA API error:', error);
      return new Response('AI service error', { status: 502, headers: corsHeaders });
    }

    // Transform stream to strip thinking
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            if (line.trim() === '' || line === 'data: [DONE]') {
              controller.enqueue(new TextEncoder().encode(line + '\n'));
            }
            continue;
          }

          if (line === 'data: [DONE]') {
            controller.enqueue(new TextEncoder().encode(line + '\n'));
            continue;
          }

          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices?.[0]?.delta?.content;

            if (content) {
              // Strip thinking tags and artifacts
              let clean = content
                .replace(/<think>[\s\S]*?<\/think>/g, '')
                .replace(/Okay[.,]?\s*/gi, '')
                .replace(/Alright[.,]?\s*/gi, '')
                .trim();

              if (clean) {
                data.choices[0].delta.content = clean;
                controller.enqueue(new TextEncoder().encode('data: ' + JSON.stringify(data) + '\n'));
              }
            } else {
              controller.enqueue(new TextEncoder().encode(line + '\n'));
            }
          } catch (e) {
            controller.enqueue(new TextEncoder().encode(line + '\n'));
          }
        }
      }
    });

    response.body.pipeTo(writable);

    return new Response(readable, {
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
