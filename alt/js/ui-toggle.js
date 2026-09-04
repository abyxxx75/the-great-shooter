/* Shared 3D UI toggle — the one bridge between the two interfaces.
   Self-contained: injects its own styles so it looks right in either UI.
   Remembers the choice, so navigating inside a UI keeps you in that UI. */
(() => {
  const KEY = 'tgs-ui';
  const here = (document.currentScript && document.currentScript.dataset.ui) === 'alt' ? 'alt' : 'flat';
  const page = location.pathname.split('/').pop() || 'index.html';
  const target = here === 'alt' ? '../' + page : 'alt/' + page;

  const CSS = `
.ui-toggle{
  display:flex; align-items:center; gap:.55rem;
  perspective:520px; z-index:500;
  font-family:inherit; user-select:none; cursor:pointer;
  -webkit-tap-highlight-color:transparent;
}
.ui-toggle--fixed{ position:fixed; top:var(--pad,1.4rem); right:var(--pad,1.4rem); }
/* Inline in the flat header: inherit its colour so it tracks the
   light-over-hero / dark-when-scrolled states automatically. */
.ui-toggle--inline{ position:relative; margin-left:1.4rem; color:inherit; }
.ui-toggle__label{
  font-size:.58rem; letter-spacing:.16em; text-transform:uppercase; font-weight:600;
  white-space:nowrap; transition:opacity .35s ease;
  opacity:.55;
}
.ui-toggle--fixed .ui-toggle__label{ color:var(--fg, currentColor); }
.ui-toggle:hover .ui-toggle__label{ opacity:1; }
.ui-toggle__cube{
  position:relative; width:44px; height:25px;
  transform-style:preserve-3d;
  transform:translateZ(-12.5px) rotateX(0deg);
  transition:transform .8s cubic-bezier(.62,.03,.2,1.04);
}
.ui-toggle:hover .ui-toggle__cube{ transform:translateZ(-12.5px) rotateX(-14deg); }
.ui-toggle.is-flipped .ui-toggle__cube,
.ui-toggle.is-flipped:hover .ui-toggle__cube{ transform:translateZ(-12.5px) rotateX(-90deg); }
.ui-toggle__face{
  position:absolute; inset:0;
  display:flex; align-items:center; justify-content:center;
  font-size:.56rem; letter-spacing:.13em; text-transform:uppercase; font-weight:700;
  border:1px solid color-mix(in srgb, currentColor 34%, transparent);
  border-radius:3px;
  background:color-mix(in srgb, currentColor 12%, transparent);
  color:currentColor;
  backdrop-filter:blur(10px) saturate(140%);
  -webkit-backdrop-filter:blur(10px) saturate(140%);
}
.ui-toggle--fixed .ui-toggle__face{
  color:var(--fg, #fff);
  border-color:var(--line, rgba(255,255,255,.2));
  background:color-mix(in srgb, var(--bg, #000) 55%, transparent);
}
.ui-toggle__face--front{ transform:translateZ(12.5px); }
.ui-toggle__face--bottom{ transform:rotateX(90deg) translateZ(12.5px); }
.ui-toggle:focus-visible{ outline:2px solid var(--accent, #888); outline-offset:6px; border-radius:4px; }
@media (max-width:720px){ .ui-toggle__label{ display:none; } }
@media (prefers-reduced-motion:reduce){ .ui-toggle__cube{ transition:none; } }
`;

  function build() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // In the flat UI there is a real header — sit inside it, at the right end.
    // In the alternate UI the chrome is floating, so pin to the top right.
    const header = document.querySelector('.site-header');
    const other = here === 'alt' ? 'Flat' : 'Immersive';

    const el = document.createElement('div');
    el.className = 'ui-toggle ' + (header ? 'ui-toggle--inline' : 'ui-toggle--fixed');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Switch to the ' + other + ' interface');
    el.title = 'Switch to the ' + other + ' interface';
    if (!header) el.setAttribute('data-cursor', '');
    el.innerHTML =
      '<span class="ui-toggle__label">' + (here === 'alt' ? 'Immersive' : 'Flat') + '</span>' +
      '<span class="ui-toggle__cube">' +
        '<span class="ui-toggle__face ui-toggle__face--front">' + (here === 'alt' ? '3D' : '2D') + '</span>' +
        '<span class="ui-toggle__face ui-toggle__face--bottom">' + (here === 'alt' ? '2D' : '3D') + '</span>' +
      '</span>';

    let going = false;
    const go = () => {
      if (going) return;
      going = true;
      try { localStorage.setItem(KEY, here === 'alt' ? 'flat' : 'alt'); } catch (e) {}
      el.classList.add('is-flipped');           // let the cube finish its turn first
      setTimeout(() => { location.href = target; }, 420);
    };
    el.addEventListener('click', go);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });

    if (header) {
      const burger = header.querySelector('.nav-toggle');
      if (burger) header.insertBefore(el, burger);
      else header.appendChild(el);
    } else {
      document.body.appendChild(el);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
