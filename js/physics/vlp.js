/**
 * Vertical Lift Performance (VLP) / Tubing Multiphase Hydraulics
 * Based on Beggs & Brill / Ansari multiphase flow principles
 */
import { Fluid } from './fluid.js';

export const VLP = {
  /**
   * Determine multiphase flow regime (Bubble, Intermittent/Slug, Transition/Churn, Distributed/Mist)
   */
  determineFlowRegime(nFr, lambdaL) {
    const L1 = 316 * Math.pow(lambdaL, 0.302);
    const L2 = 0.0009252 * Math.pow(lambdaL, -2.4684);
    const L3 = 0.1 * Math.pow(lambdaL, -1.4516);
    const L4 = 0.5 * Math.pow(lambdaL, -6.738);

    if ((lambdaL < 0.01 && nFr < L1) || (lambdaL >= 0.01 && nFr < L2)) {
      return { regime: 'Segregated', pattern: 'Stratified / Bubble' };
    } else if (
      (lambdaL >= 0.01 && lambdaL < 0.4 && L3 < nFr && nFr <= L1) ||
      (lambdaL >= 0.4 && L2 <= nFr && nFr <= L4)
    ) {
      return { regime: 'Intermittent', pattern: 'Intermittent (Slug)' };
    } else if (
      (lambdaL < 0.4 && nFr >= L1) ||
      (lambdaL >= 0.4 && nFr > L4)
    ) {
      return { regime: 'Distributed', pattern: 'Distributed (Mist)' };
    } else {
      return { regime: 'Transition', pattern: 'Transition (Churn)' };
    }
  },

  /**
   * Calculate pressure gradient dP/dz (psi/ft) at a given depth and pressure
   * Includes hydrostatic head and Colebrook-White friction
   */
  calcGradient(p, ql, wc, gor, tubingIdIn, api = 35, gasGrav = 0.7, tempF = 160) {
    if (ql <= 0) {
      // Static column gradient
      const waterCut = wc / 100;
      const yo = Fluid.calcOilGravity(api);
      const rhoAvg = (yo * (1 - waterCut) + 1.05 * waterCut) * 62.4;
      return {
        gradTotal: rhoAvg / 144, // psi/ft
        gradHydro: rhoAvg / 144,
        gradFric: 0,
        flowPattern: 'Static',
        density: rhoAvg
      };
    }

    const dFt = tubingIdIn / 12;
    const area = (Math.PI / 4) * Math.pow(dFt, 2);

    const waterCut = wc / 100;
    const qo = ql * (1 - waterCut);
    const qw = ql * waterCut;
    const pb = Fluid.calcBubblePoint(gor, gasGrav, api, tempF);
    const rs = Fluid.calcRs(p, pb, gor, gasGrav, api, tempF);
    const bo = Fluid.calcBo(rs, gasGrav, api, tempF);
    const bw = 1.02;
    const bg = Fluid.calcBg(p, tempF);

    const yo = Fluid.calcOilGravity(api);
    const yg = gasGrav || 0.7;
    const rhoO = (yo * 62.4 + (rs * yg * 0.0764) / 5.615) / bo;
    const rhoW = 62.4 * 1.05;
    const rhoG = (p <= 14.7 ? 14.7 : p) * yg * 2.7 / (0.85 * (tempF + 459.67));

    // Liquid in-situ rate (cu ft/s)
    const qL_insitu = (qo * bo + qw * bw) * 5.615 / 86400;
    // Free gas in-situ rate (cu ft/s)
    const freeGas = Math.max(0, gor - rs);
    const qG_insitu = (qo * freeGas * bg) / 86400;

    const vsl = qL_insitu / area; // Superficial liquid velocity (ft/s)
    const vsg = qG_insitu / area; // Superficial gas velocity (ft/s)
    const vm = vsl + vsg;         // Mixture velocity (ft/s)

    const noSlipHoldup = vsl / Math.max(0.0001, vm);
    const g = 32.174;
    const nFr = Math.pow(vm, 2) / (g * dFt); // Froude number

    const regimeInfo = this.determineFlowRegime(nFr, noSlipHoldup);

    // Liquid holdup with slip correlation (Beggs & Brill vertical factor)
    let hl0 = noSlipHoldup;
    if (regimeInfo.regime === 'Intermittent') {
      hl0 = (0.845 * Math.pow(noSlipHoldup, 0.5351)) / Math.pow(nFr, 0.0173);
    } else if (regimeInfo.regime === 'Distributed') {
      hl0 = (1.065 * Math.pow(noSlipHoldup, 0.5824)) / Math.pow(nFr, 0.0609);
    } else {
      hl0 = (0.98 * Math.pow(noSlipHoldup, 0.4846)) / Math.pow(nFr, 0.0868);
    }
    hl0 = Math.max(noSlipHoldup, Math.min(1.0, hl0));

    // Vertical inclination correction for tubing (+90 deg)
    const c = Math.max(0, (1 - noSlipHoldup) * Math.log(Math.max(0.0001, 0.011 * Math.pow(noSlipHoldup, -3.768) * Math.pow(nFr, 1.614))));
    const psi_inc = 1 + c * 0.91; // for vertical pipe
    const hl = Math.max(noSlipHoldup, Math.min(1.0, hl0 * psi_inc));

    // Average liquid density
    const rhoL = (qo * bo * rhoO + qw * bw * rhoW) / Math.max(0.0001, (qo * bo + qw * bw));
    // Mixture density
    const rhoM = rhoL * hl + rhoG * (1 - hl);

    // Hydrostatic gradient
    const gradHydro = rhoM / 144; // psi/ft

    // Friction factor (Moody / Colebrook approximation)
    const rough = 0.0006 / 12; // commercial steel
    const relRough = rough / dFt;
    // Mixture viscosity
    const muL = 2.0; // cp approx
    const muG = 0.018; // cp approx
    const muM = (muL * hl + muG * (1 - hl)) * 0.000672; // lbm/ft-s
    const reynolds = (rhoM * vm * dFt) / Math.max(1e-6, muM);

    let f = 0.02;
    if (reynolds < 2100) {
      f = 64 / Math.max(1, reynolds);
    } else {
      // Haaland equation for turbulent friction factor
      const term = -1.8 * Math.log10(Math.pow(relRough / 3.7, 1.11) + 6.9 / reynolds);
      f = Math.pow(1 / Math.max(0.001, term), 2);
    }

    // Beggs & Brill two-phase friction factor multiplier
    const y = Math.max(0.001, noSlipHoldup / Math.pow(hl, 2));
    let s_factor = Math.log(y);
    if (s_factor > 1 && s_factor < 1.2) s_factor = 1.0;
    const ftp = f * Math.exp(s_factor * 0.2);

    const gradFric = (2 * ftp * rhoM * Math.pow(vm, 2)) / (32.174 * dFt * 144); // psi/ft
    const gradTotal = gradHydro + gradFric;

    return {
      gradTotal,
      gradHydro,
      gradFric,
      flowPattern: regimeInfo.pattern,
      density: rhoM
    };
  },

  /**
   * Traverse integration: Compute Flowing BHP (Pwf) from Wellhead Pressure (Pwhp)
   * or compute P(z) profile along tubing depth
   */
  calcTraverse(pwhp, ql, wc, gor, tubingIdIn, tubingDepthFt, numSteps = 20, liftParams = null) {
    const dz = tubingDepthFt / numSteps;
    const profile = [{ depth: 0, p: pwhp, pattern: 'Surface', gradHydro: 0, gradFric: 0 }];

    let currentP = pwhp;
    let sumHydro = 0;
    let sumFric = 0;
    let dominantPattern = 'Bubble';

    for (let step = 1; step <= numSteps; step++) {
      const depth = step * dz;
      let effectiveGor = gor;

      // Handle Continuous Gas Lift Injection: gas added below injection depth
      if (liftParams && liftParams.type === 'gas_lift' && liftParams.injRate > 0) {
        if (depth <= liftParams.injDepth) {
          // Above injection point: extra injected gas enhances GLR
          const extraGor = (liftParams.injRate * 1000) / Math.max(1, ql * (1 - wc / 100));
          effectiveGor = gor + extraGor;
        }
      }

      // Handle ESP: pressure boost at pump depth
      if (liftParams && liftParams.type === 'esp' && liftParams.headDelta > 0) {
        if (Math.abs(depth - liftParams.pumpDepth) <= dz / 2) {
          currentP -= liftParams.headDelta; // pump adds pressure going down
          if (currentP < 14.7) currentP = 14.7;
        }
      }

      const grad = this.calcGradient(currentP, ql, wc, effectiveGor, tubingIdIn);
      const dp = grad.gradTotal * dz;
      currentP += dp;

      sumHydro += grad.gradHydro * dz;
      sumFric += grad.gradFric * dz;
      dominantPattern = grad.flowPattern;

      profile.push({
        depth: Math.round(depth),
        p: Math.round(currentP * 10) / 10,
        pattern: grad.flowPattern,
        gradHydro: grad.gradHydro,
        gradFric: grad.gradFric
      });
    }

    return {
      pwf: currentP,
      hydroTotal: sumHydro,
      fricTotal: sumFric,
      profile,
      dominantPattern
    };
  },

  /**
   * Calculate VLP curve points (Q vs Pwf) for Nodal Analysis
   */
  generateCurve(pwhp, wc, gor, tubingIdIn, tubingDepthFt, qmax, numPoints = 40, liftParams = null) {
    const points = [];
    for (let i = 0; i <= numPoints; i++) {
      const q = Math.max(1, (qmax * i) / numPoints);
      const res = this.calcTraverse(pwhp, q, wc, gor, tubingIdIn, tubingDepthFt, 10, liftParams);
      points.push({ q: Math.round(q * 10) / 10, pwf: Math.round(res.pwf * 10) / 10 });
    }
    return points;
  }
};
