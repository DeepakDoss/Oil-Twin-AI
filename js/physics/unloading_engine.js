/**
 * Gas Lift Unloading Sequence Engine
 * Models multi-stage gas displacement, liquid U-tubing,
 * unloading valve opening/closing, and pressure transitions.
 */
export const UnloadingEngine = {
  STAGES: [
    {
      id: 0,
      title: '1. Initial State (Well Static)',
      desc: 'Well is dead, loaded with completion brine (~0.465 psi/ft). Annulus and tubing are in static equilibrium. All gas lift unloading valves are submerged and open.',
      pCasing: 0,
      pTubingHead: 0,
      annulusFluidLevelFt: 0,
      activeValveIndex: -1,
      valves: [
        { depth: 2500, state: 'open', type: 'Unloading Valve 1' },
        { depth: 4800, state: 'open', type: 'Unloading Valve 2' },
        { depth: 6800, state: 'open', type: 'Unloading Valve 3' },
        { depth: 8200, state: 'open', type: 'Operating Valve (Orifice)' }
      ]
    },
    {
      id: 1,
      title: '2. Annulus Pressurization & U-Tubing',
      desc: 'High-pressure lift gas is injected into the casing annulus. Kill fluid is forced down the annulus and U-tubes into the tubing string through open valves.',
      pCasing: 1200,
      pTubingHead: 150,
      annulusFluidLevelFt: 1800,
      activeValveIndex: 0,
      valves: [
        { depth: 2500, state: 'open', type: 'Unloading Valve 1' },
        { depth: 4800, state: 'open', type: 'open', type: 'Unloading Valve 2' },
        { depth: 6800, state: 'open', type: 'Unloading Valve 3' },
        { depth: 8200, state: 'open', type: 'Operating Valve (Orifice)' }
      ]
    },
    {
      id: 2,
      title: '3. Unloading through Valve 1 (2,500 ft)',
      desc: 'Liquid level in annulus reaches Valve 1. Gas injects into tubing, aerating liquid column above 2,500 ft. Tubing head pressure surges, then unloads.',
      pCasing: 1100,
      pTubingHead: 280,
      annulusFluidLevelFt: 2500,
      activeValveIndex: 0,
      valves: [
        { depth: 2500, state: 'injecting', type: 'Unloading Valve 1' },
        { depth: 4800, state: 'open', type: 'Unloading Valve 2' },
        { depth: 6800, state: 'open', type: 'Unloading Valve 3' },
        { depth: 8200, state: 'open', type: 'Operating Valve (Orifice)' }
      ]
    },
    {
      id: 3,
      title: '4. Valve 1 Closes; Unloading through Valve 2 (4,800 ft)',
      desc: 'As tubing pressure unloads, Valve 1 dome pressure forces it shut. Fluid level in annulus is depressed to Valve 2. Gas enters through Valve 2, further lightening the well.',
      pCasing: 1020,
      pTubingHead: 220,
      annulusFluidLevelFt: 4800,
      activeValveIndex: 1,
      valves: [
        { depth: 2500, state: 'closed', type: 'Unloading Valve 1' },
        { depth: 4800, state: 'injecting', type: 'Unloading Valve 2' },
        { depth: 6800, state: 'open', type: 'Unloading Valve 3' },
        { depth: 8200, state: 'open', type: 'Operating Valve (Orifice)' }
      ]
    },
    {
      id: 4,
      title: '5. Unloading through Valve 3 (6,800 ft)',
      desc: 'Valve 2 closes automatically. Gas pushes kill fluid level down to Valve 3. Gas injection through Valve 3 brings reservoir inflow online.',
      pCasing: 940,
      pTubingHead: 190,
      annulusFluidLevelFt: 6800,
      activeValveIndex: 2,
      valves: [
        { depth: 2500, state: 'closed', type: 'Unloading Valve 1' },
        { depth: 4800, state: 'closed', type: 'Unloading Valve 2' },
        { depth: 6800, state: 'injecting', type: 'Unloading Valve 3' },
        { depth: 8200, state: 'open', type: 'Operating Valve (Orifice)' }
      ]
    },
    {
      id: 5,
      title: '6. Final Steady-State Injection (Operating Valve at 8,200 ft)',
      desc: 'Fluid level is depressed below Operating Valve. All upper unloading valves (1, 2, 3) are securely closed. Continuous steady gas lift established through bottom orifice.',
      pCasing: 880,
      pTubingHead: 165,
      annulusFluidLevelFt: 8200,
      activeValveIndex: 3,
      valves: [
        { depth: 2500, state: 'closed', type: 'Unloading Valve 1' },
        { depth: 4800, state: 'closed', type: 'Unloading Valve 2' },
        { depth: 6800, state: 'closed', type: 'Unloading Valve 3' },
        { depth: 8200, state: 'injecting', type: 'Operating Valve (Orifice)' }
      ]
    }
  ],

  getStage(index) {
    if (index < 0) return this.STAGES[0];
    if (index >= this.STAGES.length) return this.STAGES[this.STAGES.length - 1];
    return this.STAGES[index];
  }
};
