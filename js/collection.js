import { createGalleryControls } from './collection-controls.js?v=elements-2';
import { createGalleryEffects } from './gallery-effects.js?v=element-switch-1';

/* Native vertical scrolling moves a bounded horizontal strip; no wheel interception. */
(() => {
  const page = document.querySelector('.collection-page');
  if (!page) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const heroRun = page.querySelector('.collection-hero-stage');
  const hero = page.querySelector('.collection-hero');
  const cover = hero.querySelector('.project-hero__media');
  const coverImage = cover.querySelector('img');
  const title = hero.querySelector('.collection-hero__title');
  const cue = hero.querySelector('.collection-hero__cue');
  const run = page.querySelector('.collection-run');
  const stage = run.querySelector('.collection-gallery');
  const viewport = run.querySelector('.collection-gallery__viewport');
  const track = run.querySelector('.collection-track');
  const frames = [...track.querySelectorAll('.collection-frame')];
  const images = frames.map(frame => frame.querySelector('img'));
  const slider = run.querySelector('.film-strip__range');
  const fill = run.querySelector('.film-strip__fill');
  const perforations = [...run.querySelectorAll('.film-strip__holes')];
  const hint = run.querySelector('#galleryHint');
  const marquee = page.querySelector('.collection-marquee');
  const marqueeTrack = marquee.querySelector('.collection-marquee__track');
  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  let geometry;
  let request = 0;
  let needsMeasure = true;
  let pinned = false;
  const controls = createGalleryControls({
    stage, viewport, slider, fill, reduced, seek, move,
    material: page.dataset.controlMaterial || 'lava',
    getState: () => ({ pinned, x: pinned ? clamp(scrollY - geometry.start, 0, geometry.travel) : viewport.scrollLeft }),
  });
  images.forEach(image => { image.draggable = false; });
  createGalleryEffects({
    stage, reduced, material: page.dataset.controlMaterial || 'lava',
  });

  function measure() {
    const y = window.scrollY;
    const previousMode = pinned;
    const previousProgress = geometry?.travel
      ? (pinned ? clamp(y - geometry.start, 0, geometry.travel) : viewport.scrollLeft) / geometry.travel : 0;
    const wasInGallery = geometry && y >= geometry.start - 1 && y <= geometry.start + geometry.runHeight;
    pinned = !reduced.matches;
    page.classList.toggle('collection-motion', pinned);
    run.classList.toggle('is-pinned', pinned);
    if (pinned) viewport.scrollLeft = 0;
    else track.style.removeProperty('transform');
    const width = viewport.clientWidth;
    const travel = Math.max(0, track.scrollWidth - width);
    // One vertical pixel advances the film one horizontal pixel. The sticky stage
    // releases only when the trailing edge of the last photograph is visible.
    run.style.height = pinned ? `${stage.offsetHeight + travel}px` : '';
    geometry = {
      width, travel,
      runHeight: run.offsetHeight,
      inset: parseFloat(getComputedStyle(track).paddingLeft),
      start: run.getBoundingClientRect().top + window.scrollY,
      heroStart: heroRun.getBoundingClientRect().top + window.scrollY,
      heroTravel: Math.max(1, heroRun.offsetHeight - hero.offsetHeight),
      heroHeight: hero.offsetHeight,
      narrow: width < 768,
      cards: frames.map(frame => ({ left: frame.offsetLeft, width: frame.offsetWidth })),
      marqueeStart: marquee.getBoundingClientRect().top + window.scrollY,
      marqueeHeight: marquee.offsetHeight,
      viewportHeight: window.innerHeight,
    };
    controls.measure();
    if (previousMode !== pinned && wasInGallery) {
      const destination = clamp(previousProgress) * travel;
      if (!pinned) viewport.scrollLeft = destination;
      window.scrollTo({ top: geometry.start + (pinned ? destination : 0), behavior: 'instant' });
    }
    hint.textContent = pinned
      ? 'Scroll down or drag the photographs to browse. Use the film slider or edge arrows to choose a position. Arrow keys also move through the photographs.'
      : 'Swipe or drag horizontally to browse, or use the film slider and edge arrows. Arrow keys move through the photographs.';
    slider.disabled = travel === 0;
    if (!pinned) {
      [cover, coverImage, title, cue, marqueeTrack, ...images].forEach(element => {
        element.style.removeProperty('transform');
        element.style.removeProperty('opacity');
      });
    }
  }

  function paint() {
    const y = window.scrollY;
    const g = geometry;
    const x = pinned ? clamp(y - g.start, 0, g.travel) : viewport.scrollLeft;
    if (pinned) {
      const p = clamp((y - g.heroStart) / g.heroTravel);
      const sx = (g.narrow ? .72 : .34) + (g.narrow ? .28 : .66) * p;
      const sy = (g.narrow ? .42 : .5) + (g.narrow ? .58 : .5) * p;
      const fit = Math.max(sx, sy);
      cover.style.transform = `translate3d(0,${(1 - p) * g.heroHeight * (g.narrow ? .05 : .09)}px,0) scale(${sx},${sy})`;
      // Counter-scale the photograph so the growing frame never stretches it.
      coverImage.style.transform = `scale(${fit / sx},${fit / sy})`;
      title.style.transform = `translate3d(0,${-p * g.heroHeight * .35}px,0)`;
      title.style.opacity = 1 - clamp(p * 2);
      cue.style.opacity = 1 - clamp(p * 3);
      track.style.transform = `translate3d(${-x}px,0,0)`;
      const marqueeProgress = clamp((y + g.viewportHeight - g.marqueeStart) / (g.viewportHeight + g.marqueeHeight));
      marqueeTrack.style.transform = `translate3d(${-marqueeProgress * g.width * .2}px,0,0)`;
    }
    let first = frames.length - 1;
    let last = 0;
    const nearby = y + g.viewportHeight * 2 >= g.start && y < g.start + g.runHeight;
    g.cards.forEach((card, index) => {
      const left = card.left - x;
      if (left + card.width > 0 && left < g.width) {
        first = Math.min(first, index);
        last = Math.max(last, index);
      }
      // Load neighboring frames ahead of time, including on fast scrollbar jumps.
      if (nearby && left > -card.width - g.width && left < g.width * 2) {
        images[index].loading = 'eager';
      }
    });
    const progress = g.travel ? clamp(x / g.travel) : 0;
    const value = String(Math.round(progress * 1000));
    if (slider.value !== value) slider.value = value;
    slider.setAttribute('aria-valuetext', `Photographs ${first + 1} to ${last + 1} of ${frames.length}`);
    controls.paint({ x, progress, travel: g.travel });
    // Only the sprocket pattern moves: the slider remains a fixed, usable target.
    perforations.forEach(strip => {
      strip.style.transform = reduced.matches ? 'none' : `translate3d(${-x % 22}px,0,0)`;
    });
  }

  function schedule(remeasure = false) {
    needsMeasure ||= remeasure;
    if (request) return;
    request = requestAnimationFrame(() => {
      request = 0;
      if (needsMeasure) {
        needsMeasure = false;
        measure();
      }
      paint();
    });
  }

  function seek(destination, smooth = false) {
    destination = clamp(destination, 0, geometry.travel);
    const behavior = smooth && !reduced.matches ? 'smooth' : 'instant';
    if (pinned) window.scrollTo({ top: geometry.start + destination, behavior });
    else viewport.scrollTo({ left: destination, behavior });
    schedule();
  }

  function move(direction, edge, smooth = false) {
    if (!geometry) return;
    const x = pinned ? clamp(scrollY - geometry.start, 0, geometry.travel) : viewport.scrollLeft;
    const anchors = geometry.cards.map(card => clamp(card.left - geometry.inset, 0, geometry.travel));
    const target = direction > 0
      ? anchors.find(anchor => anchor > x + 1) ?? geometry.travel
      : anchors.findLast(anchor => anchor < x - 1) ?? 0;
    // Pan across a panorama before advancing beyond it.
    const destination = edge === 'start' ? 0 : edge === 'end' ? geometry.travel
      : direction > 0 ? Math.min(target, x + geometry.width * .85)
      : Math.max(target, x - geometry.width * .85);
    seek(clamp(destination, 0, geometry.travel), smooth);
  }
  slider.addEventListener('input', () => {
    if (geometry) seek(Number(slider.value) / 1000 * geometry.travel);
  });
  viewport.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1, event.key === 'Home' ? 'start' : event.key === 'End' ? 'end' : undefined);
  });
  window.addEventListener('scroll', () => schedule(), { passive: true });
  viewport.addEventListener('scroll', () => schedule(), { passive: true });
  window.addEventListener('resize', () => schedule(true));
  window.addEventListener('pageshow', () => schedule(true));
  reduced.addEventListener('change', () => schedule(true));
  document.fonts?.ready.then(() => schedule(true));
  document.addEventListener('tgs:intro-ready', () => schedule(true));

  const intro = page.querySelector('.collection-intro');
  if ('IntersectionObserver' in window) {
    if (intro.getBoundingClientRect().top >= innerHeight) intro.classList.add('is-awaiting-reveal');
    const reveal = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      intro.classList.remove('is-awaiting-reveal');
      reveal.disconnect();
    }, { threshold: .15 });
    reveal.observe(intro);
  }
  // Measure immediately so restored scroll positions use the full gallery height.
  measure();
  needsMeasure = false;
  paint();
})();
