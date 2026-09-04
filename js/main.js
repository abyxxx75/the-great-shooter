(() => {
  const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!supportsFinePointer) document.body.classList.add('no-custom-cursor');

  /* ---------- word / line splitting for reveal animations ---------- */
  function wrapWords(el) {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.textContent = '';
    text.split(' ').forEach((word, i) => {
      const span = document.createElement('span');
      span.className = 'word';
      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.textContent = word;
      inner.style.setProperty('--d', (i * 0.028) + 's');
      span.appendChild(inner);
      el.appendChild(span);
      el.appendChild(document.createTextNode(' '));
    });
  }
  document.querySelectorAll('[data-reveal-words]').forEach(wrapWords);

  document.querySelectorAll('.split-lines .line').forEach(line => {
    line.querySelectorAll('.word').forEach((word, i) => {
      const text = word.textContent;
      word.textContent = '';
      const inner = document.createElement('span');
      inner.className = 'word-inner';
      inner.textContent = text;
      inner.style.setProperty('--d', (i * 0.05) + 's');
      word.appendChild(inner);
    });
  });

  /* ---------- scroll reveal ---------- */
  const revealTargets = document.querySelectorAll('[data-reveal], [data-reveal-words]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach(el => revealObserver.observe(el));

  /* hero reveals shortly after load, not on scroll */
  function revealHero() {
    document.querySelectorAll('.hero [data-reveal], .hero .split-lines').forEach(el => el.classList.add('is-visible'));
  }
  window.requestAnimationFrame(() => setTimeout(revealHero, 250));

  /* ---------- hero background carousel ---------- */
  const heroMedia = document.getElementById('heroMedia');
  const heroDots = document.getElementById('heroDots');
  const dots = heroDots ? Array.from(heroDots.querySelectorAll('.hero-dots__dot')) : [];

  function setActiveDot(i) {
    dots.forEach((dot, di) => {
      dot.classList.remove('is-active');
      if (di === i) {
        void dot.offsetWidth; // restart the fill animation even when re-landing on the same dot
        dot.classList.add('is-active');
      }
    });
  }

  if (heroMedia) {
    const slides = Array.from(heroMedia.querySelectorAll('img'));
    let slideIndex = slides.findIndex(img => img.classList.contains('is-active'));
    if (slideIndex < 0) slideIndex = 0;
    setActiveDot(slideIndex);
    setInterval(() => {
      slides[slideIndex].classList.remove('is-active');
      slideIndex = (slideIndex + 1) % slides.length;
      slides[slideIndex].classList.add('is-active');
      setActiveDot(slideIndex);
    }, 4200);
  }

  /* ---------- header state + scroll progress ---------- */
  const header = document.getElementById('siteHeader');
  const progress = document.getElementById('progress');

  function onScrollUI() {
    const y = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 16);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    }
  }

  /* ---------- hero parallax ---------- */
  const hero = document.getElementById('hero');
  const heroTitle = document.getElementById('heroTitle');
  const heroBottom = document.getElementById('heroBottom');

  function onScrollParallax() {
    if (!hero) return;
    const h = hero.offsetHeight;
    const p = Math.min(Math.max(window.scrollY / h, 0), 1);
    if (heroMedia) heroMedia.style.transform = `translateY(${p * 30}px)`;
    if (heroTitle) heroTitle.style.transform = `translateY(${p * 90}px)`;
    if (heroTitle) heroTitle.style.opacity = 1 - p * 1.4;
    if (heroBottom) heroBottom.style.transform = `translateY(${p * 50}px)`;
    if (heroBottom) heroBottom.style.opacity = 1 - p * 1.8;
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollUI();
      onScrollParallax();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- custom cursor ---------- */
  if (supportsFinePointer) {
    const cursor = document.getElementById('cursor');
    const label = cursor ? cursor.querySelector('.cursor__label') : null;
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let tx = cx, ty = cy;

    window.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });

    function loop() {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      if (cursor) cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    }
    loop();

    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-cursor]');
      if (!target || !cursor) return;
      const mode = target.getAttribute('data-cursor');
      cursor.classList.remove('is-hover', 'is-active');
      if (mode === 'view' || mode === 'open') {
        cursor.classList.add('is-active');
        if (label) label.textContent = mode.toUpperCase();
      } else {
        cursor.classList.add('is-hover');
      }
    });
    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-cursor]');
      if (!target || !cursor) return;
      const toTarget = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-cursor]');
      if (toTarget === target) return;
      cursor.classList.remove('is-hover', 'is-active');
    });
  }

  /* ---------- mobile menu ---------- */
  const navToggle = document.getElementById('navToggle');
  const menuOverlay = document.getElementById('menuOverlay');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
    });
  }
  if (menuOverlay) {
    menuOverlay.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => document.body.classList.remove('menu-open'));
    });
  }


  /* ---------- back to top ---------- */
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();
