/**
 * Fluid PVT & Black Oil Properties
 * Standard petroleum engineering correlations (Standing, Vasquez-Beggs, Beggs-Robinson)
 */
export const Fluid = {
  // Gas specific gravity from API and standard air
  calcGasGravity(gor, api) {
    return 0.65 + 0.0001 * gor; // default approximation ~0.65 - 0.75
  },

  // Oil specific gravity from API
  calcOilGravity(api) {
    return 141.5 / (131.5 + api);
  },

  // Bubble point pressure (Standing correlation)
  calcBubblePoint(gor, gasGrav, api, tempF) {
    const yg = gasGrav || 0.7;
    const a = 0.00091 * tempF - 0.0125 * api;
    const val = (gor / yg) * Math.pow(10, a);
    return 18.2 * (Math.pow(val, 0.83) - 1.4);
  },

  // Solution Gas-Oil Ratio Rs (Standing correlation)
  calcRs(p, pBubble, gorTotal, gasGrav, api, tempF) {
    if (p >= pBubble) return gorTotal;
    const yg = gasGrav || 0.7;
    const a = 0.00091 * tempF - 0.0125 * api;
    const rs = yg * Math.pow((p / 18.2 + 1.4), 1.205) * Math.pow(10, -a);
    return Math.max(0, Math.min(rs, gorTotal));
  },

  // Oil Formation Volume Factor Bo (Standing correlation)
  calcBo(rs, gasGrav, api, tempF) {
    const yg = gasGrav || 0.7;
    const yo = this.calcOilGravity(api);
    const f = rs * Math.pow(yg / yo, 0.5) + 1.25 * tempF;
    return 0.9759 + 0.00012 * Math.pow(f, 1.2);
  },

  // Gas Formation Volume Factor Bg (rcf/scf)
  calcBg(p, tempF, zFactor = 0.85) {
    const tempR = tempF + 459.67;
    if (p <= 14.7) p = 14.7;
    return 0.0282793 * zFactor * (tempR / p);
  },

  // Dead oil viscosity (Beggs & Robinson)
  calcDeadOilVisc(api, tempF) {
    const x = Math.pow(tempF, -1.163) * Math.exp(6.9824 - 0.04658 * api);
    return Math.pow(10, x) - 1;
  },

  // Saturated oil viscosity
  calcLiveOilVisc(deadVisc, rs) {
    const a = 10.715 * Math.pow(rs + 100, -0.515);
    const b = 5.44 * Math.pow(rs + 150, -0.338);
    return a * Math.pow(deadVisc, b);
  },

  // Mixture density in lbm/cu ft
  calcMixtureDensity(ql, wc, gor, p, tempF, api, gasGrav) {
    const waterCut = wc / 100;
    const qo = ql * (1 - waterCut);
    const qw = ql * waterCut;
    const pb = this.calcBubblePoint(gor, gasGrav, api, tempF);
    const rs = this.calcRs(p, pb, gor, gasGrav, api, tempF);
    const bo = this.calcBo(rs, gasGrav, api, tempF);
    const bw = 1.02; // water formation volume factor
    const yo = this.calcOilGravity(api);
    const yg = gasGrav || 0.7;

    const rhoOilStd = yo * 62.4;
    const rhoWaterStd = 62.4 * 1.05; // ~1.05 brine sg
    const rhoGasStd = yg * 0.0764;

    const freeGasRatio = Math.max(0, gor - rs);
    const bg = this.calcBg(p, tempF);

    // In-situ flow rates
    const qInSituOil = qo * bo * 5.615 / 86400; // cu ft/sec
    const qInSituWater = qw * bw * 5.615 / 86400; // cu ft/sec
    const qInSituGas = qo * freeGasRatio * bg / 86400; // cu ft/sec

    const totalRate = qInSituOil + qInSituWater + qInSituGas;
    if (totalRate <= 0) return 50.0;

    const massRate = (qo * rhoOilStd * 5.615 + qw * rhoWaterStd * 5.615 + qo * freeGasRatio * rhoGasStd) / 86400;
    return massRate / totalRate;
  }
};
