/* Astrux Chatbot */
(function() {
  'use strict';

  const CONFIG = {
    workerUrl: '/api/chat',
    botName: 'Astrux Assistant',
    botAvatar: 'fa-solid fa-robot',
    userAvatar: 'fa-solid fa-user',
    placeholder: 'Ask about our services...',
    welcomeMessage: "Hello. I'm here to help with questions about Astrux Marketing, our services, or requesting a free demo.",

    // Clearer system prompt
    systemPrompt: `You are Astrux Assistant, a professional customer service representative for Astrux Marketing.

SERVICES:
- Free website demo before payment
- 48 hour delivery time
- Dental, medical, gym, restaurant, salon, retail, education websites
- Cloudflare Pages hosting
- Starter (3 pages), Standard (6 pages), Premium (unlimited) plans
- Mobile-first, SEO-ready, WhatsApp integration

CONTACT:
- WhatsApp: +91 6006555193
- Telegram, Email available

INSTRUCTIONS:
- Greet users naturally when they say hi/hello/hey
- Keep responses to 2-3 sentences
- Be professional and helpful
- Direct complex questions to WhatsApp
- Never start with "Okay" or "Alright"
- Do not use emojis`,

    preMessages: [{ role: 'system', content: null }]
  };

  let isOpen = false, isTyping = false, messages = [];
  let chatContainer, chatToggle, chatWindow, messagesContainer, inputField, sendBtn;

  function init() {
    createStyles();
    createDOM();
    attachEvents();
    CONFIG.preMessages[0].content = CONFIG.systemPrompt;
    addMessage('bot', CONFIG.welcomeMessage);
  }

  function createStyles() {
    const styles = document.createElement('style');
    styles.textContent = `
      #astrux-chat-container {
        position: fixed;
        bottom: 90px;
        right: 26px;
        z-index: 4999;
        font-family: 'DM Sans', sans-serif;
      }
      #astrux-chat-toggle {
        width: 54px;
        height: 54px;
        border-radius: 50%;
        background: linear-gradient(135deg, #FFAB00, #DD2E18);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        box-shadow: 0 6px 28px rgba(221, 46, 24, 0.38);
        transition: transform 0.3s;
        position: relative;
        color: #000;
      }
      #astrux-chat-toggle:hover { transform: scale(1.08); }
      #astrux-chat-toggle .pulse {
        position: absolute;
        inset: -5px;
        border-radius: 50%;
        background: #DD2E18;
        animation: astruxPulse 2.4s ease-out infinite;
        pointer-events: none;
        z-index: -1;
      }
      @keyframes astruxPulse {
        0% { transform: scale(1); opacity: 0.22; }
        100% { transform: scale(1.65); opacity: 0; }
      }
      #astrux-chat-window {
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 360px;
        max-width: calc(100vw - 40px);
        height: 500px;
        max-height: calc(100vh - 150px);
        background: #0f0f11;
        border: 1px solid rgba(255, 171, 0, 0.12);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
        transform: translateY(20px) scale(0.95);
        transform-origin: bottom right;
        transition: opacity 0.28s, transform 0.28s;
        box-shadow: 0 18px 56px rgba(0, 0, 0, 0.65);
      }
      #astrux-chat-window.open {
        opacity: 1;
        pointer-events: all;
        transform: translateY(0) scale(1);
      }
      #astrux-chat-header {
        background: linear-gradient(135deg, #FFAB00, #DD2E18);
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      #astrux-chat-header .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        color: #000;
      }
      #astrux-chat-header .info { flex: 1; }
      #astrux-chat-header .name {
        font-family: 'Outfit', sans-serif;
        font-weight: 700;
        font-size: 0.95rem;
        color: #000;
      }
      #astrux-chat-header .status {
        font-size: 0.7rem;
        color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #astrux-chat-header .status-dot {
        width: 8px;
        height: 8px;
        background: #00c853;
        border-radius: 50%;
        animation: blink 2s infinite;
      }
      #astrux-chat-close {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.15);
        color: #000;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        transition: background 0.2s;
      }
      #astrux-chat-close:hover { background: rgba(0, 0, 0, 0.25); }
      #astrux-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scroll-behavior: smooth;
      }
      #astrux-messages::-webkit-scrollbar { width: 6px; }
      #astrux-messages::-webkit-scrollbar-track { background: transparent; }
      #astrux-messages::-webkit-scrollbar-thumb {
        background: rgba(255, 171, 0, 0.2);
        border-radius: 3px;
      }
      .astrux-message {
        display: flex;
        gap: 10px;
        max-width: 85%;
        animation: fadeUp 0.3s ease;
      }
      .astrux-message.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .astrux-message .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
        flex-shrink: 0;
      }
      .astrux-message.bot .avatar {
        background: linear-gradient(135deg, #FFAB00, #DD2E18);
        color: #000;
      }
      .astrux-message.user .avatar {
        background: #141416;
        border: 1px solid rgba(255, 171, 0, 0.2);
        color: var(--text);
      }
      .astrux-message .bubble {
        padding: 12px 16px;
        border-radius: 18px;
        font-size: 0.85rem;
        line-height: 1.6;
        word-wrap: break-word;
      }
      .astrux-message.bot .bubble {
        background: #141416;
        color: #F0EDE8;
        border: 1px solid rgba(255, 171, 0, 0.1);
        border-bottom-left-radius: 4px;
      }
      .astrux-message.user .bubble {
        background: linear-gradient(135deg, #FFAB00, #DD2E18);
        color: #000;
        font-weight: 500;
        border-bottom-right-radius: 4px;
      }
      .astrux-typing {
        display: flex;
        gap: 4px;
        padding: 16px;
        align-items: center;
      }
      .astrux-typing span {
        width: 8px;
        height: 8px;
        background: rgba(255, 171, 0, 0.6);
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out both;
      }
      .astrux-typing span:nth-child(1) { animation-delay: -0.32s; }
      .astrux-typing span:nth-child(2) { animation-delay: -0.16s; }
      @keyframes typing {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      #astrux-chat-input-area {
        padding: 16px 20px;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        gap: 10px;
        background: #0a0a0b;
      }
      #astrux-chat-input {
        flex: 1;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 25px;
        padding: 12px 18px;
        color: #F0EDE8;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.85rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      #astrux-chat-input:focus {
        border-color: #FFAB00;
        box-shadow: 0 0 0 3px rgba(255, 171, 0, 0.07);
      }
      #astrux-chat-input::placeholder { color: #5a5a5a; }
      #astrux-chat-send {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #FFAB00, #DD2E18);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #000;
        font-size: 1rem;
        transition: transform 0.2s, opacity 0.2s;
      }
      #astrux-chat-send:hover:not(:disabled) { transform: scale(1.05); }
      #astrux-chat-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      @media (max-width: 480px) {
        #astrux-chat-window {
          width: calc(100vw - 40px);
          height: calc(100vh - 140px);
          max-height: 500px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  function createDOM() {
    chatContainer = document.createElement('div');
    chatContainer.id = 'astrux-chat-container';

    chatToggle = document.createElement('button');
    chatToggle.id = 'astrux-chat-toggle';
    chatToggle.innerHTML = '<div class="pulse"></div><i class="fa-solid fa-comment-dots"></i>';
    chatToggle.setAttribute('aria-label', 'Open chat');

    chatWindow = document.createElement('div');
    chatWindow.id = 'astrux-chat-window';
    chatWindow.innerHTML = `
      <div id="astrux-chat-header">
        <div class="avatar"><i class="${CONFIG.botAvatar}"></i></div>
        <div class="info">
          <div class="name">${CONFIG.botName}</div>
          <div class="status"><span class="status-dot"></span>Online</div>
        </div>
        <button id="astrux-chat-close" aria-label="Close chat"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div id="astrux-messages"></div>
      <div id="astrux-chat-input-area">
        <input type="text" id="astrux-chat-input" placeholder="${CONFIG.placeholder}" autocomplete="off">
        <button id="astrux-chat-send" aria-label="Send message"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    `;

    chatContainer.appendChild(chatWindow);
    chatContainer.appendChild(chatToggle);
    document.body.appendChild(chatContainer);

    messagesContainer = document.getElementById('astrux-messages');
    inputField = document.getElementById('astrux-chat-input');
    sendBtn = document.getElementById('astrux-chat-send');
  }

  function attachEvents() {
    chatToggle.addEventListener('click', toggleChat);
    document.getElementById('astrux-chat-close').addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    document.addEventListener('click', (e) => {
      if (isOpen && !chatContainer.contains(e.target)) toggleChat();
    });
  }

  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.classList.toggle('open', isOpen);
    const icon = chatToggle.querySelector('i');
    icon.className = isOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-comment-dots';
    chatToggle.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');
    if (isOpen) {
      inputField.focus();
      scrollToBottom();
    }
  }

  function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `astrux-message ${role}`;
    messageDiv.innerHTML = `
      <div class="avatar"><i class="${role === 'bot' ? CONFIG.botAvatar : CONFIG.userAvatar}"></i></div>
      <div class="bubble">${escapeHtml(content)}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    messages.push({ role, content });
  }

  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'astrux-typing-indicator';
    typingDiv.className = 'astrux-message bot';
    typingDiv.innerHTML = `
      <div class="avatar"><i class="${CONFIG.botAvatar}"></i></div>
      <div class="bubble astrux-typing"><span></span><span></span><span></span></div>
    `;
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
  }

  function hideTyping() {
    const typing = document.getElementById('astrux-typing-indicator');
    if (typing) typing.remove();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function sendMessage() {
    const content = inputField.value.trim();
    if (!content || isTyping) return;

    addMessage('user', content);
    inputField.value = '';

    isTyping = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const apiMessages = [
        ...CONFIG.preMessages,
        ...messages.slice(1).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.content }))
      ];

      const response = await fetch(CONFIG.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!response.ok) throw new Error('API error');

      hideTyping();
      const responseDiv = document.createElement('div');
      responseDiv.className = 'astrux-message bot';
      responseDiv.innerHTML = `
        <div class="avatar"><i class="${CONFIG.botAvatar}"></i></div>
        <div class="bubble"></div>
      `;
      messagesContainer.appendChild(responseDiv);
      const bubble = responseDiv.querySelector('.bubble');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '' || line === 'data: [DONE]') continue;
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                bubble.textContent = fullResponse;
                scrollToBottom();
              }
            } catch (e) {}
          }
        }
      }

      messages.push({ role: 'bot', content: fullResponse });

    } catch (error) {
      hideTyping();
      addMessage('bot', 'Connection issue. Please contact us on WhatsApp: +91 6006555193');
    } finally {
      isTyping = false;
      sendBtn.disabled = false;
      inputField.focus();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
