/**
 * Reservoir Inflow Performance Relationship (IPR)
 * Darcy (Linear PI), Vogel (Two-phase), and Composite IPR models
 */
export const IPR = {
  /**
   * Calculate Flowing Bottomhole Pressure Pwf for a given liquid rate Q
   * @param {number} q - Liquid production rate (STB/d)
   * @param {number} pr - Reservoir pressure (psi)
   * @param {number} pi - Productivity index (STB/d/psi)
   * @param {number} pb - Bubble point pressure (psi)
   * @returns {number} pwf - Flowing bottomhole pressure (psi)
   */
  calcPwf(q, pr, pi, pb) {
    if (q <= 0) return pr;

    // Case 1: Undersaturated throughout (Pr > Pb and Pwf >= Pb)
    if (pr >= pb) {
      const qb = pi * (pr - pb);
      if (q <= qb) {
        // Pure linear Darcy
        return Math.max(0, pr - q / pi);
      } else {
        // Composite IPR: Linear down to Pb, then Vogel below Pb
        // q = qb + qvogel
        // qvogel / qvmax = 1 - 0.2*(Pwf/Pb) - 0.8*(Pwf/Pb)^2
        const qv = q - qb;
        const qvmax = (pi * pb) / 1.8;
        const ratio = qv / qvmax;
        if (ratio >= 1) return 0; // Exceeded AOFP
        // 0.8*(Pwf/Pb)^2 + 0.2*(Pwf/Pb) - (1 - ratio) = 0
        // Quadratic: a x^2 + b x + c = 0
        const a = 0.8;
        const b = 0.2;
        const c = -(1 - ratio);
        const disc = b * b - 4 * a * c;
        if (disc < 0) return 0;
        const x = (-b + Math.sqrt(disc)) / (2 * a);
        return Math.max(0, Math.min(pb, x * pb));
      }
    } else {
      // Case 2: Saturated reservoir (Pr <= Pb) - Pure Vogel equation
      // qmax = (pi * pr) / 1.8
      const qmax = (pi * pr) / 1.8;
      const ratio = q / qmax;
      if (ratio >= 1) return 0;
      const a = 0.8;
      const b = 0.2;
      const c = -(1 - ratio);
      const disc = b * b - 4 * a * c;
      if (disc < 0) return 0;
      const x = (-b + Math.sqrt(disc)) / (2 * a);
      return Math.max(0, Math.min(pr, x * pr));
    }
  },

  /**
   * Calculate Absolute Open Flow Potential (AOFP / Qmax)
   */
  calcQmax(pr, pi, pb) {
    if (pr >= pb) {
      const qb = pi * (pr - pb);
      const qvmax = (pi * pb) / 1.8;
      return qb + qvmax;
    } else {
      return (pi * pr) / 1.8;
    }
  },

  /**
   * Generate an array of points (Q, Pwf) for plotting the IPR curve
   */
  generateCurve(pr, pi, pb, numPoints = 60) {
    const qmax = this.calcQmax(pr, pi, pb);
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const q = (qmax * i) / numPoints;
      const pwf = this.calcPwf(q, pr, pi, pb);
      points.push({ q: Math.round(q * 10) / 10, pwf: Math.max(0, Math.round(pwf * 10) / 10) });
    }
    return points;
  }
};
