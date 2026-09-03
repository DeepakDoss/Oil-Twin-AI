/**
 * Gas-Lift Unloading Process Simulator
 * Step-by-step visual animation and pressure evolution of well unloading.
 */
import { UnloadingEngine } from '../physics/unloading_engine.js';

export const GLUnloading = {
  currentStageIndex: 0,
  isPlaying: false,
  timer: null,

  setStage(index) {
    this.currentStageIndex = Math.max(0, Math.min(index, UnloadingEngine.STAGES.length - 1));
    this.renderView();
  },

  nextStage() {
    if (this.currentStageIndex < UnloadingEngine.STAGES.length - 1) {
      this.setStage(this.currentStageIndex + 1);
    } else {
      this.pause();
    }
  },

  prevStage() {
    if (this.currentStageIndex > 0) {
      this.setStage(this.currentStageIndex - 1);
    }
  },

  play() {
    this.isPlaying = true;
    const playBtn = document.getElementById('btn-play-unloading');
    if (playBtn) playBtn.innerHTML = '⏸ Pause';

    this.timer = setInterval(() => {
      if (this.currentStageIndex < UnloadingEngine.STAGES.length - 1) {
        this.nextStage();
      } else {
        this.setStage(0); // loop
      }
    }, 2800);
  },

  pause() {
    this.isPlaying = false;
    if (this.timer) clearInterval(this.timer);
    const playBtn = document.getElementById('btn-play-unloading');
    if (playBtn) playBtn.innerHTML = '▶ Auto Play';
  },

  renderView() {
    const root = document.getElementById('main-content');
    if (!root) return;

    const stage = UnloadingEngine.getStage(this.currentStageIndex);
    const totalStages = UnloadingEngine.STAGES.length;

    // Fluid level in SVG (scale 0-8200 ft to SVG Y 70-340)
    const fluidY = 70 + (stage.annulusFluidLevelFt / 8200) * 270;

    root.innerHTML = `
      <div style="max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px;">
        <div class="home-hero" style="margin-bottom: 0;">
          <h1>Gas-Lift Unloading Process</h1>
          <p>Step-by-step interactive sequence: kill fluid displacement, U-tubing, unloading valve sequencing, and final continuous injection.</p>
        </div>

        <div style="display: grid; grid-template-columns: 360px 1fr; gap: 18px; min-height: 540px;">
          <!-- Left: Stage Info, Controls & Valve Status List -->
          <div class="controls-panel">
            <div class="controls-header" style="justify-content: space-between;">
              <span style="font-weight: 600; font-size: 13.5px; color: #F0F6FC;">Sequence Control</span>
              <span style="font-size: 12px; color: var(--accent-blue); font-weight: 600;">
                Stage ${stage.id + 1} of ${totalStages}
              </span>
            </div>

            <div class="controls-scroll" style="gap: 14px;">
              <!-- Playback Controls -->
              <div style="display: flex; gap: 8px;">
                <button id="btn-prev-unloading" class="btn btn-secondary" style="flex:1;" onclick="window.App.prevUnloadingStage()">⏮ Prev</button>
                <button id="btn-play-unloading" class="btn btn-primary" style="flex:1.2;" onclick="window.App.togglePlayUnloading()">
                  ${this.isPlaying ? '⏸ Pause' : '▶ Auto Play'}
                </button>
                <button id="btn-next-unloading" class="btn btn-secondary" style="flex:1;" onclick="window.App.nextUnloadingStage()">Next ⏭</button>
              </div>

              <!-- Stage Description Box -->
              <div class="param-group" style="background: rgba(56, 139, 253, 0.08); border-color: rgba(56, 139, 253, 0.3);">
                <div style="font-weight: 700; font-size: 14px; color: #F0F6FC; margin-bottom: 6px;">
                  ${stage.title}
                </div>
                <div style="font-size: 12.5px; color: #8B949E; line-height: 1.5;">
                  ${stage.desc}
                </div>
              </div>

              <!-- Live Pressures Box -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="kpi-box" style="padding: 10px;">
                  <span class="kpi-label">Casing Pressure</span>
                  <span class="kpi-value" style="color: #39C5CF;">${stage.pCasing} <span class="kpi-unit">psi</span></span>
                </div>
                <div class="kpi-box" style="padding: 10px;">
                  <span class="kpi-label">Tubing Pressure</span>
                  <span class="kpi-value" style="color: #58A6FF;">${stage.pTubingHead} <span class="kpi-unit">psi</span></span>
                </div>
              </div>

              <!-- Valve Status Table -->
              <div class="param-group">
                <div class="group-title" style="margin-bottom: 8px;">Gas Lift Valves Status</div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  ${stage.valves.map((v, i) => {
                    const badgeColor = v.state === 'injecting' ? '#3FB950' : v.state === 'open' ? '#D29922' : '#6E7681';
                    const badgeBg = v.state === 'injecting' ? 'rgba(63, 185, 80, 0.15)' : v.state === 'open' ? 'rgba(210, 153, 34, 0.15)' : 'rgba(110, 118, 129, 0.15)';
                    return `
                      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: #0D1117; border-radius: 6px; font-size: 11.5px;">
                        <div>
                          <strong style="color: #F0F6FC;">${v.type}</strong>
                          <span style="color: #6E7681; margin-left: 4px;">(${v.depth} ft)</span>
                        </div>
                        <span style="padding: 2px 8px; border-radius: 10px; font-weight: 600; color: ${badgeColor}; background: ${badgeBg}; text-transform: capitalize;">
                          ${v.state}
                        </span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          </div>

          <!-- Right: Animated Cross-Section SVG -->
          <div class="viz-panel">
            <div class="controls-header">
              <span style="font-weight: 600; font-size: 13.5px; color: #F0F6FC;">Annulus Liquid Displacement & Injection Schematic</span>
              <span style="font-size: 12px; color: #8B949E;">Annulus Liquid Level: <strong>${stage.annulusFluidLevelFt} ft</strong></span>
            </div>

            <div class="viz-content" style="display: flex; align-items: center; justify-content: center; background: #090D16;">
              <svg viewBox="0 0 540 420" style="width: 100%; height: 100%; max-height: 440px;">
                <!-- Ground Surface -->
                <line x1="30" y1="70" x2="510" y2="70" stroke="#30363D" stroke-width="2" stroke-dasharray="4,4"/>
                <text x="35" y="62" fill="#6E7681" font-size="10" font-family="Inter">Surface Elevation (0 ft)</text>

                <!-- Casing -->
                <rect x="180" y="70" width="180" height="320" fill="#161B22" stroke="#484F58" stroke-width="2"/>

                <!-- Gas in Annulus (above fluid level) -->
                <rect x="182" y="70" width="176" height="${Math.max(0, fluidY - 70)}" fill="rgba(57, 197, 207, 0.15)"/>
                ${stage.pCasing > 0 ? `
                  <text x="210" y="${Math.min(fluidY - 10, 110)}" fill="#39C5CF" font-size="10" font-weight="bold" font-family="Inter">
                    Injected Gas (${stage.pCasing} psi)
                  </text>
                ` : ''}

                <!-- Heavy Kill Brine in Annulus (below fluid level) -->
                <rect x="182" y="${fluidY}" width="176" height="${Math.max(0, 390 - fluidY)}" fill="rgba(56, 139, 253, 0.25)"/>
                ${stage.annulusFluidLevelFt < 8200 ? `
                  <line x1="180" y1="${fluidY}" x2="360" y2="${fluidY}" stroke="#58A6FF" stroke-width="2" stroke-dasharray="3,3"/>
                  <text x="368" y="${fluidY + 4}" fill="#58A6FF" font-size="10" font-family="Inter">
                    Fluid Level: ${stage.annulusFluidLevelFt} ft
                  </text>
                ` : ''}

                <!-- Central Tubing String -->
                <rect x="250" y="70" width="40" height="300" fill="#0D1117" stroke="#58A6FF" stroke-width="2"/>

                <!-- Tubing Fluid Flow Stream (when injecting) -->
                ${stage.activeValveIndex >= 0 ? `
                  <line x1="270" y1="360" x2="270" y2="70" stroke="#3FB950" stroke-width="4" class="flow-stream"/>
                ` : `
                  <line x1="270" y1="360" x2="270" y2="70" stroke="#388BFD" stroke-width="4"/>
                `}

                <!-- Unloading Valves & Mandrels along Tubing -->
                ${stage.valves.map((v, i) => {
                  const yPos = 70 + (v.depth / 8200) * 270;
                  const isInj = v.state === 'injecting';
                  const isOp = v.state === 'open';
                  const valveColor = isInj ? '#3FB950' : isOp ? '#D29922' : '#484F58';

                  return `
                    <g transform="translate(236, ${yPos})">
                      <!-- Mandrel Pocket -->
                      <rect x="-6" y="-8" width="12" height="16" fill="${valveColor}" stroke="#ffffff" stroke-width="1.2" rx="2"/>
                      <text x="-12" y="4" fill="${valveColor}" font-size="9.5" font-family="Inter" text-anchor="end" font-weight="bold">
                        ${v.type} (${v.depth} ft)
                      </text>
                      ${isInj ? `
                        <!-- Gas Injection Arrow entering tubing -->
                        <path d="M -24 0 L -6 0" stroke="#3FB950" stroke-width="3" stroke-linecap="round"/>
                        <polygon points="-6,-3 2,0 -6,3" fill="#3FB950"/>
                      ` : ''}
                    </g>
                  `;
                }).join('')}

                <!-- Production Packer at bottom -->
                <rect x="182" y="365" width="66" height="14" fill="#D29922"/>
                <rect x="292" y="365" width="66" height="14" fill="#D29922"/>
                <text x="368" y="376" fill="#D29922" font-size="9" font-family="Inter">Packer (8,400 ft)</text>

                <!-- Wellhead Tree -->
                <rect x="245" y="40" width="50" height="30" fill="#30363D" stroke="#F0F6FC" stroke-width="1.5"/>
                <circle cx="270" cy="55" r="4" fill="#58A6FF"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
