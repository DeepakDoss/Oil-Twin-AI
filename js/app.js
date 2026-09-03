/**
 * Main Application Orchestrator (OIL-TWIN / Well Simulator)
 */
import { Navbar } from './components/navbar.js';
import { LiveSimulator } from './components/live_simulator.js';
import { ScenariosFF } from './components/scenarios_ff.js';
import { ScenariosGL } from './components/scenarios_gl.js';
import { ScenariosESP } from './components/scenarios_esp.js';
import { GLUnloading } from './components/gl_unloading.js';
import { SRPSimulator } from './components/srp_simulator.js';

export const App = {
  Navbar,
  LiveSimulator,
  ScenariosFF,
  ScenariosGL,
  ScenariosESP,
  GLUnloading,
  SRPSimulator,

  init() {
    Navbar.init();
    this.renderHome();
  },

  renderHome() {
    const root = document.getElementById('main-content');
    if (!root) return;

    root.innerHTML = `
      <div style="max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">
        <div class="home-hero">
          <h1>Oil-Twin AI</h1>
          <p>An interactive digital twin, nodal analysis, and artificial lift simulation platform for petroleum production systems. Select a tool below to begin.</p>
        </div>

        <div class="tools-grid">
          <!-- Tool 1: Live Well Simulator -->
          <div class="tool-card" onclick="window.App.Navbar.setSection('live')">
            <div class="tool-card-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div class="tool-card-body">
              <h3>Live well simulator <span class="card-arrow">→</span></h3>
              <p>Interactive reservoir-to-separator model with live IPR/VLP, choke, flowline, and artificial lift (Gas Lift & ESP) controls.</p>
            </div>
          </div>

          <!-- Tool 2: Free-Flowing Well Scenarios -->
          <div class="tool-card" onclick="window.App.Navbar.setSection('free_scenarios')">
            <div class="tool-card-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3v18M18 9l-6-6-6 6M6 19h12"/>
              </svg>
            </div>
            <div class="tool-card-body">
              <h3>Free-flowing well scenarios <span class="card-arrow">→</span></h3>
              <p>Saved natural-flow cases for comparison, sensitivity, water coning, reservoir depletion, and tubing size optimization.</p>
            </div>
          </div>

          <!-- Tool 3: Gas-Lift Scenarios -->
          <div class="tool-card" onclick="window.App.Navbar.setSection('gl_scenarios')">
            <div class="tool-card-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242M8 19v1M12 17v5M16 19v1"/>
              </svg>
            </div>
            <div class="tool-card-body">
              <h3>Gas-lift scenarios <span class="card-arrow">→</span></h3>
              <p>Gas-lift design and operating cases, deep vs shallow injection, over-injection penalties, and tubing leak diagnostics.</p>
            </div>
          </div>

          <!-- Tool 4: ESP Scenarios -->
          <div class="tool-card" onclick="window.App.Navbar.setSection('esp_scenarios')">
            <div class="tool-card-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="8"/>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            </div>
            <div class="tool-card-body">
              <h3>ESP scenarios <span class="card-arrow">→</span></h3>
              <p>Electric submersible pump operating cases, VSD frequency adjustments, free gas degradation, and pump head curves.</p>
            </div>
          </div>

          <!-- Tool 5: Gas-Lift Unloading Process -->
          <div class="tool-card" onclick="window.App.Navbar.setSection('gl_unloading')">
            <div class="tool-card-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 21V4M16 21V4"/>
                <rect x="6" y="7" width="4" height="3" rx="1"/>
                <rect x="14" y="11" width="4" height="3" rx="1"/>
                <rect x="6" y="15" width="4" height="3" rx="1"/>
              </svg>
            </div>
            <div class="tool-card-body">
              <h3>Gas-lift unloading process <span class="card-arrow">→</span></h3>
              <p>Step-by-step interactive unloading sequence: kill fluid displacement, U-tubing, and unloading valve transitions.</p>
            </div>
          </div>

          <!-- Tool 6: Sucker-Rod Pump System -->
          <div class="tool-card" onclick="window.App.Navbar.setSection('srp')">
            <div class="tool-card-icon-wrap">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 20.5h18M8 20.5 10 10.8 12 20.5M4.6 12.4 10 10.8 17 13.3"/>
                <circle cx="17" cy="16" r="2.5"/>
              </svg>
            </div>
            <div class="tool-card-body">
              <h3>Sucker-rod pump system <span class="card-arrow">→</span></h3>
              <p>Animated beam-pump unit with downhole pump, traveling and standing valves, and live dynamometer card fault diagnosis.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Global Scenario Selectors
  selectScnFF(index) {
    ScenariosFF.selectedCaseIndex = index;
    ScenariosFF.renderView();
  },

  selectScnGL(index) {
    ScenariosGL.selectedCaseIndex = index;
    ScenariosGL.renderView();
  },

  selectScnESP(index) {
    ScenariosESP.selectedCaseIndex = index;
    ScenariosESP.renderView();
  },

  // Unloading Callbacks
  prevUnloadingStage() {
    GLUnloading.prevStage();
  },

  nextUnloadingStage() {
    GLUnloading.nextStage();
  },

  togglePlayUnloading() {
    if (GLUnloading.isPlaying) {
      GLUnloading.pause();
    } else {
      GLUnloading.play();
    }
  },

  // SRP Selector
  selectSrpDiag(key) {
    SRPSimulator.setCondition(key);
  }
};

window.App = App;

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
