/* ═══════════════════════════════════════════════════════════
   AI CHATBOT WIDGET  —  "Ask about Zohaib"
   Talks to the Cloudflare Worker in chatbot-backend/ which relays
   messages to Claude. The API key lives only in the Worker.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  // 👉 Paste your deployed Cloudflare Worker URL here (see chatbot-backend/README.md)
  const CHATBOT_API_URL = "https://portfolio-chatbot.developwithzohaib.workers.dev";

  const GREETING =
    "Hi! 👋 I'm Zohaib's AI assistant. Ask me about his experience, the kinds of projects he builds, or how to work with him.";

  const SUGGESTIONS = [
    "What kind of projects does Zohaib do?",
    "What's his experience?",
    "How can I hire him?",
  ];

  // Inline SVG icons (no external icon dependency)
  const ICONS = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  };

  // Conversation history sent to the API ({role, content} pairs).
  const history = [];
  let busy = false;

  // ── Build the DOM ──────────────────────────────────────────
  const root = document.createElement("div");
  root.className = "chatbot-root";
  root.innerHTML = `
    <div class="chatbot-panel" role="dialog" aria-label="Chat with Zohaib's AI assistant">
      <div class="chatbot-header">
        <div class="chatbot-avatar">${ICONS.bot}</div>
        <div class="chatbot-header-text">
          <strong>Ask about Zohaib</strong>
          <span>AI assistant · online</span>
        </div>
        <button class="chatbot-close" aria-label="Close chat">${ICONS.close}</button>
      </div>
      <div class="chatbot-messages" id="chatbotMessages"></div>
      <div class="chatbot-suggestions" id="chatbotSuggestions"></div>
      <div class="chatbot-input-row">
        <textarea class="chatbot-input" id="chatbotInput" rows="1" placeholder="Ask me anything about Zohaib..." aria-label="Message"></textarea>
        <button class="chatbot-send" id="chatbotSend" aria-label="Send message">${ICONS.send}</button>
      </div>
    </div>
    <button class="chatbot-toggle" aria-label="Open chat" aria-expanded="false">
      <span class="chatbot-icon-open">${ICONS.chat}</span>
      <span class="chatbot-icon-close">${ICONS.close}</span>
    </button>
  `;
  document.body.appendChild(root);

  const toggleBtn = root.querySelector(".chatbot-toggle");
  const closeBtn = root.querySelector(".chatbot-close");
  const messagesEl = root.querySelector("#chatbotMessages");
  const suggestionsEl = root.querySelector("#chatbotSuggestions");
  const inputEl = root.querySelector("#chatbotInput");
  const sendBtn = root.querySelector("#chatbotSend");

  // ── Open / close ───────────────────────────────────────────
  let greeted = false;
  function openChat() {
    root.classList.add("open");
    toggleBtn.setAttribute("aria-expanded", "true");
    if (!greeted) {
      addMessage(GREETING, "bot");
      renderSuggestions();
      greeted = true;
    }
    setTimeout(() => inputEl.focus(), 250);
  }
  function closeChat() {
    root.classList.remove("open");
    toggleBtn.setAttribute("aria-expanded", "false");
  }
  toggleBtn.addEventListener("click", () => (root.classList.contains("open") ? closeChat() : openChat()));
  closeBtn.addEventListener("click", closeChat);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && root.classList.contains("open")) closeChat();
  });

  // ── Suggestion chips ───────────────────────────────────────
  function renderSuggestions() {
    suggestionsEl.innerHTML = "";
    SUGGESTIONS.forEach((q) => {
      const chip = document.createElement("button");
      chip.className = "chatbot-chip";
      chip.textContent = q;
      chip.addEventListener("click", () => {
        inputEl.value = q;
        send();
      });
      suggestionsEl.appendChild(chip);
    });
  }
  function clearSuggestions() {
    suggestionsEl.innerHTML = "";
  }

  // ── Rendering messages (XSS-safe: builds text + link nodes) ─
  function addMessage(text, type) {
    const el = document.createElement("div");
    el.className = "chatbot-msg " + type;
    linkify(text).forEach((node) => el.appendChild(node));
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function linkify(text) {
    const nodes = [];
    // Match URLs and email addresses; everything else stays plain text.
    const re = /(https?:\/\/[^\s]+|www\.[^\s]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) nodes.push(document.createTextNode(text.slice(last, m.index)));
      const token = m[0];
      const a = document.createElement("a");
      if (token.includes("@")) {
        a.href = "mailto:" + token;
      } else {
        a.href = token.startsWith("http") ? token : "https://" + token;
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.textContent = token;
      nodes.push(a);
      last = m.index + token.length;
    }
    if (last < text.length) nodes.push(document.createTextNode(text.slice(last)));
    return nodes;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "chatbot-msg bot";
    el.innerHTML = '<span class="chatbot-typing"><span></span><span></span><span></span></span>';
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  // ── Sending ────────────────────────────────────────────────
  async function send() {
    const text = inputEl.value.trim();
    if (!text || busy) return;

    clearSuggestions();
    addMessage(text, "user");
    history.push({ role: "user", content: text });
    inputEl.value = "";
    autoGrow();
    setBusy(true);

    const typing = showTyping();

    if (!CHATBOT_API_URL) {
      typing.remove();
      addMessage(
        "The chatbot isn't connected yet. Deploy the Worker in chatbot-backend/ and paste its URL into chatbot.js (CHATBOT_API_URL).",
        "error"
      );
      setBusy(false);
      return;
    }

    try {
      const res = await fetch(CHATBOT_API_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));
      typing.remove();

      if (!res.ok || data.error) {
        addMessage(data.error || "Something went wrong. Please try again.", "error");
      } else {
        addMessage(data.reply, "bot");
        history.push({ role: "assistant", content: data.reply });
      }
    } catch {
      typing.remove();
      addMessage("I couldn't reach the assistant. Please check your connection and try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  function setBusy(state) {
    busy = state;
    sendBtn.disabled = state;
    inputEl.disabled = state;
    if (!state) inputEl.focus();
  }

  // ── Input behaviour ────────────────────────────────────────
  function autoGrow() {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 110) + "px";
  }
  inputEl.addEventListener("input", autoGrow);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  sendBtn.addEventListener("click", send);
})();
