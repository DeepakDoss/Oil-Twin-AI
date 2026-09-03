/**
 * ESP Operating Scenarios
 * Includes:
 * - VSD Frequency Optimization (45 Hz to 65 Hz)
 * - Free Gas Degradation & Gas Lock Risk
 * - High Viscosity / Emulsion Head Derating
 * - Pump-Off / Inflow Starvation
 */
import { NodalSolver } from '../physics/nodal_solver.js';
import { ESP } from '../physics/esp.js';
import { ChartManager } from '../charts/chart_manager.js';

export const ScenariosESP = {
  CASES: [
    {
      id: 'vsd_nominal',
      name: '1. Standard 60 Hz Operation',
      desc: 'Nominal baseline speed. Operating within the manufacturer recommended flow range (between downthrust and upthrust limits).',
      params: { pr: 2900, pi: 2.5, pb: 1900, wc: 50, gor: 450, tubingId: 2.992, tubingDepth: 8000, choke64th: 40, flId: 4, flLen: 2500, flElev: 20, pSep: 100, liftMode: 'esp', espFreq: 60, espStages: 150, espDepth: 7200 }
    },
    {
      id: 'vsd_turndown',
      name: '2. Low Speed VSD Turndown (45 Hz)',
      desc: 'Turndown frequency to match depleted inflow or avoid drawing down into gas cap / aquifer. Head generated decreases by (45/60)^2 = 56%.',
      params: { pr: 2900, pi: 2.5, pb: 1900, wc: 50, gor: 450, tubingId: 2.992, tubingDepth: 8000, choke64th: 32, flId: 4, flLen: 2500, flElev: 20, pSep: 100, liftMode: 'esp', espFreq: 45, espStages: 150, espDepth: 7200 }
    },
    {
      id: 'vsd_boost',
      name: '3. High Speed Production Boost (65 Hz)',
      desc: 'Variable Speed Drive ramped to 65 Hz. Generates higher head and drawdown, yielding higher liquid rate but operating near upthrust limit.',
      params: { pr: 2900, pi: 3.5, pb: 1900, wc: 50, gor: 450, tubingId: 2.992, tubingDepth: 8000, choke64th: 48, flId: 4, flLen: 2500, flElev: 20, pSep: 100, liftMode: 'esp', espFreq: 65, espStages: 150, espDepth: 7200 }
    },
    {
      id: 'gas_interference',
      name: '4. Gas Interference & Degradation (High GOR)',
      desc: 'When flowing bottomhole pressure drops below bubble point, free gas breaks out at pump intake, derating centrifugal impeller head generation.',
      params: { pr: 2500, pi: 2.0, pb: 2200, wc: 15, gor: 1800, tubingId: 2.992, tubingDepth: 8000, choke64th: 36, flId: 4, flLen: 2500, flElev: 20, pSep: 100, liftMode: 'esp', espFreq: 60, espStages: 150, espDepth: 7200 }
    }
  ],

  selectedCaseIndex: 0,

  renderView() {
    const root = document.getElementById('main-content');
    if (!root) return;

    const currentCase = this.CASES[this.selectedCaseIndex];
    const res = NodalSolver.solve(currentCase.params);
    const espRes = ESP.generatePumpCurve(currentCase.params.espFreq, currentCase.params.espStages, 0.9);

    root.innerHTML = `
      <div style="max-width: 1100px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px;">
        <div class="home-hero" style="margin-bottom: 0;">
          <h1>ESP Operating Scenarios</h1>
          <p>Analyze Variable Speed Drive (VSD) frequency adjustments, pump head curves, operating ranges, and free-gas derating.</p>
        </div>

        <div style="display: grid; grid-template-columns: 320px 1fr; gap: 18px;">
          <!-- Case Study Selection List -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${this.CASES.map((c, i) => `
              <div class="tool-card ${i === this.selectedCaseIndex ? 'active' : ''}"
                   style="padding: 14px; border-color: ${i === this.selectedCaseIndex ? 'var(--accent-blue)' : 'var(--border-default)'}; background: ${i === this.selectedCaseIndex ? 'var(--accent-blue-glow)' : 'var(--bg-card)'};"
                   onclick="window.App.selectScnESP(${i})">
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
                ${res.converged && res.qLiquid > 0 ? '● Liquid Rate: ' + res.qLiquid + ' STB/d' : '▲ ' + res.statusMsg}
              </span>
            </div>

            <!-- Parameters Banner -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; padding: 12px 16px; background: #0D1117; border-bottom: 1px solid var(--border-default); font-size: 11.5px;">
              <div><span style="color:#6E7681;">VSD Frequency:</span> <strong>${currentCase.params.espFreq} Hz</strong></div>
              <div><span style="color:#6E7681;">Pump Stages:</span> <strong>${currentCase.params.espStages}</strong></div>
              <div><span style="color:#6E7681;">Pump Depth:</span> <strong>${currentCase.params.espDepth} ft</strong></div>
              <div><span style="color:#6E7681;">WHP:</span> <strong>${res.pwhp} psi</strong></div>
              <div><span style="color:#6E7681;">FBHP:</span> <strong>${res.pwf} psi</strong></div>
              <div><span style="color:#6E7681;">Choke Size:</span> <strong>${currentCase.params.choke64th}/64"</strong></div>
            </div>

            <div class="viz-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div id="scn-esp-nodal-chart" style="height: 380px;"></div>
              <div id="scn-esp-pump-chart" style="height: 380px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      ChartManager.renderNodalChart('scn-esp-nodal-chart', res, currentCase.params.pb, currentCase.params.pr);
      const opHead = Math.round((currentCase.params.tubingDepth * 0.9 * 0.433 - (res.pwf - res.pwhp)) / 0.433);
      ChartManager.renderEspCurve('scn-esp-pump-chart', espRes, res.qLiquid, Math.max(200, opHead));
    }, 50);
  }
};
