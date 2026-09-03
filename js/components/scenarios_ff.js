/**
 * Free-Flowing Well Scenarios Explorer
 * Interactive case studies for production engineering analysis:
 * - Base Healthy Well
 * - Water Coning / High Water-Cut Loading (well death)
 * - Reservoir Depletion
 * - Tubing Sizing Optimization (friction vs liquid loading / Turner velocity)
 * - Skin Damage / Formation Impairment
 */
import { NodalSolver } from '../physics/nodal_solver.js';
import { ChartManager } from '../charts/chart_manager.js';

export const ScenariosFF = {
  CASES: [
    {
      id: 'base_well',
      name: '1. Base Healthy Free-Flowing Well',
      desc: 'Typical stable natural producer with high reservoir pressure, moderate water cut, and good drawdown.',
      params: { pr: 3500, pi: 3.0, pb: 2200, wc: 20, gor: 650, tubingId: 2.441, tubingDepth: 8000, choke64th: 36, flId: 4, flLen: 3000, flElev: 20, pSep: 100, liftMode: 'free_flowing' }
    },
    {
      id: 'water_coning',
      name: '2. Water Coning (High WC Loading & Kill)',
      desc: 'Water break-through increases hydrostatic column density. Watch the VLP curve shift sharply upwards, eventually choking and killing the well.',
      params: { pr: 3100, pi: 2.8, pb: 1800, wc: 82, gor: 350, tubingId: 2.441, tubingDepth: 8000, choke64th: 32, flId: 4, flLen: 3000, flElev: 20, pSep: 100, liftMode: 'free_flowing' }
    },
    {
      id: 'depletion',
      name: '3. Reservoir Depletion (Pressure Drop)',
      desc: 'As reservoir pressure declines from 3,500 psi to 2,200 psi, inflow energy is insufficient to lift fluid to surface separator pressure.',
      params: { pr: 2200, pi: 2.5, pb: 1600, wc: 35, gor: 500, tubingId: 2.441, tubingDepth: 8000, choke64th: 32, flId: 4, flLen: 3000, flElev: 20, pSep: 120, liftMode: 'free_flowing' }
    },
    {
      id: 'tubing_size',
      name: '4. Tubing Sizing (2-3/8" vs 3-1/2")',
      desc: 'Comparison of small vs large tubing diameter: small tubing has high friction at high rates, while oversized tubing causes liquid loading at low rates.',
      params: { pr: 3400, pi: 4.5, pb: 2400, wc: 25, gor: 800, tubingId: 3.5, tubingDepth: 8500, choke64th: 48, flId: 4, flLen: 3000, flElev: 20, pSep: 100, liftMode: 'free_flowing' }
    },
    {
      id: 'skin_damage',
      name: '5. Formation Damage (Low PI / High Skin)',
      desc: 'Wellbore skin damage chokes reservoir inflow, flattening the IPR curve and causing severe drawdown with diminished production rate.',
      params: { pr: 3400, pi: 0.6, pb: 2200, wc: 15, gor: 600, tubingId: 2.441, tubingDepth: 8000, choke64th: 28, flId: 4, flLen: 3000, flElev: 20, pSep: 100, liftMode: 'free_flowing' }
    }
  ],

  selectedCaseIndex: 0,

  renderView() {
    const root = document.getElementById('main-content');
    if (!root) return;

    const currentCase = this.CASES[this.selectedCaseIndex];
    const res = NodalSolver.solve(currentCase.params);

    root.innerHTML = `
      <div style="max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px;">
        <div class="home-hero" style="margin-bottom: 0;">
          <h1>Free-Flowing Well Scenarios</h1>
          <p>Explore pre-configured natural flow case studies for sensitivity analysis, reservoir depletion, water breakthrough, and tubing optimization.</p>
        </div>

        <div style="display: grid; grid-template-columns: 320px 1fr; gap: 18px;">
          <!-- Case Study Selection List -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${this.CASES.map((c, i) => `
              <div class="tool-card ${i === this.selectedCaseIndex ? 'active' : ''}"
                   style="padding: 14px; border-color: ${i === this.selectedCaseIndex ? 'var(--accent-blue)' : 'var(--border-default)'}; background: ${i === this.selectedCaseIndex ? 'var(--accent-blue-glow)' : 'var(--bg-card)'};"
                   onclick="window.App.selectScnFF(${i})">
                <div style="font-weight: 600; font-size: 13.5px; color: #F0F6FC; margin-bottom: 4px;">${c.name}</div>
                <div style="font-size: 12px; color: #8B949E; line-height: 1.4;">${c.desc}</div>
              </div>
            `).join('')}
          </div>

          <!-- Scenario Details & Plots -->
          <div class="viz-panel" style="min-height: 520px;">
            <div class="controls-header" style="justify-content: space-between;">
              <span style="font-weight: 600; font-size: 14px; color: #F0F6FC;">${currentCase.name}</span>
              <span class="status-badge ${res.converged && res.qLiquid > 0 ? 'status-converged' : 'status-dead'}">
                ${res.converged && res.qLiquid > 0 ? '● Operating: ' + res.qLiquid + ' STB/d' : '▲ ' + res.statusMsg}
              </span>
            </div>

            <!-- Parameters Banner -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; padding: 12px 16px; background: #0D1117; border-bottom: 1px solid var(--border-default); font-size: 11.5px;">
              <div><span style="color:#6E7681;">Pr:</span> <strong>${currentCase.params.pr} psi</strong></div>
              <div><span style="color:#6E7681;">PI:</span> <strong>${currentCase.params.pi} STB/d/psi</strong></div>
              <div><span style="color:#6E7681;">Water Cut:</span> <strong>${currentCase.params.wc}%</strong></div>
              <div><span style="color:#6E7681;">GOR:</span> <strong>${currentCase.params.gor} scf/bbl</strong></div>
              <div><span style="color:#6E7681;">Tubing ID:</span> <strong>${currentCase.params.tubingId}"</strong></div>
              <div><span style="color:#6E7681;">Choke:</span> <strong>${currentCase.params.choke64th}/64"</strong></div>
              <div><span style="color:#6E7681;">WHP:</span> <strong>${res.pwhp} psi</strong></div>
            </div>

            <div class="viz-content">
              <div id="scn-ff-chart" class="chart-container"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      ChartManager.renderNodalChart('scn-ff-chart', res, currentCase.params.pb, currentCase.params.pr);
    }, 50);
  }
};
