import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Battery,
  Check,
  Droplets,
  ExternalLink,
  Flame,
  Fuel,
  Gauge,
  Radio,
  Sliders,
  Snowflake,
  Thermometer,
  Wind,
  Zap,
} from '../icons';

export function CockpitView({
  sensors,
  events,
  status,
  network,
  weather,
  onSelectAsset,
  onOpenSimulation,
  onSync,
  onNavigate,
}) {
  const [chartMetric, setChartMetric] = useState('temp_load');

  const generator = sensors.find((s) => s.sensor_type === 'generator') || {};
  const battery = sensors.find((s) => s.sensor_type === 'battery') || {};
  const hvac = sensors.find((s) => s.sensor_type === 'hvac') || {};
  const pump = sensors.find((s) => s.sensor_type === 'pump') || {};
  const env = sensors.find((s) => s.sensor_type === 'environmental') || {};

  // Build telemetry history chart points
  const chartData = sensors.slice(0, 20).map((item, idx) => ({
    time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : `T-${20 - idx}`,
    temperature: item.temperature ?? 76,
    vibration: (item.vibration ?? 2.1) * 10, // scaled for chart visibility
    vibrationRaw: item.vibration ?? 2.1,
    load: item.load ?? 78,
  }));

  const currentWeather = weather?.current;

  return (
    <div className="view-container">
      {/* Primary Subsystem SCADA Strip */}
      <div className="scada-strip-grid">
        {/* Subsystem 1: Powerhouse Cummins DG-02 */}
        <div
          className={`scada-block ${generator.temperature > 95 || generator.vibration > 4.5 ? 'has-warning' : ''}`}
          onClick={() => onSelectAsset('GENERATOR-G02')}
        >
          <div className="scada-block-header">
            <div className="scada-block-title">
              <Zap size={14} className="text-amber" />
              <span>POWERHOUSE DG-02</span>
            </div>
            <span className={`status-pill ${generator.temperature > 95 ? 'pill-warning' : 'pill-normal'}`}>
              {generator.temperature > 95 ? 'THERMAL ALERT' : 'ONLINE · 1500 RPM'}
            </span>
          </div>

          <div className="scada-block-main">
            <div className="scada-primary-reading">
              <span className="reading-val tabular">
                {generator.load !== undefined ? generator.load.toFixed(1) : '82.4'}
              </span>
              <span className="reading-unit">% LOAD</span>
            </div>
            <div className="scada-subreadings">
              <div className="subreading-row">
                <span className="sub-lbl">Jacket Temp:</span>
                <strong className={`sub-val tabular ${generator.temperature > 95 ? 'text-red' : ''}`}>
                  {generator.temperature !== undefined ? generator.temperature.toFixed(1) : '78.2'}°C
                </strong>
              </div>
              <div className="subreading-row">
                <span className="sub-lbl">Vibration:</span>
                <strong className={`sub-val tabular ${generator.vibration > 4.5 ? 'text-amber' : ''}`}>
                  {generator.vibration !== undefined ? generator.vibration.toFixed(2) : '2.14'} mm/s
                </strong>
              </div>
              <div className="subreading-row">
                <span className="sub-lbl">Day Tank:</span>
                <strong className="sub-val tabular">
                  {generator.fuel_level !== undefined ? generator.fuel_level.toFixed(0) : '88'}% (1,420 L)
                </strong>
              </div>
            </div>
          </div>

          <div className="scada-block-footer">
            <span>Cummins 125 kVA · 3-Phase 415V 50Hz</span>
            <span className="scada-link">INSPECT &rarr;</span>
          </div>
        </div>

        {/* Subsystem 2: Battery Storage & DC Microgrid */}
        <div className="scada-block" onClick={() => onSelectAsset('BATTERY-BANK-01')}>
          <div className="scada-block-header">
            <div className="scada-block-title">
              <Battery size={14} className="text-emerald" />
              <span>BATTERY BANK BATT-48V</span>
            </div>
            <span className="status-pill pill-normal">FLOAT CHARGE</span>
          </div>

          <div className="scada-block-main">
            <div className="scada-primary-reading">
              <span className="reading-val tabular">
                {battery.charge_percentage !== undefined ? battery.charge_percentage.toFixed(0) : '86'}
              </span>
              <span className="reading-unit">% SOC</span>
            </div>
            <div className="scada-subreadings">
              <div className="subreading-row">
                <span className="sub-lbl">Bus Voltage:</span>
                <strong className="sub-val tabular">
                  {battery.voltage !== undefined ? battery.voltage.toFixed(1) : '53.4'} V DC
                </strong>
              </div>
              <div className="subreading-row">
                <span className="sub-lbl">Current:</span>
                <strong className="sub-val tabular">
                  {battery.current !== undefined ? battery.current.toFixed(1) : '+24.6'} A
                </strong>
              </div>
              <div className="subreading-row">
                <span className="sub-lbl">Autonomy:</span>
                <strong className="sub-val tabular">18.4 hrs @ current load</strong>
              </div>
            </div>
          </div>

          <div className="scada-block-footer">
            <span>400Ah LiFePO4 · Inverter 60 kVA</span>
            <span className="scada-link">INSPECT &rarr;</span>
          </div>
        </div>

        {/* Subsystem 3: Habitation HVAC & Thermal Loop */}
        <div className="scada-block" onClick={() => onSelectAsset('HVAC-AHU-01')}>
          <div className="scada-block-header">
            <div className="scada-block-title">
              <Flame size={14} className="text-blue" />
              <span>HABITATION HVAC (AHU-01)</span>
            </div>
            <span className="status-pill pill-normal">CLOSED LOOP</span>
          </div>

          <div className="scada-block-main">
            <div className="scada-primary-reading">
              <span className="reading-val tabular">
                {hvac.indoor_temperature !== undefined ? hvac.indoor_temperature.toFixed(1) : '+21.4'}
              </span>
              <span className="reading-unit">°C HAB</span>
            </div>
            <div className="scada-subreadings">
              <div className="subreading-row">
                <span className="sub-lbl">Set Point:</span>
                <strong className="sub-val tabular">+21.0°C</strong>
              </div>
              <div className="subreading-row">
                <span className="sub-lbl">Heating Power:</span>
                <strong className="sub-val tabular">
                  {hvac.power_consumption !== undefined ? hvac.power_consumption.toFixed(1) : '12.8'} kW
                </strong>
              </div>
              <div className="subreading-row">
                <span className="sub-lbl">Freeze Trace:</span>
                <strong className="sub-val tabular text-emerald">+4.8°C ACTIVE</strong>
              </div>
            </div>
          </div>

          <div className="scada-block-footer">
            <span>Main Hab Complex · 25 Crew Berths</span>
            <span className="scada-link">INSPECT &rarr;</span>
          </div>
        </div>

        {/* Subsystem 4: Water Supply P-01 & Lake Line */}
        <div
          className={`scada-block ${pump.pressure < 30 ? 'has-warning' : ''}`}
          onClick={() => onSelectAsset('WATER-PUMP-P01')}
        >
          <div className="scada-block-header">
            <div className="scada-block-title">
              <Droplets size={14} className="text-blue" />
              <span>PRIYADARSHINI WATER P-01</span>
            </div>
            <span className={`status-pill ${pump.pressure < 30 ? 'pill-warning' : 'pill-normal'}`}>
              {pump.pressure < 30 ? 'LOW PRESSURE' : 'PUMPING'}
            </span>
          </div>

          <div className="scada-block-main">
            <div className="scada-primary-reading">
              <span className="reading-val tabular">
                {pump.pressure !== undefined ? pump.pressure.toFixed(1) : '58.4'}
              </span>
              <span className="reading-unit">PSI</span>
            </div>
            <div className="scada-subreadings">
              <div className="subreading-row">
                <span className="sub-lbl">Flow Rate:</span>
                <strong className="sub-val tabular">
                  {pump.flow_rate !== undefined ? pump.flow_rate.toFixed(1) : '112.0'} L/min
                </strong>
              </div>
              <div className="subreading-row">
                <span className="sub-lbl">Pipeline Temp:</span>
                <strong className="sub-val tabular text-emerald">+3.6°C (Trace OK)</strong>
              </div>
              <div className="subreading-row">
                <span className="sub-lbl">Intake Depth:</span>
                <strong className="sub-val tabular">3.8 m below ice sheet</strong>
              </div>
            </div>
          </div>

          <div className="scada-block-footer">
            <span>1.2 km Heated Trace Pipeline</span>
            <span className="scada-link">INSPECT &rarr;</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Telemetry Chart + Live Event Stream */}
      <div className="cockpit-main-layout">
        {/* Left: Industrial Telemetry Trend Viewport */}
        <section className="scada-card">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">REAL-TIME EDGE HISTORIAN</div>
              <h3 className="scada-card-title">Multi-Channel Telemetry Stream (Last 20 Ingest Cycles)</h3>
            </div>
            <div className="chart-controls">
              <button
                className={`metric-toggle-btn ${chartMetric === 'temp_load' ? 'active' : ''}`}
                onClick={() => setChartMetric('temp_load')}
              >
                Coolant Temp &amp; Electrical Load
              </button>
              <button
                className={`metric-toggle-btn ${chartMetric === 'vibe' ? 'active' : ''}`}
                onClick={() => setChartMetric('vibe')}
              >
                ISO Vibration (x10)
              </button>
            </div>
          </div>

          <div className="scada-chart-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis
                  dataKey="time"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="ui-monospace, monospace"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  fontFamily="ui-monospace, monospace"
                  domain={chartMetric === 'vibe' ? [0, 80] : [40, 120]}
                />
                <Tooltip
                  contentStyle={{
                    background: '#0d1526',
                    border: '1px solid #1e2e48',
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: 'ui-monospace, monospace',
                  }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                {chartMetric === 'temp_load' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Coolant Temp (°C)"
                      stroke="#f59e0b"
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="load"
                      name="Load (%)"
                      stroke="#38bdf8"
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </>
                )}
                {chartMetric === 'vibe' && (
                  <Line
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration (mm/s x10)"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend-row">
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#f59e0b' }} />
              <span>Coolant Jacket Temp (Limit: 95°C)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#38bdf8' }} />
              <span>Electrical Microgrid Load % (Nominal: 75-85%)</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot" style={{ background: '#ef4444' }} />
              <span>ISO 10816 Vibration (Alert: &gt; 4.5 mm/s)</span>
            </div>
          </div>
        </section>

        {/* Right: Operational Event Queue (ISA-18.2 Priority) */}
        <section className="scada-card">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">OPERATIONAL EVENT QUEUE</div>
              <h3 className="scada-card-title">Priority Incident Stream</h3>
            </div>
            <button className="btn-table-action" onClick={() => onNavigate('queue')}>
              Full Queue &rarr;
            </button>
          </div>

          <div className="event-table-scroll">
            <table className="scada-data-table">
              <thead>
                <tr>
                  <th>PRIORITY</th>
                  <th>SIGNAL / INCIDENT</th>
                  <th>ASSET</th>
                  <th>TIMESTAMP</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 7).map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <span className={`tag-priority ${ev.priority.toLowerCase()}`}>
                        {ev.priority}
                      </span>
                    </td>
                    <td className="event-desc-cell">
                      <strong>{ev.anomaly}</strong>
                      {ev.trend > 0 && <small className="text-amber">Trend: +{(ev.trend * 100).toFixed(0)}% delta</small>}
                    </td>
                    <td className="mono tabular" style={{ fontSize: 11 }}>
                      {ev.asset}
                    </td>
                    <td className="mono tabular" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <button
                        className="btn-tiny"
                        onClick={() => onSelectAsset(ev.asset)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-table-msg">
                      No anomalous priority events active in buffer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Meteorological Quick Read Bar */}
      <div className="meteo-quick-strip">
        <div className="meteo-quick-item">
          <Thermometer size={14} className="text-blue" />
          <span className="meteo-lbl">OUTSIDE AIR:</span>
          <strong className="meteo-val tabular">
            {currentWeather ? `${currentWeather.temperature}°C` : '-28.4°C'}
          </strong>
        </div>
        <div className="meteo-divider" />
        <div className="meteo-quick-item">
          <Wind size={14} className="text-blue" />
          <span className="meteo-lbl">WIND SPEED:</span>
          <strong className="meteo-val tabular">
            {currentWeather ? `${currentWeather.wind_speed} kn` : '23.0 kn'}
          </strong>
        </div>
        <div className="meteo-divider" />
        <div className="meteo-quick-item">
          <Snowflake size={14} className="text-blue" />
          <span className="meteo-lbl">WIND CHILL INDEX:</span>
          <strong className="meteo-val tabular text-blue">
            {currentWeather?.temperature
              ? `${(13.12 + 0.6215 * currentWeather.temperature - 11.37 * Math.pow(currentWeather.wind_speed * 1.852, 0.16) + 0.3965 * currentWeather.temperature * Math.pow(currentWeather.wind_speed * 1.852, 0.16)).toFixed(1)}°C`
              : '-44.1°C'}
          </strong>
        </div>
        <div className="meteo-divider" />
        <div className="meteo-quick-item">
          <Gauge size={14} className="text-blue" />
          <span className="meteo-lbl">BAROMETRIC QNH:</span>
          <strong className="meteo-val tabular">984.2 hPa (STABLE)</strong>
        </div>
        <div className="meteo-quick-item" style={{ marginLeft: 'auto' }}>
          <button className="btn-link" onClick={() => onNavigate('weather')}>
            View Full AWS Met Console &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
