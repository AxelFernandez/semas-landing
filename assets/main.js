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
    const originalCards = [...track.children];
    let x = 0;
    let lastTs = 0;
    let paused = false;
    const speed = 0.045; // px/ms: movimiento constante y suave

    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.dataset.clone = 'true';
      track.appendChild(clone);
    });
    track.style.transition = 'none';

    const cycleWidth = () => {
      const firstClone = track.children[originalCards.length];
      return firstClone ? firstClone.offsetLeft : 0;
    };
    const step = () => {
      const first = originalCards[0];
      if (!first) return 0;
      const gap = parseFloat(getComputedStyle(track).gap) || 22;
      return first.getBoundingClientRect().width + gap;
    };
    const normalize = () => {
      const width = cycleWidth();
      if (!width) return;
      while (x <= -width) x += width;
      while (x > 0) x -= width;
    };
    const render = () => {
      const width = cycleWidth();
      normalize();
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      if (prog && width) prog.style.width = ((Math.abs(x) / width) * 100) + '%';
      if (prev) prev.disabled = false;
      if (next) next.disabled = false;
    };
    const tick = ts => {
      if (!lastTs) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;
      if (!paused) x -= speed * dt;
      render();
      requestAnimationFrame(tick);
    };

    if (prev) prev.addEventListener('click', () => { x += step(); render(); });
    if (next) next.addEventListener('click', () => { x -= step(); render(); });
    track.parentElement.addEventListener('mouseenter', () => { paused = true; });
    track.parentElement.addEventListener('mouseleave', () => { paused = false; });
    window.addEventListener('resize', render);
    render();
    requestAnimationFrame(tick);

    /* swipe */
    let sx = 0;
    track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; paused = true; }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) { x += dx < 0 ? -step() : step(); render(); }
      paused = false;
    }, { passive: true });
  }
})();
