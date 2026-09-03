/**
 * Gas Lift Engineering Engine
 * Continuous gas-lift hydraulics, gradient lightening,
 * and Gas Lift Performance Curve (GLPC) generation
 */
export const GasLift = {
  /**
   * Evaluate Gas Lift Performance Curve (Liquid Rate Q vs Injected Gas Rate Q_inj)
   * Shows initial production gain from lightening hydrostatic column, followed by
   * maximum production rate, and eventual decline due to severe friction backpressure.
   */
  generatePerformanceCurve(basePr, pi, pb, pwhp, wc, formGor, tubingIdIn, tubingDepthFt, injDepthFt, maxInjMscf = 4000, numPoints = 25) {
    const points = [];
    let optQ = 0;
    let optInj = 0;

    for (let i = 0; i <= numPoints; i++) {
      const qInj = (maxInjMscf * i) / numPoints; // MSCF/d

      // Inflow/outflow equilibrium estimate for this injection rate
      // At higher qInj, hydrostatic gradient reduces: grad ~ rho_avg / 144
      // Hydrostatic reduction factor:
      const gasRatio = qInj / 800;
      const hydroRelief = 0.45 * (1 - Math.exp(-gasRatio * 0.85)); // fraction relieved
      const fricPenalty = 0.05 * Math.pow(gasRatio, 1.8);          // friction backpressure

      const netReliefPsi = (injDepthFt * 0.35) * (hydroRelief - fricPenalty);

      // Equivalent effective flowing BHP reduction
      // Delta Q = PI * Delta Pwf
      const baseQ = Math.max(10, pi * Math.max(0, basePr - pwhp - 0.38 * tubingDepthFt));
      const liftGain = pi * Math.max(-baseQ * 0.8, netReliefPsi * 0.7);
      const estimatedQ = Math.max(0, baseQ + liftGain);

      if (estimatedQ > optQ) {
        optQ = estimatedQ;
        optInj = qInj;
      }

      points.push({
        qInj: Math.round(qInj),
        qLiquid: Math.round(estimatedQ * 10) / 10
      });
    }

    return {
      curve: points,
      optInjRate: Math.round(optInj),
      optLiquidRate: Math.round(optQ * 10) / 10
    };
  }
};
