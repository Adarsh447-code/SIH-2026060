import React, { useState } from 'react';
import { Activity, AlertTriangle, Check, Search, Sliders, Zap } from '../icons';

export function TelemetryView({ sensors, onSelectAsset }) {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const types = ['all', 'generator', 'battery', 'hvac', 'pump', 'environmental'];

  const filteredSensors = sensors.filter((s) => {
    const matchesType = filterType === 'all' || s.sensor_type === filterType;
    const matchesSearch =
      !searchTerm ||
      s.asset_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sensor_type?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="view-container">
      {/* Telemetry Matrix Header & Filter Controls */}
      <div className="table-toolbar">
        <div className="filter-button-group">
          {types.map((type) => (
            <button
              key={type}
              className={`filter-btn ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="search-box-wrap">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search channel or register..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="telemetry-summary-stats">
          <span className="stat-pill">
            CHANNELS: <strong className="tabular">{filteredSensors.length} ACTIVE</strong>
          </span>
          <span className="stat-pill">
            RATE: <strong className="tabular text-emerald">5.0 Hz CONTINUOUS</strong>
          </span>
        </div>
      </div>

      {/* High-Density SCADA Register Table */}
      <div className="scada-table-card">
        <div className="scada-table-scroll">
          <table className="scada-data-table full-width">
            <thead>
              <tr>
                <th>REGISTER / ASSET ID</th>
                <th>SUBSYSTEM</th>
                <th>MEASUREMENT CHANNEL</th>
                <th>CALIBRATED VALUE</th>
                <th>ALARM BAND / LIMITS</th>
                <th>STATUS</th>
                <th>SYNC STATE</th>
                <th>INSPECT</th>
              </tr>
            </thead>
            <tbody>
              {filteredSensors.map((item) => {
                const isWarn =
                  (item.temperature && item.temperature > 95) ||
                  (item.vibration && item.vibration > 4.5) ||
                  (item.pressure && item.pressure < 30);
                const isCrit =
                  (item.temperature && item.temperature > 105) ||
                  (item.vibration && item.vibration > 6.0);

                let channelName = 'General Channel';
                let primaryVal = '---';
                let unit = '';
                let limits = 'Nominal Band';

                if (item.sensor_type === 'generator') {
                  channelName = 'Exchanger Coolant & Vibration';
                  primaryVal = `${item.temperature?.toFixed(1) ?? '75.0'}°C / ${item.vibration?.toFixed(2) ?? '2.10'} mm/s`;
                  limits = 'Max 95.0°C · ISO &lt; 4.5 mm/s';
                } else if (item.sensor_type === 'battery') {
                  channelName = 'DC Bus Voltage & SOC';
                  primaryVal = `${item.voltage?.toFixed(1) ?? '48.0'} V / ${item.charge_percentage?.toFixed(0) ?? '86'}%`;
                  limits = '44.0 - 56.0 V DC';
                } else if (item.sensor_type === 'hvac') {
                  channelName = 'Habitat Air Loop AHU-01';
                  primaryVal = `${item.indoor_temperature?.toFixed(1) ?? '21.4'}°C (${item.power_consumption?.toFixed(1) ?? '12'} kW)`;
                  limits = '+19.0°C to +23.0°C';
                } else if (item.sensor_type === 'pump') {
                  channelName = 'Intake Suction & Pressure';
                  primaryVal = `${item.pressure?.toFixed(1) ?? '58.0'} psi / ${item.flow_rate?.toFixed(0) ?? '110'} L/min`;
                  limits = 'Min 35.0 psi';
                } else if (item.sensor_type === 'environmental') {
                  channelName = 'Station AWS Baro / Wind';
                  primaryVal = `${item.outside_temperature?.toFixed(1) ?? '-28.0'}°C / ${item.wind_speed?.toFixed(1) ?? '22'} kn`;
                  limits = 'Antarctic Class 1 AWS';
                }

                return (
                  <tr key={item.id} className={isCrit ? 'row-critical' : isWarn ? 'row-warning' : ''}>
                    <td className="mono font-semibold text-primary">
                      {item.asset_id || `ASSET-${item.sensor_type?.toUpperCase()}`}
                    </td>
                    <td>
                      <span className="subsystem-tag">{item.sensor_type}</span>
                    </td>
                    <td>{channelName}</td>
                    <td className="mono tabular font-bold text-cyan">{primaryVal}</td>
                    <td className="text-secondary mono tabular" style={{ fontSize: 11 }}>
                      {limits}
                    </td>
                    <td>
                      <span
                        className={`status-chip ${
                          isCrit ? 'crit' : isWarn ? 'warn' : 'normal'
                        }`}
                      >
                        {isCrit ? 'CRITICAL' : isWarn ? 'ADVISORY' : 'NOMINAL'}
                      </span>
                    </td>
                    <td>
                      <span className="mono tabular text-muted" style={{ fontSize: 10 }}>
                        {item.sync_status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-tiny"
                        onClick={() => onSelectAsset(item.asset_id || `ASSET-${item.sensor_type}`)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredSensors.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-table-msg">
                    No matching SCADA sensor telemetry channels found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
