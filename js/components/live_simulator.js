/**
 * Live Well Simulator View & Controller
 * Complete interactive reservoir-to-separator simulator
 */
import { NodalSolver } from '../physics/nodal_solver.js';
import { GasLift } from '../physics/gaslift.js';
import { ESP } from '../physics/esp.js';
import { ChartManager } from '../charts/chart_manager.js';
import { Schematics } from './schematics.js';

export const LiveSimulator = {
  // Current Simulation State
  state: {
    pr: 3200,          // Reservoir Pressure (psi)
    pi: 2.5,           // Productivity Index (STB/d/psi)
    pb: 2200,          // Bubble Point Pressure (psi)
    wc: 40,            // Water Cut (%)
    gor: 600,          // Gas-Oil Ratio (scf/STB)
    api: 35,           // Oil API Gravity
    tubingId: 2.441,   // Tubing ID (inches)
    tubingDepth: 8000, // Tubing Depth (ft)
    choke64th: 32,     // Choke size in 64ths
    flId: 4.0,         // Flowline ID (inches)
    flLen: 3000,       // Flowline Length (ft)
    flElev: 50,        // Flowline Elevation change (ft)
    pSep: 120,         // Separator Pressure (psi)
    liftMode: 'free_flowing', // 'free_flowing' | 'gas_lift' | 'esp'
    glInjRate: 800,    // Gas Lift Injection Rate (MSCF/d)
    glInjDepth: 6500,  // Gas Lift Injection Depth (ft)
    espFreq: 60,       // ESP Frequency (Hz)
    espStages: 140,    // ESP Stages
    espDepth: 7200,    // ESP Depth (ft)
    activeTab: 'nodal' // 'nodal' | 'traverse' | 'schematic' | 'lift' | 'trend'
  },

  // Dynamic Time Series Trend Record
  timeHistory: [],
  timeStep: 0,
  savedCases: {},

  init() {
    this.renderView();
    this.recalculate();
  },

  recalculate() {
    const res = NodalSolver.solve(this.state);
    this.updateKPIs(res);

    // Record time history
    this.timeStep++;
    this.timeHistory.push({
      time: this.timeStep,
      qLiquid: res.qLiquid,
      pwhp: res.pwhp,
      flp: res.flp,
      pwf: res.pwf
    });
    if (this.timeHistory.length > 50) this.timeHistory.shift();

    this.renderActiveTab(res);
  },

  updateKPIs(res) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('kpi-ql', res.qLiquid);
    setVal('kpi-qo', res.qOil);
    setVal('kpi-qg', res.qGasMscf);
    setVal('kpi-qw', res.qWater);
    setVal('kpi-pwf', res.pwf);
    setVal('kpi-pwhp', res.pwhp);
    setVal('kpi-chokedp', res.chokeDp);
    setVal('kpi-drawdown', res.drawdown);

    const badge = document.getElementById('kpi-status-badge');
    if (badge) {
      if (res.converged && res.qLiquid > 0) {
        badge.className = 'status-badge status-converged';
        badge.innerHTML = `● Converged`;
      } else {
        badge.className = 'status-badge status-dead';
        badge.innerHTML = `▲ ${res.statusMsg}`;
      }
    }
  },

  renderActiveTab(res) {
    const tab = this.state.activeTab;
    const container = document.getElementById('viz-tab-content');
    if (!container) return;

    if (tab === 'nodal') {
      container.innerHTML = `<div id="chart-nodal" class="chart-container"></div>`;
      ChartManager.renderNodalChart('chart-nodal', res, this.state.pb, this.state.pr);
    } else if (tab === 'traverse') {
      container.innerHTML = `<div id="chart-traverse" class="chart-container"></div>`;
      ChartManager.renderTraverseChart('chart-traverse', res.traverse);
    } else if (tab === 'schematic') {
      container.innerHTML = `<div id="schematic-container" class="schematic-box"></div>`;
      Schematics.renderWellboreSVG('schematic-container', {
        ...this.state,
        pwf: res.pwf,
        pwhp: res.pwhp,
        flp: res.flp,
        isChokeCritical: res.isChokeCritical,
        tubingRegime: res.tubingRegime,
        converged: res.converged
      });
    } else if (tab === 'lift') {
      if (this.state.liftMode === 'gas_lift') {
        container.innerHTML = `<div id="chart-gl-curve" class="chart-container"></div>`;
        const glRes = GasLift.generatePerformanceCurve(
          this.state.pr,
          this.state.pi,
          this.state.pb,
          res.pwhp,
          this.state.wc,
          this.state.gor,
          this.state.tubingId,
          this.state.tubingDepth,
          this.state.glInjDepth
        );
        ChartManager.renderGasLiftCurve('chart-gl-curve', glRes);
      } else if (this.state.liftMode === 'esp') {
        container.innerHTML = `<div id="chart-esp-curve" class="chart-container"></div>`;
        const espRes = ESP.generatePumpCurve(this.state.espFreq, this.state.espStages, 0.9);
        const opHead = Math.round((this.state.tubingDepth * 0.9 * 0.433 - (res.pwf - res.pwhp)) / 0.433);
        ChartManager.renderEspCurve('chart-esp-curve', espRes, res.qLiquid, Math.max(100, opHead));
      } else {
        container.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#8B949E;gap:10px;">
            <p>Well is currently operating in <strong>Free-Flowing</strong> mode.</p>
            <p>Select <strong>Gas Lift</strong> or <strong>ESP</strong> above to view lift performance curves.</p>
          </div>`;
      }
    } else if (tab === 'trend') {
      container.innerHTML = `<div id="chart-trend" class="chart-container"></div>`;
      ChartManager.renderTimeTrendChart('chart-trend', this.timeHistory);
    }
  },

  renderView() {
    const root = document.getElementById('main-content');
    if (!root) return;

    root.innerHTML = `
      <!-- KPI Header -->
      <div class="kpi-header">
        <div class="kpi-box">
          <span class="kpi-label">Liquid Rate</span>
          <span class="kpi-value"><span id="kpi-ql">--</span><span class="kpi-unit">STB/d</span></span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">Oil Rate</span>
          <span class="kpi-value"><span id="kpi-qo">--</span><span class="kpi-unit">STB/d</span></span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">Gas Rate</span>
          <span class="kpi-value"><span id="kpi-qg">--</span><span class="kpi-unit">MSCF/d</span></span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">Water Rate</span>
          <span class="kpi-value"><span id="kpi-qw">--</span><span class="kpi-unit">STB/d</span></span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">FBHP (Pwf)</span>
          <span class="kpi-value"><span id="kpi-pwf">--</span><span class="kpi-unit">psi</span></span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">WHP</span>
          <span class="kpi-value"><span id="kpi-pwhp">--</span><span class="kpi-unit">psi</span></span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">Choke &Delta;P</span>
          <span class="kpi-value"><span id="kpi-chokedp">--</span><span class="kpi-unit">psi</span></span>
        </div>
        <div class="kpi-box">
          <span class="kpi-label">Drawdown</span>
          <span class="kpi-value"><span id="kpi-drawdown">--</span><span class="kpi-unit">psi</span></span>
        </div>
        <div class="kpi-box" style="justify-content: center; align-items: flex-start;">
          <span class="kpi-label" style="margin-bottom: 6px;">Nodal State</span>
          <span id="kpi-status-badge" class="status-badge status-converged">● Converged</span>
        </div>
      </div>

      <!-- Main Dual Panel Simulator -->
      <div class="simulator-layout">
        <!-- Controls Column -->
        <div class="controls-panel">
          <div class="controls-header">
            <span style="font-weight: 600; font-size: 13px;">Lift Mode</span>
            <div class="controls-tabs">
              <button id="btn-mode-ff" class="ctrl-tab-btn ${this.state.liftMode === 'free_flowing' ? 'active' : ''}">Free Flowing</button>
              <button id="btn-mode-gl" class="ctrl-tab-btn ${this.state.liftMode === 'gas_lift' ? 'active' : ''}">Gas Lift</button>
              <button id="btn-mode-esp" class="ctrl-tab-btn ${this.state.liftMode === 'esp' ? 'active' : ''}">ESP</button>
            </div>
          </div>

          <div class="controls-scroll">
            <!-- Reservoir & Inflow Parameters -->
            <div class="param-group">
              <div class="group-title">Reservoir & Inflow (IPR)</div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Reservoir Pressure (Pr)</span>
                  <span id="val-pr" class="slider-value">${this.state.pr} psi</span>
                </div>
                <input type="range" id="input-pr" min="1000" max="6000" step="50" value="${this.state.pr}">
              </div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Productivity Index (PI)</span>
                  <span id="val-pi" class="slider-value">${this.state.pi} STB/d/psi</span>
                </div>
                <input type="range" id="input-pi" min="0.2" max="10.0" step="0.1" value="${this.state.pi}">
              </div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Bubble Point (Pb)</span>
                  <span id="val-pb" class="slider-value">${this.state.pb} psi</span>
                </div>
                <input type="range" id="input-pb" min="500" max="4500" step="50" value="${this.state.pb}">
              </div>
            </div>

            <!-- Fluid Properties -->
            <div class="param-group">
              <div class="group-title">Fluid Properties</div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Water Cut (WC)</span>
                  <span id="val-wc" class="slider-value">${this.state.wc} %</span>
                </div>
                <input type="range" id="input-wc" min="0" max="95" step="1" value="${this.state.wc}">
              </div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Total GOR</span>
                  <span id="val-gor" class="slider-value">${this.state.gor} scf/STB</span>
                </div>
                <input type="range" id="input-gor" min="50" max="3000" step="50" value="${this.state.gor}">
              </div>
            </div>

            <!-- Wellbore & Tubing -->
            <div class="param-group">
              <div class="group-title">Wellbore & Tubing (VLP)</div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Tubing ID</span>
                  <span id="val-tid" class="slider-value">${this.state.tubingId}"</span>
                </div>
                <input type="range" id="input-tid" min="1.995" max="4.0" step="0.1" value="${this.state.tubingId}">
              </div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Tubing Depth</span>
                  <span id="val-tdep" class="slider-value">${this.state.tubingDepth} ft</span>
                </div>
                <input type="range" id="input-tdep" min="3000" max="14000" step="100" value="${this.state.tubingDepth}">
              </div>
            </div>

            <!-- Choke & Flowline -->
            <div class="param-group">
              <div class="group-title">Choke & Surface Flowline</div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Choke Size</span>
                  <span id="val-choke" class="slider-value">${this.state.choke64th}/64"</span>
                </div>
                <input type="range" id="input-choke" min="12" max="64" step="2" value="${this.state.choke64th}">
              </div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Separator Pressure</span>
                  <span id="val-psep" class="slider-value">${this.state.pSep} psi</span>
                </div>
                <input type="range" id="input-psep" min="40" max="400" step="10" value="${this.state.pSep}">
              </div>
              <div class="slider-row">
                <div class="slider-label-row">
                  <span>Flowline Length</span>
                  <span id="val-fllen" class="slider-value">${this.state.flLen} ft</span>
                </div>
                <input type="range" id="input-fllen" min="500" max="15000" step="250" value="${this.state.flLen}">
              </div>
            </div>

            <!-- Dynamic Lift Controls (Gas Lift / ESP) -->
            <div id="lift-param-group" class="param-group" style="${this.state.liftMode === 'free_flowing' ? 'display:none;' : ''}">
              <div class="group-title" id="lift-group-title">
                ${this.state.liftMode === 'gas_lift' ? 'Gas Lift Controls' : 'ESP Pump Controls'}
              </div>
              <!-- Gas Lift Controls -->
              <div id="gl-controls" style="${this.state.liftMode === 'gas_lift' ? '' : 'display:none;'}">
                <div class="slider-row">
                  <div class="slider-label-row">
                    <span>Gas Inj Rate</span>
                    <span id="val-glr" class="slider-value">${this.state.glInjRate} MSCF/d</span>
                  </div>
                  <input type="range" id="input-glr" min="100" max="3000" step="50" value="${this.state.glInjRate}">
                </div>
                <div class="slider-row">
                  <div class="slider-label-row">
                    <span>Injection Depth</span>
                    <span id="val-gld" class="slider-value">${this.state.glInjDepth} ft</span>
                  </div>
                  <input type="range" id="input-gld" min="2000" max="10000" step="100" value="${this.state.glInjDepth}">
                </div>
              </div>
              <!-- ESP Controls -->
              <div id="esp-controls" style="${this.state.liftMode === 'esp' ? '' : 'display:none;'}">
                <div class="slider-row">
                  <div class="slider-label-row">
                    <span>VSD Frequency</span>
                    <span id="val-espf" class="slider-value">${this.state.espFreq} Hz</span>
                  </div>
                  <input type="range" id="input-espf" min="35" max="70" step="1" value="${this.state.espFreq}">
                </div>
                <div class="slider-row">
                  <div class="slider-label-row">
                    <span>Pump Stages</span>
                    <span id="val-esps" class="slider-value">${this.state.espStages}</span>
                  </div>
                  <input type="range" id="input-esps" min="50" max="250" step="5" value="${this.state.espStages}">
                </div>
              </div>
            </div>

            <!-- Case Save & Reset Actions -->
            <div style="display:flex; gap:10px; margin-top:8px;">
              <button id="btn-save-case" class="btn btn-secondary" style="flex:1;">💾 Save Case</button>
              <button id="btn-reset-params" class="btn btn-secondary" style="flex:1;">↺ Reset</button>
            </div>
          </div>
        </div>

        <!-- Visualizations Column -->
        <div class="viz-panel">
          <div class="viz-tabs">
            <div class="viz-tab-list">
              <button id="tab-nodal" class="viz-tab-btn ${this.state.activeTab === 'nodal' ? 'active' : ''}">IPR / VLP Nodal</button>
              <button id="tab-traverse" class="viz-tab-btn ${this.state.activeTab === 'traverse' ? 'active' : ''}">Pressure Traverse</button>
              <button id="tab-schematic" class="viz-tab-btn ${this.state.activeTab === 'schematic' ? 'active' : ''}">Well Schematic</button>
              <button id="tab-lift" class="viz-tab-btn ${this.state.activeTab === 'lift' ? 'active' : ''}">Lift Curves</button>
              <button id="tab-trend" class="viz-tab-btn ${this.state.activeTab === 'trend' ? 'active' : ''}">Time Trends</button>
            </div>
            <button id="btn-clear-history" class="btn btn-secondary" style="padding: 4px 10px; font-size: 11px;">Clear Trend</button>
          </div>

          <div id="viz-tab-content" class="viz-content"></div>
        </div>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    // Mode Switching
    const setMode = (mode) => {
      this.state.liftMode = mode;
      document.querySelectorAll('.ctrl-tab-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(`btn-mode-${mode === 'free_flowing' ? 'ff' : mode === 'gas_lift' ? 'gl' : 'esp'}`);
      if (activeBtn) activeBtn.classList.add('active');

      const liftGroup = document.getElementById('lift-param-group');
      const glCtrl = document.getElementById('gl-controls');
      const espCtrl = document.getElementById('esp-controls');
      const title = document.getElementById('lift-group-title');

      if (mode === 'free_flowing') {
        if (liftGroup) liftGroup.style.display = 'none';
      } else if (mode === 'gas_lift') {
        if (liftGroup) liftGroup.style.display = 'block';
        if (glCtrl) glCtrl.style.display = 'block';
        if (espCtrl) espCtrl.style.display = 'none';
        if (title) title.textContent = 'Gas Lift Controls';
      } else {
        if (liftGroup) liftGroup.style.display = 'block';
        if (glCtrl) glCtrl.style.display = 'none';
        if (espCtrl) espCtrl.style.display = 'block';
        if (title) title.textContent = 'ESP Pump Controls';
      }

      this.recalculate();
    };

    document.getElementById('btn-mode-ff')?.addEventListener('click', () => setMode('free_flowing'));
    document.getElementById('btn-mode-gl')?.addEventListener('click', () => setMode('gas_lift'));
    document.getElementById('btn-mode-esp')?.addEventListener('click', () => setMode('esp'));

    // Viz Tab Switching
    const setTab = (tab) => {
      this.state.activeTab = tab;
      document.querySelectorAll('.viz-tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(`tab-${tab}`)?.classList.add('active');
      this.recalculate();
    };

    document.getElementById('tab-nodal')?.addEventListener('click', () => setTab('nodal'));
    document.getElementById('tab-traverse')?.addEventListener('click', () => setTab('traverse'));
    document.getElementById('tab-schematic')?.addEventListener('click', () => setTab('schematic'));
    document.getElementById('tab-lift')?.addEventListener('click', () => setTab('lift'));
    document.getElementById('tab-trend')?.addEventListener('click', () => setTab('trend'));

    // Slider inputs with real-time recalculation
    const bindSlider = (id, prop, valId, unit = '', parseFn = parseFloat) => {
      const slider = document.getElementById(id);
      const display = document.getElementById(valId);
      if (slider && display) {
        slider.addEventListener('input', (e) => {
          const val = parseFn(e.target.value);
          this.state[prop] = val;
          display.textContent = `${val}${unit ? ' ' + unit : ''}`;
          this.recalculate();
        });
      }
    };

    bindSlider('input-pr', 'pr', 'val-pr', 'psi');
    bindSlider('input-pi', 'pi', 'val-pi', 'STB/d/psi');
    bindSlider('input-pb', 'pb', 'val-pb', 'psi');
    bindSlider('input-wc', 'wc', 'val-wc', '%');
    bindSlider('input-gor', 'gor', 'val-gor', 'scf/STB');
    bindSlider('input-tid', 'tubingId', 'val-tid', '"');
    bindSlider('input-tdep', 'tubingDepth', 'val-tdep', 'ft');
    bindSlider('input-choke', 'choke64th', 'val-choke', '/64"');
    bindSlider('input-psep', 'pSep', 'val-psep', 'psi');
    bindSlider('input-fllen', 'flLen', 'val-fllen', 'ft');
    bindSlider('input-glr', 'glInjRate', 'val-glr', 'MSCF/d');
    bindSlider('input-gld', 'glInjDepth', 'val-gld', 'ft');
    bindSlider('input-espf', 'espFreq', 'val-espf', 'Hz');
    bindSlider('input-esps', 'espStages', 'val-esps', '');

    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
      this.timeHistory = [];
      this.timeStep = 0;
      this.recalculate();
    });

    document.getElementById('btn-reset-params')?.addEventListener('click', () => {
      this.state = {
        ...this.state,
        pr: 3200, pi: 2.5, pb: 2200, wc: 40, gor: 600,
        tubingId: 2.441, tubingDepth: 8000, choke64th: 32, pSep: 120
      };
      this.renderView();
      this.recalculate();
    });
  }
};
