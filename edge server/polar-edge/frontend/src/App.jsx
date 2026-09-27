import React, { useEffect, useState, useMemo } from 'react';
import { StationHeader } from './components/StationHeader';
import { EdgeHardwareBar } from './components/EdgeHardwareBar';
import { AlarmBanner } from './components/AlarmBanner';
import { NavigationTabs } from './components/NavigationTabs';
import { SensorDetailDrawer } from './components/SensorDetailDrawer';
import { SimulationModal } from './components/SimulationModal';

import { CockpitView } from './views/CockpitView';
import { TelemetryView } from './views/TelemetryView';
import { AnomalyView } from './views/AnomalyView';
import { QueueView } from './views/QueueView';
import { SatelliteView } from './views/SatelliteView';
import { WeatherView } from './views/WeatherView';
import { LogsView } from './views/LogsView';

const API = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000';

export function App() {
  const [activeTab, setActiveTab] = useState('cockpit');
  const [status, setStatus] = useState({
    station: 'MAITRI',
    edge_server: 'ONLINE',
    satellite: 'CONNECTED',
    local_operation: 'ACTIVE',
    last_mainland_sync: '---',
    pending_uploads: 0,
    critical_events: 0,
    local_buffer: 1420,
    data_freshness: 'LIVE',
  });
  const [sensors, setSensors] = useState([]);
  const [events, setEvents] = useState([]);
  const [queue, setQueue] = useState([]);
  const [network, setNetwork] = useState({
    connected: true,
    last_sync: '',
    pending_batches: 0,
    buffer_size: 0,
  });
  const [weather, setWeather] = useState(null);
  const [logs, setLogs] = useState([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Clock tick every 1000ms
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Main polling loop for edge SCADA registers
  const refresh = async () => {
    try {
      const [stationRes, sensorsRes, eventsRes, queueRes, networkRes] = await Promise.all([
        fetch(`${API}/station/status`).catch(() => null),
        fetch(`${API}/sensors/latest`).catch(() => null),
        fetch(`${API}/events`).catch(() => null),
        fetch(`${API}/queue`).catch(() => null),
        fetch(`${API}/network/status`).catch(() => null),
      ]);

      if (stationRes?.ok) setStatus(await stationRes.json());
      if (sensorsRes?.ok) {
        const data = await sensorsRes.json();
        setSensors(Array.isArray(data) ? data : []);
      }
      if (eventsRes?.ok) {
        const data = await eventsRes.json();
        setEvents(Array.isArray(data) ? data : []);
      }
      if (queueRes?.ok) {
        const data = await queueRes.json();
        setQueue(Array.isArray(data) ? data : []);
      }
      if (networkRes?.ok) {
        const net = await networkRes.json();
        setNetwork({ ...net, connected: !!net.connected });
      }
    } catch (error) {
      console.warn('Telemetry polling error:', error);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
  }, []);

  // Weather polling loop (10 min)
  const refreshWeather = async () => {
    try {
      const res = await fetch(`${API}/weather`);
      if (res.ok) setWeather(await res.json());
    } catch (err) {
      console.warn('Weather poll error:', err);
    }
  };

  useEffect(() => {
    refreshWeather();
    const interval = setInterval(refreshWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch logs
  const refreshLogs = async () => {
    try {
      const res = await fetch(`${API}/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Logs poll error:', err);
    }
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 6000);
    return () => clearInterval(interval);
  }, []);

  // Post control actions
  const control = async (path, payload = null) => {
    try {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : null,
      });
      if (res.ok) {
        await refresh();
        await refreshLogs();
      }
    } catch (error) {
      console.error('Control error:', error);
    }
  };

  // Sync trigger
  const handleSync = async () => {
    setSyncing(true);
    try {
      await control('/sync/start');
    } finally {
      setTimeout(() => setSyncing(false), 800);
    }
  };

  // Toggle satellite network
  const handleToggleNetwork = async () => {
    const nextAction = network.connected ? 'disconnect' : 'restore';
    await control('/network/toggle', { action: nextAction });
  };

  const selectedSensorData = useMemo(() => {
    if (!selectedAsset) return null;
    return sensors.find((s) => s.asset_id === selectedAsset || s.sensor_type === selectedAsset);
  }, [selectedAsset, sensors]);

  const criticalCount = events.filter((e) => e.priority === 'CRITICAL').length;
  const hasAnomaly = events.length > 0;
  const pendingCount = queue.length;

  return (
    <div className="scada-app-shell">
      {/* Institutional Topbar */}
      <StationHeader
        status={status}
        network={network}
        currentTime={currentTime}
        onSync={handleSync}
        onToggleNetwork={handleToggleNetwork}
        onOpenSimulation={() => setSimulationOpen(true)}
        onManualRefresh={refresh}
        syncing={syncing}
      />

      {/* Hardware Telemetry Bar */}
      <EdgeHardwareBar
        status={status}
        network={network}
        sensorCount={sensors.length}
      />

      {/* Active Alarm Banner */}
      <AlarmBanner
        events={events}
        onInspectAsset={(asset) => setSelectedAsset(asset)}
      />

      {/* Functional SCADA Navigation Tabs */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        criticalCount={criticalCount}
        pendingCount={pendingCount}
        hasAnomaly={hasAnomaly}
        isConnected={network.connected}
        logCount={logs.length}
      />

      {/* Main View Area */}
      <main className="scada-main-viewport">
        {activeTab === 'cockpit' && (
          <CockpitView
            sensors={sensors}
            events={events}
            status={status}
            network={network}
            weather={weather}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
            onOpenSimulation={() => setSimulationOpen(true)}
            onSync={handleSync}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryView
            sensors={sensors}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
          />
        )}

        {activeTab === 'anomaly' && (
          <AnomalyView
            events={events}
            sensors={sensors}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
            onOpenSimulation={() => setSimulationOpen(true)}
          />
        )}

        {activeTab === 'queue' && (
          <QueueView
            queue={queue}
            onSync={handleSync}
            syncing={syncing}
          />
        )}

        {activeTab === 'satellite' && (
          <SatelliteView
            network={network}
            status={status}
            onToggleNetwork={handleToggleNetwork}
            onSync={handleSync}
            syncing={syncing}
          />
        )}

        {activeTab === 'weather' && (
          <WeatherView weather={weather} />
        )}

        {activeTab === 'logs' && (
          <LogsView logs={logs} onRefresh={refreshLogs} />
        )}
      </main>

      {/* Sensor Inspector Slide-over Drawer */}
      <SensorDetailDrawer
        asset={selectedAsset}
        sensorData={selectedSensorData}
        onClose={() => setSelectedAsset(null)}
        onSimulate={(asset) => {
          setSelectedAsset(null);
          setSimulationOpen(true);
        }}
      />

      {/* Fault Injection Simulation Modal */}
      <SimulationModal
        isOpen={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        onControl={control}
        networkConnected={network.connected}
      />
    </div>
  );
}

export default App;
