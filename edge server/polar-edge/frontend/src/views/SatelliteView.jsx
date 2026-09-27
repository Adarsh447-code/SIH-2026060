import React from 'react';
import { Activity, AlertTriangle, Check, Radio, Upload, Wifi, WifiOff } from '../icons';

export function SatelliteView({ network, status, onToggleNetwork, onSync, syncing }) {
  const isConnected = !!network?.connected;

  return (
    <div className="view-container">
      {/* Transceiver Link Status Banner */}
      <div className={`sat-console-hero ${isConnected ? 'hero-online' : 'hero-offline'}`}>
        <div className="hero-left">
          <div className="hero-icon-bubble">
            {isConnected ? <Wifi size={24} /> : <WifiOff size={24} />}
          </div>
          <div>
            <div className="hero-eyebrow">ANTARCTIC SATELLITE TELECOMMUNICATIONS TERMINAL</div>
            <h2 className="hero-heading">
              {isConnected ? 'INSAT-3DR GEOSTATIONARY LINK ESTABLISHED' : 'LINK INTERRUPTED · AUTONOMOUS STORE-AND-FORWARD ACTIVE'}
            </h2>
            <p className="hero-subtext">
              {isConnected
                ? 'Telemetry streaming to NCPOR Mainland Operations Center (Goa) via Dedicated C-Band Transponder.'
                : 'Edge gateway is buffering all incoming SCADA registers locally in SQLite WAL database. Zero data loss during blackout.'}
            </p>
          </div>
        </div>

        <div className="hero-right">
          <button
            className={`btn ${isConnected ? 'btn-danger' : 'btn-nominal'}`}
            onClick={onToggleNetwork}
          >
            <Radio size={14} />
            {isConnected ? 'Simulate Link Loss (Disconnect)' : 'Restore Satellite Connection'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={onSync}
            disabled={!isConnected || syncing}
          >
            <Upload size={14} className={syncing ? 'spin' : ''} />
            {syncing ? 'Uploading...' : 'Trigger Immediate Sync'}
          </button>
        </div>
      </div>

      {/* Dual Transceiver Ground Terminal Cards */}
      <div className="transceiver-grid">
        {/* Terminal 1: INSAT-3DR */}
        <div className="scada-card">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">PRIMARY CARRIER TRANSPONDER</div>
              <h3 className="scada-card-title">ISRO INSAT-3DR (74.0°E GEO)</h3>
            </div>
            <span className={`status-chip ${isConnected ? 'normal' : 'offline'}`}>
              {isConnected ? 'LOCK ACQUIRED' : 'CARRIER LOST'}
            </span>
          </div>

          <div className="spec-table" style={{ marginTop: 12 }}>
            <div className="spec-row">
              <span className="spec-key">Antenna System:</span>
              <span className="spec-val">3.8m Radome Dish (Heated Feedhorn)</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Carrier Frequency:</span>
              <span className="spec-val tabular">4.125 GHz (C-Band Extended)</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Carrier-to-Noise C/N₀:</span>
              <strong className="spec-val tabular text-emerald">
                {isConnected ? '14.8 dB-Hz (Nominal)' : '0.0 dB-Hz'}
              </strong>
            </div>
            <div className="spec-row">
              <span className="spec-key">Look Angles:</span>
              <span className="spec-val tabular">Az 312.4° · El 18.2° True</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Round-Trip Latency:</span>
              <span className="spec-val tabular text-cyan">
                {isConnected ? '112 ms' : '---'}
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Channel Bitrate:</span>
              <span className="spec-val tabular">64.0 kbps (Data-optimized)</span>
            </div>
          </div>
        </div>

        {/* Terminal 2: Iridium SBD Backup */}
        <div className="scada-card">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">EMERGENCY FAILOVER CONSTELLATION</div>
              <h3 className="scada-card-title">Iridium Certus 100 (LEO SBD)</h3>
            </div>
            <span className="status-chip normal">STANDBY READY</span>
          </div>

          <div className="spec-table" style={{ marginTop: 12 }}>
            <div className="spec-row">
              <span className="spec-key">Constellation:</span>
              <span className="spec-val">66 Polar LEO Cross-Linked Birds</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Antenna:</span>
              <span className="spec-val">Omnidirectional Low-Profile Helix</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Role:</span>
              <span className="spec-val text-amber">Emergency Life-Safety &amp; Trip Bursts</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Burst Packet Size:</span>
              <span className="spec-val tabular">340 Bytes / SBD Frame</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Signal Quality:</span>
              <span className="spec-val tabular text-emerald">5 of 5 Bars (-82 dBm)</span>
            </div>
            <div className="spec-row">
              <span className="spec-key">Next Satellite Pass:</span>
              <span className="spec-val tabular">Continuous Polar Footprint</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Ledger & Buffer Telemetry */}
      <div className="scada-card" style={{ marginTop: 14 }}>
        <div className="scada-card-header">
          <div>
            <div className="scada-card-kicker">STORE-AND-FORWARD ENGINE RECONCILIATION</div>
            <h3 className="scada-card-title">Transmission Ledger &amp; WAL Buffer Health</h3>
          </div>
        </div>

        <div className="ledger-metrics-grid">
          <div className="ledger-metric-item">
            <span className="ledger-lbl">LAST SUCCESSFUL SYNC</span>
            <strong className="ledger-val tabular text-primary">
              {network?.last_sync || status?.last_mainland_sync || '---'}
            </strong>
          </div>
          <div className="ledger-metric-item">
            <span className="ledger-lbl">BUFFERED RECORDS</span>
            <strong className="ledger-val tabular text-amber">
              {network?.buffer_size ?? 0} ITEMS
            </strong>
          </div>
          <div className="ledger-metric-item">
            <span className="ledger-lbl">PENDING BATCHES</span>
            <strong className="ledger-val tabular text-cyan">
              {network?.pending_batches ?? 0} BATCHES
            </strong>
          </div>
          <div className="ledger-metric-item">
            <span className="ledger-lbl">RETRY BACKOFF ALGORITHM</span>
            <strong className="ledger-val tabular">EXPONENTIAL JITTER</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
