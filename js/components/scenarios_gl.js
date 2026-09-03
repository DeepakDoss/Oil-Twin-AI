/**
 * Gas-Lift Scenarios & Diagnostics
 * Includes:
 * - Deep vs Shallow Gas Injection
 * - Gas Lift Instability / Heading & Slugging
 * - Tubing Leak / Casing Communication Hole Diagnostic
 * - Over-injection Friction Penalty
 */
import { NodalSolver } from '../physics/nodal_solver.js';
import { ChartManager } from '../charts/chart_manager.js';

export const ScenariosGL = {
  CASES: [
    {
      id: 'opt_injection',
      name: '1. Optimal Deep Injection (6,500 ft)',
      desc: 'Injection through operating orifice near bottom of tubing lightens maximum hydrostatic column, maximizing liquid rate and drawdown.',
      params: { pr: 2800, pi: 2.2, pb: 1800, wc: 65, gor: 400, tubingId: 2.441, tubingDepth: 8000, choke64th: 32, flId: 4, flLen: 3000, flElev: 30, pSep: 110, liftMode: 'gas_lift', glInjRate: 900, glInjDepth: 6500 }
    },
    {
      id: 'shallow_injection',
      name: '2. Sub-optimal Shallow Injection (2,500 ft)',
      desc: 'Gas injected at shallow depth leaves 5,500 ft of dense dead liquid column beneath it, choking production and increasing required FBHP.',
      params: { pr: 2800, pi: 2.2, pb: 1800, wc: 65, gor: 400, tubingId: 2.441, tubingDepth: 8000, choke64th: 32, flId: 4, flLen: 3000, flElev: 30, pSep: 110, liftMode: 'gas_lift', glInjRate: 900, glInjDepth: 2500 }
    },
    {
      id: 'tubing_leak',
      name: '3. Tubing Hole / Casing Communication Leak',
      desc: 'Corrosion hole in tubing at 3,200 ft steals injection gas from bottom valve. Results in dogleg in pressure traverse and loss of deep lift.',
      isHole: true,
      holeDepth: 3200,
      params: { pr: 2800, pi: 2.2, pb: 1800, wc: 65, gor: 400, tubingId: 2.441, tubingDepth: 8000, choke64th: 32, flId: 4, flLen: 3000, flElev: 30, pSep: 110, liftMode: 'gas_lift', glInjRate: 900, glInjDepth: 3200 }
    },
    {
      id: 'over_injection',
      name: '4. Severe Over-injection (Gas Friction Penalty)',
      desc: 'Injecting excessive gas (2,800 MSCF/d) increases friction backpressure more than hydrostatic reduction, causing production rate to decline.',
      params: { pr: 2800, pi: 2.2, pb: 1800, wc: 65, gor: 400, tubingId: 2.441, tubingDepth: 8000, choke64th: 32, flId: 4, flLen: 3000, flElev: 30, pSep: 110, liftMode: 'gas_lift', glInjRate: 2800, glInjDepth: 6500 }
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
          <h1>Gas-Lift Scenarios & Diagnostics</h1>
          <p>Analyze gas lift injection depth efficiency, severe over-injection friction penalties, and tubing-casing leak diagnostics.</p>
        </div>

        <div style="display: grid; grid-template-columns: 320px 1fr; gap: 18px;">
          <!-- Case Study Selection List -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${this.CASES.map((c, i) => `
              <div class="tool-card ${i === this.selectedCaseIndex ? 'active' : ''}"
                   style="padding: 14px; border-color: ${i === this.selectedCaseIndex ? 'var(--accent-blue)' : 'var(--border-default)'}; background: ${i === this.selectedCaseIndex ? 'var(--accent-blue-glow)' : 'var(--bg-card)'};"
                   onclick="window.App.selectScnGL(${i})">
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
              <div><span style="color:#6E7681;">Inj Depth:</span> <strong>${currentCase.params.glInjDepth} ft</strong></div>
              <div><span style="color:#6E7681;">Inj Rate:</span> <strong>${currentCase.params.glInjRate} MSCF/d</strong></div>
              <div><span style="color:#6E7681;">WHP:</span> <strong>${res.pwhp} psi</strong></div>
              <div><span style="color:#6E7681;">FBHP:</span> <strong>${res.pwf} psi</strong></div>
              <div><span style="color:#6E7681;">Hydrostatic &Delta;P:</span> <strong>${res.hydroTotal} psi</strong></div>
              <div><span style="color:#6E7681;">Friction &Delta;P:</span> <strong>${res.fricTotal} psi</strong></div>
            </div>

            <div class="viz-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div id="scn-gl-nodal-chart" style="height: 380px;"></div>
              <div id="scn-gl-traverse-chart" style="height: 380px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      ChartManager.renderNodalChart('scn-gl-nodal-chart', res, currentCase.params.pb, currentCase.params.pr);
      ChartManager.renderTraverseChart('scn-gl-traverse-chart', res.traverse);
    }, 50);
  }
};
