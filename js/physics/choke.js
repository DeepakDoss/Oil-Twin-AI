/**
 * Choke Hydraulics & Multiphase Flow
 * Gilbert, Ros, Baxendell, and Sachdeva choke correlations
 * Evaluates Critical vs Subcritical flow regimes
 */
export const Choke = {
  /**
   * Critical pressure ratio cutoff (P_downstream / P_upstream)
   * Typically ~0.50 - 0.55 for multiphase mixtures
   */
  CRITICAL_RATIO: 0.546,

  /**
   * Gilbert correlation for Critical Flow through choke orifice
   * P_whp = (a * Q_liquid * GLR^b) / S^c
   * where S is choke size in 64ths of an inch
   */
  calcCriticalWHP(ql, gor, choke64th) {
    if (choke64th <= 0 || ql <= 0) return 0;
    const a = 10.0;
    const b = 0.546;
    const c = 1.89;

    // Gilbert equation: P1 (psi) = 10 * Q (STB/d) * (GLR / 100)^0.546 / (S^1.89)
    const glrHundreds = Math.max(0.01, gor / 100);
    const pwhp = (a * ql * Math.pow(glrHundreds, b)) / Math.pow(choke64th, c);
    return Math.max(14.7, pwhp);
  },

  /**
   * Determine whether flow through choke is Critical or Subcritical
   * @param {number} pwhp - Upstream Wellhead Pressure (psi)
   * @param {number} pflp - Downstream Flowline Pressure (psi)
   * @returns {object} { isCritical, pressureRatio, dp, downstreamP }
   */
  evaluateFlow(pwhp, pflp) {
    if (pwhp <= 0) {
      return { isCritical: false, pressureRatio: 1.0, dp: 0, regime: 'Subcritical' };
    }
    const ratio = pflp / pwhp;
    const isCritical = ratio <= this.CRITICAL_RATIO;
    const dp = Math.max(0, pwhp - pflp);

    return {
      isCritical,
      pressureRatio: Math.round(ratio * 1000) / 1000,
      dp: Math.round(dp * 10) / 10,
      regime: isCritical ? 'Critical Flow' : 'Subcritical Flow'
    };
  },

  /**
   * Calculate required upstream WHP given liquid rate, GOR, choke size, and downstream FLP
   */
  calcWHP(ql, gor, choke64th, pflp) {
    if (ql <= 0) return pflp;
    // Critical upstream pressure from Gilbert
    const pCrit = this.calcCriticalWHP(ql, gor, choke64th);

    if (pflp / Math.max(1, pCrit) <= this.CRITICAL_RATIO) {
      // Critical regime: downstream disturbances don't propagate upstream
      return pCrit;
    } else {
      // Subcritical regime: orifice equation dP = f(rho, v^2)
      // dP approx proportional to (Q / S^2)^2
      const area64 = Math.PI * Math.pow((choke64th / 64) / 2, 2);
      const dpSub = (0.00015 * Math.pow(ql, 1.8)) / Math.pow(area64, 1.5);
      return pflp + dpSub;
    }
  }
};
