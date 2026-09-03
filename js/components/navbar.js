/**
 * Navigation Bar, Sidebar, and Global Modals (About & Settings)
 */
export const Navbar = {
  activeSection: 'home',
  unitSystem: 'field', // 'field' | 'metric'

  init() {
    this.bindNavButtons();
  },

  setSection(sectionName) {
    this.activeSection = sectionName;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`nav-${sectionName}`)?.classList.add('active');

    // Update Topbar Title
    const titleMap = {
      home: 'Overview - All Simulators',
      live: 'Live Well Simulator (Nodal Analysis)',
      free_scenarios: 'Free-Flowing Well Scenarios',
      gl_scenarios: 'Gas-Lift Scenarios',
      esp_scenarios: 'ESP Scenarios',
      gl_unloading: 'Gas-Lift Unloading Process',
      srp: 'Sucker-Rod Pump System & Fault Diagnosis'
    };
    const titleEl = document.getElementById('topbar-section-title');
    if (titleEl) titleEl.textContent = titleMap[sectionName] || 'Oil-Twin AI';

    // Route to View
    if (sectionName === 'home') {
      window.App.renderHome();
    } else if (sectionName === 'live') {
      window.App.LiveSimulator.init();
    } else if (sectionName === 'free_scenarios') {
      window.App.ScenariosFF.renderView();
    } else if (sectionName === 'gl_scenarios') {
      window.App.ScenariosGL.renderView();
    } else if (sectionName === 'esp_scenarios') {
      window.App.ScenariosESP.renderView();
    } else if (sectionName === 'gl_unloading') {
      window.App.GLUnloading.renderView();
    } else if (sectionName === 'srp') {
      window.App.SRPSimulator.renderView();
    }
  },

  toggleUnitSystem() {
    this.unitSystem = this.unitSystem === 'field' ? 'metric' : 'field';
    const btn = document.getElementById('unit-toggle-btn');
    if (btn) btn.textContent = this.unitSystem === 'field' ? 'Units: Field (psi, bbl)' : 'Units: Metric (bar, m³)';
    // Trigger recalculation if in live simulator
    if (this.activeSection === 'live') {
      window.App.LiveSimulator.recalculate();
    }
  },

  openAboutModal() {
    const modal = document.getElementById('about-modal');
    if (modal) modal.classList.add('open');
  },

  closeAboutModal() {
    const modal = document.getElementById('about-modal');
    if (modal) modal.classList.remove('open');
  },

  openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('open');
  },

  closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('open');
  },

  bindNavButtons() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('btn-sidebar-collapse');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }

    document.getElementById('nav-home')?.addEventListener('click', () => this.setSection('home'));
    document.getElementById('nav-live')?.addEventListener('click', () => this.setSection('live'));
    document.getElementById('nav-free_scenarios')?.addEventListener('click', () => this.setSection('free_scenarios'));
    document.getElementById('nav-gl_scenarios')?.addEventListener('click', () => this.setSection('gl_scenarios'));
    document.getElementById('nav-esp_scenarios')?.addEventListener('click', () => this.setSection('esp_scenarios'));
    document.getElementById('nav-gl_unloading')?.addEventListener('click', () => this.setSection('gl_unloading'));
    document.getElementById('nav-srp')?.addEventListener('click', () => this.setSection('srp'));

    document.getElementById('nav-about')?.addEventListener('click', () => this.openAboutModal());
    document.getElementById('nav-settings')?.addEventListener('click', () => this.openSettingsModal());

    document.getElementById('unit-toggle-btn')?.addEventListener('click', () => this.toggleUnitSystem());

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAboutModal();
        this.closeSettingsModal();
      });
    });
  }
};
