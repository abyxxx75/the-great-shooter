/* Theme artwork stays separate from gallery gestures and progress. */
const WATER_PLAYHEAD = `<svg class="film-dew__body" viewBox="0 0 40 64" fill="none">
    <defs>
      <radialGradient id="dew-volume" cx=".5" cy=".78" r=".76">
        <stop stop-color="#34e8ff"/>
        <stop offset=".38" stop-color="#05bde9"/>
        <stop offset=".68" stop-color="#086bc0"/>
        <stop offset=".88" stop-color="#063e98"/>
        <stop offset="1" stop-color="#061967"/>
      </radialGradient>
      <linearGradient id="dew-rim" x1="20" y1="3" x2="20" y2="61" gradientUnits="userSpaceOnUse">
        <stop stop-color="#071667"/><stop offset=".65" stop-color="#0756b0"/><stop offset="1" stop-color="#15bce9"/>
      </linearGradient>
      <linearGradient id="dew-core" x1="20" y1="15" x2="20" y2="54" gradientUnits="userSpaceOnUse">
        <stop stop-color="#064599"/><stop offset="1" stop-color="#09d7ef" stop-opacity=".45"/>
      </linearGradient>
      <linearGradient id="dew-gloss" x1="20" y1="17" x2="10" y2="46" gradientUnits="userSpaceOnUse">
        <stop stop-color="#20c0ed" stop-opacity="0"/><stop offset=".55" stop-color="#b7f5ff" stop-opacity=".8"/><stop offset="1" stop-color="white"/>
      </linearGradient>
      <linearGradient id="dew-crescent" x1="24" y1="23" x2="19" y2="55" gradientUnits="userSpaceOnUse">
        <stop stop-color="#79dbff" stop-opacity="0"/><stop offset=".65" stop-color="#ecfcff"/><stop offset="1" stop-color="white"/>
      </linearGradient>
    </defs>
    <path d="M20 3C16 18 9 29 5 39C-2 53 7 61 20 61S42 53 35 39C31 29 24 18 20 3Z" fill="url(#dew-volume)" stroke="url(#dew-rim)" stroke-width=".7"/>
    <path d="M20 13C18 27 12 35 14 43C15 50 21 54 27 51C37 44 27 28 20 13Z" fill="url(#dew-core)"/>
    <g class="film-dew__light">
      <path d="M19 16C16 26 9 34 7 41C5 48 8 49 11 45C13 40 13 30 19 16Z" fill="url(#dew-gloss)"/>
      <ellipse cx="11" cy="48" rx="1.2" ry="2.1" fill="white"/>
      <path d="M24 22C28 32 34 42 31 48C28 55 17 58 9 51C17 56 27 52 29 47C33 39 27 30 24 22Z" fill="url(#dew-crescent)"/>
    </g>
    <path d="M7 52C14 60 29 59 34 49" stroke="#19ddff" stroke-opacity=".75" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

const FIRE_PLAYHEAD = `<svg class="film-dew__body" viewBox="0 0 40 64" fill="none">
  <defs>
    <linearGradient id="fire-outer" x1="20" y1="4" x2="20" y2="62" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffad30"/><stop offset=".45" stop-color="#ff6c13"/><stop offset="1" stop-color="#c82c06"/>
    </linearGradient>
    <linearGradient id="fire-inner" x1="19" y1="23" x2="20" y2="61" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffe890"/><stop offset=".5" stop-color="#ffc02f"/><stop offset="1" stop-color="#fff2b5"/>
    </linearGradient>
  </defs>
  <path class="film-fire__tongue" d="M21 61C4 62 0 50 5 38c2 7 6 9 6 9-6-20 12-25 8-44 17 12 3 25 12 34 1-6 0-10 0-10 13 15 14 33-10 34Z" fill="url(#fire-outer)"/>
  <path class="film-fire__tongue film-fire__tongue--side" d="M10 56C-1 46 6 34 3 27c10 9 7 16 12 20l-5 9Zm18 3c15-11 3-22 9-36-12 11-6 21-13 29l4 7Z" fill="#ff7b16" fill-opacity=".85"/>
  <g class="film-dew__light">
    <path class="film-fire__core" d="M20 61c-12 0-14-11-8-20 1 6 4 7 4 7-3-11 9-17 7-29 9 12 0 17 4 26 3-3 4-8 4-8 7 14 0 24-11 24Z" fill="url(#fire-inner)"/>
    <path class="film-fire__core film-fire__core--white" d="M20 61c-7 0-9-7-4-13l4-11c5 9 1 10 5 15 3 5 0 9-5 9Z" fill="#fff7d3"/>
  </g>
</svg>`;

const SUN_PLAYHEAD = `<svg class="film-dew__body" viewBox="0 0 64 64" fill="none">
  <defs>
    <radialGradient id="solar-corona">
      <stop offset=".4" stop-color="#ffe190" stop-opacity=".7"/><stop offset=".72" stop-color="#ffb238" stop-opacity=".23"/><stop offset="1" stop-color="#ff9d1a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="solar-volume" cx=".37" cy=".33" r=".73">
      <stop stop-color="#fff4c7"/><stop offset=".3" stop-color="#ffdf71"/><stop offset=".68" stop-color="#ffb631"/><stop offset=".91" stop-color="#e87c13"/><stop offset="1" stop-color="#c9550a"/>
    </radialGradient>
    <pattern id="solar-granules" width="7" height="6" patternUnits="userSpaceOnUse">
      <path d="m1 1 2 1m1 2 2-1m-4 2 1 .5" stroke="#ff8e16" stroke-opacity=".35" stroke-width=".6"/>
      <circle cx="5" cy="1" r=".6" fill="#fff2b3" fill-opacity=".45"/>
    </pattern>
  </defs>
  <circle class="film-sun__halo" cx="32" cy="32" r="32" fill="url(#solar-corona)"/>
  <g class="film-sun__rays" stroke="#ffda7a" stroke-width=".8" stroke-linecap="round" opacity=".65">
    <path d="M32 4v5m0 46v5M4 32h5m46 0h5M12.2 12.2l3.6 3.6m32.4 32.4 3.6 3.6m0-39.6-3.6 3.6M15.8 48.2l-3.6 3.6M21 5.5l2 5m18 43 2 5M5.5 43l5-2m43-18 5-2M5.5 21l5 2m43 18 5 2M43 5.5l-2 5m-18 43-2 5"/>
  </g>
  <circle cx="32" cy="32" r="21" fill="url(#solar-volume)" stroke="#ffda6f" stroke-width=".7"/>
  <circle cx="32" cy="32" r="20.6" fill="url(#solar-granules)"/>
  <g class="film-dew__light">
    <path d="M18 23c5-10 18-11 25-4" stroke="#fff5cb" stroke-opacity=".48" stroke-width="1.4" stroke-linecap="round"/>
    <path d="m25 36 2-1 1 2-2 1Zm13-11 1-1 1 2-1 1Z" fill="#d57611" fill-opacity=".5"/>
  </g>
</svg>`;

const MOON_PLAYHEAD = `<svg class="film-dew__body" viewBox="0 0 64 64" fill="none">
  <defs>
    <radialGradient id="moon-halo">
      <stop offset=".55" stop-color="#dde8ef" stop-opacity=".25"/><stop offset="1" stop-color="#dde8ef" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moon-volume" cx=".31" cy=".25" r=".85">
      <stop stop-color="#f2f0e6"/><stop offset=".39" stop-color="#cfceca"/><stop offset=".73" stop-color="#8f969b"/><stop offset="1" stop-color="#323f4d"/>
    </radialGradient>
    <radialGradient id="moon-crater" cx=".45" cy=".6" r=".6">
      <stop stop-color="#525e68" stop-opacity=".7"/><stop offset=".7" stop-color="#81888c" stop-opacity=".45"/><stop offset="1" stop-color="#e2e0d7" stop-opacity=".7"/>
    </radialGradient>
    <clipPath id="moon-disc"><circle cx="32" cy="32" r="25"/></clipPath>
  </defs>
  <circle class="film-moon__halo" cx="32" cy="32" r="32" fill="url(#moon-halo)"/>
  <circle cx="32" cy="32" r="25" fill="url(#moon-volume)" stroke="#d9e0e3" stroke-opacity=".55" stroke-width=".6"/>
  <g clip-path="url(#moon-disc)">
    <path d="m23 12 9-1 5 6-4 8-8 3-8-4-1-6Zm15 17 9-6 7 7-2 8-10 2-6-6ZM16 30l7 2 4 8-7 5-8-4-1-7Z" fill="#6d7980" fill-opacity=".27"/>
    <g fill="url(#moon-crater)">
      <ellipse cx="20" cy="19" rx="4" ry="3.4"/><ellipse cx="35" cy="19" rx="3" ry="3.3"/>
      <ellipse cx="44" cy="30" rx="5" ry="4"/><ellipse cx="21" cy="36" rx="5" ry="4.5"/>
      <ellipse cx="34" cy="43" rx="4" ry="3.7"/><ellipse cx="15" cy="28" rx="2.2" ry="3"/>
      <ellipse cx="43" cy="46" rx="2.5" ry="3"/><ellipse cx="30" cy="30" rx="2.5" ry="2.1"/>
      <ellipse cx="26" cy="49" rx="3" ry="2"/><ellipse cx="48" cy="20" rx="2.1" ry="3"/>
      <circle cx="26" cy="15" r="1.5"/><circle cx="38" cy="32" r="1.2"/><circle cx="29" cy="39" r="1.6"/>
    </g>
    <g stroke="#e5e2d7" stroke-opacity=".43" stroke-width=".6" stroke-linecap="round">
      <path d="m33 43-6-8m7 9-9 1m10 0 4 8m-4-9 10-4m-10 4 7-11M18 36l-5-3m8 4 4-6m-4 7 2 7"/>
    </g>
    <g fill="#ebeadf" fill-opacity=".6">
      <circle cx="28" cy="23" r=".8"/><circle cx="38" cy="37" r=".7"/><circle cx="18" cy="45" r=".6"/>
      <circle cx="41" cy="15" r=".7"/><circle cx="13" cy="24" r=".6"/><circle cx="49" cy="35" r=".9"/>
    </g>
    <g class="film-dew__light">
      <path d="M12 25c3-11 13-17 24-15" stroke="#fffdf0" stroke-opacity=".45" stroke-width="1" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;

const PLAYHEADS = {
  lava: { material: 'lava', artwork: FIRE_PLAYHEAD, headOffset: 11 },
  sun: { material: 'sun', artwork: SUN_PLAYHEAD, headOffset: 18 },
  sand: { material: 'sand', artwork: MOON_PLAYHEAD, headOffset: 16 },
  water: { material: 'water', artwork: WATER_PLAYHEAD, headOffset: 10 },
};

export function getPlayhead(material) {
  return Object.hasOwn(PLAYHEADS, material) ? PLAYHEADS[material] : PLAYHEADS.lava;
}
