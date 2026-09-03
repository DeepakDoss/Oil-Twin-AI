/**
 * Surface Flowline Hydraulics
 * Calculates Flowline Pressure (FLP) upstream of separator taking into account
 * flowline length, internal diameter, elevation difference, and separator pressure.
 */
export const Flowline = {
  /**
   * Calculate FLP (Flowline Pressure at wellhead)
   * @param {number} pSep - Separator pressure (psi)
   * @param {number} ql - Liquid flow rate (STB/d)
   * @param {number} flIdIn - Flowline internal diameter (in)
   * @param {number} flLenFt - Flowline length (ft)
   * @param {number} flElevFt - Elevation difference from wellhead to separator (ft, positive means uphill to separator)
   * @param {number} wc - Water cut (%)
   * @param {number} gor - Gas oil ratio (scf/STB)
   */
  calcFLP(pSep, ql, flIdIn, flLenFt, flElevFt, wc = 50, gor = 500) {
    if (ql <= 0) return Math.max(14.7, pSep);

    const dFt = flIdIn / 12;
    const area = (Math.PI / 4) * Math.pow(dFt, 2);

    // Liquid velocity (ft/s)
    const vL = (ql * 5.615 / 86400) / area;
    // Free gas velocity estimate
    const vG = (ql * (gor / 100) * 0.05) / (area * 86400);
    const vm = vL + vG;

    // Mixture density (lb/cu ft) approx
    const rhoM = 50.0 + (wc / 100) * 12.0;

    // Hydrostatic head due to elevation
    const dpElev = (rhoM * flElevFt) / 144;

    // Friction loss (Fanning / Darcy equation in pipe)
    const reynolds = (rhoM * vm * dFt) / (0.001 * 0.000672); // approx
    const f = reynolds > 2000 ? 0.022 : 0.04;
    const dpFric = (2 * f * rhoM * Math.pow(vm, 2) * flLenFt) / (32.174 * dFt * 144);

    const flp = pSep + dpElev + dpFric;
    return {
      flp: Math.max(pSep, Math.round(flp * 10) / 10),
      dpTotal: Math.round((dpElev + dpFric) * 10) / 10,
      dpFric: Math.round(dpFric * 10) / 10,
      dpElev: Math.round(dpElev * 10) / 10,
      flowPattern: vm > 15 ? 'Dispersed Bubble' : 'Stratified / Wave'
    };
  }
};
