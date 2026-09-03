# Oil-Twin AI — Nodal Analysis & Production Optimization

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/DeepakDoss/Oil-Twin-AI)

An interactive petroleum production digital twin and nodal analysis platform modeled after [well-simulator.com](https://www.well-simulator.com).

## Overview

**Oil-Twin AI** models the entire pathway of petroleum production from reservoir pore to surface separator. It integrates inflow performance, multiphase vertical lift, surface choke hydraulics, surface flowlines, artificial lift systems (Gas Lift & ESP), and beam-pumped rod pumping units with downhole valve kinematics.

---

## Features & Modules

### 1. Live Well Simulator
- **Lift Modes**: Free Flowing, Continuous Gas Lift, and Multi-Stage ESP.
- **Inflow (IPR)**: Darcy linear model above bubble point ($P_b$); Vogel two-phase quadratic model below $P_b$.
- **Outflow (VLP)**: Beggs & Brill / Ansari multiphase hydraulics calculating mixture velocity, liquid holdup ($H_L$), friction loss, and flow regimes (Bubble, Slug/Intermittent, Churn, Mist).
- **Surface Choke**: Gilbert & Sachdeva multiphase orifice equations evaluating critical vs subcritical flow cutoffs ($P_{down}/P_{up} \le 0.546$).
- **Flowline**: Diameter, length, and elevation difference to the surface production separator.
- **Nodal Solver**: Real-time numerical bisection root solver calculating equilibrium liquid rate ($Q$), flowing bottomhole pressure ($P_{wf}$), wellhead pressure ($WHP$), and drawdown.
- **Multi-Tab Visualizations**:
  - Interactive Plotly IPR vs VLP curves with $P_b$ line and operating point.
  - Full Pressure Traverse profile from reservoir sandface, up the tubing string, across the choke, and along the flowline to the separator.
  - Gas Lift Performance Curve ($Q_L$ vs $Q_{inj}$) with optimum injection rate.
  - ESP Pump Performance Curve (Head vs Capacity) with recommended operating window.
  - Dynamic Time Trend recorder tracking pressure and rate histories.
  - Interactive cross-sectional SVG wellbore schematic with live pressure callouts and animated fluid streams.

### 2. Free-Flowing Well Scenarios
- **Base Healthy Well**: Baseline natural producer with good drawdown.
- **Water Coning / Kill**: High water-cut breakthrough increasing hydrostatic column density and killing the well.
- **Reservoir Depletion**: Natural pressure decline below lift threshold.
- **Tubing Sizing**: Comparison of 2-3/8" vs 3-1/2" tubing (friction loss vs liquid loading / Turner critical velocity).
- **Skin Damage**: Formation impairment flattening IPR.

### 3. Gas-Lift Scenarios
- **Deep vs Shallow Injection**: Efficiency loss when injecting above the deepest possible valve.
- **Gas Lift Instability**: Slugging and heading phenomena.
- **Tubing-Casing Leak Diagnostic**: Corrosion hole simulation showing anomalous pressure doglegs and stolen lift gas.
- **Over-Injection Friction Penalty**: Severe gas friction backpressure causing production decline.

### 4. ESP Scenarios
- **VSD Frequency Sweeps**: 45 Hz turndown vs 60 Hz nominal vs 65 Hz production boost.
- **Gas Interference & Gas Lock**: Free gas degradation at pump intake.
- **Pump-Off Condition**: Inflow starvation and low intake pressure.

### 5. Gas-Lift Unloading Process
- Step-by-step and animated sequence of well kick-off:
  1. Static kill brine state.
  2. Annulus pressurization and U-tubing displacement.
  3. Unloading through Valve 1 (2,500 ft).
  4. Valve 1 closes; unloading through Valve 2 (4,800 ft).
  5. Unloading through Valve 3 (6,800 ft).
  6. Final continuous injection through bottom operating orifice (8,200 ft).
- SVG animation showing annulus fluid level depression, live casing pressure ($P_{cas}$) and tubing head pressure ($P_{th}$) gauges, and valve status lights.

### 6. Sucker-Rod Pump (SRP) System & Fault Diagnosis
- Real-time HTML5 Canvas animation of a beam pumping unit:
  - Samson post, saddle bearing, walking beam, horsehead, bridle, polished rod, pitman arm, crank, and counterweights.
  - Downhole pump barrel, plunger, traveling valve (TV), and standing valve (SV).
- Synchronized surface and downhole dynamometer cards (Load vs Position).
- 7 Selectable Fault Modes:
  1. Normal full pump
  2. Gas interference
  3. Fluid pound (incomplete fillage)
  4. Standing valve leak
  5. Traveling valve leak
  6. Parted rod string
  7. Unanchored tubing stretch

---

## How to Run Locally

### Option 1: Direct Browser
Simply double-click `index.html` or open it in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server
Using Python:
```bash
python -m http.server 3000
```
Or using Node.js:
```bash
npx serve -l 3000 .
```
Then open `http://localhost:3000` in your browser.

---

## Technical References
- Brown, K.E., *The Technology of Artificial Lift Methods*, Vol. 1–4, PennWell Publishing Co.
- Beggs, H.D. & Brill, J.P., *A Study of Two-Phase Flow in Inclined Pipes*, Journal of Petroleum Technology.
- Gilbert, W.E., *Flowing and Gas-Lift Well Performance*, API Drilling and Production Practice.
- Vogel, J.V., *Inflow Performance Relationships for Solution-Gas Drive Wells*, JPT.
