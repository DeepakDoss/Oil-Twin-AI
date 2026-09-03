/**
 * Sucker-Rod Pumping (SRP) & Beam Unit Kinematics Engine
 * Models walking beam surface kinematics, polished rod motion,
 * downhole plunger displacement, valve logic, and
 * surface & downhole dynamometer card generation.
 */
export const SRPEngine = {
  // Fault diagnosis types
  DIAGNOSIS_TYPES: {
    normal: {
      name: 'Normal Operation',
      desc: 'Full pump barrel fillage, sharp load pickup on upstroke, complete load transfer on downstroke.'
    },
    gas_interference: {
      name: 'Gas Interference',
      desc: 'Free gas in pump barrel causes delayed load transfer on downstroke as gas compresses before TV opens.'
    },
    fluid_pound: {
      name: 'Fluid Pound / Incomplete Fillage',
      desc: 'Inflow starved pump barrel: plunger strikes liquid surface midway through downstroke with sharp impact.'
    },
    sv_leak: {
      name: 'Standing Valve Leak',
      desc: 'Liquid slips past worn standing valve on upstroke, causing sloped bottom line and lower volumetric efficiency.'
    },
    tv_leak: {
      name: 'Traveling Valve Leak',
      desc: 'Fluid slips past traveling valve on downstroke, causing delayed load pickup at top of stroke.'
    },
    parted_rod: {
      name: 'Parted Rod String',
      desc: 'Rod string fractured downhole. Polished rod carries only weight of broken upper rod string; zero fluid lift.'
    },
    unanchored_tubing: {
      name: 'Unanchored Tubing',
      desc: 'Tubing string stretches during stroke, causing distorted parallelogram card with loss of effective stroke.'
    }
  },

  /**
   * Surface Kinematics: Calculate beam position and polished rod position at crank angle theta (rad)
   * Stroke length S, SPM (Strokes Per Minute)
   */
  calcKinematics(thetaRad, strokeInches = 120, spm = 10) {
    // Crank angle 0 = Bottom Dead Center (BDC), PI = Top Dead Center (TDC)
    // Polished rod displacement s(theta):
    const posNorm = 0.5 * (1 - Math.cos(thetaRad)); // 0 to 1
    const rodPosInches = posNorm * strokeInches;

    // Velocity & Acceleration
    const omega = (2 * Math.PI * spm) / 60; // rad/s
    const vel = 0.5 * strokeInches * omega * Math.sin(thetaRad); // in/s
    const acc = 0.5 * strokeInches * Math.pow(omega, 2) * Math.cos(thetaRad); // in/s^2

    // Direction: 1 = Upstroke, -1 = Downstroke
    const isUpstroke = Math.sin(thetaRad) >= 0;

    return {
      posInches: rodPosInches,
      posNorm,
      velocity: vel,
      accel: acc,
      isUpstroke,
      crankAngleDeg: Math.round(((thetaRad * 180) / Math.PI) % 360)
    };
  },

  /**
   * Generate Dynamometer Card (Surface & Downhole) for a given fault condition
   * Returns array of points: [{ pos: inches, surfLoad: lbs, downholeLoad: lbs, phase: 'up'|'down' }]
   */
  generateDynoCard(condition = 'normal', strokeInches = 120, rodWeightLbs = 14000, fluidLoadLbs = 8500) {
    const points = [];
    const numPoints = 80;

    for (let i = 0; i <= numPoints; i++) {
      const theta = (2 * Math.PI * i) / numPoints;
      const kin = this.calcKinematics(theta, strokeInches);
      const x = kin.posInches;
      const frac = kin.posNorm; // 0 (bottom) to 1 (top)
      const isUp = kin.isUpstroke;

      let downholeLoad = 0;
      let surfDynamicAdd = (kin.accel / 386.4) * rodWeightLbs * 0.45; // inertia load

      switch (condition) {
        case 'normal':
          if (isUp) {
            // Full fluid load picked up near bottom
            const pickup = Math.min(1.0, frac / 0.08);
            downholeLoad = fluidLoadLbs * pickup;
          } else {
            // Load transferred to tubing near top
            const drop = Math.min(1.0, (1 - frac) / 0.08);
            downholeLoad = fluidLoadLbs * (1 - drop);
          }
          break;

        case 'gas_interference':
          if (isUp) {
            downholeLoad = fluidLoadLbs * Math.min(1.0, frac / 0.1);
          } else {
            // Gas compression curve on downstroke: load stays high until gas compresses
            const gasComp = Math.pow(1 - frac, 2.5);
            downholeLoad = fluidLoadLbs * (1 - gasComp);
          }
          break;

        case 'fluid_pound':
          if (isUp) {
            downholeLoad = fluidLoadLbs * Math.min(1.0, frac / 0.08);
          } else {
            // High load during air/gas travel, then SUDDEN DROP when striking liquid at ~50%
            if (frac > 0.45) {
              downholeLoad = fluidLoadLbs;
            } else {
              // Liquid pound impact!
              const pound = frac < 0.4 ? 0 : fluidLoadLbs * 0.8;
              downholeLoad = pound;
            }
          }
          break;

        case 'sv_leak':
          if (isUp) {
            // Standing valve leaks: load slants downward during upstroke
            const leakDecay = 1 - 0.35 * frac;
            downholeLoad = fluidLoadLbs * leakDecay * Math.min(1.0, frac / 0.1);
          } else {
            const drop = Math.min(1.0, (1 - frac) / 0.1);
            downholeLoad = fluidLoadLbs * (1 - drop);
          }
          break;

        case 'tv_leak':
          if (isUp) {
            // Traveling valve leaks: delayed load pickup, rounded top right
            const leakDelay = Math.pow(frac, 1.8);
            downholeLoad = fluidLoadLbs * leakDelay;
          } else {
            downholeLoad = fluidLoadLbs * 0.15 * frac;
          }
          break;

        case 'parted_rod':
          // Fractured rod downhole: zero fluid load, very low rod weight
          downholeLoad = 0;
          surfDynamicAdd *= 0.3;
          break;

        case 'unanchored_tubing':
          if (isUp) {
            // Tubing stretches: slow diagonal slope on pickup
            downholeLoad = fluidLoadLbs * Math.min(1.0, frac / 0.35);
          } else {
            // Tubing contracts: slow diagonal slope on release
            downholeLoad = fluidLoadLbs * (1 - Math.min(1.0, (1 - frac) / 0.35));
          }
          break;
      }

      // Parted rod special load
      const effectiveRodWeight = condition === 'parted_rod' ? rodWeightLbs * 0.35 : rodWeightLbs;
      const surfLoad = effectiveRodWeight + downholeLoad + surfDynamicAdd;

      points.push({
        thetaDeg: kin.crankAngleDeg,
        posInches: Math.round(x * 10) / 10,
        downholeLoad: Math.max(0, Math.round(downholeLoad)),
        surfLoad: Math.max(0, Math.round(surfLoad)),
        isUpstroke: isUp
      });
    }

    return points;
  }
};
