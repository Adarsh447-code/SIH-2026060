import React, { useState } from 'react';
import { RefreshCw, Search, Terminal } from '../icons';

export function LogsView({ logs, onRefresh }) {
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = levelFilter === 'ALL' || log.level?.toUpperCase() === levelFilter;
    const matchesSearch =
      !search ||
      log.message?.toLowerCase().includes(search.toLowerCase()) ||
      log.event?.toLowerCase().includes(search.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="view-container">
      {/* Log Console Toolbar */}
      <div className="table-toolbar">
        <div className="filter-button-group">
          {['ALL', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
            <button
              key={lvl}
              className={`filter-btn ${levelFilter === lvl ? 'active' : ''}`}
              onClick={() => setLevelFilter(lvl)}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="search-box-wrap">
          <Search size={13} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search daemon logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn-secondary" onClick={onRefresh} title="Fetch latest logs">
          <RefreshCw size={12} />
          <span>POLL LOGS</span>
        </button>
      </div>

      {/* Monospaced SCADA Terminal View */}
      <div className="terminal-card">
        <div className="terminal-header">
          <div className="terminal-title">
            <Terminal size={14} className="text-emerald" />
            <span>/var/log/polar-edge/scada-daemon.log · DAKSHIN-OS EDGE RUNTIME</span>
          </div>
          <span className="terminal-status tabular">ENTRIES: {filteredLogs.length}</span>
        </div>

        <div className="terminal-body">
          {filteredLogs.map((entry, idx) => {
            const isErr = entry.level?.toUpperCase() === 'ERROR';
            const isWarn = entry.level?.toUpperCase() === 'WARN' || entry.level?.toUpperCase() === 'WARNING';
            return (
              <div key={entry.id ?? idx} className="terminal-line">
                <span className="log-line-num tabular">{String(idx + 1).padStart(4, '0')}</span>
                <span className="log-time tabular">{new Date(entry.timestamp).toISOString()}</span>
                <span className={`log-lvl ${isErr ? 'lvl-err' : isWarn ? 'lvl-warn' : 'lvl-info'}`}>
                  [{entry.level || 'INFO'}]
                </span>
                <span className="log-event mono text-cyan">{entry.event}:</span>
                <span className="log-msg">{entry.message}</span>
              </div>
            );
          })}
          {filteredLogs.length === 0 && (
            <div className="terminal-empty">
              No matching log records found in edge database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
