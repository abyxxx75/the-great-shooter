import { getPlayhead } from './control-playheads.js?v=elements-2';

export function createControlMaterial({ control, fill, stage, reduced, material }) {
  const skin = getPlayhead(material);
  const lava = skin.material === 'lava';
  control.dataset.material = skin.material;
  const current = document.createElement('span');
  current.className = 'film-strip__current';
  current.setAttribute('aria-hidden', 'true');
  fill.append(current);
  const dew = document.createElement('span');
  dew.className = 'film-dew';
  dew.setAttribute('aria-hidden', 'true');
  dew.innerHTML = `<span class="film-playhead__motion">${skin.artwork}</span>`;
  control.append(dew);
  const meniscus = document.createElement('span');
  meniscus.className = 'film-strip__meniscus';
  meniscus.setAttribute('aria-hidden', 'true');
  control.append(meniscus);
  control.classList.add('has-dew');

  const emitters = [];
  let headSmoke;
  if (lava) {
    const smoke = document.createElement('span');
    smoke.className = 'film-lava-smoke';
    smoke.setAttribute('aria-hidden', 'true');
    // A fixed, small set of wisps avoids spawning particles while the gallery scrolls.
    for (let i = 0; i < 9; i++) {
      const emitter = document.createElement('span');
      emitter.className = 'film-lava-smoke__emitter';
      const position = .05 + i * .112;
      emitter.style.left = `${position * 100}%`;
      for (let layer = 0; layer < 2; layer++) {
        const wisp = document.createElement('span');
        wisp.className = 'film-lava-smoke__wisp';
        wisp.style.animationDelay = `${-i * .83 - layer * 4.5}s`;
        if (layer) wisp.classList.add('film-lava-smoke__wisp--curl');
        emitter.append(wisp);
      }
      smoke.append(emitter);
      emitters.push({ element: emitter, position });
    }
    headSmoke = document.createElement('span');
    headSmoke.className = 'film-lava-smoke__emitter film-lava-smoke__head';
    headSmoke.innerHTML = '<span class="film-lava-smoke__wisp"></span><span class="film-lava-smoke__wisp film-lava-smoke__wisp--curl"></span>';
    smoke.append(headSmoke);
    control.append(smoke);
  }

  let visible = !('IntersectionObserver' in window);
  const updateMotion = () => control.classList.toggle('is-material-active', visible && !document.hidden && !reduced.matches);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      updateMotion();
    });
    observer.observe(stage);
  }
  document.addEventListener('visibilitychange', updateMotion);
  reduced.addEventListener('change', updateMotion);
  window.addEventListener('pagehide', () => control.classList.remove('is-material-active'));
  window.addEventListener('pageshow', updateMotion);
  updateMotion();

  return {
    dew, meniscus, headOffset: skin.headOffset,
    body: dew.querySelector('.film-dew__body'),
    light: dew.querySelector('.film-dew__light'),
    paint({ head, progress, travel }) {
      if (!lava) return;
      for (const emitter of emitters) {
        emitter.element.classList.toggle('is-emitting', travel > 0 && progress > emitter.position);
      }
      headSmoke.style.transform = `translate3d(${head}px,0,0)`;
      headSmoke.classList.toggle('is-emitting', travel > 0 && progress > .005);
    },
  };
}
