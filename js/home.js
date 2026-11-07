/* Homepage choreography. Native scrolling drives one bounded horizontal sequence. */
(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.home-hero');
  const openingMedia = document.querySelector('[data-opening-media]');
  const openingTitle = document.querySelector('.home-hero__title');
  const intro = document.querySelector('.home-intro');
  const statement = document.querySelector('[data-scroll-words]');
  const run = document.querySelector('.chapter-run');
  const stage = run.querySelector('.chapter-stage');
  const track = run.querySelector('.chapter-track');
  const chapters = [...run.querySelectorAll('.chapter')];
  const counter = run.querySelector('.chapter-stage__counter');
  const meter = run.querySelector('.chapter-stage__meter');
  const previous = run.querySelector('[data-chapter-step="-1"]');
  const next = run.querySelector('[data-chapter-step="1"]');
  const pause = document.querySelector('.home-pause');
  const pauseImage = pause.querySelector('img');
  const video = document.querySelector('.home-about video');
  const desktop = matchMedia('(min-width: 768px) and (min-height: 560px) and (hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  let horizontal = false;
  let activeIndex = -1;
  let frame = 0;
  let needsMeasure = true;
  let geometry = {};

  const words = statement.textContent.trim().split(/\s+/).map(word => {
    const span = document.createElement('span');
    span.className = 'home-intro__word';
    span.textContent = word;
    return span;
  });
  statement.replaceChildren(...words.flatMap(word => [word, document.createTextNode(' ')]));
  const scenes = chapters.map(chapter => ({
    chapter,
    title: chapter.querySelector('.chapter__title'),
    image: chapter.querySelector('.chapter__cover img'),
    detail: chapter.querySelector('.chapter__detail'),
    name: chapter.querySelector('h2').textContent,
  }));

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / 04`;
    stage.dataset.theme = chapters[index].dataset.theme;
    previous.setAttribute('aria-disabled', String(index === 0));
    next.setAttribute('aria-disabled', String(index === chapters.length - 1));
    previous.setAttribute('aria-label', index > 0 ? `Previous collection: ${scenes[index - 1].name}` : 'First collection');
    next.setAttribute('aria-label', index < chapters.length - 1 ? `Next collection: ${scenes[index + 1].name}` : 'Last collection');
  }

  function measure() {
    const y = window.scrollY;
    horizontal = desktop.matches && !reduced.matches;
    run.classList.toggle('has-horizontal', horizontal);
    const width = run.clientWidth;
    run.style.setProperty('--chapter-width', `${width}px`);
    const travel = horizontal ? width * (chapters.length - 1) : 0;
    run.style.height = horizontal ? `${stage.offsetHeight + travel}px` : '';
    geometry = {
      viewport: window.innerHeight,
      heroHeight: hero.offsetHeight,
      introTop: intro.getBoundingClientRect().top + y,
      introHeight: intro.offsetHeight,
      start: run.getBoundingClientRect().top + y,
      end: run.getBoundingClientRect().top + y + run.offsetHeight,
      width,
      travel,
      pauseTop: pause.getBoundingClientRect().top + y,
      pauseHeight: pause.offsetHeight,
    };
    if (!horizontal) {
      track.style.removeProperty('transform');
      scenes.forEach(({ chapter, title, image, detail }) => {
        chapter.classList.remove('is-in-view');
        title.style.removeProperty('transform');
        image.style.removeProperty('transform');
        detail.style.removeProperty('transform');
      });
    }
    if (reduced.matches) {
      openingMedia.style.removeProperty('transform');
      openingTitle.style.removeProperty('transform');
      openingTitle.style.removeProperty('opacity');
      pauseImage.style.removeProperty('transform');
      words.forEach(word => word.style.removeProperty('opacity'));
    }
  }

  function paint() {
    const y = window.scrollY;
    const g = geometry;
    if (!reduced.matches) {
      if (y <= g.heroHeight) {
        const progress = clamp(y / g.heroHeight);
        openingMedia.style.transform = `translate3d(0,${progress * 36}px,0)`;
        openingTitle.style.transform = `translate3d(0,${progress * 90}px,0)`;
        openingTitle.style.opacity = 1 - progress * .6;
      }
      if (y + g.viewport >= g.introTop && y <= g.introTop + g.introHeight) {
        const progress = clamp((y + g.viewport * .8 - g.introTop) / (g.viewport * .65));
        words.forEach((word, i) => {
          const wordProgress = clamp(progress * (words.length + 2) - i);
          word.style.opacity = .3 + wordProgress * .7;
        });
      }
      if (y + g.viewport >= g.pauseTop && y <= g.pauseTop + g.pauseHeight) {
        const progress = clamp((y + g.viewport - g.pauseTop) / (g.viewport + g.pauseHeight));
        pauseImage.style.transform = `translate3d(0,${(progress - .5) * 48}px,0)`;
      }
    }
    if (!horizontal) return;
    const x = clamp(y - g.start, 0, g.travel);
    track.style.transform = `translate3d(${-x}px,0,0)`;
    const index = Math.round(x / g.width);
    setActive(index);
    meter.style.transform = `scaleX(${(x / g.width + 1) / chapters.length})`;
    const nearby = y + g.viewport * 1.5 >= g.start && y <= g.end;
    scenes.forEach(({ chapter, title, image, detail }, i) => {
      const local = clamp((x - i * g.width) / g.width, -1, 1);
      const inView = nearby && Math.abs(x / g.width - i) <= 1;
      chapter.classList.toggle('is-in-view', inView);
      if (!inView) return;
      title.style.transform = `translate3d(${local * g.width * .055}px,0,0)`;
      image.style.transform = `translate3d(0,${local * 20}px,0)`;
      detail.style.transform = `translate3d(0,${-local * 28}px,0)`;
      // Warm the current and neighboring covers before they arrive in the frame.
      chapter.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
    });
  }

  function requestPaint(remeasure = false) {
    needsMeasure ||= remeasure;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (needsMeasure) {
        needsMeasure = false;
        measure();
      }
      paint();
    });
  }

  function scrollToChapter(index, smooth = true) {
    if (!horizontal) return;
    window.scrollTo({
      top: geometry.start + index * geometry.width,
      behavior: smooth && !reduced.matches ? 'smooth' : 'instant',
    });
  }

  function alignHash() {
    const index = chapters.findIndex(chapter => `#${chapter.id}` === location.hash);
    if (index >= 0) scrollToChapter(index, false);
  }

  run.querySelectorAll('[data-chapter-step]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-disabled') === 'true') return;
      scrollToChapter(clamp(activeIndex + Number(button.dataset.chapterStep), 0, chapters.length - 1));
    });
  });

  // Existing chapter bookmarks still map to the right frame in the horizontal section.
  document.addEventListener('click', event => {
    if (!horizontal || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    const currentPath = location.pathname.replace(/index\.html$/, '');
    if (url.origin !== location.origin || url.pathname.replace(/index\.html$/, '') !== currentPath) return;
    const index = chapters.findIndex(chapter => `#${chapter.id}` === url.hash);
    if (index < 0) return;
    event.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    scrollToChapter(index);
  });

  // Keyboard navigation brings the focused chapter into view without trapping Tab.
  run.addEventListener('focusin', event => {
    const chapter = event.target.closest('.chapter');
    if (!horizontal || !chapter) return;
    const index = chapters.indexOf(chapter);
    if (index !== activeIndex) scrollToChapter(index, false);
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('[data-home-reveal]').forEach(element => revealObserver.observe(element));
  document.body.classList.add('home-motion');
  function revealOpening() {
    requestAnimationFrame(() => hero.classList.add('is-ready'));
  }
  if (root.classList.contains('intro-pending')) {
    document.addEventListener('tgs:intro-ready', revealOpening, { once: true });
  } else revealOpening();

  let videoInView = false;
  let userPaused = false;
  function updateVideo() {
    if (!videoInView || document.hidden || reduced.matches) {
      video.pause();
    } else if (!userPaused && !navigator.connection?.saveData) {
      video.play().catch(() => { /* Native controls remain available if autoplay is denied. */ });
    }
  }
  video.addEventListener('pause', () => {
    if (videoInView && !document.hidden && !reduced.matches) userPaused = true;
  });
  video.addEventListener('play', () => { userPaused = false; });
  const videoObserver = new IntersectionObserver(entries => {
    videoInView = entries[0].isIntersecting && entries[0].intersectionRatio >= .35;
    updateVideo();
  }, { threshold: .35 });
  videoObserver.observe(video);
  document.addEventListener('visibilitychange', updateVideo);
  window.addEventListener('pagehide', () => {
    videoInView = false;
    video.pause();
  });

  window.addEventListener('scroll', () => requestPaint(), { passive: true });
  window.addEventListener('resize', () => requestPaint(true), { passive: true });
  desktop.addEventListener('change', () => requestPaint(true));
  reduced.addEventListener('change', () => {
    requestPaint(true);
    updateVideo();
  });
  window.addEventListener('hashchange', alignHash);
  window.addEventListener('popstate', alignHash);
  window.addEventListener('pageshow', () => {
    requestPaint(true);
    requestAnimationFrame(alignHash);
  });
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(() => requestPaint(true));
    [hero, intro, stage, pause].forEach(element => resizeObserver.observe(element));
  }
  if (document.fonts) document.fonts.ready.then(() => {
    requestPaint(true);
    requestAnimationFrame(alignHash);
  });
  measure();
  needsMeasure = false;
  paint();
  requestAnimationFrame(alignHash);
})();
