import React from 'react';
import { Activity, AlertTriangle, Check, ExternalLink, Sliders, X, Zap } from '../icons';

export function SensorDetailDrawer({ asset, sensorData, onClose, onSimulate }) {
  if (!asset) return null;

  // Derive asset details from asset name or sensorData
  const reading = sensorData || {};

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="sensor-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <span className="drawer-kicker">SCADA REGISTER INSPECTOR</span>
            <h2 className="drawer-title">{asset}</h2>
          </div>
          <button className="icon-close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Hardware & Modbus Interface Specs */}
          <section className="drawer-section">
            <div className="section-label">INTERFACE SPECIFICATION</div>
            <div className="spec-table">
              <div className="spec-row">
                <span className="spec-key">Subsystem:</span>
                <span className="spec-val">{reading.sensor_type ? reading.sensor_type.toUpperCase() : 'STATION ASSET'}</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Protocol / Bus:</span>
                <span className="spec-val">Modbus RTU over RS-485 (Isolated)</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">ADC Register:</span>
                <span className="spec-val tabular">HOLDING_REG_0x4012 (Float32)</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Sample Rate:</span>
                <span className="spec-val tabular">5.0 Hz (Continuous Edge Poll)</span>
              </div>
              <div className="spec-row">
                <span className="spec-key">Sync Priority:</span>
                <span className="spec-val tag-priority-high">TIER 1 (CRITICAL TELEMETRY)</span>
              </div>
            </div>
          </section>

          {/* Real-time Readings */}
          <section className="drawer-section">
            <div className="section-label">LIVE CALIBRATED CHANNELS</div>
            <div className="channel-grid">
              {reading.temperature !== undefined && reading.temperature !== null && (
                <div className="channel-card">
                  <span className="channel-title">Operating Temp</span>
                  <strong className="channel-value tabular">{Number(reading.temperature).toFixed(1)}°C</strong>
                  <span className="channel-limits">Threshold: max 95.0°C</span>
                </div>
              )}
              {reading.vibration !== undefined && reading.vibration !== null && (
                <div className="channel-card">
                  <span className="channel-title">Vibration Velocity</span>
                  <strong className="channel-value tabular">{Number(reading.vibration).toFixed(2)} mm/s</strong>
                  <span className="channel-limits">ISO 10816: &lt; 4.5 mm/s</span>
                </div>
              )}
              {reading.load !== undefined && reading.load !== null && (
                <div className="channel-card">
                  <span className="channel-title">Electrical Load</span>
                  <strong className="channel-value tabular">{Number(reading.load).toFixed(1)}%</strong>
                  <span className="channel-limits">Rating: 125 kVA prime</span>
                </div>
              )}
              {reading.voltage !== undefined && reading.voltage !== null && (
                <div className="channel-card">
                  <span className="channel-title">Bus Voltage</span>
                  <strong className="channel-value tabular">{Number(reading.voltage).toFixed(1)} V</strong>
                  <span className="channel-limits">Nominal: 48.0 V DC</span>
                </div>
              )}
              {reading.pressure !== undefined && reading.pressure !== null && (
                <div className="channel-card">
                  <span className="channel-title">Line Pressure</span>
                  <strong className="channel-value tabular">{Number(reading.pressure).toFixed(1)} psi</strong>
                  <span className="channel-limits">Range: 40 - 80 psi</span>
                </div>
              )}
              {reading.indoor_temperature !== undefined && reading.indoor_temperature !== null && (
                <div className="channel-card">
                  <span className="channel-title">Habitat Air Temp</span>
                  <strong className="channel-value tabular">{Number(reading.indoor_temperature).toFixed(1)}°C</strong>
                  <span className="channel-limits">Target: 21.0 ± 2.0°C</span>
                </div>
              )}
            </div>
          </section>

          {/* Operational Engineering Notes */}
          <section className="drawer-section">
            <div className="section-label">STATION OPERATOR LOG</div>
            <div className="operator-note-box">
              <p>
                <strong>Inspection Rule (Antarctic Winter Protocol):</strong> Maintain coolant jacket pre-heat when standby.
                Vibration velocity above 4.5 mm/s indicates alternator bearing fatigue or shaft misalignment from permafrost freeze-thaw settlement.
              </p>
            </div>
          </section>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={() => onSimulate(asset)}>
            <Sliders size={13} />
            Test Fault Injection
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </aside>
    </div>
  );
}
