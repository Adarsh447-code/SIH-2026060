import React, { useState } from 'react';
import { AlertTriangle, Check, Database, Download, HardDrive, RefreshCw, Upload } from '../icons';

export function QueueView({ queue, onSync, syncing }) {
  const [selectedItem, setSelectedItem] = useState(null);

  // Group queue counts
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, HISTORICAL: 0 };
  queue.forEach((item) => {
    const cat = item.queue_category || 'LOW';
    if (counts[cat] !== undefined) counts[cat] += 1;
  });

  return (
    <div className="view-container">
      {/* Priority Tier Overview Cards */}
      <div className="queue-tier-grid">
        <div className="queue-tier-card tier-critical">
          <div className="tier-header">
            <span className="tier-badge crit">TIER 1 · CRITICAL</span>
            <span className="tier-sla">IMMEDIATE BURST</span>
          </div>
          <div className="tier-count tabular">{counts.CRITICAL}</div>
          <div className="tier-meta">Trip signals, generator overheats, power failure</div>
        </div>

        <div className="queue-tier-card tier-high">
          <div className="tier-header">
            <span className="tier-badge high">TIER 2 · HIGH</span>
            <span className="tier-sla">&lt; 5 MIN PASS</span>
          </div>
          <div className="tier-count tabular">{counts.HIGH}</div>
          <div className="tier-meta">Threshold exceedances, line pressure drops</div>
        </div>

        <div className="queue-tier-card tier-medium">
          <div className="tier-header">
            <span className="tier-badge med">TIER 3 · MEDIUM</span>
            <span className="tier-sla">HOURLY BATCH</span>
          </div>
          <div className="tier-count tabular">{counts.MEDIUM}</div>
          <div className="tier-meta">Hourly synoptic weather &amp; battery charge states</div>
        </div>

        <div className="queue-tier-card tier-low">
          <div className="tier-header">
            <span className="tier-badge low">TIER 4 · LOW</span>
            <span className="tier-sla">SCHEDULED WINDOW</span>
          </div>
          <div className="tier-count tabular">{counts.LOW}</div>
          <div className="tier-meta">Routine equipment temperatures and run hours</div>
        </div>

        <div className="queue-tier-card tier-historical">
          <div className="tier-header">
            <span className="tier-badge hist">TIER 5 · HISTORICAL</span>
            <span className="tier-sla">BROADBAND BULK</span>
          </div>
          <div className="tier-count tabular">{counts.HISTORICAL}</div>
          <div className="tier-meta">Compressed raw ADC logs, vibration spectra FFT</div>
        </div>
      </div>

      {/* Main Queue Table & Payload Inspector */}
      <div className="queue-split-layout">
        {/* Table of Queued Telemetry Packets */}
        <div className="scada-card queue-table-pane">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">STORE-AND-FORWARD BUFFER</div>
              <h3 className="scada-card-title">Pending Satellite Uplink Packets ({queue.length})</h3>
            </div>
            <button
              className="btn-primary"
              onClick={onSync}
              disabled={syncing}
            >
              <Upload size={13} className={syncing ? 'spin' : ''} />
              <span>{syncing ? 'UPLOADING...' : 'TRIGGER BATCH SYNC'}</span>
            </button>
          </div>

          <div className="scada-table-scroll" style={{ maxHeight: 420 }}>
            <table className="scada-data-table full-width">
              <thead>
                <tr>
                  <th>SEQ ID</th>
                  <th>TIER</th>
                  <th>STATION</th>
                  <th>ASSET ID</th>
                  <th>BUFFERED AT</th>
                  <th>SYNC STATE</th>
                  <th>INSPECT</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item, index) => {
                  const isSelected = selectedItem?.id === item.id;
                  return (
                    <tr
                      key={item.id || index}
                      className={isSelected ? 'row-selected' : ''}
                      onClick={() => setSelectedItem(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="mono tabular text-secondary" style={{ fontSize: 11 }}>
                        #{String(item.sequence ?? item.id ?? index).padStart(5, '0')}
                      </td>
                      <td>
                        <span className={`tag-priority ${(item.queue_category || 'low').toLowerCase()}`}>
                          {item.queue_category || 'LOW'}
                        </span>
                      </td>
                      <td className="mono tabular" style={{ fontSize: 11 }}>{item.station}</td>
                      <td className="mono font-semibold text-primary">{item.asset}</td>
                      <td className="mono tabular text-muted" style={{ fontSize: 10 }}>
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString() : '---'}
                      </td>
                      <td>
                        <span className="mono tabular text-amber" style={{ fontSize: 10 }}>
                          {item.sync_status || 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-tiny"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                        >
                          Payload
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {queue.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-table-msg">
                      No pending records in store-and-forward queue buffer. All telemetry synced to mainland.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payload Inspector Pane */}
        <div className="scada-card payload-pane">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">PACKET INSPECTOR</div>
              <h3 className="scada-card-title">Telemetry Frame Payload</h3>
            </div>
          </div>

          {selectedItem ? (
            <div className="payload-inspector-body">
              <div className="packet-header-specs">
                <div className="spec-row">
                  <span className="spec-key">Sequence Frame:</span>
                  <span className="spec-val tabular">#0x{Number(selectedItem.id || 1).toString(16).toUpperCase()}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Target Station:</span>
                  <span className="spec-val">{selectedItem.station}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">Originating Asset:</span>
                  <span className="spec-val text-cyan">{selectedItem.asset}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-key">CRC32 Checksum:</span>
                  <span className="spec-val tabular text-emerald">VALID (0xE82B71A4)</span>
                </div>
              </div>

              <div className="payload-json-wrap">
                <span className="payload-json-label">RAW JSON PAYLOAD:</span>
                <pre className="payload-json-code">
                  {typeof selectedItem.payload === 'object'
                    ? JSON.stringify(selectedItem.payload, null, 2)
                    : selectedItem.payload || '{"message": "Telemetry frame payload placeholder"}'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="payload-empty-state">
              <HardDrive size={24} className="text-muted" />
              <p>Select any packet row in the queue table to inspect serialized Modbus registers and CRC checksum.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
