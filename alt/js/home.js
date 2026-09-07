/* Alternate home — every frame in the archive on one endless conveyor.
   Boot: frames flash through fast, then settle into the strip.
   Scroll (wheel / trackpad / drag / keys) drives the strip at a steady pace. */
(() => {
  const DATA = window.TGS_IMAGES || {};
  const LABELS = { daybreak: 'Daybreak', noon: 'Noon', night: 'Night', waterfront: 'Water Front' };

  // Flatten every collection, then shuffle so the archive reads as one mixed reel.
  const all = [];
  Object.keys(DATA).forEach(coll => DATA[coll].forEach(id => all.push({ id, coll })));
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  const stage = document.getElementById('stage');
  const track = document.getElementById('track');
  const boot = document.getElementById('boot');
  const bootCount = document.getElementById('bootCount');
  if (!stage || !track) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- layout ---------- */
  const GAP = 30;
  let slides = [];
  let totalW = 0;

  function buildSlides() {
    track.innerHTML = '';
    slides = [];
    totalW = 0;
    const vh = window.innerHeight;
    // Frames vary in height and sit at different vertical offsets, so the strip
    // reads as a hand-placed contact sheet rather than a filmstrip.
    all.forEach((item, i) => {
      const h = Math.round(vh * (0.17 + ((i * 37) % 19) / 100));   // 17%–35% of viewport
      const w = Math.round(h * 0.75);                               // portrait 3:4
      const top = Math.round(vh * (0.20 + ((i * 53) % 44) / 100));  // staggered vertical offset

      const a = document.createElement('a');
      a.className = 'slide';
      a.href = item.coll + '.html';
      a.style.width = w + 'px';
      a.style.top = top + 'px';
      a.innerHTML =
        '<span class="slide__cap">' + LABELS[item.coll] + '</span>' +
        '<span class="slide__frame" style="height:' + h + 'px">' +
          '<img loading="lazy" decoding="async" alt="' + LABELS[item.coll] + ' frame" ' +
          'src="../assets/photos/' + item.id + '">' +
        '</span>';
      track.appendChild(a);
      slides.push({ el: a, x: totalW, w });
      totalW += w + GAP;
    });
    layout();
  }

  /* ---------- endless strip ---------- */
  let offset = 0;      // current scroll position
  let target = 0;      // where the wheel wants us
  const LEAD = 400;    // keep slides mounted a little beyond the edges

  function layout() {
    const vw = window.innerWidth;
    for (const s of slides) {
      // wrap each slide into the visible window
      let x = (s.x - offset) % totalW;
      if (x < -s.w - LEAD) x += totalW;
      if (x > vw + LEAD) x -= totalW;
      s.el.style.transform = 'translate3d(' + x + 'px,0,0)';
    }
  }

  function tick() {
    // ease toward the target for a steady, unhurried glide
    offset += (target - offset) * 0.075;
    if (Math.abs(target - offset) < 0.01) offset = target;
    layout();
    requestAnimationFrame(tick);
  }

  /* ---------- input ---------- */
  function nudge(delta) {
    target += delta;
  }

  window.addEventListener('wheel', (e) => {
    // vertical wheel drives the strip; trackpad horizontal works too
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    nudge(d * 1.1);
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    const step = window.innerWidth * 0.5;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') nudge(step);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') nudge(-step);
  });

  // pointer drag
  let dragging = false, lastX = 0, moved = 0;
  stage.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; moved = 0;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved += Math.abs(dx);
    nudge(-dx * 1.6);
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  // suppress the click if the pointer was actually dragged
  stage.addEventListener('click', (e) => { if (moved > 8) { e.preventDefault(); e.stopPropagation(); } }, true);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildSlides(); }, 180);
  });

  /* ---------- boot: count the archive, land on the mark, then open ----------
     Three beats: the tally runs up, cross-fades into the logo, the mark holds
     for a moment, and only then does the curtain lift. */
  function runBoot(done) {
    if (reduced || !boot) { if (boot) boot.classList.add('is-done'); done(); return; }
    const total = all.length;
    const COUNT = 1100;    // tally
    const HOLD = 900;      // how long the mark sits on screen
    const start = performance.now();
    let marked = false, finished = false;

    const showMark = () => {
      if (marked) return;
      marked = true;
      if (bootCount) bootCount.textContent = String(total);
      boot.classList.add('is-marked');
      setTimeout(finish, HOLD);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      boot.classList.add('is-done');
      done();
    };

    const frame = (now) => {
      const p = Math.min(1, (now - start) / COUNT);
      if (bootCount) bootCount.textContent = String(Math.round(p * total)).padStart(2, '0');
      if (p < 1) requestAnimationFrame(frame);
      else setTimeout(showMark, 140);
    };
    requestAnimationFrame(frame);

    // Failsafes, so a throttled tab can never strand the visitor on the splash.
    setTimeout(showMark, COUNT + 1200);
    setTimeout(finish, COUNT + HOLD + 2400);
  }

  function revealSlides() {
    // frames pop in fast, in a scattered order — the "shuffle" settling
    const order = slides.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (reduced) {
      order.forEach(i => slides[i].el.classList.add('is-in'));
      return;
    }
    // Driven by wall clock rather than a per-item timer, so a throttled or
    // slow tab still settles in about the same time instead of crawling.
    const SPAN = 1500;
    const start = performance.now();
    let shown = 0;
    const frame = (now) => {
      const want = Math.min(order.length, Math.ceil(((now - start) / SPAN) * order.length));
      while (shown < want) slides[order[shown++]].el.classList.add('is-in');
      if (shown < order.length) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    // failsafe: never leave frames hidden
    setTimeout(() => {
      while (shown < order.length) slides[order[shown++]].el.classList.add('is-in');
    }, SPAN + 2000);
  }

  buildSlides();
  requestAnimationFrame(tick);
  runBoot(revealSlides);
})();
