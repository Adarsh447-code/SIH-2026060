import React from 'react';
import { Radio, RefreshCw, Sliders, Upload, Wifi, WifiOff } from '../icons';

export function StationHeader({
  status,
  network,
  currentTime,
  onSync,
  onToggleNetwork,
  onOpenSimulation,
  onManualRefresh,
  syncing,
}) {
  const utcString = currentTime.toUTCString().slice(17, 25);
  const istString = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(currentTime);

  const isConnected = !!network?.connected;

  return (
    <header className="station-topbar">
      {/* Tricolour institutional indicator */}
      <div className="gov-strip" aria-hidden="true">
        <span className="strip-saffron" />
        <span className="strip-white" />
        <span className="strip-green" />
      </div>

      <div className="topbar-content">
        {/* Left: Organization & Station ID */}
        <div className="topbar-identity">
          <div className="ncpor-emblem" aria-label="NCPOR India">
            <span className="emblem-code">NCPOR</span>
          </div>
          <div>
            <div className="agency-name">
              NATIONAL CENTRE FOR POLAR & OCEAN RESEARCH
              <span className="agency-sub">Ministry of Earth Sciences · Government of India</span>
            </div>
            <div className="station-meta-row">
              <span className="station-pill">MAITRI BASE (WMO 89514)</span>
              <span className="geo-coord">70°45′58″S, 11°44′09″E</span>
              <span className="elevation-tag">ELEV 117m AMSL</span>
              <span className="runtime-mode">
                <i className="status-dot normal" />
                AUTONOMOUS EDGE DAEMON
              </span>
            </div>
          </div>
        </div>

        {/* Right: Dual Clocks, Satellite Link, Actions */}
        <div className="topbar-controls">
          {/* Dual Precision Mission Clocks */}
          <div className="clock-rack">
            <div className="clock-cell">
              <span className="clock-label">STN (UTC)</span>
              <strong className="clock-digits">{utcString}</strong>
            </div>
            <div className="clock-divider" />
            <div className="clock-cell">
              <span className="clock-label">HQ (IST)</span>
              <strong className="clock-digits">{istString}</strong>
            </div>
          </div>

          {/* Satellite Carrier Link Status */}
          <div className={`satellite-link-card ${isConnected ? 'online' : 'offline'}`}>
            <div className="sat-icon-wrap">
              {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            </div>
            <div className="sat-info">
              <div className="sat-title">
                {isConnected ? 'INSAT-3DR TRANSPONDER' : 'SATELLITE OFFLINE'}
              </div>
              <div className="sat-details">
                {isConnected ? '112ms · C-BAND · 14.8 dB SNR' : 'STORE & FORWARD BUFFER ACTIVE'}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="topbar-actions">
            <button
              className={`action-btn ${isConnected ? 'btn-uplink' : 'btn-uplink-disabled'}`}
              onClick={onSync}
              disabled={syncing || !isConnected}
              title={isConnected ? 'Package priority batch and push to mainland server' : 'Satellite link disconnected'}
            >
              <Upload size={13} className={syncing ? 'spin' : ''} />
              <span>{syncing ? 'SYNCING...' : 'FORCE SYNC'}</span>
            </button>

            <button
              className={`action-btn ${isConnected ? 'btn-sat-toggle-live' : 'btn-sat-toggle-off'}`}
              onClick={onToggleNetwork}
              title={isConnected ? 'Simulate satellite pass loss (buffers telemetry locally)' : 'Restore satellite link and trigger reconciliation'}
            >
              <Radio size={13} />
              <span>{isConnected ? 'DISCONNECT LINK' : 'RESTORE LINK'}</span>
            </button>

            <button
              className="action-btn btn-secondary"
              onClick={onOpenSimulation}
              title="Open Anomaly & Fault Injection Test Harness"
            >
              <Sliders size={13} />
              <span>TEST HARNESS</span>
            </button>

            <button
              className="icon-action-btn"
              onClick={onManualRefresh}
              title="Poll latest edge registers"
              aria-label="Refresh"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
