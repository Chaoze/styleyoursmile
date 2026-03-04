'use strict';

/* ──────────────────────────────────────────
   Sticky Header
────────────────────────────────────────── */
const header = document.getElementById('siteHeader');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ──────────────────────────────────────────
   Mobile Burger Menu
────────────────────────────────────────── */
const burger  = document.getElementById('burger');
const mainNav = document.getElementById('mainNav');

function closeNav() {
  mainNav.classList.remove('open');
  burger.classList.remove('open');
  burger.setAttribute('aria-label', 'Menü');
  document.body.style.overflow = '';
}

if (burger && mainNav) {
  burger.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on nav link click (mobile)
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && mainNav.classList.contains('open')) closeNav();
  });

  // Close on outside tap (mobile)
  document.addEventListener('click', e => {
    if (mainNav.classList.contains('open') &&
        !mainNav.contains(e.target) &&
        !burger.contains(e.target)) {
      closeNav();
    }
  });
}

/* ──────────────────────────────────────────
   Smooth Scroll
────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const hh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - hh,
      behavior: 'smooth'
    });
  });
});

/* ──────────────────────────────────────────
   Active Nav Link on Scroll
────────────────────────────────────────── */
const sections = document.querySelectorAll('section[id], div[id]');
const navLinks  = document.querySelectorAll('.nav-link');

const highlightNav = () => {
  const y = window.scrollY + 100;
  sections.forEach(sec => {
    const top    = sec.offsetTop;
    const bottom = top + sec.offsetHeight;
    if (y >= top && y < bottom) {
      const id = sec.id;
      navLinks.forEach(l => {
        const href = l.getAttribute('href');
        l.classList.toggle('active', href === `#${id}`);
      });
    }
  });
};
window.addEventListener('scroll', highlightNav, { passive: true });

/* ──────────────────────────────────────────
   FAQ Accordion
────────────────────────────────────────── */
document.querySelectorAll('.faq-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item    = trigger.closest('.faq-item');
    const body    = item.querySelector('.faq-body');
    const isOpen  = trigger.getAttribute('aria-expanded') === 'true';

    // Close all
    document.querySelectorAll('.faq-trigger').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
      t.closest('.faq-item').querySelector('.faq-body').classList.remove('open');
    });

    // Toggle clicked
    if (!isOpen) {
      trigger.setAttribute('aria-expanded', 'true');
      body.classList.add('open');
    }
  });
});

/* ──────────────────────────────────────────
   Scroll Reveal (IntersectionObserver)
────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.10, rootMargin: '0px 0px -48px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ──────────────────────────────────────────
   Contact Form
────────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = contactForm.querySelector('[type="submit"]');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Wird gesendet…';

    try {
      const res = await fetch('kontakt.php', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(contactForm),
      });

      if (res.ok) {
        btn.textContent = 'Nachricht gesendet ✓';
        btn.style.background = '#3d6b61';
        contactForm.reset();
        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = orig;
          btn.style.background = '';
        }, 4000);
      } else {
        throw new Error();
      }
    } catch {
      btn.textContent = 'Fehler — bitte erneut versuchen';
      btn.style.background = '#c0392b';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = orig;
        btn.style.background = '';
      }, 4000);
    }
  });
}

/* ──────────────────────────────────────────
   Language Dropdown (Header)
────────────────────────────────────────── */
const langDropdown = document.getElementById('langDropdown');
const langToggle   = document.getElementById('langToggle');

if (langDropdown && langToggle) {
  langToggle.addEventListener('click', () => {
    const isOpen = langDropdown.classList.toggle('open');
    langToggle.setAttribute('aria-expanded', isOpen);
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!langDropdown.contains(e.target)) {
      langDropdown.classList.remove('open');
      langToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ──────────────────────────────────────────
   Language switcher (footer — visual)
────────────────────────────────────────── */
document.querySelectorAll('.lang-switch .lang').forEach(btn => {
  btn.addEventListener('click', e => {
    const href = btn.getAttribute('href');
    if (!href || href === '#') {
      e.preventDefault();
      btn.closest('.lang-switch').querySelectorAll('.lang').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  });
});

/* ──────────────────────────────────────────
   Praxis-Chat
────────────────────────────────────────── */
const chatEndpoint = 'https://ai.styleyoursmile.ch/chat';
const chatDrawer = document.getElementById('chatDrawer');
const chatFab = document.getElementById('chatFab');
const chatClose = document.getElementById('chatClose');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const chatOpenButtons = document.querySelectorAll('[data-chat-open]');
const chatQuestionButtons = document.querySelectorAll('[data-chat-question]');
const chatState = {
  sending: false,
  messages: [],
};

function setChatOpen(open) {
  if (!chatDrawer || !chatFab) return;
  chatDrawer.hidden = !open;
  chatFab.setAttribute('aria-expanded', String(open));
  if (open && chatInput) chatInput.focus();
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatChatMessage(text) {
  const normalized = text.replaceAll('ß', 'ss');
  let html = escapeHtml(normalized);

  html = html.replace(
    /https:\/\/wa\.me\/41434434242/gi,
    '<a href="https://wa.me/41434434242" target="_blank" rel="noopener" class="chat-inline-link">WhatsApp</a>'
  );

  html = html.replace(
    /\+41 43 443 42 42/g,
    '<a href="tel:+41434434242" class="chat-inline-link">+41 43 443 42 42</a>'
  );

  html = html.replace(
    /WhatsApp/gi,
    '<a href="https://wa.me/41434434242" target="_blank" rel="noopener" class="chat-inline-link">WhatsApp</a>'
  );

  return html.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>');
}

function appendChatMessage(role, content, isPending = false) {
  if (!chatMessages) return null;

  const article = document.createElement('article');
  article.className = `chat-message chat-message--${role}`;
  if (isPending) article.classList.add('chat-message--pending');

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';
  bubble.innerHTML = `<p>${formatChatMessage(content)}</p>`;

  article.appendChild(bubble);
  chatMessages.appendChild(article);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function setChatBusy(isBusy) {
  chatState.sending = isBusy;
  if (chatInput) chatInput.disabled = isBusy;
  if (chatForm) {
    const submitButton = chatForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = isBusy;
  }
  chatQuestionButtons.forEach(button => { button.disabled = isBusy; });
}

async function readSseResponse(response, pendingBubble) {
  if (!response.body) {
    const fallbackText = await response.text();
    pendingBubble.innerHTML = `<p>${formatChatMessage(fallbackText || 'Im Moment konnte keine Antwort gelesen werden.')}</p>`;
    return fallbackText || '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let reply = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';

    parts.forEach(part => {
      const line = part.trim();
      if (!line.startsWith('data:')) return;
      const payload = line.slice(5).trim();

      if (payload === '[DONE]') return;

      try {
        const json = JSON.parse(payload);
        if (typeof json.content === 'string') {
          reply += json.content;
          pendingBubble.innerHTML = `<p>${formatChatMessage(reply)}</p>`;
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      } catch (_) {
        // Ignore malformed partial chunks from the stream.
      }
    });
  }

  return reply;
}

async function sendChatMessage(text) {
  if (!text || chatState.sending || !chatMessages) return;

  const userMessage = text.trim();
  if (!userMessage) return;

  setChatOpen(true);
  setChatBusy(true);

  chatState.messages.push({ role: 'user', content: userMessage });
  appendChatMessage('user', userMessage);

  if (chatInput) chatInput.value = '';

  const pendingBubble = appendChatMessage('assistant', 'Antwort wird vorbereitet ...', true);

  try {
    const response = await fetch(chatEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatState.messages }),
    });

    if (!response.ok) {
      throw new Error('Chat request failed');
    }

    const reply = await readSseResponse(response, pendingBubble);
    pendingBubble.parentElement.classList.remove('chat-message--pending');

    if (!reply.trim()) {
      pendingBubble.innerHTML = '<p>Im Moment dauert die Antwort laenger als erwartet. Bitte versuchen Sie es erneut.</p>';
      return;
    }

    chatState.messages.push({ role: 'assistant', content: reply });
  } catch (_) {
    pendingBubble.parentElement.classList.remove('chat-message--pending');
    pendingBubble.innerHTML = '<p>Der Praxis-Chat ist gerade nicht erreichbar. Bitte versuchen Sie es erneut oder schreiben Sie uns per <a href="https://wa.me/41434434242" target="_blank" rel="noopener" class="chat-inline-link">WhatsApp</a>.</p>';
  } finally {
    setChatBusy(false);
    if (chatInput) chatInput.focus();
  }
}

if (chatFab && chatDrawer) {
  chatFab.addEventListener('click', () => setChatOpen(chatDrawer.hidden));
}

if (chatClose) {
  chatClose.addEventListener('click', () => setChatOpen(false));
}

chatOpenButtons.forEach(button => {
  button.addEventListener('click', () => setChatOpen(true));
});

chatQuestionButtons.forEach(button => {
  button.addEventListener('click', () => {
    const question = button.getAttribute('data-chat-question');
    if (question) sendChatMessage(question);
  });
});

if (chatForm && chatInput) {
  chatForm.addEventListener('submit', event => {
    event.preventDefault();
    sendChatMessage(chatInput.value);
  });

  chatInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChatMessage(chatInput.value);
    }
  });
}

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && chatDrawer && !chatDrawer.hidden) {
    setChatOpen(false);
  }
});

document.addEventListener('click', event => {
  if (!chatDrawer || chatDrawer.hidden || !chatFab) return;
  if (chatDrawer.contains(event.target) || chatFab.contains(event.target)) return;
  if (event.target.closest('[data-chat-open]') || event.target.closest('[data-chat-question]')) return;
  setChatOpen(false);
});

/* ──────────────────────────────────────────
   Google Places — Live Bewertungen
   Trage deinen API Key unten ein.
   Key erstellen: console.cloud.google.com
   → "Places API (New)" aktivieren
   → Credentials → API Key → Domain einschränken
────────────────────────────────────────── */
const GOOGLE_PLACES_API_KEY = ''; // ← API Key hier einfügen

async function fetchGoogleRating() {
  if (!GOOGLE_PLACES_API_KEY) return;
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.rating,places.userRatingCount',
      },
      body: JSON.stringify({
        textQuery: 'StyleYourSmile Weinbergstrasse 62 8006 Zürich',
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return;
    if (place.rating != null) {
      document.querySelectorAll('[data-google-rating]').forEach(el => {
        el.textContent = place.rating.toFixed(1) + ' ★';
      });
    }
    if (place.userRatingCount != null) {
      document.querySelectorAll('[data-google-reviews]').forEach(el => {
        el.textContent = place.userRatingCount + '+';
      });
    }
  } catch (_) {
    // Stille Fehlerbehandlung — statische Fallback-Werte bleiben sichtbar
  }
}

fetchGoogleRating();

/* ──────────────────────────────────────────
   Parking Sticker — pop in, hide on scroll
────────────────────────────────────────── */
const parkingSticker = document.getElementById('parkingSticker');
if (parkingSticker) {
  let stickerShown = false;
  let scrollAtShow = 0;

  // Show after 2.5s delay
  setTimeout(() => {
    stickerShown = true;
    scrollAtShow = window.scrollY;
    parkingSticker.classList.add('visible');
  }, 2500);

  // Hide once user scrolls 400px further from where it appeared
  window.addEventListener('scroll', () => {
    if (!stickerShown) return;
    if (window.scrollY > scrollAtShow + 400) {
      parkingSticker.classList.remove('visible');
      stickerShown = false; // one-shot
    }
  }, { passive: true });
}

/* ──────────────────────────────────────────
   Marquee pause on hover
────────────────────────────────────────── */
const marqueeInner = document.querySelector('.marquee-inner');
if (marqueeInner) {
  const strip = marqueeInner.closest('.marquee-strip');
  if (strip) {
    strip.addEventListener('mouseenter', () => {
      marqueeInner.style.animationPlayState = 'paused';
    });
    strip.addEventListener('mouseleave', () => {
      marqueeInner.style.animationPlayState = 'running';
    });
  }
}
