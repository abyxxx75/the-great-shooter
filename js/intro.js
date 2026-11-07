/* Run at the beginning of <body>, before the first paint of the page content. */
(() => {
  const SESSION_KEY = 'tgs-film-intro-seen';
  const MAX_WAIT_MS = 4500;
  const root = document.documentElement;
  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation?.type === 'back_forward' || location.hash) return;
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
  } catch { /* Storage can be unavailable in private browsing. */ }
  if (!('HTMLDialogElement' in window)) return;

  const intro = document.createElement('dialog');
  intro.className = 'film-intro';
  intro.setAttribute('aria-label', 'The Great Shooter — opening frame');
  intro.innerHTML = `
    <div class="film-intro__top">
      <span class="film-intro__meta">The Great Shooter</span>
      <span class="film-intro__meta" aria-hidden="true">Photography / 01</span>
    </div>
    <div class="film-intro__center">
      <div class="film-intro__frame">
        <img class="film-intro__logo" src="assets/logo/icon.svg" alt="" width="224" height="124">
      </div>
      <div class="film-intro__progress" aria-hidden="true"><span></span></div>
      <p class="film-intro__meta" role="status">Preparing the opening frame</p>
    </div>
    <div class="film-intro__bottom">
      <span class="film-intro__meta">Light. Stillness. Character.</span>
      <button class="film-intro__skip" type="button" autofocus>Skip intro ↗</button>
    </div>`;
  document.body.append(intro);
  let finished = false;
  let exitTimer;
  let deadline;
  const progress = intro.querySelector('.film-intro__progress span');

  function removeIntro() {
    clearTimeout(exitTimer);
    intro.close();
    intro.remove();
  }
  function finish(immediate = false) {
    if (finished) {
      if (immediate) removeIntro();
      return;
    }
    finished = true;
    clearTimeout(deadline);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {}
    root.classList.remove('intro-pending');
    intro.classList.add('is-leaving');
    // Free focus and pointer interaction as soon as the photographic reveal starts.
    intro.close();
    intro.setAttribute('open', '');
    intro.inert = true;
    intro.setAttribute('aria-hidden', 'true');
    document.dispatchEvent(new Event('tgs:intro-ready'));
    if (immediate) return removeIntro();
    const token = matchMedia('(prefers-reduced-motion: reduce)').matches
      ? '--duration-short' : '--duration-xslow';
    exitTimer = setTimeout(removeIntro, parseFloat(getComputedStyle(intro).getPropertyValue(token)));
  }

  root.classList.add('intro-pending');
  try { intro.showModal(); } catch {
    root.classList.remove('intro-pending');
    intro.remove();
    return;
  }
  deadline = setTimeout(finish, MAX_WAIT_MS);
  intro.querySelector('button').addEventListener('click', () => finish());
  intro.addEventListener('cancel', event => { event.preventDefault(); finish(); });
  window.addEventListener('pagehide', () => finish(true), { once: true });

  document.addEventListener('DOMContentLoaded', async () => {
    if (finished) return;
    const hero = document.querySelector('.hero__media img, .project-hero__media img');
    if (hero) hero.fetchPriority = 'high';
    const imageReady = !hero ? Promise.resolve() : hero.decode
      ? hero.decode()
      : new Promise(resolve => {
        if (hero.complete) resolve();
        else {
          hero.addEventListener('load', resolve, { once: true });
          hero.addEventListener('error', resolve, { once: true });
        }
      });
    const fontsReady = document.fonts
      ? Promise.all([document.fonts.load('400 16px Gambarino'), document.fonts.load('400 16px Manrope')])
      : Promise.resolve();
    let ready = 0;
    const markReady = () => {
      if (!finished) progress.style.transform = `scaleX(${++ready / 2})`;
    };
    await Promise.allSettled([imageReady, fontsReady].map(promise =>
      promise.then(markReady, () => { /* An unavailable asset must not block entry. */ })));
    if (!finished) {
      intro.querySelector('[role="status"]').textContent = 'Opening the collection';
      // Let the final readiness state paint before the overlay fades.
      requestAnimationFrame(() => requestAnimationFrame(() => finish()));
    }
  }, { once: true });
})();
