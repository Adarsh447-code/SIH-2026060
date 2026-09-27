import React from 'react';
import { Cpu, Database, HardDrive, Server, Activity, Clock } from '../icons';

export function EdgeHardwareBar({ status, network, sensorCount }) {
  const pendingCount = status?.pending_uploads ?? network?.buffer_size ?? 0;
  const localBuffer = status?.local_buffer ?? 1420;

  return (
    <div className="hardware-strip">
      <div className="hw-appliance-title">
        <Server size={13} className="hw-icon" />
        <span className="hw-name">ADVANTECH MIC-770 RUGGED EDGE GATEWAY</span>
        <span className="hw-fw">DAKSHIN-OS v4.2.1-POLAR</span>
      </div>

      <div className="hw-stat-group">
        <div className="hw-stat-item" title="CPU Core Utilization (Quad-core Intel Core i7 Industrial)">
          <Cpu size={12} />
          <span className="hw-stat-lbl">CPU:</span>
          <strong className="hw-stat-val tabular">14.6%</strong>
        </div>

        <div className="hw-stat-item" title="ECC DDR4 RAM Allocated">
          <Activity size={12} />
          <span className="hw-stat-lbl">MEM:</span>
          <strong className="hw-stat-val tabular">3.4 / 16 GB</strong>
        </div>

        <div className="hw-stat-item" title="Local SQLite WAL Database Volume">
          <Database size={12} />
          <span className="hw-stat-lbl">SQLITE WAL:</span>
          <strong className="hw-stat-val tabular">19.1 MB</strong>
        </div>

        <div className="hw-stat-item" title="Store-and-forward telemetry records buffered locally">
          <HardDrive size={12} />
          <span className="hw-stat-lbl">STORE & FORWARD:</span>
          <strong className={`hw-stat-val tabular ${pendingCount > 0 ? 'text-amber' : 'text-emerald'}`}>
            {pendingCount} PENDING
          </strong>
        </div>

        <div className="hw-stat-item" title="Local Sensor Ingest Poll Cycle">
          <Clock size={12} />
          <span className="hw-stat-lbl">INGEST LOOP:</span>
          <strong className="hw-stat-val tabular">5.0 Hz (ACTIVE)</strong>
        </div>

        <div className="hw-stat-item" title="Local SQLite Sensor Buffer Depth">
          <span className="hw-stat-lbl">BUFFER DEPTH:</span>
          <strong className="hw-stat-val tabular">{localBuffer.toLocaleString()} RECS</strong>
        </div>
      </div>
    </div>
  );
}
