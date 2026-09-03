/**
 * Interactive SVG Schematics Engine
 * Renders wellbore cross-section, surface tree, choke valve,
 * flowline, separator, and artificial lift hardware (mandrels / ESP pump)
 * with live dynamic pressure callouts and animated fluid streams.
 */

export const Schematics = {
  renderWellboreSVG(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
      pwhp = 250,
      flp = 180,
      pSep = 100,
      pwf = 1950,
      pr = 3200,
      tubingDepth = 8000,
      choke64th = 32,
      liftMode = 'free_flowing',
      glInjRate = 0,
      glInjDepth = 6500,
      espFreq = 60,
      espDepth = 7200,
      isChokeCritical = true,
      tubingRegime = 'Intermittent (Slug)',
      converged = true
    } = data;

    const flowAnimClass = converged ? 'flow-stream' : '';

    let liftSvgElement = '';
    if (liftMode === 'gas_lift') {
      liftSvgElement = `
        <!-- Gas Lift Injection Mandrel -->
        <g transform="translate(195, 230)">
          <rect x="-8" y="-12" width="16" height="24" fill="#3FB950" stroke="#ffffff" stroke-width="1.5" rx="3"/>
          <path d="M -18 0 L -8 0" stroke="#39C5CF" stroke-width="3" stroke-linecap="round"/>
          <text x="-24" y="4" fill="#39C5CF" font-size="10" font-family="Inter" text-anchor="end" font-weight="bold">
            Gas Inj (${glInjRate} MSCF/d)
          </text>
          <polygon points="-8,-4 0,0 -8,4" fill="#3FB950"/>
        </g>
      `;
    } else if (liftMode === 'esp') {
      liftSvgElement = `
        <!-- ESP Pump & Motor Assembly -->
        <g transform="translate(200, 260)">
          <!-- Pump Body -->
          <rect x="-14" y="-30" width="28" height="50" fill="#388BFD" stroke="#ffffff" stroke-width="1.5" rx="4"/>
          <!-- Impeller Stage Stripes -->
          <line x1="-14" y1="-20" x2="14" y2="-20" stroke="#0D1117" stroke-width="2"/>
          <line x1="-14" y1="-10" x2="14" y2="-10" stroke="#0D1117" stroke-width="2"/>
          <line x1="-14" y1="0" x2="14" y2="0" stroke="#0D1117" stroke-width="2"/>
          <line x1="-14" y1="10" x2="14" y2="10" stroke="#0D1117" stroke-width="2"/>
          <!-- Motor Body -->
          <rect x="-12" y="24" width="24" height="36" fill="#1F6FEB" stroke="#388BFD" stroke-width="1.5" rx="3"/>
          <!-- Cable -->
          <path d="M -16 60 L -16 -230" stroke="#D29922" stroke-width="2" stroke-dasharray="3,3"/>
          <text x="22" y="0" fill="#58A6FF" font-size="10" font-family="Inter" font-weight="bold">
            ESP Pump (${espFreq} Hz)
          </text>
        </g>
      `;
    }

    const svgHtml = `
      <svg viewBox="0 0 560 440" class="well-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="casingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#21262D" />
            <stop offset="50%" stop-color="#30363D" />
            <stop offset="100%" stop-color="#21262D" />
          </linearGradient>
          <linearGradient id="tubingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#161B22" />
            <stop offset="50%" stop-color="#388BFD" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#161B22" />
          </linearGradient>
          <linearGradient id="reservoirGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8B5E3C" stop-opacity="0.6"/>
            <stop offset="50%" stop-color="#D29922" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#8B5E3C" stop-opacity="0.6"/>
          </linearGradient>
        </defs>

        <!-- SURFACE GROUND LINE -->
        <line x1="40" y1="70" x2="520" y2="70" stroke="#6E7681" stroke-width="2" stroke-dasharray="6,4"/>
        <text x="45" y="62" fill="#8B949E" font-size="10" font-family="Inter">Surface Elevation (0 ft)</text>

        <!-- RESERVOIR FORMATION ZONE -->
        <rect x="80" y="340" width="240" height="70" fill="url(#reservoirGrad)" rx="6"/>
        <text x="200" y="360" fill="#F0F6FC" font-size="11" font-weight="bold" font-family="Inter" text-anchor="middle">
          Reservoir Sandface (Pr = ${pr} psi)
        </text>

        <!-- CASING STRING -->
        <rect x="160" y="70" width="80" height="300" fill="url(#casingGrad)" stroke="#6E7681" stroke-width="2"/>
        <text x="130" y="180" fill="#8B949E" font-size="9" font-family="Inter" transform="rotate(-90, 130, 180)">
          9-5/8" Casing
        </text>

        <!-- TUBING STRING -->
        <rect x="185" y="70" width="30" height="270" fill="url(#tubingGrad)" stroke="#58A6FF" stroke-width="1.5"/>

        <!-- FLUID FLOW STREAM IN TUBING -->
        <line x1="200" y1="330" x2="200" y2="70" stroke="#3FB950" stroke-width="4" class="${flowAnimClass}"/>

        <!-- PERFORATIONS -->
        <g stroke="#F85149" stroke-width="2">
          <line x1="150" y1="355" x2="170" y2="355"/>
          <line x1="150" y1="370" x2="170" y2="370"/>
          <line x1="150" y1="385" x2="170" y2="385"/>
          <line x1="230" y1="355" x2="250" y2="355"/>
          <line x1="230" y1="370" x2="250" y2="370"/>
          <line x1="230" y1="385" x2="250" y2="385"/>
        </g>

        <!-- PACKER -->
        <rect x="162" y="325" width="23" height="12" fill="#D29922" stroke="#ffffff" stroke-width="1"/>
        <rect x="215" y="325" width="23" height="12" fill="#D29922" stroke="#ffffff" stroke-width="1"/>
        <text x="245" y="334" fill="#D29922" font-size="9" font-family="Inter">Production Packer</text>

        <!-- ARTIFICIAL LIFT COMPONENT -->
        ${liftSvgElement}

        <!-- WELLHEAD CHRISTMAS TREE -->
        <g transform="translate(200, 70)">
          <!-- Tree Body -->
          <rect x="-16" y="-35" width="32" height="35" fill="#30363D" stroke="#F0F6FC" stroke-width="1.5"/>
          <line x1="-25" y1="-18" x2="25" y2="-18" stroke="#F0F6FC" stroke-width="4"/>
          <!-- Master Valve & Crown -->
          <circle cx="0" cy="-28" r="5" fill="#58A6FF"/>
          <circle cx="0" cy="-8" r="5" fill="#58A6FF"/>
          <!-- Flow wing -->
          <path d="M 16 -18 L 80 -18" stroke="#F0F6FC" stroke-width="4"/>
        </g>

        <!-- CHOKE VALVE -->
        <g transform="translate(285, 52)">
          <!-- Choke Bowtie Valve Symbol -->
          <polygon points="0,-10 20,10 20,-10 0,10" fill="#D29922" stroke="#ffffff" stroke-width="1.5"/>
          <rect x="7" y="-18" width="6" height="8" fill="#F0F6FC"/>
          <!-- Choke Callout Tag -->
          <text x="10" y="-24" fill="#D29922" font-size="10" font-family="Inter" font-weight="bold" text-anchor="middle">
            Choke: ${choke64th}/64"
          </text>
          <text x="10" y="24" fill="${isChokeCritical ? '#3FB950' : '#D29922'}" font-size="9" font-family="Inter" text-anchor="middle">
            ${isChokeCritical ? 'Critical Flow' : 'Subcritical'}
          </text>
        </g>

        <!-- FLOWLINE TO SEPARATOR -->
        <g transform="translate(305, 52)">
          <path d="M 0 0 L 100 0 L 100 30 L 140 30" stroke="#39C5CF" stroke-width="3" fill="none" class="${flowAnimClass}"/>
        </g>

        <!-- PRODUCTION SEPARATOR -->
        <g transform="translate(445, 60)">
          <rect x="0" y="0" width="85" height="50" rx="14" fill="#161B22" stroke="#388BFD" stroke-width="2"/>
          <line x1="0" y1="28" x2="85" y2="28" stroke="#388BFD" stroke-width="1" stroke-dasharray="3,3"/>
          <text x="42" y="20" fill="#F0F6FC" font-size="10" font-family="Inter" font-weight="bold" text-anchor="middle">
            Separator
          </text>
          <text x="42" y="40" fill="#8B949E" font-size="9" font-family="Inter" text-anchor="middle">
            ${pSep} psi
          </text>
        </g>

        <!-- PRESSURE CALLOUT LABELS -->
        <!-- WHP -->
        <g transform="translate(140, 25)">
          <rect x="-10" y="-12" width="90" height="20" rx="4" fill="#161B22" stroke="#58A6FF" stroke-width="1"/>
          <text x="35" y="2" fill="#58A6FF" font-size="10" font-family="Inter" font-weight="bold" text-anchor="middle">
            WHP: ${pwhp} psi
          </text>
        </g>

        <!-- FLP -->
        <g transform="translate(320, 20)">
          <rect x="0" y="-10" width="85" height="18" rx="4" fill="#161B22" stroke="#D29922" stroke-width="1"/>
          <text x="42" y="3" fill="#D29922" font-size="10" font-family="Inter" font-weight="bold" text-anchor="middle">
            FLP: ${flp} psi
          </text>
        </g>

        <!-- FBHP -->
        <g transform="translate(240, 310)">
          <rect x="0" y="-12" width="105" height="20" rx="4" fill="#161B22" stroke="#3FB950" stroke-width="1"/>
          <text x="52" y="2" fill="#3FB950" font-size="10" font-family="Inter" font-weight="bold" text-anchor="middle">
            FBHP: ${pwf} psi
          </text>
        </g>

        <!-- FLOW PATTERN BADGE -->
        <g transform="translate(20, 120)">
          <rect x="0" y="0" width="125" height="34" rx="6" fill="#161B22" stroke="#21262D" stroke-width="1"/>
          <text x="8" y="14" fill="#8B949E" font-size="9" font-family="Inter">Tubing Flow Pattern:</text>
          <text x="8" y="28" fill="#39C5CF" font-size="10" font-family="Inter" font-weight="bold">${tubingRegime}</text>
        </g>

      </svg>
    `;

    container.innerHTML = svgHtml;
  }
};
