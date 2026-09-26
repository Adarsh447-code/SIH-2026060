import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = 'http://127.0.0.1:8000';
const COMPASS_POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function compassDirection(degrees) {
  if (typeof degrees !== 'number' || !Number.isFinite(degrees)) return null;
  return COMPASS_POINTS[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16];
}

function weatherValue(value, unit = '') {
  return value === null || value === undefined ? '—' : `${value}${unit}`;
}

function forecastDay(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`));
}

function App() {
  const [status, setStatus] = useState({
    station: 'MAITRI',
    edge_server: 'ONLINE',
    satellite: 'CONNECTED',
    local_operation: 'ACTIVE',
    last_mainland_sync: '---',
    pending_uploads: 0,
    critical_events: 0,
    local_buffer: 0,
    data_freshness: 'LIVE',
  });
  const [sensors, setSensors] = useState([]);
  const [events, setEvents] = useState([]);
  const [queue, setQueue] = useState([]);
  const [network, setNetwork] = useState({ connected: true, last_sync: '', pending_batches: 0, buffer_size: 0 });
  const [weather, setWeather] = useState(null);

  const refresh = async () => {
    try {
      const [stationRes, sensorsRes, eventsRes, queueRes, networkRes] = await Promise.all([
        fetch(`${API}/station/status`),
        fetch(`${API}/sensors/latest`),
        fetch(`${API}/events`),
        fetch(`${API}/queue`),
        fetch(`${API}/network/status`),
      ]);

      const station = await stationRes.json();
      const latest = await sensorsRes.json();
      const eventData = await eventsRes.json();
      const queueData = await queueRes.json();
      const net = await networkRes.json();

      setStatus({ ...station });
      setSensors(Array.isArray(latest) ? latest : []);
      setEvents(Array.isArray(eventData) ? eventData : []);
      setQueue(Array.isArray(queueData) ? queueData : []);
      setNetwork({ ...net, connected: !!net.connected });
    } catch (error) {
      console.error('refresh failed', error);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const refreshWeather = async () => {
      try {
        const response = await fetch(`${API}/weather`);
        if (!response.ok) throw new Error(`Weather request failed: ${response.status}`);
        setWeather(await response.json());
      } catch (error) {
        console.error('weather refresh failed', error);
        setWeather({ status: 'unavailable', current: null, daily: [] });
      }
    };

    refreshWeather();
    const interval = setInterval(refreshWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const control = async (path, payload = null) => {
    try {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : null,
      });
      if (res.ok) await refresh();
    } catch (error) {
      console.error('control failed', error);
    }
  };

  const latestGeneration = useMemo(
    () => sensors.filter((item) => item.sensor_type === 'generator').slice(0, 5),
    [sensors],
  );

  const chartData = useMemo(
    () =>
      sensors.slice(0, 15).map((item) => ({
        name: String(item.id || item.timestamp || 'n'),
        temperature: item.temperature || 0,
        vibration: item.vibration || 0,
        load: item.load || 0,
      })),
    [sensors],
  );

  const queueCounts = useMemo(() => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, HISTORICAL: 0 };
    queue.forEach((item) => {
      const key = item.queue_category || 'LOW';
      if (counts[key] !== undefined) counts[key] += 1;
    });
    return counts;
  }, [queue]);

  const latestGenerator = latestGeneration[0] || {};
  const latestBattery = sensors.find((item) => item.sensor_type === 'battery') || {};
  const latestHvac = sensors.find((item) => item.sensor_type === 'hvac') || {};
  const latestPump = sensors.find((item) => item.sensor_type === 'pump') || {};
  const latestEnvironment = sensors.find((item) => item.sensor_type === 'environmental') || {};
  const currentWeather = weather?.current;
  const windFrom = currentWeather?.wind_direction;
  const windToward = typeof windFrom === 'number' ? (windFrom + 180) % 360 : null;
  const windFromCompass = compassDirection(windFrom);
  const windTowardCompass = compassDirection(windToward);
  const anomalyStatus = events[0]?.priority ? 'ANOMALY DETECTED' : 'Normal';
  const anomalyScore = events[0]?.anomaly_score || 0.02;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">✦</div>
          <div>
            <div className="brand-title">POLAR TWIN</div>
            <div className="brand-subtitle">Edge Intelligence</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-title">Operations</div>
          <a className="nav-link active">Mission Dashboard</a>
          <a className="nav-link">Local Telemetry</a>
          <a className="nav-link">AI Anomaly Monitor</a>
          <a className="nav-link">Uplink Queue</a>
          <a className="nav-link">Sync & Reconciliation</a>
        </nav>

        <div className="station-card">
          <div className="station-label">Station</div>
          <div className="station-name">MAITRI</div>
          <div className="station-country">Indian Antarctic Station</div>
        </div>
      </aside>

      <main className="main">
        <section className="topbar">
          <div>
            <div className="breadcrumb">Antarctic Remote Operations / Edge Server</div>
            <h1>Mission Command Dashboard</h1>
          </div>
          <div className="top-actions">
            <span className={`signal ${network.connected ? 'online' : 'offline'}`}>
              {network.connected ? 'SATELLITE CONNECTED' : 'SATELLITE OFFLINE'}
            </span>
            <span className="sync-state">Local Operation Active</span>
          </div>
        </section>

        <section className="grid status-grid">
          <div className="status-card">
            <div className="status-label">Edge Server</div>
            <div className="status-value online-text">ONLINE</div>
            <div className="status-detail">Local-first</div>
          </div>
          <div className="status-card">
            <div className="status-label">Satellite</div>
            <div className="status-value">{network.connected ? 'CONNECTED' : 'OFFLINE'}</div>
            <div className="status-detail">{network.connected ? 'Uplink Available' : 'Buffering Local'}</div>
          </div>
          <div className="status-card">
            <div className="status-label">Local Database</div>
            <div className="status-value online-text">ONLINE</div>
            <div className="status-detail">SQLite</div>
          </div>
          <div className="status-card">
            <div className="status-label">AI Engine</div>
            <div className="status-value online-text">ONLINE</div>
            <div className="status-detail">Isolation Forest</div>
          </div>
        </section>

        <section className="grid weather-grid" aria-label="Polar weather">
          <div className="panel weather-current">
            <div className="panel-header">
              <div className="panel-title">Current Weather</div>
              <span className={`weather-badge ${weather?.status || 'loading'}`}>
                {weather?.status === 'available' ? 'LIVE MODEL' : weather?.status === 'stale' ? 'STALE' : weather?.status === 'unavailable' ? 'UNAVAILABLE' : 'LOADING'}
              </span>
            </div>
            {currentWeather ? (
              <>
                <div className="weather-current-grid">
                  <div className="weather-reading"><span>Temperature</span><strong>{weatherValue(currentWeather.temperature, ' °C')}</strong></div>
                  <div className="weather-reading"><span>Humidity</span><strong>{weatherValue(currentWeather.humidity, '%')}</strong></div>
                  <div className="weather-reading"><span>Visibility</span><strong>{weatherValue(currentWeather.visibility, ' km')}</strong></div>
                  <div className="weather-reading"><span>Wind speed</span><strong>{weatherValue(currentWeather.wind_speed, ' kn')}</strong></div>
                </div>
                <div className="wind-compass-row">
                  {windFromCompass ? (
                    <div className="wind-compass" role="img" aria-label={`Wind from ${windFrom} degrees ${windFromCompass}, moving toward ${windTowardCompass}`}>
                      <div className="compass-face" aria-hidden="true">
                        <span className="compass-north">N</span><span className="compass-east">E</span>
                        <span className="compass-south">S</span><span className="compass-west">W</span>
                        <span className="wind-vector" style={{ transform: `rotate(${windToward}deg)` }} />
                      </div>
                      <div className="wind-direction-copy">
                        <strong>From {Math.round(windFrom)}° {windFromCompass}</strong>
                        <span>Vector toward {windTowardCompass}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="wind-compass-empty">Wind direction unavailable</div>
                  )}
                </div>
              </>
            ) : (
              <div className="weather-message">
                {weather?.status === 'unavailable' ? 'Weather data is unavailable. Check the station network and try again.' : 'Fetching current polar conditions…'}
              </div>
            )}
            <div className="weather-source">
              <span>{weather?.source || 'Open-Meteo'} · Model estimate for MAITRI</span>
              <span>{weather?.retrieved_at ? `Updated ${new Date(weather.retrieved_at).toLocaleTimeString()}` : 'No update received'}</span>
            </div>
          </div>

          <div className="panel forecast-panel">
            <div className="panel-header">
              <div className="panel-title">7-Day Forecast</div>
              <span className="forecast-timezone">{weather?.timezone || 'UTC'}</span>
            </div>
            {weather?.daily?.length ? (
              <div className="forecast-scroll">
                <table className="forecast-table">
                  <thead>
                    <tr><th scope="col">Day</th><th scope="col">Low / High</th><th scope="col">Humidity</th><th scope="col">Wind</th><th scope="col">Snow</th><th scope="col">Visibility</th></tr>
                  </thead>
                  <tbody>
                    {weather.daily.map((day) => (
                      <tr key={day.date}>
                        <th scope="row">{forecastDay(day.date)}</th>
                        <td>{weatherValue(day.temperature_low, '°')} / {weatherValue(day.temperature_high, '°')}</td>
                        <td>{weatherValue(day.humidity, '%')}</td>
                        <td>{weatherValue(day.wind_speed, ' kn')} {compassDirection(day.wind_direction) || ''}</td>
                        <td>{weatherValue(day.snowfall, ' cm')}</td>
                        <td>{weatherValue(day.visibility, ' km')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="weather-message">{weather?.status === 'unavailable' ? 'Forecast unavailable while the provider cannot be reached.' : 'Seven-day forecast is loading…'}</div>
            )}
            {weather?.status === 'stale' && <div className="weather-stale-note">Showing the last successful forecast; current conditions may have changed.</div>}
          </div>
        </section>

        <section className="grid telemetry-grid">
          <div className="panel span-2">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">Live Telemetry</div>
                <div className="panel-title">Generator Diagnostics</div>
              </div>
              <span className="chip">MAITRI</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="vibration" stroke="#eab308" strokeWidth={2} />
                <Line type="monotone" dataKey="load" stroke="#60a5fa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">AI Anomaly Monitor</div>
                <div className="panel-title">Detection</div>
              </div>
            </div>
            <div className="anomaly-box">
              <div className="anomaly-status">{anomalyStatus}</div>
              <div className="anomaly-score">Score: {anomalyScore.toFixed(2)}</div>
            </div>
            <div className="mini-grid">
              <div>
                <div className="mini-label">Normal</div>
                <div className="mini-value normal">{Math.max(0, 100 - events.length * 10)}%</div>
              </div>
              <div>
                <div className="mini-label">Anomalies</div>
                <div className="mini-value anomaly">{events.length}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid cards-grid">
          <div className="summary-card">
            <div className="summary-label">Generator Temperature</div>
            <div className="summary-value">{latestGenerator.temperature?.toFixed(1) || '75.2'}°C</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Generator Vibration</div>
            <div className="summary-value">{latestGenerator.vibration?.toFixed(2) || '2.1'} Hz</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Generator Load</div>
            <div className="summary-value">{latestGenerator.load?.toFixed(1) || '80.2'}%</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Battery Charge</div>
            <div className="summary-value">{latestBattery.charge_percentage?.toFixed(1) || '86'}%</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">HVAC Temperature</div>
            <div className="summary-value">{latestHvac.indoor_temperature?.toFixed(1) || '22'}°C</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Water Pressure</div>
            <div className="summary-value">{latestPump.pressure?.toFixed(1) || '60'} psi</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Outside Temperature</div>
            <div className="summary-value">{latestEnvironment.outside_temperature?.toFixed(1) || '-18'}°C</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Wind Speed</div>
            <div className="summary-value">{latestEnvironment.wind_speed?.toFixed(1) || '18'} kt</div>
          </div>
        </section>

        <section className="grid lower-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">Priority Events</div>
                <div className="panel-title">Event Stream</div>
              </div>
            </div>
            <div className="event-list">
              {events.slice(0, 8).map((event) => (
                <div className="event-row" key={event.id}>
                  <div>
                    <div className="event-time">{new Date(event.timestamp).toLocaleTimeString()}</div>
                    <div className="event-detail">{event.station} / {event.asset}</div>
                  </div>
                  <div className="event-anomaly">{event.anomaly}</div>
                  <div className={`priority-${String(event.priority).toLowerCase()}`}>{event.priority}</div>
                  <div className="event-score">{event.score}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">Simulation Control</div>
                <div className="panel-title">Operations</div>
              </div>
            </div>
            <div className="control-panel">
              <button className="control-button" onClick={() => control('/simulation/normal')}>Normal Operation</button>
              <button className="control-button alert" onClick={() => control('/simulation/generator/anomaly')}>Trigger Generator Anomaly</button>
              <button className="control-button alert" onClick={() => control('/simulation/pump/anomaly')}>Trigger Water Pump Anomaly</button>
              <button className="control-button alert" onClick={() => control('/simulation/battery/anomaly')}>Trigger Battery Anomaly</button>
              <button
                className="control-button"
                onClick={() => control('/network/toggle', { action: network.connected ? 'disconnect' : 'restore' })}
              >
                {network.connected ? 'Disconnect Satellite' : 'Restore Satellite'}
              </button>
              <button className="control-button" onClick={() => control('/sync/start')}>Start Sync</button>
            </div>
          </div>
        </section>

        <section className="grid queue-grid">
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">Uplink Queue</div>
                <div className="panel-title">Priority Queue</div>
              </div>
            </div>
            <div className="queue-stats">
              {Object.entries(queueCounts).map(([key, value]) => (
                <div key={key} className="queue-item">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="queue-grid">
              {queue.slice(0, 20).map((item) => (
                <div className="queue-row" key={item.id}>
                  <span className="queue-type">{item.queue_category}</span>
                  <span className="queue-asset">{item.asset}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-kicker">Sync Status</div>
                <div className="panel-title">Transmission</div>
              </div>
            </div>
            <div className="sync-status">
              <div className="sync-line">
                <span className="sync-label">Last successful sync</span>
                <span className="sync-value">{status.last_mainland_sync || network.last_sync || '---'}</span>
              </div>
              <div className="sync-line">
                <span className="sync-label">Pending batches</span>
                <span className="sync-value">{network.pending_batches}</span>
              </div>
              <div className="sync-line">
                <span className="sync-label">Synced records</span>
                <span className="sync-value">{events.length}</span>
              </div>
              <div className="sync-line">
                <span className="sync-label">Buffered records</span>
                <span className="sync-value">{network.buffer_size}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
