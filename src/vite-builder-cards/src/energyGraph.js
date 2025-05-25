import { HomeAssistantAPI } from './ha-integration/homeAssistantAPI.js';
import Chart from 'chart.js/auto';

export class EnergyGraphCard extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this.api = new HomeAssistantAPI();
    this.chart = null;
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    console.log('EnergyGraph card connected');
    this.setupListeners();
    const initial = this._config.period || 'daily';
    this.createChart(initial);
  }

  setupListeners() {
    const refreshBtn = this.shadowRoot.querySelector('#refresh-button');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }
    const tabs = this.shadowRoot.querySelectorAll('.tab');
    if (tabs) {
      tabs.forEach(tab => {
        tab.addEventListener('click', e => {
          this.shadowRoot.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          e.target.classList.add('active');
          this.updateChart(e.target.dataset.period);
        });
      });
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --primary-color: #5fc0f4;
          --bg-color: #1d1e23;
          font-family: Arial, sans-serif;
          display: block;
          background-color: var(--bg-color);
          color: white;
          padding: 20px;
          border-radius: 15px;
          overflow: hidden;
        }
        h1 {
          text-align: center;
          color: var(--primary-color);
          margin: 0 0 20px;
          line-height: 1.3;
        }
        .chart-wrapper {
          width: 90%;
          max-width: 1200px;
          margin: 0 auto;
        }
        .tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }
        .tab {
          padding: 10px 20px;
          cursor: pointer;
          background-color: #272a31;
          color: white;
          border: none;
          border-radius: 5px 5px 0 0;
          margin: 0 5px;
          font-size: 1em;
        }
        .tab.active {
          background-color: var(--primary-color);
          color: #272a31;
        }
        .tab:hover:not(.active) {
          background-color: var(--primary-color);
        }
        .chart-container {
          background-color: #15161a;
          border-radius: 5px;
          padding: 10px;
        }
        .chart-container canvas {
          width: 100% !important;
          height: 400px !important;
        }
        .controls {
          text-align: center;
          margin-top: 10px;
          font-size: 0.9em;
        }
        #refresh-button {
          display: none;
        }
      </style>
      <h1>${this._config.title || 'Energy Consumption<br>Comparison'}</h1>
      <div class="tabs">
        <button class="tab active" data-period="daily">Daily</button>
        <button class="tab" data-period="weekly">Weekly</button>
        <button class="tab" data-period="monthly">Monthly</button>
        <button class="tab" data-period="yearly">Yearly</button>
      </div>
      <div class="chart-wrapper">
        <div class="chart-container">
          <canvas id="energyChart"></canvas>
        </div>
        <div class="controls">
          Last updated: <span id="last-updated">Never</span>
        </div>
      </div>
    `;
  }

  setConfig(cfg) {
    this._config = cfg;
  }

  set hass(hass) {
    this._hass = hass;
    this.api.connect(hass);
    this.refreshData();
  }

  refreshData() {
    const now = new Date();
    this.shadowRoot.querySelector('#last-updated').textContent = now.toLocaleString();
  }

  async createChart(period) {
    console.log(`[EnergyGraph] Creating chart for period: ${period}`);

    const ctx = this.shadowRoot.querySelector('#energyChart').getContext('2d');
    if (this.chart) this.chart.destroy();

    const entityMap = {
      daily: 'sensor.energy_daily',
      weekly: 'sensor.energy_weekly',
      monthly: 'sensor.energy_monthly',
      yearly: 'sensor.energy_yearly'
    };

    const defaultData = this.getDemoData()[period];
    const entityId = entityMap[period];
    const stateObj = this._hass.states[entityId];

    console.log(`[EnergyGraph] Using entity: ${entityId}`);
    console.log(`[EnergyGraph] State object:`, stateObj);

    let yourUsage = [...defaultData.yourUsage];
    let neighborAvg = [...defaultData.neighborAvg];
    let labels = [...defaultData.labels];

    if (stateObj && stateObj.attributes) {
      try {
        const usageAttr = stateObj.attributes.usage;
        const neighborAttr = stateObj.attributes.neighbor_avg;

        console.log(`[EnergyGraph] Raw usage:`, usageAttr);
        console.log(`[EnergyGraph] Raw neighbor_avg:`, neighborAttr);

        const rawUsage = typeof usageAttr === 'string' ? JSON.parse(usageAttr) : usageAttr;
        const rawNeighbor = typeof neighborAttr === 'string' ? JSON.parse(neighborAttr) : neighborAttr;

        console.log(`[EnergyGraph] Parsed usage array:`, rawUsage);
        console.log(`[EnergyGraph] Parsed neighbor array:`, rawNeighbor);

        if (Array.isArray(rawUsage) && Array.isArray(rawNeighbor)) {
          yourUsage = rawUsage.map(v => Number(v));
          neighborAvg = rawNeighbor.map(v => Number(v));

          // Adjust label count to match data
          if (yourUsage.length < labels.length) {
            labels = labels.slice(0, yourUsage.length);
          }

          console.log(`[EnergyGraph] Final yourUsage:`, yourUsage);
          console.log(`[EnergyGraph] Final neighborAvg:`, neighborAvg);
          console.log(`[EnergyGraph] Labels used:`, labels);
        } else {
          console.warn(`[EnergyGraph] Parsed data is not array.`);
        }

      } catch (e) {
        console.error(`[EnergyGraph] Failed to parse sensor attributes:`, e);
      }
    } else {
      console.warn(`[EnergyGraph] No attributes found for ${entityId}`);
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Your Energy Usage', data: yourUsage, backgroundColor: '#5fc0f4' },
          { label: 'Neighbor Average', data: neighborAvg, backgroundColor: '#4d5d82' }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: defaultData.xTitle, color: 'white' }, grid: { display: false }, ticks: { color: 'white' } },
          y: { title: { display: true, text: defaultData.yTitle, color: 'white' }, ticks: { color: 'white', beginAtZero: true } }
        },
        plugins: {
          legend: { position: 'top', labels: { color: 'white' } },
          tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(2)} kWh` } }
        },
        barPercentage: 1,
        categoryPercentage: 0.9,
        maintainAspectRatio: false
      }
    });

    this.refreshData();
  }



  updateChart(period) {
    this.createChart(period);
  }

  getDemoData() {
    return {
      daily: {
        labels: Array.from({ length: 24 }, (_, i) =>
          i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
        ),
        yourUsage: Array(24).fill(0),
        neighborAvg: Array(24).fill(0),
        xTitle: 'Hour of Day',
        yTitle: 'Energy Usage (kWh)'
      },
      weekly: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        yourUsage: Array(7).fill(0),
        neighborAvg: Array(7).fill(0),
        xTitle: 'Day of Week',
        yTitle: 'Energy Usage (kWh)'
      },
      monthly: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        yourUsage: Array(4).fill(0),
        neighborAvg: Array(4).fill(0),
        xTitle: 'Week of Month',
        yTitle: 'Energy Usage (kWh)'
      },
      yearly: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        yourUsage: Array(12).fill(0),
        neighborAvg: Array(12).fill(0),
        xTitle: 'Month',
        yTitle: 'Energy Usage (kWh)'
      }
    };
  }
}

customElements.define('energy-graph', EnergyGraphCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'energy-graph',
  name: 'Energy Graph',
  description: 'Display energy consumption data with interactive graphs'
});
