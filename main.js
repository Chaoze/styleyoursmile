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

if (burger && mainNav) {
  burger.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  // Close on nav link click (mobile)
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      burger.classList.remove('open');
      document.body.style.overflow = '';
    });
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
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('[type="submit"]');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Wird gesendet…';
    setTimeout(() => {
      btn.textContent = 'Nachricht gesendet ✓';
      btn.style.background = '#3d6b61';
      contactForm.reset();
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = orig;
        btn.style.background = '';
      }, 3000);
    }, 1200);
  });
}

/* ──────────────────────────────────────────
   Language switcher (visual)
────────────────────────────────────────── */
document.querySelectorAll('.lang-switch .lang').forEach(btn => {
  btn.addEventListener('click', e => {
    // Only intercept if no real href (same-page links)
    const href = btn.getAttribute('href');
    if (!href || href === '#') {
      e.preventDefault();
      btn.closest('.lang-switch').querySelectorAll('.lang').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  });
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
  let stickerDismissed = false;
  // Show after 2.5s delay
  setTimeout(() => {
    if (!stickerDismissed) parkingSticker.classList.add('visible');
  }, 2500);

  // Hide once user scrolls past ~60% of viewport height
  const hideThreshold = () => window.innerHeight * 0.6;
  window.addEventListener('scroll', () => {
    if (stickerDismissed) return;
    if (window.scrollY > hideThreshold()) {
      parkingSticker.classList.remove('visible');
      stickerDismissed = true;
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
