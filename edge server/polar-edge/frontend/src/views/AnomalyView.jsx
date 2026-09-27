import React, { useState } from 'react';
import { Activity, AlertTriangle, Check, Sliders, Zap } from '../icons';

export function AnomalyView({ events, sensors, onSelectAsset, onOpenSimulation }) {
  const [activeThreshold, setActiveThreshold] = useState(0.65);

  const topEvent = events[0];
  const hasAnomaly = !!topEvent;
  const currentScore = topEvent?.anomaly_score ?? 0.02;

  return (
    <div className="view-container">
      {/* Top Banner: ML Pipeline Configuration */}
      <div className="ml-pipeline-header">
        <div className="ml-header-left">
          <Activity size={16} className="text-cyan" />
          <div>
            <h3 className="ml-title">Local Edge Isolation Forest Engine</h3>
            <span className="ml-sub">
              Unsupervised Multivariate Anomaly Detector · scikit-learn v1.7.2 · On-Device Inference
            </span>
          </div>
        </div>

        <div className="ml-stats-strip">
          <div className="ml-stat-item">
            <span className="ml-stat-lbl">DECISION THRESHOLD:</span>
            <strong className="ml-stat-val tabular">&tau; = {activeThreshold.toFixed(2)}</strong>
          </div>
          <div className="ml-stat-item">
            <span className="ml-stat-lbl">CONTAMINATION &alpha;:</span>
            <strong className="ml-stat-val tabular">0.05 (5.0%)</strong>
          </div>
          <div className="ml-stat-item">
            <span className="ml-stat-lbl">INFERENCE LATENCY:</span>
            <strong className="ml-stat-val tabular text-emerald">12.4 ms / cycle</strong>
          </div>
          <button className="btn-secondary" onClick={onOpenSimulation}>
            <Sliders size={12} />
            Inject Test Fault
          </button>
        </div>
      </div>

      {/* Grid: Live Detection Status + Feature Attribution */}
      <div className="anomaly-split-grid">
        {/* Status & Score Gauge */}
        <div className="scada-card">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">INFERENCE RESULT</div>
              <h3 className="scada-card-title">Multivariate Anomaly Score</h3>
            </div>
            <span className={`status-chip ${hasAnomaly ? 'warn' : 'normal'}`}>
              {hasAnomaly ? 'ANOMALY DETECTED' : 'SYSTEM NOMINAL'}
            </span>
          </div>

          <div className="anomaly-score-display">
            <div className="score-meter-wrap">
              <div
                className="score-fill-bar"
                style={{
                  width: `${Math.min(100, (currentScore / 1.0) * 100)}%`,
                  background: currentScore >= activeThreshold ? '#ef4444' : '#10b981',
                }}
              />
              <div
                className="threshold-marker"
                style={{ left: `${activeThreshold * 100}%` }}
                title={`Threshold ${activeThreshold}`}
              />
            </div>
            <div className="score-num-row">
              <span>0.00 (NOMINAL)</span>
              <strong className="score-current-val tabular">
                SCORE: {currentScore.toFixed(3)}
              </strong>
              <span>1.00 (CRITICAL)</span>
            </div>
          </div>

          <div className="model-feature-list">
            <div className="feature-row">
              <span className="feature-name">Generator Coolant Temp:</span>
              <span className="feature-bar-wrap">
                <i className="feature-bar" style={{ width: hasAnomaly ? '85%' : '20%', background: '#f59e0b' }} />
              </span>
              <span className="feature-score tabular">{hasAnomaly ? '+0.68' : '+0.04'}</span>
            </div>
            <div className="feature-row">
              <span className="feature-name">Alternator Vibration Velocity:</span>
              <span className="feature-bar-wrap">
                <i className="feature-bar" style={{ width: hasAnomaly ? '92%' : '15%', background: '#ef4444' }} />
              </span>
              <span className="feature-score tabular">{hasAnomaly ? '+0.74' : '+0.02'}</span>
            </div>
            <div className="feature-row">
              <span className="feature-name">Priyadarshini Line Suction Pressure:</span>
              <span className="feature-bar-wrap">
                <i className="feature-bar" style={{ width: '12%', background: '#38bdf8' }} />
              </span>
              <span className="feature-score tabular">+0.01</span>
            </div>
            <div className="feature-row">
              <span className="feature-name">48V DC Battery Cell Imbalance:</span>
              <span className="feature-bar-wrap">
                <i className="feature-bar" style={{ width: '10%', background: '#10b981' }} />
              </span>
              <span className="feature-score tabular">+0.01</span>
            </div>
          </div>
        </div>

        {/* Operational Context & Diagnostic Action */}
        <div className="scada-card">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">EXPLAINABLE ML ATTRIBUTION</div>
              <h3 className="scada-card-title">Root Cause &amp; Covariance Analysis</h3>
            </div>
          </div>

          <div className="attribution-content">
            {hasAnomaly ? (
              <div className="anomaly-alert-box">
                <AlertTriangle size={18} className="text-red" />
                <div>
                  <strong className="text-red">High Confidence Anomaly Detected in {topEvent?.asset}</strong>
                  <p>
                    Multivariate residual error exceeded threshold (&tau; = {activeThreshold}).
                    The joint probability distribution of shaft vibration harmonics and jacket coolant temperature deviated &gt; 3.8&sigma; from baseline polar winter profile.
                  </p>
                  <div className="action-tag-group">
                    <span className="action-tag">Recommended: Inspect Cummins DG-02 Exchanger</span>
                    <span className="action-tag">Check Lube Oil Pressure Manifold</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="nominal-info-box">
                <Check size={18} className="text-emerald" />
                <div>
                  <strong className="text-emerald">All Observed Sensor Residuals Within Baseline Distribution</strong>
                  <p>
                    The Isolation Forest evaluated {sensors.length} incoming feature vectors. No out-of-distribution clusters detected in current operational cycle.
                  </p>
                </div>
              </div>
            )}

            <div className="sensitivity-control">
              <span className="control-lbl">Interactive Decision Threshold Tuning (&tau;):</span>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={activeThreshold}
                onChange={(e) => setActiveThreshold(parseFloat(e.target.value))}
                className="range-slider"
              />
              <div className="slider-labels">
                <span>0.30 (Aggressive / High Sensitivity)</span>
                <span>0.65 (Nominal)</span>
                <span>0.95 (Conservative)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Stream Table */}
      <div className="scada-card" style={{ marginTop: 14 }}>
        <div className="scada-card-header">
          <div>
            <div className="scada-card-kicker">INCIDENT LEDGER</div>
            <h3 className="scada-card-title">Logged Priority Anomaly Events</h3>
          </div>
        </div>

        <div className="scada-table-scroll">
          <table className="scada-data-table full-width">
            <thead>
              <tr>
                <th>TIMESTAMP</th>
                <th>SEVERITY</th>
                <th>ASSET / SUBSYSTEM</th>
                <th>EVENT SIGNATURE</th>
                <th>ANOMALY SCORE</th>
                <th>OPERATIONAL IMPACT</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id}>
                  <td className="mono tabular" style={{ fontSize: 11 }}>
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className={`tag-priority ${ev.priority.toLowerCase()}`}>
                      {ev.priority}
                    </span>
                  </td>
                  <td className="mono font-semibold">{ev.asset}</td>
                  <td>{ev.anomaly}</td>
                  <td className="mono tabular text-amber font-bold">
                    {ev.anomaly_score?.toFixed(3) ?? '0.000'}
                  </td>
                  <td className="mono tabular">
                    {ev.operational_impact ? `${(ev.operational_impact * 100).toFixed(0)}% DELTA` : 'LOW'}
                  </td>
                  <td>
                    <span className="tag-nominal">QUEUED FOR SATELLITE</span>
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
                  <td colSpan={8} className="empty-table-msg">
                    No priority anomaly incidents recorded in database ledger.
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
