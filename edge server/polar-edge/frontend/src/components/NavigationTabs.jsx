import React from 'react';
import { Activity, AlertTriangle, Layers, Radio, Terminal, Wind, Zap } from '../icons';

export function NavigationTabs({
  activeTab,
  onSelectTab,
  criticalCount,
  pendingCount,
  hasAnomaly,
  isConnected,
  logCount,
}) {
  const tabs = [
    {
      id: 'cockpit',
      label: 'SCADA COCKPIT',
      icon: Layers,
      badge: criticalCount > 0 ? { text: `${criticalCount} ALARM`, type: 'crit' } : null,
    },
    {
      id: 'telemetry',
      label: 'SUBSYSTEM TELEMETRY',
      icon: Zap,
    },
    {
      id: 'anomaly',
      label: 'AI ANOMALY ENGINE',
      icon: Activity,
      badge: hasAnomaly ? { text: 'ANOMALY', type: 'warn' } : null,
    },
    {
      id: 'queue',
      label: 'UPLINK QUEUE',
      icon: AlertTriangle,
      badge: pendingCount > 0 ? { text: `${pendingCount}`, type: 'neutral' } : null,
    },
    {
      id: 'satellite',
      label: 'SATELLITE & COMMS',
      icon: Radio,
      badge: {
        text: isConnected ? 'CONNECTED' : 'DISCONNECTED',
        type: isConnected ? 'online' : 'offline',
      },
    },
    {
      id: 'weather',
      label: 'POLAR METEOROLOGY',
      icon: Wind,
    },
    {
      id: 'logs',
      label: 'SYSTEM LOGS',
      icon: Terminal,
      badge: logCount > 0 ? { text: `${logCount}`, type: 'neutral' } : null,
    },
  ];

  return (
    <nav className="nav-tab-strip" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`nav-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            <Icon size={14} className="tab-icon" />
            <span className="tab-title">{tab.label}</span>
            {tab.badge && (
              <span className={`tab-badge ${tab.badge.type}`}>
                {tab.badge.text}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
