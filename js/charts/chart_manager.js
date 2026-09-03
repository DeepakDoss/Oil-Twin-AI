/**
 * Chart Manager using Plotly.js
 * Handles rendering and dynamic updates of:
 * - Nodal Analysis (IPR / VLP)
 * - Pressure Traverse
 * - Gas Lift Performance Curve
 * - ESP Head vs Rate Curve
 * - Dynamic Time-Trend Recorder
 * - Dynamometer Cards
 */

const darkLayoutDefaults = {
  paper_bgcolor: '#161B22',
  plot_bgcolor: '#0D1117',
  font: { family: 'Inter, sans-serif', color: '#8B949E', size: 11 },
  margin: { l: 60, r: 30, t: 35, b: 50 },
  xaxis: {
    gridcolor: '#21262D',
    zerolinecolor: '#30363D',
    tickfont: { color: '#8B949E' }
  },
  yaxis: {
    gridcolor: '#21262D',
    zerolinecolor: '#30363D',
    tickfont: { color: '#8B949E' }
  },
  legend: {
    font: { color: '#F0F6FC' },
    bgcolor: 'rgba(22, 27, 34, 0.75)',
    bordercolor: '#30363D',
    borderwidth: 1
  }
};

export const ChartManager = {
  /**
   * Render Nodal Analysis Curve (IPR vs VLP)
   */
  renderNodalChart(containerId, solverResult, pb, pr) {
    if (!window.Plotly) return;

    const { iprCurve, vlpCurve, qLiquid, pwf, converged } = solverResult;

    // IPR Trace
    const iprTrace = {
      x: iprCurve.map(p => p.q),
      y: iprCurve.map(p => p.pwf),
      mode: 'lines',
      name: 'IPR (Inflow)',
      line: { color: '#388BFD', width: 2.5 }
    };

    // VLP Trace
    const vlpTrace = {
      x: vlpCurve.map(p => p.q),
      y: vlpCurve.map(p => p.pwf),
      mode: 'lines',
      name: 'VLP (Outflow)',
      line: { color: '#A371F7', width: 2.5 }
    };

    const traces = [iprTrace, vlpTrace];

    // Operating Point Marker
    if (converged && qLiquid > 0) {
      traces.push({
        x: [qLiquid],
        y: [pwf],
        mode: 'markers+text',
        name: 'Operating Point',
        text: [`(${qLiquid} STB/d, ${pwf} psi)`],
        textposition: 'top right',
        textfont: { color: '#3FB950', size: 12, family: 'Inter' },
        marker: { color: '#3FB950', size: 12, line: { color: '#ffffff', width: 2 } }
      });
    }

    const layout = {
      ...darkLayoutDefaults,
      title: { text: 'Nodal Analysis (IPR vs VLP)', font: { color: '#F0F6FC', size: 14 } },
      xaxis: { ...darkLayoutDefaults.xaxis, title: 'Liquid Production Rate (STB/d)' },
      yaxis: { ...darkLayoutDefaults.yaxis, title: 'Flowing Bottomhole Pressure Pwf (psi)' },
      shapes: [
        // Bubble Point horizontal dashed line
        {
          type: 'line',
          x0: 0,
          x1: Math.max(...iprCurve.map(p => p.q)),
          y0: pb,
          y1: pb,
          line: { color: '#D29922', width: 1.5, dash: 'dashdot' }
        }
      ],
      annotations: [
        {
          x: iprCurve[Math.floor(iprCurve.length / 2)].q,
          y: pb,
          text: `Bubble Point (Pb = ${pb} psi)`,
          showarrow: false,
          font: { color: '#D29922', size: 10 },
          yshift: 10
        }
      ]
    };

    window.Plotly.newPlot(containerId, traces, layout, { responsive: true, displayModeBar: false });
  },

  /**
   * Render Pressure Traverse (Depth vs Pressure)
   */
  renderTraverseChart(containerId, traverseData) {
    if (!window.Plotly) return;

    const trace = {
      x: traverseData.map(d => d.pressure),
      y: traverseData.map(d => d.depth),
      mode: 'lines+markers',
      name: 'Pressure Profile',
      line: { color: '#39C5CF', width: 2.5 },
      marker: { size: 6, color: '#39C5CF' },
      text: traverseData.map(d => `${d.location}: ${d.pressure} psi`),
      hoverinfo: 'text'
    };

    const layout = {
      ...darkLayoutDefaults,
      title: { text: 'Pressure Traverse Profile', font: { color: '#F0F6FC', size: 14 } },
      xaxis: { ...darkLayoutDefaults.xaxis, title: 'Pressure (psi)' },
      yaxis: {
        ...darkLayoutDefaults.yaxis,
        title: 'Depth (ft)',
        autorange: 'reversed' // Reservoir at bottom, surface at top
      }
    };

    window.Plotly.newPlot(containerId, [trace], layout, { responsive: true, displayModeBar: false });
  },

  /**
   * Render Gas Lift Performance Curve
   */
  renderGasLiftCurve(containerId, glResult) {
    if (!window.Plotly) return;

    const { curve, optInjRate, optLiquidRate } = glResult;

    const trace = {
      x: curve.map(p => p.qInj),
      y: curve.map(p => p.qLiquid),
      mode: 'lines',
      name: 'Gas Lift Response',
      line: { color: '#3FB950', width: 2.5 }
    };

    const optMarker = {
      x: [optInjRate],
      y: [optLiquidRate],
      mode: 'markers+text',
      name: 'Optimum Gas Rate',
      text: [`Opt: ${optLiquidRate} STB/d @ ${optInjRate} MSCF/d`],
      textposition: 'bottom center',
      textfont: { color: '#3FB950', size: 11 },
      marker: { color: '#3FB950', size: 10 }
    };

    const layout = {
      ...darkLayoutDefaults,
      title: { text: 'Gas Lift Performance Curve', font: { color: '#F0F6FC', size: 14 } },
      xaxis: { ...darkLayoutDefaults.xaxis, title: 'Gas Injection Rate (MSCF/d)' },
      yaxis: { ...darkLayoutDefaults.yaxis, title: 'Liquid Production Rate (STB/d)' }
    };

    window.Plotly.newPlot(containerId, [trace, optMarker], layout, { responsive: true, displayModeBar: false });
  },

  /**
   * Render ESP Head vs Rate Curve
   */
  renderEspCurve(containerId, espResult, operatingQ, operatingHead) {
    if (!window.Plotly) return;

    const { curve, downthrustLimitQ, upthrustLimitQ, bepQ } = espResult;

    const headTrace = {
      x: curve.map(p => p.q),
      y: curve.map(p => p.head),
      mode: 'lines',
      name: 'Total Dynamic Head (ft)',
      line: { color: '#388BFD', width: 2.5 }
    };

    const traces = [headTrace];

    if (operatingQ && operatingHead) {
      traces.push({
        x: [operatingQ],
        y: [operatingHead],
        mode: 'markers+text',
        name: 'Pump Operating Point',
        text: [`Operating Point: ${operatingQ} STB/d`],
        textposition: 'top right',
        textfont: { color: '#3FB950', size: 11 },
        marker: { color: '#3FB950', size: 11, line: { color: '#ffffff', width: 2 } }
      });
    }

    const layout = {
      ...darkLayoutDefaults,
      title: { text: 'ESP Pump Performance Curve', font: { color: '#F0F6FC', size: 14 } },
      xaxis: { ...darkLayoutDefaults.xaxis, title: 'Liquid Rate (STB/d)' },
      yaxis: { ...darkLayoutDefaults.yaxis, title: 'Developed Head (ft)' },
      shapes: [
        // Recommended operating window band
        {
          type: 'rect',
          x0: downthrustLimitQ,
          x1: upthrustLimitQ,
          y0: 0,
          y1: Math.max(...curve.map(p => p.head)) * 1.05,
          fillcolor: 'rgba(56, 139, 253, 0.08)',
          line: { color: 'rgba(56, 139, 253, 0.3)', width: 1, dash: 'dot' }
        }
      ]
    };

    window.Plotly.newPlot(containerId, traces, layout, { responsive: true, displayModeBar: false });
  },

  /**
   * Render Dynamic Time Trend (History of WHP, FLP, Rate, FBHP)
   */
  renderTimeTrendChart(containerId, timeSeriesData) {
    if (!window.Plotly) return;

    const times = timeSeriesData.map(d => d.time);

    const traces = [
      {
        x: times,
        y: timeSeriesData.map(d => d.qLiquid),
        mode: 'lines',
        name: 'Liquid Rate (STB/d)',
        line: { color: '#3FB950', width: 2 }
      },
      {
        x: times,
        y: timeSeriesData.map(d => d.pwhp),
        mode: 'lines',
        name: 'WHP (psi)',
        line: { color: '#58A6FF', width: 2 }
      },
      {
        x: times,
        y: timeSeriesData.map(d => d.flp),
        mode: 'lines',
        name: 'FLP (psi)',
        line: { color: '#D29922', width: 2 }
      },
      {
        x: times,
        y: timeSeriesData.map(d => d.pwf),
        mode: 'lines',
        name: 'FBHP (psi)',
        line: { color: '#A371F7', width: 2 }
      }
    ];

    const layout = {
      ...darkLayoutDefaults,
      title: { text: 'Dynamic Pressure & Rate Time Trend', font: { color: '#F0F6FC', size: 14 } },
      xaxis: { ...darkLayoutDefaults.xaxis, title: 'Simulation Steps (Time)' },
      yaxis: { ...darkLayoutDefaults.yaxis, title: 'Pressure (psi) / Rate (STB/d)' }
    };

    window.Plotly.newPlot(containerId, traces, layout, { responsive: true, displayModeBar: false });
  },

  /**
   * Render Dynamometer Card (Surface & Downhole Load vs Position)
   */
  renderDynoCard(containerId, cardPoints, conditionName) {
    if (!window.Plotly) return;

    const surfTrace = {
      x: cardPoints.map(p => p.posInches),
      y: cardPoints.map(p => p.surfLoad),
      mode: 'lines',
      name: 'Surface Card',
      line: { color: '#388BFD', width: 2.5 }
    };

    const downholeTrace = {
      x: cardPoints.map(p => p.posInches),
      y: cardPoints.map(p => p.downholeLoad),
      mode: 'lines',
      name: 'Downhole Pump Card',
      line: { color: '#3FB950', width: 2.5, dash: 'dot' }
    };

    const layout = {
      ...darkLayoutDefaults,
      title: { text: `Dynamometer Card: ${conditionName}`, font: { color: '#F0F6FC', size: 14 } },
      xaxis: { ...darkLayoutDefaults.xaxis, title: 'Polished Rod Position (inches)' },
      yaxis: { ...darkLayoutDefaults.yaxis, title: 'Load (lbs)' }
    };

    window.Plotly.newPlot(containerId, [surfTrace, downholeTrace], layout, { responsive: true, displayModeBar: false });
  }
};
