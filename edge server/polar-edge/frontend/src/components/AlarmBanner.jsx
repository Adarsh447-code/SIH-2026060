import React, { useState } from 'react';
import { AlertTriangle, Bell, Check, Shield } from '../icons';

export function AlarmBanner({ events, onInspectAsset }) {
  const [acknowledged, setAcknowledged] = useState({});

  const unacknowledged = events.filter(
    (ev) => !acknowledged[ev.id] && (ev.priority === 'CRITICAL' || ev.priority === 'HIGH')
  );

  const topAlarm = unacknowledged[0];

  const handleAck = (id) => {
    setAcknowledged((prev) => ({ ...prev, [id]: true }));
  };

  if (!topAlarm) {
    return (
      <div className="alarm-strip nominal">
        <div className="alarm-strip-left">
          <Shield size={13} className="text-emerald" />
          <span className="alarm-status-txt">ISA-18.2 ALARM BUS: ALL CHANNELS NOMINAL</span>
          <span className="alarm-detail-txt">
            Threshold limits: Generator Coolant &lt; 95°C · Lube Press &gt; 3.0 bar · Line Trace &gt; +2°C
          </span>
        </div>
        <div className="alarm-strip-right">
          <span className="tag-nominal">DEFCON 5 / NORMAL</span>
        </div>
      </div>
    );
  }

  const isCritical = topAlarm.priority === 'CRITICAL';

  return (
    <div className={`alarm-strip ${isCritical ? 'critical' : 'warning'}`}>
      <div className="alarm-strip-left">
        <AlertTriangle size={15} className={`alarm-icon-pulse ${isCritical ? 'text-red' : 'text-amber'}`} />
        <span className={`alarm-level-badge ${topAlarm.priority.toLowerCase()}`}>
          {topAlarm.priority} ALARM
        </span>
        <strong className="alarm-title-txt">{topAlarm.anomaly}</strong>
        <span className="alarm-asset-txt">ASSET: {topAlarm.asset}</span>
        <span className="alarm-time-txt">
          LOGGED: {new Date(topAlarm.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="alarm-strip-right">
        {topAlarm.operational_impact > 0 && (
          <span className="alarm-impact-pill">
            IMPACT: {(topAlarm.operational_impact * 100).toFixed(0)}%
          </span>
        )}
        <button
          className="btn-alarm-action"
          onClick={() => onInspectAsset(topAlarm.asset)}
        >
          Inspect Register
        </button>
        <button
          className="btn-alarm-ack"
          onClick={() => handleAck(topAlarm.id)}
          title="Acknowledge alarm in edge SCADA queue"
        >
          <Check size={12} />
          ACK ALARM
        </button>
      </div>
    </div>
  );
}
