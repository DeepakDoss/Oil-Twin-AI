/**
 * Sucker-Rod Pump (SRP) Walking-Beam Simulator & Fault Diagnosis
 * HTML5 Canvas beam unit animation synchronized with
 * surface & downhole dynamometer card plotting.
 */
import { SRPEngine } from '../physics/srp_engine.js';
import { ChartManager } from '../charts/chart_manager.js';

export const SRPSimulator = {
  activeCondition: 'normal',
  spm: 10,
  strokeInches: 120,
  theta: 0,
  isPlaying: true,
  animFrameId: null,

  setCondition(condKey) {
    if (!SRPEngine.DIAGNOSIS_TYPES[condKey]) return;
    this.activeCondition = condKey;
    this.renderView();
  },

  renderView() {
    const root = document.getElementById('main-content');
    if (!root) return;

    const cond = SRPEngine.DIAGNOSIS_TYPES[this.activeCondition];
    const cardPoints = SRPEngine.generateDynoCard(this.activeCondition, this.strokeInches);

    root.innerHTML = `
      <div style="max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px;">
        <div class="home-hero" style="margin-bottom: 0;">
          <h1>Sucker-Rod Pump System & Fault Diagnosis</h1>
          <p>Real-time animated beam pump unit synchronized with surface and downhole dynamometer cards for failure diagnosis.</p>
        </div>

        <div class="srp-grid">
          <!-- Left: Pumping Unit Animation Canvas -->
          <div class="srp-canvas-box">
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 600; font-size: 13px; color: #F0F6FC;">Beam Pumping Unit</span>
              <span id="srp-spm-label" style="font-size: 12px; color: var(--accent-blue); font-weight: 600;">10 SPM</span>
            </div>

            <canvas id="srpBeamCanvas" width="340" height="380"></canvas>

            <!-- Play / Pause / Speed Bar -->
            <div style="width: 100%; display: flex; align-items: center; gap: 10px; margin-top: 10px;">
              <button id="btn-srp-toggle" class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;">
                ${this.isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <div style="flex: 1; display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 11px; color: #8B949E;">Speed:</span>
                <input type="range" id="srp-spm-slider" min="4" max="20" step="1" value="${this.spm}" style="flex: 1;">
              </div>
            </div>
          </div>

          <!-- Right: Dynamometer Card & Fault Diagnosis List -->
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Dynamometer Plot -->
            <div class="viz-panel" style="height: 320px;">
              <div class="controls-header" style="justify-content: space-between;">
                <span style="font-weight: 600; font-size: 13px; color: #F0F6FC;">Dynamometer Card (Load vs Position)</span>
                <span style="font-size: 11.5px; color: #8B949E;">Stroke: <strong>${this.strokeInches}"</strong></span>
              </div>
              <div class="viz-content" style="padding: 4px;">
                <div id="srp-dyno-chart" style="width: 100%; height: 100%;"></div>
              </div>
            </div>

            <!-- Fault Diagnosis Condition Selector -->
            <div class="param-group" style="flex: 1; overflow-y: auto;">
              <div class="group-title" style="margin-bottom: 8px;">Diagnostic Failure Modes (Select to Inspect)</div>
              <div class="diag-card-list">
                ${Object.keys(SRPEngine.DIAGNOSIS_TYPES).map(key => {
                  const item = SRPEngine.DIAGNOSIS_TYPES[key];
                  const isActive = key === this.activeCondition;
                  return `
                    <div class="diag-item ${isActive ? 'active' : ''}" onclick="window.App.selectSrpDiag('${key}')">
                      <div class="diag-title" style="color: ${isActive ? 'var(--accent-blue)' : '#F0F6FC'};">
                        ${item.name}
                      </div>
                      <div class="diag-desc">${item.desc}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      ChartManager.renderDynoCard('srp-dyno-chart', cardPoints, cond.name);
      this.startCanvasAnimation();
    }, 50);

    this.bindEvents();
  },

  bindEvents() {
    document.getElementById('btn-srp-toggle')?.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      const btn = document.getElementById('btn-srp-toggle');
      if (btn) btn.innerHTML = this.isPlaying ? '⏸ Pause' : '▶ Play';
    });

    const spmSlider = document.getElementById('srp-spm-slider');
    if (spmSlider) {
      spmSlider.addEventListener('input', (e) => {
        this.spm = parseInt(e.target.value);
        const lbl = document.getElementById('srp-spm-label');
        if (lbl) lbl.textContent = `${this.spm} SPM`;
      });
    }
  },

  startCanvasAnimation() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const canvas = document.getElementById('srpBeamCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const animate = () => {
      if (this.isPlaying) {
        const dTheta = (2 * Math.PI * this.spm) / (60 * 60);
        this.theta = (this.theta + dTheta) % (2 * Math.PI);
      }

      this.drawBeamUnit(ctx, canvas.width, canvas.height, this.theta);
      this.animFrameId = requestAnimationFrame(animate);
    };

    animate();
  },

  drawBeamUnit(ctx, width, height, theta) {
    ctx.clearRect(0, 0, width, height);

    // Coordinate space
    const groundY = 280;

    // Samson Post Apex
    const postX = 140;
    const saddleY = 120;

    // Crank Axis
    const crankX = 240;
    const crankY = 220;
    const crankR = 35;

    // Walking Beam Dimensions
    const beamFrontL = 95; // distance from saddle to horsehead
    const beamRearL = 80;  // distance from saddle to pitman connection

    // Crank Pin Position
    const crankPinX = crankX + crankR * Math.cos(theta);
    const crankPinY = crankY + crankR * Math.sin(theta);

    // Beam tilt angle alpha approx proportional to crank vertical position
    const pitmanLen = 110;
    const beamAngle = 0.22 * Math.sin(theta); // tilt in radians

    // Front (Horsehead) pivot and Rear (Equalizer) pivot
    const frontX = postX - beamFrontL * Math.cos(beamAngle);
    const frontY = saddleY - beamFrontL * Math.sin(beamAngle);

    const rearX = postX + beamRearL * Math.cos(beamAngle);
    const rearY = saddleY + beamRearL * Math.sin(beamAngle);

    // Ground Base
    ctx.fillStyle = '#21262D';
    ctx.fillRect(20, groundY, width - 40, 14);

    // Samson Post Structure (A-Frame)
    ctx.strokeStyle = '#484F58';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(90, groundY);
    ctx.lineTo(postX, saddleY);
    ctx.lineTo(190, groundY);
    ctx.stroke();

    // Cross-bracing
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(115, 200);
    ctx.lineTo(165, 200);
    ctx.stroke();

    // Gear Reducer Box
    ctx.fillStyle = '#161B22';
    ctx.strokeStyle = '#30363D';
    ctx.lineWidth = 2;
    ctx.fillRect(crankX - 25, crankY - 10, 50, 60);
    ctx.strokeRect(crankX - 25, crankY - 10, 50, 60);

    // Rotating Crank & Counterweights
    ctx.save();
    ctx.translate(crankX, crankY);
    ctx.rotate(theta);
    // Crank Arm
    ctx.strokeStyle = '#388BFD';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(crankR, 0);
    ctx.stroke();
    // Counterweight
    ctx.fillStyle = '#1F6FEB';
    ctx.beginPath();
    ctx.arc(crankR * 0.85, 0, 16, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.restore();

    // Pitman Arm (Connecting Crank Pin to Rear of Beam)
    ctx.strokeStyle = '#8B949E';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(rearX, rearY);
    ctx.lineTo(crankPinX, crankPinY);
    ctx.stroke();

    // Walking Beam
    ctx.strokeStyle = '#58A6FF';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(frontX, frontY);
    ctx.lineTo(rearX, rearY);
    ctx.stroke();

    // Center Saddle Bearing Pivot
    ctx.fillStyle = '#F0F6FC';
    ctx.beginPath();
    ctx.arc(postX, saddleY, 6, 0, 2 * Math.PI);
    ctx.fill();

    // Horsehead (Arc on front of beam)
    ctx.save();
    ctx.translate(frontX, frontY);
    ctx.rotate(beamAngle);
    ctx.fillStyle = '#388BFD';
    ctx.beginPath();
    ctx.arc(0, 0, 38, Math.PI * 0.75, Math.PI * 1.45, false);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Wireline Bridle & Polished Rod hanging vertically from Horsehead tip
    const wellheadX = 35;
    const rodTopY = frontY + 28;

    ctx.strokeStyle = '#F0F6FC';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(frontX - 32, frontY + 12);
    ctx.lineTo(wellheadX, rodTopY);
    ctx.stroke();

    // Polished Rod
    ctx.strokeStyle = '#3FB950';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wellheadX, rodTopY);
    ctx.lineTo(wellheadX, groundY + 15);
    ctx.stroke();

    // Stuffing Box at surface
    ctx.fillStyle = '#D29922';
    ctx.fillRect(wellheadX - 8, groundY - 14, 16, 14);

    // Downhole Subsurface Representation Box (Plunger & Valves)
    const downholeBoxY = groundY + 25;
    ctx.fillStyle = '#0D1117';
    ctx.strokeStyle = '#30363D';
    ctx.lineWidth = 1.5;
    ctx.fillRect(wellheadX - 18, downholeBoxY, 36, 60);
    ctx.strokeRect(wellheadX - 18, downholeBoxY, 36, 60);

    // Plunger position within downhole barrel
    const isUp = Math.sin(theta) >= 0;
    const plungerNorm = 0.5 * (1 - Math.cos(theta));
    const plungerY = downholeBoxY + 10 + plungerNorm * 26;

    // Plunger
    ctx.fillStyle = '#58A6FF';
    ctx.fillRect(wellheadX - 12, plungerY, 24, 14);

    // Traveling Valve (TV) Ball: Closed on upstroke, open on downstroke
    ctx.fillStyle = isUp ? '#F85149' : '#3FB950';
    ctx.beginPath();
    ctx.arc(wellheadX, plungerY + (isUp ? 7 : 2), 3.5, 0, 2 * Math.PI);
    ctx.fill();

    // Standing Valve (SV) Ball at bottom of barrel: Open on upstroke, closed on downstroke
    ctx.fillStyle = isUp ? '#3FB950' : '#F85149';
    ctx.beginPath();
    ctx.arc(wellheadX, downholeBoxY + 52 - (isUp ? 4 : 0), 3.5, 0, 2 * Math.PI);
    ctx.fill();

    // Valve labels
    ctx.fillStyle = '#8B949E';
    ctx.font = '9px Inter';
    ctx.fillText(`TV: ${isUp ? 'CLOSED' : 'OPEN'}`, wellheadX + 22, plungerY + 10);
    ctx.fillText(`SV: ${isUp ? 'OPEN' : 'CLOSED'}`, wellheadX + 22, downholeBoxY + 54);
    ctx.fillText(isUp ? '▲ UPSTROKE' : '▼ DOWNSTROKE', wellheadX - 10, groundY + 18);
  }
};
