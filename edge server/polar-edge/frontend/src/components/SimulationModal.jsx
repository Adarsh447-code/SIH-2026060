import React from 'react';
import { AlertTriangle, Check, Radio, RotateCcw, Sliders, X, Zap } from '../icons';

export function SimulationModal({ isOpen, onClose, onControl, networkConnected }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="simulation-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Sliders size={16} className="text-amber" />
            <div>
              <h3 className="modal-title">Edge Hardware & Anomaly Test Harness</h3>
              <span className="modal-sub">Antarctic Subsystem Fault Injection & Offline Buffer Simulator</span>
            </div>
          </div>
          <button className="icon-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="test-harness-notice">
            <AlertTriangle size={14} className="text-amber" />
            <span>
              <strong>Engineering Warning:</strong> Triggering an anomaly injects out-of-distribution synthetic readings into the local edge processor.
              The Isolation Forest ML model will flag an incident and route an ISA-18.2 CRITICAL alarm to the store-and-forward queue.
            </span>
          </div>

          <div className="scenario-grid">
            {/* Scenario 1 */}
            <div className="scenario-card">
              <div className="scenario-header">
                <Zap size={14} className="text-red" />
                <strong>Generator DG-02 Thermal Overheat</strong>
              </div>
              <p className="scenario-desc">
                Simulates primary Cummins diesel jacket coolant temperature spike (&gt;98°C) with elevated harmonic vibration (6.2 mm/s).
              </p>
              <button
                className="btn-scenario-trigger alert"
                onClick={() => {
                  onControl('/simulation/generator/anomaly');
                  onClose();
                }}
              >
                Inject Generator Anomaly
              </button>
            </div>

            {/* Scenario 2 */}
            <div className="scenario-card">
              <div className="scenario-header">
                <AlertTriangle size={14} className="text-amber" />
                <strong>Priyadarshini Lake Pump Cavitation</strong>
              </div>
              <p className="scenario-desc">
                Simulates intake suction ice blockage at Priyadarshini Lake, causing line pressure collapse (&lt;20 psi) and impeller cavitation.
              </p>
              <button
                className="btn-scenario-trigger alert"
                onClick={() => {
                  onControl('/simulation/pump/anomaly');
                  onClose();
                }}
              >
                Inject Pump Anomaly
              </button>
            </div>

            {/* Scenario 3 */}
            <div className="scenario-card">
              <div className="scenario-header">
                <Zap size={14} className="text-amber" />
                <strong>Battery Bank Cell Voltage Sag</strong>
              </div>
              <p className="scenario-desc">
                Simulates extreme cold-soak thermal contraction in battery room, dropping DC bus voltage to 41.2V and triggering load shedding.
              </p>
              <button
                className="btn-scenario-trigger alert"
                onClick={() => {
                  onControl('/simulation/battery/anomaly');
                  onClose();
                }}
              >
                Inject Battery Anomaly
              </button>
            </div>

            {/* Scenario 4 */}
            <div className="scenario-card">
              <div className="scenario-header">
                <Radio size={14} className="text-blue" />
                <strong>Satellite Pass Loss (Offline Buffer)</strong>
              </div>
              <p className="scenario-desc">
                Cuts uplink to INSAT-3DR transponder. Telemetry automatically diverts to the local SQLite WAL queue for store-and-forward.
              </p>
              <button
                className="btn-scenario-trigger"
                onClick={() => {
                  onControl('/network/toggle', { action: networkConnected ? 'disconnect' : 'restore' });
                  onClose();
                }}
              >
                {networkConnected ? 'Simulate Link Disconnect' : 'Restore Satellite Link'}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-nominal"
            onClick={() => {
              onControl('/simulation/normal');
              onClose();
            }}
          >
            <Check size={13} />
            Reset All Subsystems to Nominal Operation
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
