/* =============================================
   StyleYourSmile – Main JS
   ============================================= */

'use strict';

/* ----- Sticky Header ----- */
const header = document.getElementById('header');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
};
window.addEventListener('scroll', onScroll, { passive: true });

/* ----- Mobile Menu ----- */
const hamburger = document.getElementById('hamburger');
const nav       = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('mobile-open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-label', isOpen ? 'Menü schliessen' : 'Menü öffnen');
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

// Close on nav link click (mobile)
nav.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('mobile-open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ----- Smooth Scroll for anchor links ----- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72;
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth'
    });
  });
});

/* ----- Active nav link on scroll ----- */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav__link');

const highlightNav = () => {
  const scrollY = window.scrollY + 100;
  sections.forEach(section => {
    const top    = section.offsetTop;
    const bottom = top + section.offsetHeight;
    const id     = section.getAttribute('id');
    if (scrollY >= top && scrollY < bottom) {
      navLinks.forEach(l => l.classList.remove('active'));
      const current = document.querySelector(`.nav__link[href="#${id}"]`);
      if (current) current.classList.add('active');
    }
  });
};
window.addEventListener('scroll', highlightNav, { passive: true });

/* ----- Tabs ----- */
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    tabBtns.forEach(b  => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const panel = document.getElementById(`tab-${target}`);
    if (panel) panel.classList.add('active');
  });
});

/* ----- Accordion ----- */
document.querySelectorAll('.accordion__trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {
    const item    = trigger.closest('.accordion__item');
    const content = item.querySelector('.accordion__content');
    const isOpen  = trigger.getAttribute('aria-expanded') === 'true';

    // Close all
    document.querySelectorAll('.accordion__trigger').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
      t.closest('.accordion__item').querySelector('.accordion__content').classList.remove('open');
    });

    // Open clicked (unless it was already open)
    if (!isOpen) {
      trigger.setAttribute('aria-expanded', 'true');
      content.classList.add('open');
    }
  });
});

/* ----- Reveal on Scroll ----- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

// Apply reveal classes to key elements
const revealTargets = [
  '.feature-card',
  '.about__text-col',
  '.service-item',
  '.team-card',
  '.testimonial-card',
  '.accordion__item',
  '.contact-detail',
  '.footer__col'
];

revealTargets.forEach(selector => {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('reveal');
    if (i % 3 === 1) el.classList.add('reveal-delay-1');
    if (i % 3 === 2) el.classList.add('reveal-delay-2');
    revealObserver.observe(el);
  });
});

/* ----- Contact Form ----- */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const submitBtn = contactForm.querySelector('[type="submit"]');
    const original  = submitBtn.textContent;
    submitBtn.disabled   = true;
    submitBtn.textContent = 'Wird gesendet…';

    // Simulate send (replace with real fetch/API call)
    setTimeout(() => {
      submitBtn.textContent = 'Nachricht gesendet ✓';
      submitBtn.style.background = '#1a6b5e';
      contactForm.reset();
      setTimeout(() => {
        submitBtn.disabled   = false;
        submitBtn.textContent = original;
        submitBtn.style.background = '';
      }, 3000);
    }, 1200);
  });
}

/* ----- Language Switcher (visual only) ----- */
document.querySelectorAll('.header__lang .lang-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.header__lang .lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
document.querySelectorAll('.footer__lang .lang-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.footer__lang .lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});
