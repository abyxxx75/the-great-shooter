/* The flat site's primary navigation: a narrow, numbered vertical rail. */
(() => {
  const collections = [
    { id: 'daybreak', name: 'Daybreak' },
    { id: 'noon', name: 'Noon' },
    { id: 'night', name: 'Night' },
    { id: 'waterfront', name: 'Water Front' },
  ];
  const HOVER_HOLD_MS = 3000;
  const desktop = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const page = location.pathname.split('/').pop() || 'index.html';
  const homePage = page === 'index.html';
  const index = document.createElement('div');
  index.className = 'film-index';
  index.innerHTML = `
    <div class="film-index__edge" aria-hidden="true"></div>
    <button class="film-index__trigger" type="button" aria-expanded="false"
      aria-controls="filmPanel" aria-label="Open navigation">Menu</button>
    <nav class="film-index__panel" id="filmPanel" aria-label="Main navigation" aria-hidden="true" inert>
      <a class="film-index__brand" href="index.html" aria-label="The Great Shooter — home">The Great Shooter</a>
      <div class="film-index__links">
        ${collections.map((item, i) => `
          <a class="film-index__link" href="${item.id}.html"
            ${page === `${item.id}.html` ? 'aria-current="page"' : ''}>
            <span>0${i + 1} ${item.name}</span>
          </a>`).join('')}
        <a class="film-index__link" href="${homePage ? '#about' : 'index.html#about'}"><span>05 About</span></a>
      </div>
      <a class="film-index__mode" href="alt/${page}" aria-label="Switch to the 3D interface" title="Switch to 3D">3D</a>
    </nav>`;
  document.body.append(index);

  const trigger = index.querySelector('.film-index__trigger');
  const panel = index.querySelector('.film-index__panel');
  let holdTimer;
  let exitTimer;
  let pointerInside = false;
  let isOpen = false;
  let restoringFocus = false;

  function clearTimers() {
    clearTimeout(holdTimer);
    clearTimeout(exitTimer);
  }

  function finishClose() {
    if (isOpen) return;
    index.classList.remove('is-closing');
    panel.inert = true;
    panel.setAttribute('aria-hidden', 'true');
  }

  function open({ focus = false } = {}) {
    if (document.documentElement.classList.contains('intro-pending')) return;
    clearTimers();
    isOpen = true;
    panel.inert = false;
    panel.removeAttribute('aria-hidden');
    index.classList.remove('is-closing');
    index.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    if (focus) panel.querySelector('a').focus({ preventScroll: true });
  }

  function close({ restoreFocus = false, immediate = false } = {}) {
    clearTimers();
    isOpen = false;
    index.classList.remove('is-open');
    index.classList.add('is-closing');
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
      restoringFocus = true;
      trigger.focus({ preventScroll: true });
      restoringFocus = false;
    }
    if (immediate) return finishClose();
    const token = reducedMotion.matches ? '--duration-short' : '--duration-xslow';
    exitTimer = setTimeout(finishClose,
      parseFloat(getComputedStyle(index).getPropertyValue(token)));
  }

  function hasKeyboardFocus() {
    return index.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
  }

  function scheduleClose() {
    clearTimeout(holdTimer);
    if (!desktop.matches || !isOpen || pointerInside || hasKeyboardFocus()) return;
    holdTimer = setTimeout(() => {
      if (!pointerInside && !hasKeyboardFocus()) close();
    }, HOVER_HOLD_MS);
  }

  index.addEventListener('pointerenter', event => {
    if (!desktop.matches || event.pointerType === 'touch') return;
    pointerInside = true;
    open();
  });
  index.addEventListener('pointerleave', () => {
    pointerInside = false;
    scheduleClose();
  });
  trigger.addEventListener('click', event => open({ focus: event.detail === 0 }));
  trigger.addEventListener('focus', () => {
    if (!restoringFocus && trigger.matches(':focus-visible')) open();
  });
  panel.addEventListener('focusin', () => open());
  index.addEventListener('focusout', () => queueMicrotask(scheduleClose));
  panel.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    if (link.classList.contains('film-index__mode')) {
      try { localStorage.setItem('tgs-ui', 'alt'); } catch {}
    }
    close({ immediate: true });
  });
  document.addEventListener('keydown', event => {
    if (isOpen && event.key === 'Escape') {
      event.preventDefault();
      close({ restoreFocus: panel.contains(document.activeElement) });
    }
  });
  document.addEventListener('pointerdown', event => {
    if (isOpen && !index.contains(event.target)) close({ immediate: true });
  });
  desktop.addEventListener('change', () => {
    pointerInside = false;
    close({ restoreFocus: panel.contains(document.activeElement), immediate: true });
  });
  window.addEventListener('pagehide', () => close({ immediate: true }));
  document.body.classList.add('film-ready');
})();

/* Enhance photographic links without intercepting navigation or browser history. */
(() => {
  if (!('onpageswap' in window)) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.project-hero__media');
  let pendingCover = null;
  let pendingUrl = '';
  let namedCover = null;

  function reset() {
    hero?.style.removeProperty('view-transition-name');
    namedCover?.style.removeProperty('view-transition-name');
    pendingCover = namedCover = null;
    pendingUrl = '';
  }
  document.addEventListener('click', event => {
    pendingCover = null;
    pendingUrl = '';
    if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
      event.ctrlKey || event.shiftKey || event.altKey || reducedMotion.matches) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download')) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin ||
      !/\/(daybreak|noon|night|waterfront)(?:\.html)?$/.test(destination.pathname)) return;
    const image = link.querySelector('img');
    if (!image) return;
    pendingCover = link.querySelector('.collection-next__media') || image;
    pendingUrl = destination.href;
  });
  window.addEventListener('pageswap', event => {
    if (!event.viewTransition || reducedMotion.matches || !pendingCover ||
      event.activation?.entry?.url !== pendingUrl) return;
    // Only one element in each document may hold the shared transition name.
    if (hero) hero.style.viewTransitionName = 'none';
    namedCover = pendingCover;
    namedCover.style.viewTransitionName = 'collection-cover';
    event.viewTransition.finished.then(reset, reset);
  });
  window.addEventListener('pageshow', reset);
})();
