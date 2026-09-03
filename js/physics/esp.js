/**
 * Electric Submersible Pump (ESP) Hydraulic Engine
 * Multi-stage centrifugal pump performance, affinity laws,
 * operating windows (downthrust/upthrust), and gas/viscosity degradation
 */
export const ESP = {
  /**
   * Base 60Hz single stage head curve coefficients (Head ft vs Rate STB/d)
   * H_stage = A - B*Q - C*Q^2
   */
  BASE_STAGE_A: 45.0,  // Shutoff head per stage (ft)
  BASE_STAGE_B: 0.002,
  BASE_STAGE_C: 0.0000035,
  BASE_BEP_RATE: 2200, // Best Efficiency Point rate at 60Hz (STB/d)
  BASE_MIN_RATE: 800,  // Downthrust limit (STB/d)
  BASE_MAX_RATE: 3400, // Upthrust limit (STB/d)

  /**
   * Calculate total developed head (ft) and differential pressure (psi)
   * @param {number} ql - Liquid rate (STB/d)
   * @param {number} freqHz - VSD frequency (Hz)
   * @param {number} stages - Number of pump stages
   * @param {number} fluidSg - Average fluid specific gravity (~0.85 - 1.0)
   * @param {number} freeGasPct - In-situ free gas percentage at pump intake (%)
   */
  calcHead(ql, freqHz, stages, fluidSg = 0.9, freeGasPct = 0) {
    const fRatio = freqHz / 60.0;
    // Affinity Laws: Q_equiv = Q / fRatio
    const qEquiv = ql / Math.max(0.1, fRatio);

    // Single stage head at 60Hz
    let hSingle = this.BASE_STAGE_A - this.BASE_STAGE_B * qEquiv - this.BASE_STAGE_C * Math.pow(qEquiv, 2);
    if (hSingle < 0) hSingle = 0;

    // Scale by Affinity Law: H = H_60 * fRatio^2
    let hTotal = hSingle * Math.pow(fRatio, 2) * stages;

    // Free gas head derating factor (Dunlap / Cirigliano correlation)
    if (freeGasPct > 5) {
      const gasPenalty = Math.min(0.9, 0.025 * Math.pow(freeGasPct - 5, 1.2));
      hTotal *= (1 - gasPenalty);
    }

    // Convert Head (ft) to Differential Pressure Delta P (psi)
    // Delta P = Head (ft) * Specific Gravity * 0.433
    const deltaP = (hTotal * fluidSg * 62.4) / 144;

    // Power consumption (BHP)
    // Power = (Q * Head * SG) / (3960 * Efficiency)
    const eff = Math.max(0.2, 0.72 - Math.pow((qEquiv - this.BASE_BEP_RATE) / 2500, 2));
    const bhp = (ql * hTotal * fluidSg * 0.000017) / Math.max(0.1, eff);

    return {
      headFt: Math.round(hTotal),
      deltaP: Math.round(deltaP * 10) / 10,
      powerHp: Math.round(bhp * 10) / 10,
      efficiency: Math.round(eff * 100)
    };
  },

  /**
   * Generate Pump Performance Curve (Head vs Rate) for a given frequency and stages
   */
  generatePumpCurve(freqHz, stages, fluidSg = 0.9, numPoints = 35) {
    const fRatio = freqHz / 60.0;
    const maxQ = this.BASE_MAX_RATE * fRatio * 1.35;
    const minRecQ = this.BASE_MIN_RATE * fRatio;
    const maxRecQ = this.BASE_MAX_RATE * fRatio;

    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const q = (maxQ * i) / numPoints;
      const res = this.calcHead(q, freqHz, stages, fluidSg);
      points.push({
        q: Math.round(q),
        head: res.headFt,
        deltaP: res.deltaP,
        inRecommendedRange: q >= minRecQ && q <= maxRecQ
      });
    }

    return {
      curve: points,
      downthrustLimitQ: Math.round(minRecQ),
      upthrustLimitQ: Math.round(maxRecQ),
      bepQ: Math.round(this.BASE_BEP_RATE * fRatio)
    };
  }
};
