/* Alternate collection page — a 3D wall of every frame in the collection.
   Grab and drag to look around, scroll to move through it.
   Pure CSS 3D (preserve-3d), no WebGL. */
(() => {
  const world = document.getElementById('world');
  const camera = document.getElementById('camera');
  if (!world || !camera) return;

  const coll = world.dataset.collection;
  const ids = (window.TGS_IMAGES || {})[coll] || [];
  if (!ids.length) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const titleEl = document.querySelector('.collection-title');

  // touch devices pinch rather than scroll
  if (matchMedia('(hover: none)').matches) {
    const hud = document.querySelector('.hud');
    if (hud) hud.innerHTML = '<span><b>Drag</b> to look around</span><span><b>Pinch</b> to zoom</span>';
  }

  /* ---------- place the frames on a cylinder ---------- */
  // The frames sit on a wall that curves away at the edges rather than a
  // closed ring. A full ring would put frames behind the camera, and CSS 3D
  // scales those up instead of culling them — one photo would swallow the
  // screen. Capping the spread keeps every frame in front of the viewer.
  const SPREAD = 150;                       // degrees of wall, centred on the viewer
  const SPREAD_RAD = SPREAD * Math.PI / 180;
  // More bands keeps each row short, which tightens the radius and lets the
  // frames read at a decent size instead of receding into the distance.
  const BANDS = ids.length <= 8 ? 1
              : ids.length <= 22 ? 2
              : ids.length <= 34 ? 3 : 4;
  const PER_BAND = Math.ceil(ids.length / BANDS);

  // Frame sizes come first; the wall is then sized around them so no two
  // frames can touch. Deriving the radius from the widest frame (rather than
  // picking a radius and hoping) is what keeps the grid clear of overlaps.
  const H_MIN = 340, H_STEP = 30, H_STEPS = 5;      // heights 340…460
  const H_MAX = H_MIN + H_STEP * (H_STEPS - 1);
  const W_MAX = Math.round(H_MAX * 0.75);
  const GAP = 1.3;                                  // side-to-side breathing room
  const GAP_Y = 1.14;                               // rows can sit closer than columns
  const JITTER = 26;                                // vertical wobble, kept small

  // Frames step across the arc in (PER_BAND - 1) intervals, so the radius has
  // to satisfy that same divisor — not PER_BAND — or the spacing comes up short.
  const stepRad = PER_BAND > 1 ? SPREAD_RAD / (PER_BAND - 1) : SPREAD_RAD;
  const RADIUS = Math.max(900, (W_MAX * GAP) / stepRad);
  const BAND_H = Math.round(H_MAX * GAP_Y) + JITTER * 2;   // clears the tallest frame plus its wobble

  const tiles = [];
  ids.forEach((id, i) => {
    const band = Math.floor(i / PER_BAND);
    const inBand = i % PER_BAND;
    const bandCount = Math.min(PER_BAND, ids.length - band * PER_BAND);

    // Step by the full-band interval even in a short final band, so the
    // spacing stays identical everywhere instead of stretching to fill.
    const angle = -SPREAD / 2 + inBand * (SPREAD / Math.max(1, PER_BAND - 1))
                + (band % 2 ? SPREAD / (PER_BAND * 2.4) : 0);
    const y = (band - (BANDS - 1) / 2) * BAND_H + (((i * 29) % 7) - 3) * (JITTER / 3);

    const h = H_MIN + ((i * 43) % H_STEPS) * H_STEP;
    const w = Math.round(h * 0.75);

    const tile = document.createElement('figure');
    tile.className = 'tile';
    tile.style.width = w + 'px';
    tile.style.height = h + 'px';
    tile.style.marginLeft = (-w / 2) + 'px';
    tile.style.marginTop = (-h / 2) + 'px';
    // rotateY spins it around the ring; translateZ pushes it out to the wall.
    // The frame ends up facing the centre, where the viewer stands.
    tile.style.transform =
      'translateY(' + y + 'px) rotateY(' + angle + 'deg) translateZ(' + -RADIUS + 'px) rotateY(180deg)';
    // Eager, not lazy: inside a preserve-3d scene the browser works out
    // visibility from the untransformed box, so lazy frames that are plainly
    // on screen never get fetched and stay blank.
    tile.innerHTML =
      '<div class="tile__inner" style="width:100%;height:100%">' +
        '<img decoding="async" alt="' + coll + ' frame" ' +
        'src="../assets/photos/' + id + '">' +
      '</div>';
    camera.appendChild(tile);
    tiles.push(tile);
  });

  /* ---------- camera ---------- */
  let yaw = 0, pitch = 0, zoom = 0;          // current
  let tYaw = 0, tPitch = 0, tZoom = 0;       // target
  // The nearest frames sit at the arc's edges; stop short of them so nothing
  // ever crosses behind the camera.
  const NEAREST = RADIUS * Math.cos(SPREAD_RAD / 2);
  const ZOOM_MIN = -RADIUS * 0.75;           // pushed back, taking in the whole wall
  const ZOOM_MAX = NEAREST * 0.85;           // pushed forward, in among the frames
  const PITCH_LIMIT = 30;
  // let the viewer turn toward either edge of the wall, but not past it
  const YAW_LIMIT = SPREAD / 2 + 12;
  const clampYaw = (v) => Math.max(-YAW_LIMIT, Math.min(YAW_LIMIT, v));

  function apply() {
    camera.style.transform =
      'translateZ(' + zoom + 'px) rotateX(' + pitch + 'deg) rotateY(' + yaw + 'deg)';
  }

  function tick() {
    yaw += (tYaw - yaw) * 0.085;
    pitch += (tPitch - pitch) * 0.085;
    zoom += (tZoom - zoom) * 0.085;
    apply();
    requestAnimationFrame(tick);
  }

  /* ---------- drag to look around ---------- */
  let dragging = false, lastX = 0, lastY = 0, moved = 0;

  world.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0;
    lastX = e.clientX; lastY = e.clientY;
    world.classList.add('is-grabbing');
    try { world.setPointerCapture(e.pointerId); } catch (err) {}
    hideTitle();
  });

  world.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    tYaw = clampYaw(tYaw + dx * 0.16);
    tPitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, tPitch + dy * 0.09));
  });

  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    world.classList.remove('is-grabbing');
    try { world.releasePointerCapture(e.pointerId); } catch (err) {}
  };
  world.addEventListener('pointerup', release);
  world.addEventListener('pointercancel', release);
  world.addEventListener('pointerleave', release);

  /* ---------- wheel to zoom ---------- */
  world.addEventListener('wheel', (e) => {
    e.preventDefault();
    tZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, tZoom - e.deltaY * 0.85));
    hideTitle();
  }, { passive: false });

  /* pinch to zoom / two-finger drag on touch */
  let pinchStart = null;
  world.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart = { d: Math.hypot(dx, dy), z: tZoom };
    }
  }, { passive: true });
  world.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && pinchStart) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      tZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pinchStart.z + (d - pinchStart.d) * 2.4));
    }
  }, { passive: true });
  world.addEventListener('touchend', () => { pinchStart = null; }, { passive: true });

  /* keyboard */
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') tYaw = clampYaw(tYaw - 12);
    if (e.key === 'ArrowRight') tYaw = clampYaw(tYaw + 12);
    if (e.key === 'ArrowUp') tPitch = Math.max(-PITCH_LIMIT, tPitch - 6);
    if (e.key === 'ArrowDown') tPitch = Math.min(PITCH_LIMIT, tPitch + 6);
    if (e.key === '+' || e.key === '=') tZoom = Math.min(ZOOM_MAX, tZoom + 140);
    if (e.key === '-' || e.key === '_') tZoom = Math.max(ZOOM_MIN, tZoom - 140);
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_'].includes(e.key)) hideTitle();
  });

  /* ---------- intro ---------- */
  let titleHidden = false;
  function hideTitle() {
    if (titleHidden || !titleEl) return;
    titleHidden = true;
    titleEl.classList.add('is-gone');
  }

  // start pushed back, then drift in — establishes the space before you touch it
  zoom = ZOOM_MIN;
  tZoom = 0;
  yaw = -22; tYaw = 0;
  apply();
  requestAnimationFrame(tick);

  const order = tiles.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (reduced) {
    order.forEach(i => tiles[i].classList.add('is-in'));
  } else {
    // wall-clock driven so a throttled tab still settles on time
    const SPAN = 1400, start = performance.now();
    let shown = 0;
    const frame = (now) => {
      const want = Math.min(order.length, Math.ceil(((now - start) / SPAN) * order.length));
      while (shown < want) tiles[order[shown++]].classList.add('is-in');
      if (shown < order.length) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    setTimeout(() => { while (shown < order.length) tiles[order[shown++]].classList.add('is-in'); }, SPAN + 2000);
  }

  if (titleEl) setTimeout(() => titleEl.classList.add('is-in'), reduced ? 0 : 420);
  setTimeout(hideTitle, 4200);
})();
