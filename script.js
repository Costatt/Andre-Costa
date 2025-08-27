// Helpers
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// Mobile menu
const mobileBtn = $('#mobileMenuBtn');
const mobileMenu = $('#mobileMenu');
if (mobileBtn && mobileMenu) {
  mobileBtn.addEventListener('click', () => {
    const hidden = mobileMenu.hasAttribute('hidden');
    mobileMenu.toggleAttribute('hidden');
    mobileBtn.setAttribute('aria-expanded', String(hidden));
  });
}

// Scroll Reveal: fade/slide in elements as they enter viewport
(() => {
  const items = Array.from(document.querySelectorAll('[data-reveal]'));
  if (!items.length) return;
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { root: null, threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

  items.forEach((el) => io.observe(el));
})();

// Carousel controls (dots + autoplay)
document.querySelectorAll('[data-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('.carousel-track');
  const prev = carousel.querySelector('.prev');
  const next = carousel.querySelector('.next');
  const dotsWrap = carousel.querySelector('.carousel-dots');
  if (!track) return;

  const cards = Array.from(track.querySelectorAll('.card'));
  const gap = 16; // must match CSS gap
  const getStep = () => {
    const card = track.querySelector('.card');
    return card ? Math.round(card.getBoundingClientRect().width + gap) : 300;
  };

  // Create dots (one per card)
  let dots = [];
  if (dotsWrap && cards.length) {
    dotsWrap.innerHTML = '';
    cards.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'carousel-dot';
      b.type = 'button';
      b.setAttribute('aria-label', `Ir ao item ${i + 1}`);
      b.addEventListener('click', () => {
        pauseAuto();
        const left = i * getStep();
        track.scrollTo({ left, behavior: 'smooth' });
      });
      dotsWrap.appendChild(b);
      dots.push(b);
    });
  }

  function updateActiveDot() {
    if (!dots.length) return;
    const idx = Math.round(track.scrollLeft / getStep());
    dots.forEach((d, i) => {
      const active = i === idx;
      d.classList.toggle('active', active);
      d.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  // Nav buttons
  prev && prev.addEventListener('click', () => {
    pauseAuto();
    track.scrollBy({ left: -getStep(), behavior: 'smooth' });
  });
  next && next.addEventListener('click', () => {
    pauseAuto();
    track.scrollBy({ left: getStep(), behavior: 'smooth' });
  });

  // Sync dots on scroll
  track.addEventListener('scroll', () => {
    updateActiveDot();
  });

  // Autoplay with pause on hover/interactions
  let autoTimer = null;
  let pausedUntil = 0;
  const AUTO_MS = 3000;
  function tick() {
    const now = Date.now();
    if (now < pausedUntil) return; // temporary pause
    const maxScroll = track.scrollWidth - track.clientWidth;
    const step = getStep();
    let nextLeft = track.scrollLeft + step;
    if (nextLeft > maxScroll + 2) nextLeft = 0; // loop
    track.scrollTo({ left: nextLeft, behavior: 'smooth' });
  }
  function startAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = setInterval(tick, AUTO_MS);
  }
  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }
  function pauseAuto(ms = 5000) {
    pausedUntil = Date.now() + ms;
  }
  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);
  track.addEventListener('pointerdown', () => pauseAuto());

  // Init
  updateActiveDot();
  startAuto();
});

// Smooth scroll for internal links
$$('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (href && href.length > 1) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (mobileMenu && !mobileMenu.hasAttribute('hidden')) mobileMenu.setAttribute('hidden', '');
      }
    }
  });
});

// WhatsApp buttons fallback
$$('[data-whatsapp]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    // If protocol whatsapp:// is blocked on desktop, fallback to wa.me
    const isDesktop = !/Mobi|Android/i.test(navigator.userAgent);
    if (isDesktop) {
      e.preventDefault();
      window.open('https://wa.me/+5567999444131', '_blank');
    }
  });
});

// Footer year
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Lightbox for portfolio images
const lightbox = $('#lightbox');
const lightboxImg = $('#lightboxImg');
const lightboxCap = $('#lightboxCap');
const lightboxClose = lightbox ? lightbox.querySelector('.modal-close') : null;
const lightPrev = $('#lightPrev');
const lightNext = $('#lightNext');
const lightBadge = $('#lightboxBadge');

let gallery = [];
let currentIndex = -1;
let currentCategory = '';

function setLightboxImage(src, alt) {
  if (!lightboxImg) return;
  lightboxImg.style.opacity = '0';
  lightboxImg.onload = () => {
    lightboxImg.style.opacity = '1';
    lightboxImg.onload = null;
  };
  lightboxImg.src = src;
  lightboxImg.alt = alt || '';
}

function updateLightboxFromIndex() {
  if (!gallery.length || currentIndex < 0) return;
  const img = gallery[currentIndex];
  setLightboxImage(img.src, img.alt);
  lightboxCap.textContent = img.alt || '';
  if (lightBadge) lightBadge.textContent = currentCategory || '';
}

function openLightbox(img) {
  // Support old .grid and new .carousel structure
  const grid = img.closest('.grid');
  const carousel = img.closest('.carousel');
  const container = grid || (carousel && carousel.querySelector('.carousel-track'));
  const titleEl = grid ? grid.previousElementSibling : (carousel ? carousel.previousElementSibling : null);
  const subtitle = titleEl && titleEl.classList.contains('portfolio-subtitle') ? titleEl.textContent.trim() : '';
  currentCategory = subtitle;
  gallery = container ? Array.from(container.querySelectorAll('.card-media img')) : [img];
  currentIndex = Math.max(0, gallery.indexOf(img));
  updateLightboxFromIndex();
  if (typeof lightbox.showModal === 'function') lightbox.showModal();
  else lightbox.setAttribute('open', '');
}

function stepLightbox(dir) {
  if (!gallery.length) return;
  currentIndex = (currentIndex + dir + gallery.length) % gallery.length;
  updateLightboxFromIndex();
}

if (lightbox && lightboxImg && lightboxCap) {
  // Open on card image click
  document.addEventListener('click', (e) => {
    const img = e.target;
    if (img && img.tagName === 'IMG' && img.closest('.card-media')) {
      openLightbox(img);
    }
  });

  // Close handlers
  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightbox.close ? lightbox.close() : lightbox.removeAttribute('open');
    });
  }

  // Prev/Next buttons
  if (lightPrev) lightPrev.addEventListener('click', () => stepLightbox(-1));
  if (lightNext) lightNext.addEventListener('click', () => stepLightbox(1));

  // Close on backdrop click
  lightbox.addEventListener('click', (e) => {
    const rect = lightbox.getBoundingClientRect();
    const clickedInDialog = (
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom
    );
    if (!clickedInDialog) {
      lightbox.close ? lightbox.close() : lightbox.removeAttribute('open');
    }
  });

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && (lightbox.open || lightbox.hasAttribute('open'))) {
      lightbox.close ? lightbox.close() : lightbox.removeAttribute('open');
    }
    if ((lightbox.open || lightbox.hasAttribute('open'))) {
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    }
  });

  // Click-to-zoom inside lightbox
  let zoomed = false;
  if (lightboxImg) {
    lightboxImg.style.cursor = 'zoom-in';
    lightboxImg.addEventListener('click', () => {
      zoomed = !zoomed;
      lightboxImg.style.cursor = zoomed ? 'zoom-out' : 'zoom-in';
      lightboxImg.style.transform = zoomed ? 'scale(1.08)' : 'none';
    });
  }
}
