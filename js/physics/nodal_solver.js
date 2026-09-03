/**
 * Nodal Analysis System Solver
 * Integrates Inflow (IPR) and Outflow (VLP + Choke + Flowline + Separator)
 * Solves for equilibrium operating point: Pwf_IPR(Q) = Pwf_VLP(Q)
 */
import { IPR } from './ipr.js';
import { VLP } from './vlp.js';
import { Choke } from './choke.js';
import { Flowline } from './flowline.js';
import { ESP } from './esp.js';

export const NodalSolver = {
  /**
   * Evaluate the complete Outflow (Pwf required to deliver liquid rate Q to the separator)
   */
  calcOutflowPwf(q, params) {
    if (q <= 0) return 0;

    const {
      pSep,
      choke64th,
      flId,
      flLen,
      flElev,
      tubingId,
      tubingDepth,
      wc,
      gor,
      api,
      liftMode, // 'free_flowing' | 'gas_lift' | 'esp'
      glInjRate,
      glInjDepth,
      espFreq,
      espStages,
      espDepth
    } = params;

    // 1. Flowline Pressure Drop
    const flRes = Flowline.calcFLP(pSep, q, flId, flLen, flElev, wc, gor);
    const flp = flRes.flp;

    // 2. Choke Pressure Drop
    const pwhp = Choke.calcWHP(q, gor, choke64th, flp);

    // 3. Lift parameters
    let liftParams = null;
    if (liftMode === 'gas_lift' && glInjRate > 0) {
      liftParams = {
        type: 'gas_lift',
        injRate: glInjRate,
        injDepth: glInjDepth || (tubingDepth * 0.85)
      };
    } else if (liftMode === 'esp' && espFreq > 0 && espStages > 0) {
      const espRes = ESP.calcHead(q, espFreq, espStages, 0.9);
      liftParams = {
        type: 'esp',
        headDelta: espRes.deltaP,
        pumpDepth: espDepth || (tubingDepth * 0.9)
      };
    }

    // 4. Vertical Tubing Traverse to Bottomhole
    const vlpRes = VLP.calcTraverse(pwhp, q, wc, gor, tubingId, tubingDepth, 15, liftParams);

    return {
      pwf: vlpRes.pwf,
      pwhp,
      flp,
      chokeDp: Math.max(0, pwhp - flp),
      flowlineDp: flRes.dpTotal,
      hydroTotal: vlpRes.hydroTotal,
      fricTotal: vlpRes.fricTotal,
      vlpProfile: vlpRes.profile,
      dominantPattern: vlpRes.dominantPattern
    };
  },

  /**
   * Numerical Bisection / Secant Root Solver for Nodal Intersection
   */
  solve(params) {
    const { pr, pi, pb, wc, gor } = params;
    const qmax = IPR.calcQmax(pr, pi, pb);

    if (qmax <= 0) {
      return this.buildEmptyResult(params, 'Reservoir Depleted / Zero Inflow');
    }

    // Define residual function F(Q) = Pwf_IPR(Q) - Pwf_VLP(Q)
    const residual = (q) => {
      const pwf_ipr = IPR.calcPwf(q, pr, pi, pb);
      const outflow = this.calcOutflowPwf(q, params);
      return { diff: pwf_ipr - outflow.pwf, pwf_ipr, outflow };
    };

    // Bracket the root
    let lowQ = 5.0;
    let highQ = qmax * 0.99;

    let resLow = residual(lowQ);
    let resHigh = residual(highQ);

    // If even at near-zero rate Outflow Pwf > Inflow Pwf, the well cannot lift itself (liquid loaded / died)
    if (resLow.diff < 0 && resHigh.diff < 0) {
      return this.buildEmptyResult(params, 'Well Dead / Liquid Loaded (VLP > IPR)');
    }

    // Bisection search
    let converged = false;
    let bestQ = 0;
    let bestOutflow = null;
    let bestPwf = 0;

    let iterations = 0;
    const maxIter = 40;
    const tol = 1.0; // within 1 psi

    while (iterations < maxIter && (highQ - lowQ) > 0.5) {
      iterations++;
      const midQ = (lowQ + highQ) / 2;
      const resMid = residual(midQ);

      if (Math.abs(resMid.diff) < tol) {
        bestQ = midQ;
        bestOutflow = resMid.outflow;
        bestPwf = resMid.pwf_ipr;
        converged = true;
        break;
      }

      // Check sign
      if (resMid.diff > 0) {
        // IPR > VLP -> we can produce more rate
        lowQ = midQ;
      } else {
        // VLP > IPR -> rate too high
        highQ = midQ;
      }

      bestQ = midQ;
      bestOutflow = resMid.outflow;
      bestPwf = resMid.pwf_ipr;
      if (Math.abs(resMid.diff) < 5.0) converged = true;
    }

    if (!converged && bestQ <= 10) {
      return this.buildEmptyResult(params, 'No Intersection / Non-flowing');
    }

    // Calculate fluid breakdown
    const waterCutFrac = wc / 100;
    const qOil = bestQ * (1 - waterCutFrac);
    const qWater = bestQ * waterCutFrac;
    const qGasMscf = (qOil * gor) / 1000;
    const drawdown = Math.max(0, pr - bestPwf);

    // Choke regime
    const chokeEval = Choke.evaluateFlow(bestOutflow.pwhp, bestOutflow.flp);

    // Generate IPR and VLP curves for plotting
    const iprCurve = IPR.generateCurve(pr, pi, pb, 50);
    const vlpCurve = [];
    const stepQ = qmax / 40;
    for (let i = 1; i <= 40; i++) {
      const qVal = i * stepQ;
      const out = this.calcOutflowPwf(qVal, params);
      vlpCurve.push({ q: Math.round(qVal * 10) / 10, pwf: Math.round(out.pwf * 10) / 10 });
    }

    // Complete Pressure Traverse from Reservoir to Separator
    const fullTraverse = [
      { location: 'Reservoir', depth: params.tubingDepth + 100, pressure: pr },
      { location: 'Sandface / FBHP', depth: params.tubingDepth, pressure: bestPwf }
    ];

    // Add tubing steps in reverse depth (from bottom to top)
    if (bestOutflow.vlpProfile && bestOutflow.vlpProfile.length > 0) {
      for (let i = bestOutflow.vlpProfile.length - 1; i >= 0; i--) {
        const pt = bestOutflow.vlpProfile[i];
        fullTraverse.push({
          location: pt.depth === 0 ? 'Wellhead' : `Tubing (${pt.depth} ft)`,
          depth: pt.depth,
          pressure: pt.p,
          regime: pt.pattern
        });
      }
    }

    fullTraverse.push(
      { location: 'Downstream Choke (FLP)', depth: 0, pressure: bestOutflow.flp },
      { location: 'Separator', depth: -params.flElev, pressure: params.pSep }
    );

    return {
      converged: true,
      statusMsg: 'Converged',
      qLiquid: Math.round(bestQ * 10) / 10,
      qOil: Math.round(qOil * 10) / 10,
      qWater: Math.round(qWater * 10) / 10,
      qGasMscf: Math.round(qGasMscf * 10) / 10,
      pwf: Math.round(bestPwf * 10) / 10,
      pwhp: Math.round(bestOutflow.pwhp * 10) / 10,
      flp: Math.round(bestOutflow.flp * 10) / 10,
      chokeDp: Math.round(bestOutflow.chokeDp * 10) / 10,
      flowlineDp: Math.round(bestOutflow.flowlineDp * 10) / 10,
      drawdown: Math.round(drawdown * 10) / 10,
      hydroTotal: Math.round(bestOutflow.hydroTotal * 10) / 10,
      fricTotal: Math.round(bestOutflow.fricTotal * 10) / 10,
      chokeRegime: chokeEval.regime,
      isChokeCritical: chokeEval.isCritical,
      tubingRegime: bestOutflow.dominantPattern,
      iprCurve,
      vlpCurve,
      traverse: fullTraverse
    };
  },

  buildEmptyResult(params, reason) {
    const iprCurve = IPR.generateCurve(params.pr, params.pi, params.pb, 40);
    return {
      converged: false,
      statusMsg: reason,
      qLiquid: 0,
      qOil: 0,
      qWater: 0,
      qGasMscf: 0,
      pwf: params.pr,
      pwhp: params.pSep,
      flp: params.pSep,
      chokeDp: 0,
      flowlineDp: 0,
      drawdown: 0,
      hydroTotal: 0,
      fricTotal: 0,
      chokeRegime: 'No Flow',
      isChokeCritical: false,
      tubingRegime: 'Static',
      iprCurve,
      vlpCurve: [],
      traverse: [
        { location: 'Reservoir', depth: params.tubingDepth, pressure: params.pr },
        { location: 'Wellhead', depth: 0, pressure: params.pSep },
        { location: 'Separator', depth: 0, pressure: params.pSep }
      ]
    };
  }
};
