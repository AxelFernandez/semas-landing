/* =========================================================
   SE +  ·  Interacciones
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Nav: scroll state + burger ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    parallax();
  };
  const burger = document.getElementById('burger');
  if (burger) {
    burger.addEventListener('click', () => document.body.classList.toggle('menu-open'));
    document.querySelectorAll('#menu a').forEach(a =>
      a.addEventListener('click', () => document.body.classList.remove('menu-open')));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
    // Fallback: si algo demora, asegurar que todo sea visible
    setTimeout(() => revealEls.forEach(el => el.classList.add('in')), 2600);
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- Parallax (subtle) ---------- */
  const pxEls = [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;
  function parallax() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      pxEls.forEach(el => {
        const r = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.parallax) || 0.15;
        const offset = (r.top + r.height / 2 - window.innerHeight / 2) * -speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Pillars (propuesta de valor) ---------- */
  document.querySelectorAll('[data-pillar]').forEach(p => {
    p.addEventListener('click', () => {
      const open = p.classList.contains('active');
      document.querySelectorAll('[data-pillar]').forEach(x => x.classList.remove('active'));
      if (!open) p.classList.add('active');
    });
  });

  /* ---------- Accordion (servicios complementarios) ---------- */
  document.querySelectorAll('#acc .acc__item').forEach(item => {
    const head = item.querySelector('.acc__head');
    head.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('#acc .acc__item').forEach(x => x.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });

  /* ---------- Hero video: fallback a blob si el server no soporta range ---------- */
  const heroVideo = document.querySelector('.hero__video');
  if (heroVideo) {
    const tryPlay = () => heroVideo.play().catch(() => {});
    tryPlay();
    // Si tras unos segundos no bufferó nada (server sin range requests),
    // descargamos el archivo completo y lo servimos como blob local.
    setTimeout(() => {
      if (heroVideo.readyState < 2) {
        const srcEl = heroVideo.querySelector('source');
        const url = (srcEl && srcEl.src) || heroVideo.currentSrc || heroVideo.src;
        if (url) {
          fetch(url)
            .then(r => r.blob())
            .then(b => {
              heroVideo.src = URL.createObjectURL(b);
              heroVideo.load();
              tryPlay();
            })
            .catch(() => {});
        }
      }
    }, 3500);
  }

  /* ---------- Carousel (clientes) ---------- */
  const track = document.getElementById('track');
  if (track) {
    const prev = document.getElementById('prev');
    const next = document.getElementById('next');
    const prog = document.getElementById('prog');
    let index = 0;

    const metrics = () => {
      const cards = track.children;
      if (!cards.length) return { step: 0, perView: 1, max: 0 };
      const cardW = cards[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 22;
      const step = cardW + gap;
      const perView = Math.max(1, Math.round((track.parentElement.clientWidth + gap) / step));
      const max = Math.max(0, cards.length - perView);
      return { step, perView, max };
    };

    function update() {
      const { step, max } = metrics();
      index = Math.max(0, Math.min(index, max));
      track.style.transform = 'translateX(' + (-index * step) + 'px)';
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= max;
      if (prog) prog.style.width = (max === 0 ? 100 : ((index / max) * 100)) + '%';
    }

    const nextSlide = () => {
      const { max } = metrics();
      index = index >= max ? 0 : index + 1;
      update();
    };

    let autoplay = null;
    const startAutoplay = () => {
      if (autoplay) return;
      autoplay = setInterval(nextSlide, 3200);
    };
    const stopAutoplay = () => {
      clearInterval(autoplay);
      autoplay = null;
    };
    const restartAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    if (prev) prev.addEventListener('click', () => { index--; update(); restartAutoplay(); });
    if (next) next.addEventListener('click', () => { index++; update(); restartAutoplay(); });
    track.parentElement.addEventListener('mouseenter', stopAutoplay);
    track.parentElement.addEventListener('mouseleave', startAutoplay);
    window.addEventListener('resize', update);
    update();
    startAutoplay();

    /* swipe */
    let sx = 0;
    track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; stopAutoplay(); }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) { index += dx < 0 ? 1 : -1; update(); }
      startAutoplay();
    }, { passive: true });
  }
})();
