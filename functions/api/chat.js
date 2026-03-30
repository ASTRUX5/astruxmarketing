// File: functions/api/chat.js
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

    // Add instruction to last user message or system
    const modifiedMessages = messages.map((m, i) => {
      if (m.role === 'system') {
        return {
          role: 'system',
          content: m.content + ' Reply naturally without saying Okay or Alright.'
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

    // Simple passthrough with minimal processing
    const { readable, writable } = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            controller.enqueue(new TextEncoder().encode(line + '\n'));
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
              // Only strip thinking tags, keep everything else
              const clean = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

              if (clean || content.includes('<think>')) {
                data.choices[0].delta.content = clean;
                controller.enqueue(new TextEncoder().encode('data: ' + JSON.stringify(data) + '\n'));
              } else {
                controller.enqueue(new TextEncoder().encode(line + '\n'));
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
