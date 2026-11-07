import { createControlMaterial } from './control-material.js?v=elements-2';

/* Shared gestures and liquid feedback for every photographic collection. */
export function createGalleryControls({ stage, viewport, slider, fill, reduced, getState, seek, move, material = 'lava' }) {
  const control = slider.closest('.film-strip__slider');
  const { dew, body, light, meniscus, headOffset, paint: paintMaterial } = createControlMaterial({
    control, fill, stage, reduced, material,
  });

  const arrows = [-1, 1].map(direction => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `collection-edge collection-edge--${direction < 0 ? 'previous' : 'next'}`;
    button.setAttribute('aria-label', direction < 0 ? 'Previous photograph' : 'Next photograph');
    button.innerHTML = `<svg viewBox="0 0 56 24" fill="none" aria-hidden="true"><path d="M4 12h47M42 3l9 9-9 9"/></svg>`;
    button.addEventListener('click', event => {
      if (button.getAttribute('aria-disabled') !== 'true') move(direction, undefined, event.detail > 0);
    });
    stage.append(button);
    return button;
  });

  let drag = null;
  let sliderPointer = null;
  let pointer = null;
  let touchVisible = false;
  let touchTimer;
  let head = 7;
  let controlWidth = 0;
  let animation = 0;
  let lastTime = 0;
  let lastPosition = null;
  let drive = 0;
  let bend = 0;
  let speed = 0;
  let lastInputAt = 0;
  let suppressClick = false;

  function showDew() {
    const bounds = pointer ? control.getBoundingClientRect() : null;
    const nearHead = pointer && Math.abs(pointer.x - bounds.left - head) < 30
      && pointer.y > bounds.top - 18 && pointer.y < bounds.bottom + 40;
    control.classList.toggle('is-dew-visible', Boolean(nearHead || sliderPointer !== null
      || touchVisible || slider.matches(':focus-visible')));
  }

  function settle(time) {
    animation = 0;
    const dt = Math.min((time - lastTime) / 1000 || 1 / 60, 1 / 30);
    lastTime = time;
    if (reduced.matches || document.hidden) {
      drive = bend = speed = 0;
    } else {
      drive *= Math.exp(-dt / .08);
      // The animate skill's mass 1 / stiffness 100 / damping 10 spring.
      speed += (-100 * (bend - drive) - 10 * speed) * dt;
      bend += speed * dt;
    }
    const amount = Math.min(Math.abs(bend), 1);
    body.style.transform = `rotate(${-bend * 9}deg) scale(${1 + amount * .12},${1 - amount * .07})`;
    light.style.transform = `translate3d(${bend * 2}px,0,0)`;
    meniscus.style.transform = `translate3d(${head - 5}px,0,0) scaleX(${1 + amount * .65})`;
    const alive = Math.abs(drive) + Math.abs(bend) + Math.abs(speed) > .002;
    control.classList.toggle('is-flowing', alive && !reduced.matches);
    if (alive) animation = requestAnimationFrame(settle);
    else {
      body.style.removeProperty('transform');
      light.style.removeProperty('transform');
    }
  }

  function pulse(delta) {
    if (reduced.matches || !delta || document.hidden) return;
    const now = performance.now();
    const elapsed = Math.max(16, Math.min(now - lastInputAt, 80));
    lastInputAt = now;
    drive = Math.max(-1, Math.min(1, delta / elapsed / 3));
    control.classList.toggle('is-reversing', delta < 0);
    if (!animation) {
      lastTime = now;
      animation = requestAnimationFrame(settle);
    }
  }

  function revealForTouch() {
    touchVisible = true;
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => { touchVisible = false; showDew(); }, 1200);
    showDew();
  }
  control.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch') pointer = { x: event.clientX, y: event.clientY };
    showDew();
  });
  control.addEventListener('pointerleave', () => { pointer = null; showDew(); });
  slider.addEventListener('focus', showDew);
  slider.addEventListener('keydown', () => requestAnimationFrame(showDew));
  slider.addEventListener('blur', showDew);
  slider.addEventListener('pointerdown', event => {
    if (!event.isPrimary) { event.preventDefault(); return; }
    if (slider.disabled || event.button !== 0) return;
    sliderPointer = event.pointerId;
    slider.setPointerCapture(event.pointerId);
    if (event.pointerType === 'touch') revealForTouch();
    showDew();
  });
  function releaseSlider(event) {
    if (sliderPointer !== event.pointerId) return;
    sliderPointer = null;
    if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
    if (event.pointerType === 'touch') revealForTouch();
    showDew();
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => slider.addEventListener(type, releaseSlider));

  function endDrag() {
    if (!drag) return;
    const id = drag.id;
    suppressClick = drag.active;
    drag = null;
    viewport.classList.remove('is-dragging');
    document.body.classList.remove('is-gallery-dragging');
    if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id);
  }
  viewport.addEventListener('dragstart', event => event.preventDefault());
  viewport.addEventListener('pointerdown', event => {
    if (drag || !event.isPrimary || event.button !== 0) return;
    const state = getState();
    if (event.pointerType === 'touch' && !state.pinned) return;
    suppressClick = false;
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY,
      position: state.x, active: false };
    if (event.pointerType === 'mouse') viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.active) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
      if (event.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx)) return endDrag();
      drag.active = true;
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('is-dragging');
      document.body.classList.add('is-gallery-dragging');
    }
    if (event.cancelable) event.preventDefault();
    seek(drag.position - dx);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => viewport.addEventListener(type, event => {
    if (drag?.id === event.pointerId) endDrag();
  }));
  viewport.addEventListener('click', event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClick = false;
  }, true);
  viewport.addEventListener('pointerenter', () => document.body.classList.add('is-over-gallery'));
  viewport.addEventListener('pointerleave', () => document.body.classList.remove('is-over-gallery'));
  function cancelInteraction() {
    endDrag();
    const id = sliderPointer;
    sliderPointer = null;
    if (id !== null && slider.hasPointerCapture(id)) slider.releasePointerCapture(id);
    pointer = null;
    touchVisible = false;
    clearTimeout(touchTimer);
    document.body.classList.remove('is-over-gallery');
    showDew();
  }
  window.addEventListener('blur', cancelInteraction);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelInteraction();
  });
  window.addEventListener('resize', endDrag);
  window.addEventListener('wheel', endDrag, { passive: true });
  reduced.addEventListener('change', () => {
    endDrag();
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    drive = bend = speed = 0;
    body.style.removeProperty('transform');
    light.style.removeProperty('transform');
    control.classList.remove('is-flowing');
  });
  window.addEventListener('pagehide', () => {
    cancelInteraction();
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    lastPosition = null;
    drive = bend = speed = 0;
    body.style.removeProperty('transform');
    light.style.removeProperty('transform');
    control.classList.remove('is-flowing');
    document.body.classList.remove('is-over-gallery');
  });

  return {
    measure() { controlWidth = control.clientWidth; },
    paint({ x, progress, travel }) {
      head = 7 + progress * Math.max(0, controlWidth - 14);
      dew.style.transform = `translate3d(${head - headOffset}px,0,0)`;
      fill.style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0 round 3px)`;
      meniscus.style.opacity = progress > 0 ? '1' : '0';
      meniscus.style.transform = `translate3d(${head - 5}px,0,0)`;
      paintMaterial({ head, progress, travel });
      if (lastPosition !== null) pulse(x - lastPosition);
      lastPosition = x;
      arrows[0].setAttribute('aria-disabled', String(x <= 1));
      arrows[1].setAttribute('aria-disabled', String(x >= travel - 1));
      showDew();
    },
  };
}
