import { createRainAudio } from './rain-audio.js?v=1';
import { getPlayhead } from './control-playheads.js?v=elements-2';

const THEMES = {
  lava: { label: 'Lava rainfall', duration: 2.4 },
  sun: { label: 'Falling sunlight', duration: 4.8 },
  sand: { label: 'Falling sand', duration: 3.6 },
  water: { label: 'Rainfall', duration: 2.1 },
};

export function createGalleryEffects({ stage, reduced, material }) {
  const theme = THEMES[material] || THEMES.lava;
  const skin = getPlayhead(material);
  let enabled = false;
  let visible = false;
  let pageActive = true;
  let soundEnabled = false;
  let audio;
  let soundRequest = 0;
  const ambience = createRainAudio();

  const rain = document.createElement('div');
  rain.className = 'gallery-weather';
  rain.dataset.material = skin.material;
  rain.setAttribute('aria-hidden', 'true');
  // Fixed particle count, with decorative motion independent of gallery dragging.
  for (let i = 0; i < 30; i++) {
    const drop = document.createElement('i');
    drop.className = 'gallery-weather__particle';
    drop.style.left = `${2 + (i * 37.13) % 96}%`;
    drop.style.animationDuration = `${theme.duration + (i % 7) * .3}s`;
    drop.style.animationDelay = `${-(i * .57) % 4.2}s`;
    rain.append(drop);
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'gallery-weather-toggle';
  toggle.dataset.material = skin.material;
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-label', theme.label);
  // The slider and switch share artwork, but each SVG needs unique paint IDs.
  const artwork = skin.artwork.replace(/\sclass="[^"]*"/g, '')
    .replace(/id="([^"]+)"/g, 'id="weather-$1"')
    .replace(/url\(#([^)]+)\)/g, 'url(#weather-$1)');
  toggle.innerHTML = `<span class="gallery-weather-toggle__well" aria-hidden="true">
    <span class="gallery-weather-toggle__scene"></span>
    <svg class="gallery-weather-toggle__power" viewBox="0 0 24 24" fill="none"><path d="M12 3v8M7 5a9 9 0 1 0 10 0"/></svg>
    <span class="gallery-weather-toggle__thumb"><span class="gallery-weather-toggle__element">${artwork}</span></span>
  </span>`;

  const sound = document.createElement('button');
  sound.type = 'button';
  sound.className = 'gallery-ambience';
  sound.setAttribute('aria-label', 'Ambient sound');
  sound.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z"/><path class="gallery-ambience__waves" d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="gallery-ambience__mute" d="m17 10 4 4m0-4-4 4"/></svg>';
  stage.append(rain, toggle, sound);

  function renderSound() {
    sound.setAttribute('aria-pressed', String(soundEnabled));
    sound.title = soundEnabled ? 'Mute ambience' : 'Enable ambience';
  }

  function update() {
    const active = enabled && visible && pageActive && !document.hidden;
    rain.classList.toggle('is-active', active);
    rain.classList.toggle('is-moving', active && !reduced.matches);
    ambience.update(audio, active && soundEnabled);
  }

  function renderToggle() {
    toggle.setAttribute('aria-checked', String(enabled));
    toggle.title = `${theme.label}: ${enabled ? 'on' : 'off'}`;
    update();
  }
  toggle.addEventListener('click', () => { enabled = !enabled; renderToggle(); });

  sound.addEventListener('click', async () => {
    const request = ++soundRequest;
    soundEnabled = !soundEnabled;
    renderSound();
    update();
    if (!soundEnabled) { sound.removeAttribute('aria-busy'); return; }
    sound.setAttribute('aria-busy', 'true');
    try {
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (!AudioEngine) throw new Error('Audio unavailable');
      audio ||= new AudioEngine();
      await audio.resume();
      if (request !== soundRequest) return;
      if (audio.state !== 'running') throw new Error('Audio did not start');
      update();
    } catch {
      if (request !== soundRequest) return;
      soundEnabled = false;
      renderSound();
      sound.title = 'Sound could not start. Click to try again.';
      update();
    } finally {
      if (request === soundRequest) sound.removeAttribute('aria-busy');
    }
  });

  const resize = new ResizeObserver(() => rain.style.setProperty('--weather-travel', `${rain.clientHeight + 50}px`));
  resize.observe(rain);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    update();
  });
  observer.observe(stage);
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  window.addEventListener('pagehide', () => {
    pageActive = false;
    soundEnabled = false;
    soundRequest++;
    sound.removeAttribute('aria-busy');
    renderSound();
    update();
    void audio?.suspend().catch(() => {});
  });
  window.addEventListener('pageshow', () => { pageActive = true; update(); });
  renderSound();
  renderToggle();
}
