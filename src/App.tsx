import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BatteryCharging,
  Bell,
  Bot,
  Box,
  Check,
  ChevronDown,
  CircleGauge,
  Clock,
  CloudSnow,
  Compass,
  Cpu,
  Droplets,
  ExternalLink,
  Eye,
  Flame,
  Fuel,
  Gauge,
  Layers,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  Network,
  Package,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Thermometer,
  Truck,
  Wind,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { LoginPage } from "./components/LoginPage";
import { StationToggle } from "./components/StationToggle";
import {
  loadDashboard,
  loadWeather,
  getTelemetryHistory,
  formatWindDirection,
  getCompassBearing,
  getWindVector,
  getAntarcticOperationalPlan,
  type DashboardAlert,
  type DashboardAsset,
  type DashboardMetrics,
  type DashboardSnapshot,
  type WeatherSnapshot,
  type TelemetryPoint,
  type WindVector,
  type AntarcticOperationalPlan,
} from "./api";
import { navGroups } from "./data/dashboardData";
import type { PageKey, Severity, Station } from "./types";

export function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [page, setPage] = useState<PageKey>("overview");
  const [station, setStation] = useState<Station>("MAITRI");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock tick every second for UTC & IST mission control clocks
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      loadDashboard(station)
        .then((snapshot) => {
          if (active) setDashboard(snapshot);
        })
        .catch(() => undefined);
    refresh();
    const interval = window.setInterval(refresh, 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [station]);

  const stationDashboard = dashboard?.station === station ? dashboard : null;
  const data: DashboardMetrics = stationDashboard?.metrics ?? {
    health: 89,
    fuel: 68,
    battery: 78,
    temp: -28.4,
    wind: 42.5,
    windDirection: 135,
    humidity: 52,
    pressure: 984.2,
    environmentAvailable: true,
    power: 142.5,
    demand: 118.2,
    water: 184.0,
    windChill: -44.1,
    fuelDaysAutonomy: 23.4,
    batteryHours: 19.2,
    internalTemp: 21.4,
  };

  const alerts = stationDashboard?.alerts ?? [];
  const assets = stationDashboard?.assets ?? [];

  const goTo = (next: PageKey) => {
    setPage(next);
    setSidebarOpen(false);
    window.history.replaceState(null, "", `#/${next}`);
  };

  const utcString = currentTime.toUTCString().slice(17, 25);
  const istString = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(currentTime);

  if (!authenticated) {
    return <LoginPage station={station} setStation={setStation} onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="gov-ribbon">
          <i />
          <i />
          <i />
        </div>

        <div className="brand">
          <div className="brand-emblem">
            <Snowflake size={18} />
          </div>
          <div className="brand-text">
            <div className="brand-title">
              POLAR TWIN <span className="brand-badge">MAINLAND</span>
            </div>
            <div className="brand-sub">NCPOR Remote Operations</div>
          </div>
          <button
            className="icon-btn"
            style={{ display: sidebarOpen ? "grid" : "none", marginLeft: "auto" }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="sidebar-scroll">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map(([key, label, Icon]) => (
                <button
                  className={`nav-item ${page === key ? "active" : ""}`}
                  key={key}
                  onClick={() => goTo(key)}
                >
                  <Icon size={15} strokeWidth={1.8} />
                  <span>{label}</span>
                  {key === "alerts" && alerts.length > 0 && <b className="nav-count">{alerts.length}</b>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-station-select">
            <div className="nav-label" style={{ padding: "0 0 6px" }}>Active Station</div>
            <StationToggle station={station} onSelect={setStation} compact showDot={false} />
          </div>
          <div className="sidebar-footer-stat">
            <span>
              <i className="status-indicator-dot normal" />
              Mainland Server
            </span>
            <b className="tabular" style={{ color: "#34d399", fontSize: 10 }}>ONLINE</b>
          </div>
          <div className="sidebar-footer-stat" style={{ marginBottom: 0 }}>
            <span>
              <Radio size={12} style={{ color: "var(--text-muted)" }} />
              Satellite Sync
            </span>
            <b className="tabular" style={{ color: "var(--text-secondary)", fontSize: 10 }}>NOMINAL</b>
          </div>
        </div>
      </aside>

      {/* Main Command Console */}
      <main className="main">
        {/* Institutional Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-btn"
              style={{ display: "none" }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="agency-identity">
              <div>
                <div className="agency-logo-text">NATIONAL CENTRE FOR POLAR & OCEAN RESEARCH</div>
                <div className="agency-logo-sub">Ministry of Earth Sciences · Government of India</div>
              </div>
            </div>
            <StationToggle station={station} onSelect={setStation} />
          </div>

          <div className="topbar-right">
            {/* Dual UTC and IST Clocks */}
            <div className="clock-group">
              <div className="clock-item">
                <span>STN (UTC)</span>
                <strong>{utcString}</strong>
              </div>
              <div style={{ width: 1, height: 14, background: "var(--border-subtle)" }} />
              <div className="clock-item">
                <span>HQ (IST)</span>
                <strong>{istString}</strong>
              </div>
            </div>

            {/* Satellite Telemetry Link Status */}
            <div className="satellite-link-pill">
              <Radio size={12} />
              <span>INSAT-3DR 112ms</span>
            </div>

            {/* Outside Weather Quick-read */}
            <div className="telemetry-indicator" title="Outside ambient temperature at station AWS">
              <Thermometer size={14} style={{ color: "#38bdf8" }} />
              <strong>{data.temp.toFixed(1)}°C</strong>
            </div>

            {/* Alert Quick Access */}
            <button className="icon-btn" onClick={() => goTo("alerts")} aria-label="Alarms">
              <Bell size={16} />
              {alerts.length > 0 && <span className="icon-badge">{alerts.length}</span>}
            </button>

            {/* Mission Controller Profile */}
            <div className="operator-profile">
              <div className="operator-avatar">NC</div>
              <div className="operator-info">
                <b>Mission Control</b>
                <small>Goa, India</small>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Pages */}
        <div className="content">
          {page === "overview" && (
            <Overview
              data={data}
              alerts={alerts}
              station={station}
              onSelectAsset={setSelectedAsset}
              onSimulate={setSimulation}
              goTo={goTo}
            />
          )}
          {page === "digital-twin" && (
            <TwinPage station={station} assets={assets} onSelectAsset={setSelectedAsset} />
          )}
          {page === "infrastructure" && (
            <Infrastructure assets={assets} onSelectAsset={setSelectedAsset} />
          )}
          {page === "energy" && <Energy data={data} station={station} />}
          {page === "environment" && <Environment data={data} station={station} />}
          {page === "water" && <Water station={station} onSimulate={() => setSimulation("WATER PUMP FAILURE")} />}
          {page === "logistics" && <Logistics station={station} />}
          {page === "equipment" && <Equipment station={station} />}
          {page === "maintenance" && <Maintenance onSelectAsset={setSelectedAsset} />}
          {page === "simulation" && <Simulation active={simulation} onRun={setSimulation} />}
          {page === "alerts" && (
            <Alerts alerts={alerts} onSelectAsset={setSelectedAsset} onSimulate={setSimulation} />
          )}
          {page === "communication" && <Communication station={station} />}
          {page === "ai-assistant" && <Assistant station={station} />}
        </div>
      </main>

      {/* Asset Inspection Slide-over Drawer */}
      {selectedAsset && (
        <AssetDrawer
          asset={selectedAsset}
          close={() => setSelectedAsset(null)}
          onSimulate={() => {
            setSelectedAsset(null);
            setSimulation("GENERATOR DG-02 EXCHANGER FAILURE");
            goTo("simulation");
          }}
        />
      )}

      {/* Active Simulation Floating Toast */}
      {simulation && page !== "simulation" && (
        <div className="drawer-overlay" style={{ background: "transparent", pointerEvents: "none" }}>
          <div
            style={{
              position: "fixed",
              bottom: 24,
              right: 24,
              background: "#0d1726",
              border: "1px solid var(--border-accent)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              pointerEvents: "auto",
              zIndex: 40,
            }}
          >
            <Sparkles size={16} style={{ color: "#38bdf8" }} />
            <div>
              <b style={{ display: "block", fontSize: 12, color: "var(--text-primary)" }}>
                Simulation Active: {simulation}
              </b>
              <small style={{ color: "var(--text-secondary)", fontSize: 11 }}>
                System impact analysis ready for review
              </small>
            </div>
            <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => goTo("simulation")}>
              View Cascade
            </button>
            <button className="icon-btn" onClick={() => setSimulation(null)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   Page: Overview
   ========================================================================== */

function Overview({
  data,
  alerts,
  station,
  onSelectAsset,
  onSimulate,
  goTo,
}: {
  data: DashboardMetrics;
  alerts: DashboardAlert[];
  station: Station;
  onSelectAsset: (asset: string) => void;
  onSimulate: (scenario: string) => void;
  goTo: (page: PageKey) => void;
}) {
  const isMaitri = station === "MAITRI";
  const coordinates = isMaitri ? "70°45′58″ S, 11°44′09″ E" : "69°24′28″ S, 76°11′14″ E";
  const locationDesc = isMaitri
    ? "Schirmacher Oasis, Queen Maud Land · WMO 89514 · Elev 117m"
    : "Larsemann Hills, Grovnes Peninsula · WMO 89508 · Elev 35m";

  return (
    <div className="page">
      {/* Station Header & Geographic Metadata */}
      <div className="page-header">
        <div className="page-header-titles">
          <h1>{station} STATION DIGITAL TWIN CONSOLE</h1>
          <p>{locationDesc}</p>
        </div>
        <div className="station-meta-badge">
          <span>COORDINATES:</span>
          <strong>{coordinates}</strong>
          <span>SOLAR:</span>
          <strong>-12.4° (Civil Twilight)</strong>
          <span>STATUS:</span>
          <strong style={{ color: "#34d399" }}>DEFCON NOMINAL</strong>
        </div>
      </div>

      {/* High-Density SCADA Telemetry Row */}
      <div className="telemetry-row">
        {/* Microgrid Electrical Generation */}
        <div className="telemetry-card">
          <div className="card-top">
            <span>Power Generation</span>
            <Zap size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">{data.power.toFixed(1)} kW</div>
          <div className="card-meta">
            <span>Station Load: <b className="tabular">{data.demand.toFixed(1)} kW</b></span>
            <small>Reserve: {(data.power - data.demand).toFixed(1)} kW</small>
          </div>
        </div>

        {/* Diesel Fuel Storage & Autonomy */}
        <div className="telemetry-card">
          <div className="card-top">
            <span>Fuel Reserve</span>
            <Fuel size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">{data.fuel}%</div>
          <div className="card-meta">
            <span>Autonomy: <b className="tabular">{data.fuelDaysAutonomy ?? 23.4} days</b></span>
            <small>Burn: ~31.4 L/h</small>
          </div>
        </div>

        {/* Station Thermal & Life Support */}
        <div className="telemetry-card">
          <div className="card-top">
            <span>Thermal & Water Loop</span>
            <Droplets size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">{data.water.toFixed(1)} L/min</div>
          <div className="card-meta">
            <span>Hab Inside: <b className="tabular">+{data.internalTemp ?? 21.4}°C</b></span>
            <small>Trace: +4.8°C</small>
          </div>
        </div>

        {/* Antarctic Meteorological Station */}
        <div className="telemetry-card">
          <div className="card-top">
            <span>External Meteorology</span>
            <Wind size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">{data.temp.toFixed(1)}°C</div>
          <div className="card-meta">
            <span>Wind: <b className="tabular">{data.wind.toFixed(1)} km/h ENE</b></span>
            <small>Chill: {data.windChill ?? -44.1}°C</small>
          </div>
        </div>
      </div>

      {/* Main Grid: Orthographic CAD Twin + Alarms */}
      <div className="overview-main-grid">
        {/* CAD Digital Twin Vector Viewport */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>{station} Spatial Site Blueprint</h2>
              <span>Orthographic CAD Telemetry Model · 1:2500 Scale</span>
            </div>
            <div className="panel-actions">
              <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => goTo("digital-twin")}>
                Full GIS View <ExternalLink size={12} />
              </button>
            </div>
          </div>
          <TwinCanvas station={station} onSelectAsset={onSelectAsset} />
        </section>

        {/* Live Operational Alarm Queue */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Active Alarm Queue</h2>
              <span>ISA-18.2 Priority Signals</span>
            </div>
            <div className="panel-actions">
              <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => goTo("alerts")}>
                All Alarms <ArrowUpRight size={12} />
              </button>
            </div>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="alarm-table-wrap">
              <table className="alarm-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Signal & Asset</th>
                    <th>Age</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={`${alert.asset}-${alert.title}`}>
                      <td>
                        <span className={`alarm-level-tag ${alert.level}`}>{alert.level}</span>
                      </td>
                      <td className="alarm-title-col">
                        <b>{alert.title}</b>
                        <small>{alert.asset}</small>
                      </td>
                      <td className="mono tabular" style={{ fontSize: 11 }}>{alert.time}</td>
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: "2px 6px", fontSize: 10 }}
                          onClick={() => onSelectAsset(alert.asset)}
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                  {alerts.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>
                        No active operational alarms. All telemetry channels within nominal threshold limits.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Secondary Grid: Interactive Telemetry Chart + Risk Chain */}
      <div className="overview-secondary-grid">
        {/* Dynamic Telemetry Time-Series Chart */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Power Grid Telemetry Curve</h2>
              <span>Generation vs Station Demand</span>
            </div>
          </div>
          <div className="panel-body">
            <InteractiveChart station={station} metric="power" />
          </div>
        </section>

        {/* Operational Risk Dependency Chain */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Cascading Risk Dependency Matrix</h2>
              <span>Simulated Failure Propagation</span>
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: "4px 8px", fontSize: 11 }}
              onClick={() => onSimulate("EXTREME KATABATIC STORM")}
            >
              Run Storm Simulation <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="panel-body">
            <div className="risk-matrix">
              <div className="cascade-step-list">
                <div className="cascade-step">
                  <div className="cascade-step-num">01</div>
                  <div className="cascade-step-desc">
                    <b>Katabatic Wind Vector Gusts &gt; 75 km/h</b>
                    <span>Exterior air temperature drop to -38.0°C</span>
                  </div>
                  <span className="tabular mono" style={{ color: "#f59e0b", fontSize: 11 }}>AMBER RISK</span>
                </div>
                <div className="cascade-step">
                  <div className="cascade-step-num">02</div>
                  <div className="cascade-step-desc">
                    <b>HVAC Habitat Heating & Heat Trace Demand</b>
                    <span>Thermal loop heating power increases +28.5 kW</span>
                  </div>
                  <span className="tabular mono" style={{ color: "var(--text-secondary)", fontSize: 11 }}>+24% LOAD</span>
                </div>
                <div className="cascade-step danger">
                  <div className="cascade-step-num">03</div>
                  <div className="cascade-step-desc">
                    <b>Generator DG-02 Secondary Exchanger Overload</b>
                    <span>Coolant temperature reaches 98.4°C warning threshold</span>
                  </div>
                  <span className="tabular mono" style={{ color: "#ef4444", fontSize: 11 }}>CRITICAL DELTA</span>
                </div>
                <div className="cascade-step">
                  <div className="cascade-step-num">04</div>
                  <div className="cascade-step-desc">
                    <b>Fuel Burn Rate Acceleration</b>
                    <span>Daily consumption accelerates to 38.2 L/h (18.5 days autonomy)</span>
                  </div>
                  <span className="tabular mono" style={{ color: "#f59e0b", fontSize: 11 }}>-4.9 DAYS</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ==========================================================================
   Orthographic CAD Digital Twin Canvas Component
   ========================================================================== */

function TwinCanvas({
  station,
  onSelectAsset,
}: {
  station: Station;
  onSelectAsset: (asset: string) => void;
}) {
  const [activeLayer, setActiveLayer] = useState<"all" | "power" | "water" | "science">("all");
  const isMaitri = station === "MAITRI";

  // Maitri Facilities & Layout
  const maitriBuildings = [
    { id: "hab", x: 260, y: 160, w: 120, h: 70, label: "MAIN HABITATION COMPLEX", sub: "Block A/B/C · 25 Crew", status: "normal", asset: "HVAC Habitation Loop AHU-01" },
    { id: "gen", x: 410, y: 155, w: 85, h: 55, label: "POWERHOUSE (DG 1-3)", sub: "3x 125kVA · Day Tank", status: "warning", asset: "Generator DG-02 (Cummins 125 kVA)" },
    { id: "pump", x: 100, y: 310, w: 65, h: 45, label: "PUMP HOUSE", sub: "P-01 · 184 L/min", status: "normal", asset: "Priyadarshini Lake Pump P-01" },
    { id: "kuber", x: 380, y: 260, w: 90, h: 50, label: "KUBER FUEL DEPOT", sub: "128,400 L Polar Diesel", status: "normal", asset: "Kuber Fuel Depot Storage Farm" },
    { id: "garage", x: 250, y: 260, w: 85, h: 50, label: "VEHICLE WORKSHOP", sub: "PistenBully / Prinoth", status: "normal", asset: "Vehicle Garage & Heavy Shed" },
    { id: "mara", x: 530, y: 90, w: 75, h: 45, label: "MARA RADAR ARRAY", sub: "53.5 MHz Atmospheric", status: "normal", asset: "MARA Atmospheric Radar System" },
    { id: "gargi", x: 130, y: 110, w: 60, h: 40, label: "GARGI AWS HUT", sub: "Campbell Met Station", status: "normal", asset: "Campbell Scientific AWS Station" },
    { id: "priya", x: 550, y: 240, w: 65, h: 40, label: "PRIYA HUT", sub: "Broadband Seismo / GNSS", status: "normal", asset: "Broadband Seismometer & GNSS" },
  ];

  // Bharati Facilities & Layout
  const bharatiBuildings = [
    { id: "bha_main", x: 280, y: 150, w: 140, h: 80, label: "MAIN AEROFOIL STATION", sub: "3-Tier Modular · 47 Crew", status: "normal", asset: "Aerofoil Modular Habitation HVAC" },
    { id: "chp", x: 450, y: 165, w: 80, h: 60, label: "CHP ENERGY BLOCK", sub: "2x 100kW MAN Units", status: "normal", asset: "MAN Diesel Generator CHP-01" },
    { id: "desal", x: 170, y: 220, w: 75, h: 50, label: "RO DESALINATION", sub: "4,800 L/day Seawater", status: "normal", asset: "Seawater Reverse Osmosis RO-01" },
    { id: "isro1", x: 480, y: 70, w: 65, h: 45, label: "ISRO RADOME 1", sub: "7.5m Earth Observation", status: "normal", asset: "ISRO Ground Station Radome 1" },
    { id: "isro2", x: 570, y: 110, w: 65, h: 45, label: "ISRO RADOME 2", sub: "7.5m Science Downlink", status: "normal", asset: "ISRO Ground Station Radome 2" },
    { id: "fuel", x: 340, y: 270, w: 90, h: 50, label: "POLAR FUEL FARM", sub: "185,000 L ATF / Diesel", status: "normal", asset: "Polar Bunded Fuel Farm" },
    { id: "heli", x: 150, y: 100, w: 75, h: 55, label: "POLAR HELIPAD", sub: "Mi-8 / Kamov Staging", status: "normal", asset: "Helipad Flight Control" },
  ];

  const buildings = isMaitri ? maitriBuildings : bharatiBuildings;

  return (
    <div className="cad-container">
      {/* Top Left Engineering Overlay */}
      <div className="cad-toolbar">
        <span className="cad-badge">
          GRID: UTM 32S · DATUM WGS-84
        </span>
        <span className="cad-badge" style={{ color: "#34d399" }}>
          LIVE TELEMETRY ACTIVE
        </span>
      </div>

      {/* SVG Orthographic Blueprint */}
      <div className="cad-viewport">
        <svg viewBox="0 0 700 390" className="cad-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            {/* Engineering Grid Pattern */}
            <pattern id="cadGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(148, 163, 184, 0.07)" strokeWidth="0.8" />
            </pattern>
            {/* Major Grid Pattern */}
            <pattern id="cadMajorGrid" width="150" height="150" patternUnits="userSpaceOnUse">
              <rect width="150" height="150" fill="url(#cadGrid)" />
              <path d="M 150 0 L 0 0 0 150" fill="none" stroke="rgba(148, 163, 184, 0.15)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#cadMajorGrid)" />

          {/* Topographic Terrain Contours */}
          <path
            d="M 20 50 Q 180 80, 320 40 T 680 70 M 10 180 Q 200 230, 400 170 T 690 200 M 30 320 Q 250 360, 480 320 T 680 350"
            fill="none"
            className="svg-cad-terrain"
          />

          {/* Priyadarshini Lake (Maitri) or Coastal Inlet (Bharati) */}
          {isMaitri ? (
            <g>
              <path
                d="M 30 260 Q 80 230, 160 250 T 230 330 Q 180 380, 90 370 T 30 330 Z"
                className="svg-cad-lake"
              />
              <text x="75" y="325" fill="#38bdf8" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.08em">
                PRIYADARSHINI LAKE (FRESHWATER INTAKE)
              </text>
            </g>
          ) : (
            <g>
              <path
                d="M 0 300 Q 140 280, 240 320 T 400 390 L 0 390 Z"
                className="svg-cad-lake"
              />
              <text x="40" y="360" fill="#38bdf8" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.08em">
                PRYDZ BAY / SEA ICE MARGIN
              </text>
            </g>
          )}

          {/* Heated Water Pipeline Trace (Intake -> Station) */}
          {(activeLayer === "all" || activeLayer === "water") && (
            <g>
              <path
                d={isMaitri ? "M 130 310 L 200 280 L 260 220" : "M 210 240 L 280 210"}
                className="svg-cad-pipeline"
              />
              <text
                x={isMaitri ? "150" : "215"}
                y={isMaitri ? "270" : "215"}
                fill="#38bdf8"
                fontSize="8"
                fontFamily="var(--font-mono)"
              >
                1.2km HEATED TRACE (+4.8°C)
              </text>
            </g>
          )}

          {/* Electrical Microgrid Underground Conduits */}
          {(activeLayer === "all" || activeLayer === "power") && (
            <g>
              <path
                d={
                  isMaitri
                    ? "M 410 180 L 380 180 M 410 210 L 410 260 M 495 180 L 530 115"
                    : "M 450 190 L 420 190 M 490 165 L 490 115 M 450 225 L 430 270"
                }
                className="svg-cad-powerline"
              />
            </g>
          )}

          {/* Buildings & Facilities */}
          {buildings.map((b) => (
            <g
              key={b.id}
              onClick={() => onSelectAsset(b.asset)}
              style={{ cursor: "pointer" }}
            >
              {/* Outer building outline */}
              <rect
                x={b.x}
                y={b.y}
                width={b.w}
                height={b.h}
                rx="4"
                className={`svg-cad-building ${b.status}`}
              />
              {/* Status Indicator Pip */}
              <circle
                cx={b.x + b.w - 10}
                cy={b.y + 10}
                r="4"
                fill={b.status === "warning" ? "#f59e0b" : "#10b981"}
              />
              {/* Label Text */}
              <text x={b.x + 8} y={b.y + 20} className="svg-cad-building-text">
                {b.label}
              </text>
              <text x={b.x + 8} y={b.y + 36} className="svg-cad-building-sub">
                {b.sub}
              </text>
            </g>
          ))}

          {/* Geographic North Arrow */}
          <g transform="translate(640, 40)">
            <circle cx="0" cy="0" r="16" fill="rgba(8,15,27,0.8)" stroke="var(--border-default)" strokeWidth="1" />
            <polygon points="0,-12 5,5 0,2 -5,5" fill="#f59e0b" />
            <text x="-4" y="-14" fill="#f8fafc" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700">N</text>
          </g>

          {/* Scale Bar */}
          <g transform="translate(30, 370)">
            <line x1="0" y1="0" x2="80" y2="0" stroke="var(--text-muted)" strokeWidth="2" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--text-muted)" strokeWidth="2" />
            <line x1="80" y1="-3" x2="80" y2="3" stroke="var(--text-muted)" strokeWidth="2" />
            <text x="25" y="-5" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)">100 METERS</text>
          </g>
        </svg>
      </div>

      {/* Layer Toggles & Status Legend */}
      <div className="cad-layer-bar">
        <div className="cad-layer-toggles">
          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>LAYERS:</span>
          <button
            className={`cad-layer-tag ${activeLayer === "all" ? "active" : ""}`}
            onClick={() => setActiveLayer("all")}
          >
            All Subsystems
          </button>
          <button
            className={`cad-layer-tag ${activeLayer === "power" ? "active" : ""}`}
            onClick={() => setActiveLayer("power")}
          >
            Power Grid (415V)
          </button>
          <button
            className={`cad-layer-tag ${activeLayer === "water" ? "active" : ""}`}
            onClick={() => setActiveLayer("water")}
          >
            Water & Heat Trace
          </button>
        </div>

        <div className="cad-legend">
          <span className="legend-item">
            <i className="status-indicator-dot normal" /> Nominal
          </span>
          <span className="legend-item">
            <i className="status-indicator-dot warning" /> Warning
          </span>
          <span className="legend-item">
            <i className="status-indicator-dot critical" /> Critical
          </span>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Interactive Time-Series Chart Component
   ========================================================================== */

function InteractiveChart({
  station,
  metric,
}: {
  station: Station;
  metric: "power" | "water" | "temp" | "fuel";
}) {
  const [range, setRange] = useState<"1h" | "6h" | "24h" | "7d">("24h");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const data = useMemo(() => getTelemetryHistory(station, metric, range), [station, metric, range]);

  const maxVal = Math.max(...data.map((d) => Math.max(d.value1, d.value2))) * 1.15;
  const minVal = Math.min(...data.map((d) => Math.min(d.value1, d.value2))) * 0.9;
  const rangeSpan = maxVal - minVal || 1;

  const width = 580;
  const height = 180;
  const paddingLeft = 45;
  const paddingBottom = 25;
  const graphW = width - paddingLeft;
  const graphH = height - paddingBottom;

  const points1 = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * graphW;
    const y = graphH - ((d.value1 - minVal) / rangeSpan) * graphH;
    return `${x},${y}`;
  }).join(" ");

  const points2 = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * graphW;
    const y = graphH - ((d.value2 - minVal) / rangeSpan) * graphH;
    return `${x},${y}`;
  }).join(" ");

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="chart-container">
      <div className="chart-header-controls">
        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          Current Reading:{" "}
          <strong style={{ color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
            {activePoint?.value1} kW
          </strong>{" "}
          (Demand:{" "}
          <strong style={{ color: "#f59e0b", fontFamily: "var(--font-mono)" }}>
            {activePoint?.value2} kW
          </strong>
          )
        </div>
        <div className="range-toggle-group">
          {(["1h", "6h", "24h", "7d"] as const).map((r) => (
            <button
              key={r}
              className={`range-btn ${range === r ? "selected" : ""}`}
              onClick={() => setRange(r)}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-svg-box">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const fraction = Math.max(0, Math.min(1, (mouseX - paddingLeft) / graphW));
            setHoverIndex(Math.round(fraction * (data.length - 1)));
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const y = graphH - p * graphH;
            const val = (minVal + p * rangeSpan).toFixed(0);
            return (
              <g key={p}>
                <line x1={paddingLeft} y1={y} x2={width} y2={y} className="chart-grid-line" />
                <text x="4" y={y + 3} className="chart-axis-label">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Time Labels on X-axis */}
          {data.filter((_, idx) => idx % Math.ceil(data.length / 5) === 0).map((d) => {
            const i = data.indexOf(d);
            const x = paddingLeft + (i / (data.length - 1)) * graphW;
            return (
              <text key={d.timestamp} x={x - 10} y={height - 5} className="chart-axis-label">
                {d.timeLabel}
              </text>
            );
          })}

          {/* Polylines for Channels */}
          <polyline points={points1} fill="none" stroke="#38bdf8" strokeWidth="2" />
          <polyline points={points2} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4" />

          {/* Hover Crosshair */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={paddingLeft + (hoverIndex / (data.length - 1)) * graphW}
                y1="0"
                x2={paddingLeft + (hoverIndex / (data.length - 1)) * graphW}
                y2={graphH}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>
      </div>

      <div className="chart-legend-box">
        <span>
          <i className="chart-legend-line" style={{ background: "#38bdf8" }} /> Total Power Generation (kW)
        </span>
        <span>
          <i className="chart-legend-line" style={{ background: "#f59e0b", borderTop: "2px dashed #f59e0b" }} /> Station Load Demand (kW)
        </span>
      </div>
    </div>
  );
}

/* ==========================================================================
   Page: Digital Twin Dedicated View
   ========================================================================== */

function TwinPage({
  station,
  assets,
  onSelectAsset,
}: {
  station: Station;
  assets: DashboardAsset[];
  onSelectAsset: (asset: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const filteredAssets = filter === "all" ? assets : assets.filter((a) => a.subsystem?.toLowerCase().includes(filter));

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>{station} GIS & DIGITAL TWIN WORKSTATION</h1>
          <p>Real-time physical asset inspection and spatial telemetry</p>
        </div>
        <div className="station-meta-badge">
          <span>MODE:</span>
          <strong>ORTHOGRAPHIC CAD INSPECTION</strong>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
        {/* Left Asset Navigator */}
        <section className="panel" style={{ display: "flex", flexDirection: "column", height: 500 }}>
          <div className="panel-header">
            <div className="panel-title">
              <h2>Monitored Assets</h2>
              <span>({filteredAssets.length})</span>
            </div>
          </div>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="range-toggle-group" style={{ width: "100%", justifyContent: "space-between" }}>
              {["all", "electrical", "freshwater", "meteorological"].map((cat) => (
                <button
                  key={cat}
                  className={`range-btn ${filter === cat ? "selected" : ""}`}
                  onClick={() => setFilter(cat)}
                  style={{ textTransform: "capitalize", fontSize: 10 }}
                >
                  {cat === "all" ? "All" : cat.slice(0, 5)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
            {filteredAssets.map((asset) => (
              <button
                key={asset.name}
                className="scenario-item-btn"
                style={{ marginBottom: 4, padding: "8px 10px" }}
                onClick={() => onSelectAsset(asset.name)}
              >
                <div>
                  <b style={{ display: "block", fontSize: 11, color: "var(--text-primary)" }}>{asset.name}</b>
                  <small style={{ color: "var(--text-muted)", fontSize: 10 }}>{asset.location}</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className={`status-indicator-dot ${asset.status}`} />
                  <small className="mono tabular" style={{ display: "block", fontSize: 10, marginTop: 2 }}>
                    {asset.health}%
                  </small>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right Digital Twin Canvas */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Spatial Telemetry Plan</h2>
              <span>Click any structure or equipment block to inspect diagnostics</span>
            </div>
          </div>
          <TwinCanvas station={station} onSelectAsset={onSelectAsset} />
        </section>
      </div>
    </div>
  );
}

/* ==========================================================================
   Page: Infrastructure (Asset Register)
   ========================================================================== */

function Infrastructure({
  assets,
  onSelectAsset,
}: {
  assets: DashboardAsset[];
  onSelectAsset: (asset: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase()) ||
      (a.subsystem && a.subsystem.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>STATION ASSET & INFRASTRUCTURE REGISTER</h1>
          <p>Comprehensive telemetry monitoring, operating hours and failure probability</p>
        </div>
        <div className="form-input-box" style={{ width: 260 }}>
          <Search size={14} />
          <input
            placeholder="Search equipment or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <section className="panel">
        <div className="asset-table-wrap">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Equipment Asset Tag</th>
                <th>Subsystem & Location</th>
                <th>Condition</th>
                <th>Health Score</th>
                <th>Live Telemetry</th>
                <th>Operating Hours</th>
                <th>Vibration RMS</th>
                <th>Failure Risk</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr key={asset.name} onClick={() => onSelectAsset(asset.name)}>
                  <td>
                    <b style={{ color: "var(--text-primary)" }}>{asset.name}</b>
                  </td>
                  <td>
                    <span>{asset.subsystem ?? "Station Aux"}</span>
                    <small style={{ display: "block", color: "var(--text-muted)" }}>{asset.location}</small>
                  </td>
                  <td>
                    <span className={`alarm-level-tag ${asset.status}`}>{asset.status}</span>
                  </td>
                  <td>
                    <div className="health-meter">
                      <div className="health-meter-bar">
                        <div className={`health-meter-fill ${asset.status}`} style={{ width: `${asset.health}%` }} />
                      </div>
                      <span className="mono tabular" style={{ fontSize: 11 }}>{asset.health}%</span>
                    </div>
                  </td>
                  <td className="mono tabular" style={{ color: "var(--text-primary)" }}>{asset.value}</td>
                  <td className="mono tabular">{asset.runtime}</td>
                  <td className="mono tabular">{asset.vibration ?? "Nominal"}</td>
                  <td>
                    <span className="mono tabular" style={{ color: asset.risk > 50 ? "#ef4444" : asset.risk > 20 ? "#f59e0b" : "#10b981", fontWeight: 600 }}>
                      {asset.risk}%
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: "3px 8px", fontSize: 10 }}>
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   Page: Energy & Microgrid Command
   ========================================================================== */

function Energy({ data, station }: { data: DashboardMetrics; station: Station }) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>MICROGRID & ENERGY OPERATIONS</h1>
          <p>Generation capacity, fuel autonomy, electrical distribution and storage buffer</p>
        </div>
      </div>

      <div className="telemetry-row">
        <div className="telemetry-card">
          <div className="card-top">
            <span>Primary Grid Output</span>
            <Zap size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">{data.power.toFixed(1)} kW</div>
          <div className="card-meta">
            <span>Bus Voltage: <b className="tabular">415 V / 50 Hz</b></span>
            <small>3-Phase AC</small>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="card-top">
            <span>Station Critical Load</span>
            <Activity size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">{data.demand.toFixed(1)} kW</div>
          <div className="card-meta">
            <span>Load Factor: <b className="tabular">{((data.demand / data.power) * 100).toFixed(0)}%</b></span>
            <small>Baseline Nominal</small>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="card-top">
            <span>Battery Bank Reserve</span>
            <BatteryCharging size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">{data.battery}%</div>
          <div className="card-meta">
            <span>Autonomy: <b className="tabular">{data.batteryHours ?? 19.2} hrs</b></span>
            <small>312 kWh LiFePO4</small>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="card-top">
            <span>Arctic Diesel Fuel Reserve</span>
            <Fuel size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">{data.fuel}%</div>
          <div className="card-meta">
            <span>Remaining: <b className="tabular">{data.fuelDaysAutonomy ?? 23.4} days</b></span>
            <small>128,400 L Total</small>
          </div>
        </div>
      </div>

      <div className="overview-secondary-grid">
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Power Generation & Demand Curve</h2>
              <span>24-Hour Telemetry Log</span>
            </div>
          </div>
          <div className="panel-body">
            <InteractiveChart station={station} metric="power" />
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Generator Load Sharing Roster</h2>
              <span>Diesel Gen Units in Utility Bay</span>
            </div>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <div className="alarm-table-wrap">
              <table className="alarm-table">
                <thead>
                  <tr>
                    <th>Unit Tag</th>
                    <th>Status</th>
                    <th>Output (kW)</th>
                    <th>Coolant Temp</th>
                    <th>RPM</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>DG-01 (Cummins 125 kVA)</b></td>
                    <td><span className="alarm-level-tag normal">LEAD ACTIVE</span></td>
                    <td className="mono tabular">74.2 kW</td>
                    <td className="mono tabular">82.5°C</td>
                    <td className="mono tabular">1500</td>
                  </tr>
                  <tr>
                    <td><b>DG-02 (Cummins 125 kVA)</b></td>
                    <td><span className="alarm-level-tag warning">LOAD SHARE</span></td>
                    <td className="mono tabular">68.3 kW</td>
                    <td className="mono tabular" style={{ color: "#f59e0b", fontWeight: 600 }}>98.4°C</td>
                    <td className="mono tabular">1502</td>
                  </tr>
                  <tr>
                    <td><b>DG-03 (Emergency Standby)</b></td>
                    <td><span className="alarm-level-tag normal">COLD STANDBY</span></td>
                    <td className="mono tabular">0.0 kW</td>
                    <td className="mono tabular">21.0°C</td>
                    <td className="mono tabular">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ==========================================================================
   Page: Antarctic Environment & Weather (Synoptic Observatory & Operational Plan)
   ========================================================================== */

function PolarCompassRose({ vector }: { vector: WindVector }) {
  const needleRotation = vector.degrees;
  // Vector flow angle (wind blows from vector.degrees towards vector.degrees + 180)
  const flowRotation = (vector.degrees + 180) % 360;

  return (
    <div className="polar-compass-svg-wrap">
      <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="compassBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
            <stop offset="85%" stopColor="#09111e" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="1" />
          </radialGradient>
          <linearGradient id="needleNorth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
          <linearGradient id="needleSouth" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Bezel */}
        <circle cx="50" cy="50" r="46" fill="url(#compassBg)" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="39" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.75" />

        {/* Graduation Ticks (every 30 deg) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30;
          const isMajor = angle % 90 === 0;
          return (
            <line
              key={angle}
              x1="50"
              y1={isMajor ? "6" : "9"}
              x2="50"
              y2="13"
              stroke={isMajor ? "#38bdf8" : "rgba(255,255,255,0.25)"}
              strokeWidth={isMajor ? "1.5" : "0.75"}
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}

        {/* Cardinal Direction Badges */}
        <text x="50" y="21" textAnchor="middle" fill="#f43f5e" fontSize="7.5" fontWeight="800" fontFamily="var(--font-mono)">N</text>
        <text x="81" y="52.5" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="700" fontFamily="var(--font-mono)">E</text>
        <text x="50" y="83" textAnchor="middle" fill="#38bdf8" fontSize="6.5" fontWeight="700" fontFamily="var(--font-mono)">S</text>
        <text x="19" y="52.5" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="700" fontFamily="var(--font-mono)">W</text>
        <text x="71" y="29" textAnchor="middle" fill="#64748b" fontSize="5" fontWeight="600" fontFamily="var(--font-mono)">NE</text>
        <text x="72" y="73" textAnchor="middle" fill="#64748b" fontSize="5" fontWeight="600" fontFamily="var(--font-mono)">SE</text>
        <text x="29" y="73" textAnchor="middle" fill="#64748b" fontSize="5" fontWeight="600" fontFamily="var(--font-mono)">SW</text>
        <text x="29" y="29" textAnchor="middle" fill="#64748b" fontSize="5" fontWeight="600" fontFamily="var(--font-mono)">NW</text>

        {/* Subtle Crosshairs */}
        <line x1="50" y1="24" x2="50" y2="76" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="1,2" />
        <line x1="24" y1="50" x2="76" y2="50" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" strokeDasharray="1,2" />

        {/* Dynamic Wind Vector Flow Arrow (showing resultant wind force) */}
        <g transform={`rotate(${flowRotation} 50 50)`} opacity="0.85">
          <line x1="50" y1="50" x2="50" y2="27" stroke="#38bdf8" strokeWidth="1.75" strokeDasharray="2,1.5" />
          <polygon points="50,23 47,28 53,28" fill="#38bdf8" filter="url(#glow)" />
        </g>

        {/* Compass Heading Needle (facing wind origin) */}
        <g transform={`rotate(${needleRotation} 50 50)`}>
          {/* North / Origin pointing half */}
          <polygon points="50,15 46.5,50 50,47" fill="url(#needleNorth)" filter="url(#glow)" />
          <polygon points="50,15 53.5,50 50,47" fill="#fb7185" />

          {/* South / Target half */}
          <polygon points="50,85 46.5,50 50,53" fill="url(#needleSouth)" />
          <polygon points="50,85 53.5,50 50,53" fill="#0284c7" />

          {/* Center Hub */}
          <circle cx="50" cy="50" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="1.8" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

function Environment({ data, station }: { data: DashboardMetrics; station: Station }) {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  useEffect(() => {
    loadWeather(station).then(setWeather).catch(() => undefined);
  }, [station]);

  const isMaitri = station === "MAITRI";

  // Wind vector calculations
  const windDegrees = data.windDirection ?? 135;
  const windSpeedKmh = data.wind ?? 42.5;
  const windVector = useMemo(() => getWindVector(windSpeedKmh, windDegrees), [windSpeedKmh, windDegrees]);

  // Optical visibility & snow accumulation
  const currVisibility = weather?.current?.visibility ?? (isMaitri ? 18.5 : 24.0);
  const currSnowAccum = weather?.current?.snow_accumulation ?? (isMaitri ? 7.8 : 4.6);
  const currSnowfall = weather?.daily?.[0]?.snowfall ?? 0.2;

  // Station Operational Weather Plan
  const operationalPlan = useMemo(
    () => getAntarcticOperationalPlan(windSpeedKmh, currVisibility, currSnowfall),
    [windSpeedKmh, currVisibility, currSnowfall]
  );

  // Katabatic check: winds > 40 km/h from East/South-East plateau
  const isKatabatic = windSpeedKmh >= 40 && windDegrees >= 90 && windDegrees <= 180;

  const dailyList = weather?.daily ?? [];
  const selectedDay = dailyList[selectedDayIndex] ?? dailyList[0];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>ANTARCTIC METEOROLOGY & SYNOPTIC OBSERVATORY</h1>
          <p>
            {isMaitri
              ? "Maitri AWS • Schirmacher Oasis (70°45′58″S, 11°44′00″E) • Continental Polar High-Res NWP"
              : "Bharati AWS • Larsemann Hills (69°24′25″S, 76°11′13″E) • Coastal Antarctic Polar High-Res NWP"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className={`status-pill ${
              operationalPlan.tier === "Condition 1"
                ? "status-pill-danger"
                : operationalPlan.tier === "Condition 2"
                ? "status-pill-warning"
                : "status-pill-normal"
            }`}
          >
            {operationalPlan.code} • {operationalPlan.tier.toUpperCase()}
          </span>
        </div>
      </div>

      {/* TOP SECTION: Synoptic Banners & Wind Vector Compass */}
      <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="weather-banner-upgrade">
          {/* Card 1: Ambient Temperature & Wind Chill */}
          <div className="weather-primary">
            <CloudSnow size={38} style={{ color: "#38bdf8", flexShrink: 0 }} />
            <div>
              <div className="weather-temp-num tabular">{data.temp.toFixed(1)}°C</div>
              <div className="weather-temp-sub">Current Station Ambient Temp</div>
              <div style={{ marginTop: 6, display: "flex", gap: 10, fontSize: 11, fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "#38bdf8" }}>Chill: {data.windChill ?? -44.1}°C</span>
                <span style={{ color: "var(--text-muted)" }}>•</span>
                <span style={{ color: "var(--text-secondary)" }}>RH: {data.humidity ?? 52}%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Polar Wind Compass & Vector Visualizer */}
          <div className="polar-compass-card">
            <PolarCompassRose vector={windVector} />
            <div className="polar-compass-details">
              <div style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.04em", fontWeight: 700 }}>
                Polar Wind Vector & Heading
              </div>
              <div className="polar-heading-badge tabular">
                {windVector.formattedDirection}
              </div>
              <div className="polar-direction-alt">
                {windVector.degrees} dec {windVector.bearingText} • Azimuth {windVector.degrees}°
              </div>
              <div className="polar-speed-badge tabular">
                <span>{windVector.speedKmh} km/h</span>
                <span style={{ color: "var(--text-muted)", fontSize: 11 }}>({windVector.speedKnots} kn / {(windVector.speedKmh / 3.6).toFixed(1)} m/s)</span>
              </div>
              <div className="polar-vector-coords tabular">
                <span className="polar-vector-chip">u (zonal): {windVector.u > 0 ? "+" : ""}{windVector.u} km/h</span>
                <span className="polar-vector-chip">v (meridional): {windVector.v > 0 ? "+" : ""}{windVector.v} km/h</span>
              </div>
              {isKatabatic && (
                <div className="polar-katabatic-badge">
                  <Wind size={11} />
                  <span>Katabatic Flow (Plateau Slope)</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Optical Visibility & Snow Accumulation */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <small style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>
                OPTICAL VISIBILITY
              </small>
              <span
                className={`visibility-pill ${
                  currVisibility >= 15 ? "good" : currVisibility >= 5 ? "warn" : "crit"
                }`}
              >
                {currVisibility >= 15 ? "CLEAR" : currVisibility >= 5 ? "CAUTION" : "WHITEOUT"}
              </span>
            </div>
            <b style={{ fontSize: 20, color: "var(--text-primary)", fontFamily: "var(--font-mono)", display: "block", marginTop: 2 }}>
              {currVisibility.toFixed(1)} km
            </b>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <small style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em" }}>
                  7-DAY SNOW ACCUM
                </small>
                <span className="snow-accum-pill">
                  <Snowflake size={10} />
                  Net Depth
                </span>
              </div>
              <b style={{ fontSize: 16, color: "#38bdf8", fontFamily: "var(--font-mono)", display: "block", marginTop: 1 }}>
                {currSnowAccum.toFixed(1)} cm
              </b>
            </div>
          </div>

          {/* Card 4: Barometric Pressure & Katabatic Front */}
          <div>
            <small style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", display: "block" }}>
              BAROMETRIC PRESSURE
            </small>
            <b style={{ fontSize: 20, color: "var(--text-primary)", fontFamily: "var(--font-mono)", display: "block", marginTop: 2 }}>
              {data.pressure?.toFixed(1) ?? "984.2"} hPa
            </b>
            <small style={{ display: "block", color: "#f59e0b", fontSize: 10, marginTop: 4, fontFamily: "var(--font-mono)" }}>
              Tendency: -4.2 hPa / 3h (Katabatic front)
            </small>
            <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>
              Model: Polar ECMWF High-Res Synoptic
            </div>
          </div>
        </div>

        {/* 7-DAY POLAR PREDICTION CARDS */}
        {dailyList.length > 0 && (
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <b style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-primary)" }}>
                  7-Day Polar Numerical Synoptic Prediction
                </b>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                  Daily High/Low, Relative Humidity, Snow Accumulation & Visibility
                </span>
              </div>
              <small style={{ color: "#38bdf8", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                Horizon: 7 Consecutive Cycles
              </small>
            </div>

            <div className="polar-7day-cards">
              {dailyList.map((day, idx) => {
                const dayDate = new Date(day.date);
                const dayName = idx === 0 ? "TODAY" : dayDate.toLocaleDateString("en-US", { weekday: "short" });
                const dayPlan = getAntarcticOperationalPlan(day.wind_speed ?? 30, day.visibility ?? 20, day.snowfall ?? 0);
                const dayBearing = formatWindDirection(day.wind_direction ?? 135);
                const isSelected = idx === selectedDayIndex;

                return (
                  <div
                    key={day.date}
                    className={`polar-forecast-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedDayIndex(idx)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div className="polar-forecast-date">{day.date.slice(5)}</div>
                        <div className="polar-forecast-dayname">{dayName}</div>
                      </div>
                      <span
                        className="operational-status-tag"
                        style={{
                          fontSize: 9,
                          padding: "2px 5px",
                          background: dayPlan.statusColor,
                          color: "#0f172a",
                        }}
                      >
                        {dayPlan.code}
                      </span>
                    </div>

                    <div className="polar-temp-range">
                      <span className="polar-temp-lo">{day.temperature_low}°C</span>
                      <span style={{ color: "var(--text-muted)" }}>/</span>
                      <span className="polar-temp-hi">{day.temperature_high}°C</span>
                    </div>

                    <div className="polar-sub-metric">
                      <span>Wind</span>
                      <span className="polar-sub-val">{day.wind_speed} km/h</span>
                    </div>

                    <div className="polar-sub-metric">
                      <span>Bearing</span>
                      <span className="polar-sub-val" style={{ color: "#38bdf8" }}>{dayBearing}</span>
                    </div>

                    <div className="polar-sub-metric">
                      <span>Humidity</span>
                      <span className="polar-sub-val">{day.humidity ?? 52}%</span>
                    </div>

                    <div className="polar-sub-metric">
                      <span>Snow (Day / Acc)</span>
                      <span className="polar-sub-val">{day.snowfall ?? 0} / {day.snow_accumulation ?? 0} cm</span>
                    </div>

                    <div className="polar-sub-metric">
                      <span>Visibility</span>
                      <span
                        className="polar-sub-val"
                        style={{
                          color: (day.visibility ?? 20) < 5 ? "#ef4444" : (day.visibility ?? 20) < 15 ? "#f59e0b" : "#10b981",
                        }}
                      >
                        {day.visibility ?? 20} km
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7-DAY SYNOPTIC MASTER TABLE */}
        {dailyList.length > 0 && (
          <div className="alarm-table-wrap">
            <table className="alarm-table">
              <thead>
                <tr>
                  <th>Date & Cycle</th>
                  <th>Polar Condition</th>
                  <th>Temp (Low / High)</th>
                  <th>Wind Vector & Direction</th>
                  <th>Rel Humidity (%)</th>
                  <th>Snowfall & Accumulation</th>
                  <th>Optical Visibility</th>
                  <th>Traverse & Mission Go/No-Go</th>
                </tr>
              </thead>
              <tbody>
                {dailyList.map((day, idx) => {
                  const dayPlan = getAntarcticOperationalPlan(day.wind_speed ?? 30, day.visibility ?? 20, day.snowfall ?? 0);
                  const vector = getWindVector(day.wind_speed ?? 30, day.wind_direction ?? 135);
                  const isToday = idx === 0;

                  return (
                    <tr
                      key={day.date}
                      style={{
                        background: idx === selectedDayIndex ? "rgba(14, 165, 233, 0.06)" : undefined,
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedDayIndex(idx)}
                    >
                      <td className="mono tabular">
                        <b>{day.date}</b> {isToday && <span style={{ color: "#38bdf8", fontSize: 10, marginLeft: 4 }}>[TODAY]</span>}
                      </td>
                      <td>
                        <span
                          className="operational-status-tag"
                          style={{
                            fontSize: 10,
                            padding: "2px 6px",
                            background: dayPlan.statusColor,
                            color: "#0f172a",
                          }}
                        >
                          {dayPlan.code} • {dayPlan.tier}
                        </span>
                      </td>
                      <td className="mono tabular">
                        <span style={{ color: "#38bdf8" }}>{day.temperature_low}°C</span> / <span style={{ color: "#f87171" }}>{day.temperature_high}°C</span>
                      </td>
                      <td className="mono tabular">
                        <b>{vector.formattedDirection}</b> @ {vector.speedKmh} km/h
                        <small style={{ color: "var(--text-muted)", display: "block", fontSize: 10 }}>
                          (u: {vector.u > 0 ? "+" : ""}{vector.u}, v: {vector.v > 0 ? "+" : ""}{vector.v} km/h)
                        </small>
                      </td>
                      <td className="mono tabular">
                        <b>{day.humidity ?? 52}% RH</b>
                        <small style={{ color: "var(--text-muted)", display: "block", fontSize: 10 }}>
                          Frost pt ~-36°C
                        </small>
                      </td>
                      <td className="mono tabular">
                        <span style={{ color: "var(--text-primary)" }}>{day.snowfall ?? 0.0} cm/24h</span>
                        <small style={{ color: "#38bdf8", display: "block", fontSize: 10, fontWeight: 700 }}>
                          Σ Net: {day.snow_accumulation ?? day.snowfall ?? 0.0} cm
                        </small>
                      </td>
                      <td className="mono tabular">
                        <span
                          className={`visibility-pill ${
                            (day.visibility ?? 20) >= 15 ? "good" : (day.visibility ?? 20) >= 5 ? "warn" : "crit"
                          }`}
                        >
                          <Eye size={10} />
                          {day.visibility ?? 20} km
                        </span>
                      </td>
                      <td>
                        {dayPlan.fieldTraverse === "PERMITTED" ? (
                          <span className="matrix-go"><Check size={12} /> GO: Field Open</span>
                        ) : dayPlan.fieldTraverse === "RESTRICTED" ? (
                          <span className="matrix-caution"><AlertTriangle size={12} /> CAUTION: Tethered</span>
                        ) : (
                          <span className="matrix-nogo"><X size={12} /> NO-GO: Lockdown</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* BOTTOM SECTION: Antarctic Station Operational Weather Plan & Mission Matrix */}
      <section className="panel operational-plan-section">
        <div className="panel-header">
          <div>
            <h3>ANTARCTIC STATION OPERATIONAL WEATHER PLAN & FIELD ACTION MATRIX</h3>
            <p>
              Mission safety protocols, field traverse authorization, and station thermal safeguard guidelines
            </p>
          </div>
          <span className="snow-accum-pill">
            <ShieldCheck size={12} />
            Polar Safety Standard Revision 4.2
          </span>
        </div>

        {/* Current Operational Directive Banner */}
        <div
          className={`operational-banner ${
            operationalPlan.tier === "Condition 1"
              ? "condition-1"
              : operationalPlan.tier === "Condition 2"
              ? "condition-2"
              : "condition-3"
          }`}
        >
          <div className="operational-title-wrap">
            <ShieldAlert size={28} style={{ color: operationalPlan.statusColor }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="operational-status-tag">{operationalPlan.code}</span>
                <b style={{ fontSize: 15, color: "var(--text-primary)" }}>{operationalPlan.label}</b>
              </div>
              <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
                {operationalPlan.summary}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>Tethering Rule</div>
              <b style={{ fontSize: 12, color: operationalPlan.statusColor }}>
                {operationalPlan.tier === "Condition 1" ? "MANDATORY LOCKDOWN" : operationalPlan.tier === "Condition 2" ? "2-PERSON BUDDY TETHER" : "NORMAL PERIMETER"}
              </b>
            </div>
          </div>
        </div>

        {/* 7-Day Mission Activity Matrix Table */}
        {dailyList.length > 0 && (
          <div className="alarm-table-wrap">
            <table className="mission-matrix-table">
              <thead>
                <tr>
                  <th>Forecast Day</th>
                  <th>Condition Tier</th>
                  <th>Traverse (Snowcat / Bully)</th>
                  <th>Priyadarshini Lake Pipeline</th>
                  <th>Aviation & Helipad Flights</th>
                  <th>Mast & Turbine Maintenance</th>
                  <th>Snow Clearance Schedule</th>
                </tr>
              </thead>
              <tbody>
                {dailyList.map((day) => {
                  const dayPlan = getAntarcticOperationalPlan(day.wind_speed ?? 30, day.visibility ?? 20, day.snowfall ?? 0);
                  const isHighWind = (day.wind_speed ?? 30) > 50;

                  return (
                    <tr key={`mission-${day.date}`}>
                      <td className="mono tabular">
                        <b>{day.date}</b>
                        <small style={{ color: "var(--text-muted)", display: "block" }}>
                          {formatWindDirection(day.wind_direction)} • {day.wind_speed} km/h
                        </small>
                      </td>
                      <td>
                        <span
                          className="operational-status-tag"
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            background: dayPlan.statusColor,
                            color: "#0f172a",
                          }}
                        >
                          {dayPlan.code}
                        </span>
                      </td>
                      <td>
                        {dayPlan.fieldTraverse === "PERMITTED" ? (
                          <span className="matrix-go"><Check size={12} /> OPEN (Full Route)</span>
                        ) : dayPlan.fieldTraverse === "RESTRICTED" ? (
                          <span className="matrix-caution"><AlertTriangle size={12} /> RESTRICTED (&lt;5km)</span>
                        ) : (
                          <span className="matrix-nogo"><X size={12} /> SUSPENDED</span>
                        )}
                      </td>
                      <td>
                        {dayPlan.waterPipeline === "ROUTINE ACCESS" ? (
                          <span className="matrix-go"><Check size={12} /> Routine Inspection</span>
                        ) : dayPlan.waterPipeline === "BUDDY TETHER REQ" ? (
                          <span className="matrix-caution"><AlertTriangle size={12} /> Tethered Transit Only</span>
                        ) : (
                          <span className="matrix-nogo"><X size={12} /> Remote SCADA Only</span>
                        )}
                      </td>
                      <td>
                        {dayPlan.aviationStatus === "FLIGHTS OPEN" ? (
                          <span className="matrix-go"><Check size={12} /> Normal VFR Flights</span>
                        ) : dayPlan.aviationStatus === "CAUTION - STANDBY" ? (
                          <span className="matrix-caution"><AlertTriangle size={12} /> Standby / Gust Alerts</span>
                        ) : (
                          <span className="matrix-nogo"><X size={12} /> Flights Grounded</span>
                        )}
                      </td>
                      <td>
                        {dayPlan.externalMaintenance === "NORMAL" ? (
                          <span className="matrix-go"><Check size={12} /> Approved</span>
                        ) : dayPlan.externalMaintenance === "RESTRICTED 1HR MAX" ? (
                          <span className="matrix-caution"><AlertTriangle size={12} /> 1-Hour Limit</span>
                        ) : (
                          <span className="matrix-nogo"><X size={12} /> Work Suspended</span>
                        )}
                      </td>
                      <td>
                        {dayPlan.snowClearing === "CRITICAL READINESS" ? (
                          <span className="matrix-nogo"><AlertTriangle size={12} /> Intake Clearing Priority</span>
                        ) : dayPlan.snowClearing === "STANDBY" ? (
                          <span className="matrix-caution"><AlertTriangle size={12} /> Snow Plow Standby</span>
                        ) : (
                          <span className="matrix-go"><Check size={12} /> Routine Grooming</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Station Engineering Safeguards Notice */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "var(--bg-sunken)", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <b style={{ fontSize: 11, textTransform: "uppercase", color: "#38bdf8", display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={13} />
              Thermal Trace Heating Duty Cycle Advisory
            </b>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
              Priyadarshini lake pump pipeline trace heaters should maintain <strong>{isKatabatic ? "100% continuous duty" : "75% cyclic duty"}</strong> with ambient temperature at {data.temp.toFixed(1)}°C and wind chill {data.windChill ?? -44.1}°C to avoid ice damming in external valves.
            </p>
          </div>

          <div style={{ background: "var(--bg-sunken)", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
            <b style={{ fontSize: 11, textTransform: "uppercase", color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
              <Snowflake size={13} />
              Snow Accumulation & Sastrugi Drift Alert
            </b>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "6px 0 0 0", lineHeight: 1.5 }}>
              Cumulative 7-day snow accumulation estimated at <strong>{currSnowAccum.toFixed(1)} cm</strong>. Main station air intake louvers and emergency diesel exhaust manifolds require snow grooming when wind velocity drops below 35 km/h.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   Page: Water System (Priyadarshini Lake Supply Chain)
   ========================================================================== */

function Water({ station, onSimulate }: { station: Station; onSimulate: () => void }) {
  const isMaitri = station === "MAITRI";

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>FRESHWATER PRODUCTION & DISTRIBUTION CHAIN</h1>
          <p>{isMaitri ? "Priyadarshini Lake Submerged Intake → 1.2km Heated Trace Pipeline → Station Buffer Storage" : "Prydz Bay Seawater Intake → Reverse Osmosis Desalination → Potable Distribution"}</p>
        </div>
        <button className="btn btn-secondary" onClick={onSimulate}>
          Simulate Pump Failure <ArrowUpRight size={13} />
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <h2>Supply Chain Progression</h2>
            <span>Telemetry telemetry loop</span>
          </div>
        </div>
        <div className="water-flow-chain">
          <div className="water-step-box">
            <span>STAGE 01</span>
            <b>Lake Submerged Intake</b>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Heated suction bellmouth at 4m depth</p>
            <strong>Temp: +2.1°C</strong>
          </div>
          <div className="water-step-box">
            <span>STAGE 02</span>
            <b>Intake Pump House P-01</b>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Submersible multi-stage centrifugal</p>
            <strong>Flow: 184 L/min</strong>
          </div>
          <div className="water-step-box">
            <span>STAGE 03</span>
            <b>1.2 km Insulated Pipeline</b>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Polyurethane jacket with self-regulating trace</p>
            <strong>Core: +4.8°C</strong>
          </div>
          <div className="water-step-box">
            <span>STAGE 04</span>
            <b>Filtration & Chlorination</b>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Dual sand filter & UV disinfection loop</p>
            <strong>Pressure: 4.8 bar</strong>
          </div>
          <div className="water-step-box">
            <span>STAGE 05</span>
            <b>Station Day Tanks T-01/02</b>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-muted)" }}>Heated insulated storage reserve</p>
            <strong>Reserve: 11.4 Days</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   Page: Logistics & Resupply Control
   ========================================================================== */

function Logistics({ station }: { station: Station }) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>POLAR EXPEDITION LOGISTICS & DEPOT READINESS</h1>
          <p>Inventory, consumable autonomy, polar resupply window and heavy fleet readiness</p>
        </div>
      </div>

      <div className="telemetry-row">
        <div className="telemetry-card">
          <div className="card-top">
            <span>Fuel Storage (ATF/Diesel)</span>
            <Fuel size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">128,400 L</div>
          <div className="card-meta">
            <span>Autonomy: <b className="tabular">23.4 Days</b></span>
            <small>68% Capacity</small>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="card-top">
            <span>Crew Rations & Nutrition</span>
            <Package size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">142 Days</div>
          <div className="card-meta">
            <span>Winter Crew: <b className="tabular">25 Personnel</b></span>
            <small>Full Reserve</small>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="card-top">
            <span>Critical Spares Stock</span>
            <Wrench size={14} className="card-icon" />
          </div>
          <div className="card-value tabular" style={{ color: "#f59e0b" }}>42%</div>
          <div className="card-meta">
            <span>Warning: <b className="tabular">Generator filters low</b></span>
            <small>Req Resupply</small>
          </div>
        </div>

        <div className="telemetry-card">
          <div className="card-top">
            <span>Heavy Polar Fleet</span>
            <Truck size={14} className="card-icon" />
          </div>
          <div className="card-value tabular">4 / 5 Active</div>
          <div className="card-meta">
            <span>PistenBully 300: <b className="tabular">Operational</b></span>
            <small>1 in overhaul</small>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Page: Research Equipment
   ========================================================================== */

function Equipment({ station }: { station: Station }) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>SCIENTIFIC PAYLOADS & SENSOR TELEMETRY</h1>
          <p>Atmospheric radar, seismology, space weather and geomagnetic observatories</p>
        </div>
      </div>

      <section className="panel">
        <div className="alarm-table-wrap">
          <table className="alarm-table">
            <thead>
              <tr>
                <th>Instrument Payload</th>
                <th>Observatory</th>
                <th>Condition</th>
                <th>Telemetry Spec</th>
                <th>Data Quality</th>
                <th>Power Draw</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>MARA Atmospheric Radar</b></td>
                <td>MARA Science Annex</td>
                <td><span className="alarm-level-tag normal">ACTIVE TRANSMIT</span></td>
                <td className="mono tabular">53.5 MHz VHF · 7.4 kW RF</td>
                <td className="mono tabular">98.4%</td>
                <td className="mono tabular">8.2 kW</td>
              </tr>
              <tr>
                <td><b>Campbell AWS Met Mast</b></td>
                <td>Gargi Hut</td>
                <td><span className="alarm-level-tag normal">OBSERVING</span></td>
                <td className="mono tabular">CR1000X Data Logger</td>
                <td className="mono tabular">99.1%</td>
                <td className="mono tabular">0.8 kW</td>
              </tr>
              <tr>
                <td><b>Broadband Bedrock Seismometer</b></td>
                <td>Priya Hut</td>
                <td><span className="alarm-level-tag normal">RECORDING</span></td>
                <td className="mono tabular">Triaxial 24-bit Borehole</td>
                <td className="mono tabular">95.0%</td>
                <td className="mono tabular">0.6 kW</td>
              </tr>
              <tr>
                <td><b>3-Axis Fluxgate Magnetometer</b></td>
                <td>Nandi Hut</td>
                <td><span className="alarm-level-tag normal">VARIATION SYNC</span></td>
                <td className="mono tabular">42,185 nT Vector</td>
                <td className="mono tabular">97.2%</td>
                <td className="mono tabular">1.1 kW</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   Page: Maintenance Center
   ========================================================================== */

function Maintenance({ onSelectAsset }: { onSelectAsset: (asset: string) => void }) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>PREDICTIVE MAINTENANCE & REMAINING USEFUL LIFE</h1>
          <p>Prioritized equipment servicing based on sensor anomaly detection and vibration spectra</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <h2>Priority Maintenance Queue</h2>
            <span>Ranked by simulated failure risk and operational criticality</span>
          </div>
        </div>
        <div className="panel-body" style={{ padding: 0 }}>
          <div className="alarm-table-wrap">
            <table className="alarm-table">
              <thead>
                <tr>
                  <th>Equipment Asset</th>
                  <th>Degradation Mechanism</th>
                  <th>Failure Risk</th>
                  <th>Remaining Useful Life</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Generator DG-02 (Cummins 125 kVA)</b></td>
                  <td>Secondary coolant heat exchanger fouling & fan vibration</td>
                  <td><span className="mono tabular" style={{ color: "#ef4444", fontWeight: 700 }}>74%</span></td>
                  <td className="mono tabular" style={{ color: "#ef4444", fontWeight: 600 }}>~7 Operating Hours</td>
                  <td>
                    <button className="btn btn-primary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => onSelectAsset("Generator DG-02 (Cummins 125 kVA)")}>
                      Open Work Order
                    </button>
                  </td>
                </tr>
                <tr>
                  <td><b>HVAC Habitation AHU-01</b></td>
                  <td>Motor bearing pre-load wear detected in acoustic profile</td>
                  <td><span className="mono tabular" style={{ color: "#f59e0b", fontWeight: 700 }}>39%</span></td>
                  <td className="mono tabular">11 Days</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => onSelectAsset("HVAC Habitation Loop AHU-01")}>
                      Inspect Log
                    </button>
                  </td>
                </tr>
                <tr>
                  <td><b>Priyadarshini Lake Pump P-01</b></td>
                  <td>Impeller mechanical seal erosion baseline shift</td>
                  <td><span className="mono tabular" style={{ color: "#10b981", fontWeight: 700 }}>9%</span></td>
                  <td className="mono tabular">65 Days</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }} onClick={() => onSelectAsset("Priyadarshini Lake Pump P-01")}>
                      Inspect Log
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   Page: Simulation & What-If Engine
   ========================================================================== */

function Simulation({ active, onRun }: { active: string | null; onRun: (scenario: string) => void }) {
  const [selected, setSelected] = useState(active ?? "EXTREME KATABATIC BLIZZARD");

  const scenarios = [
    "EXTREME KATABATIC BLIZZARD",
    "GENERATOR DG-02 EXCHANGER FAILURE",
    "LAKE PUMP LINE FREEZE HAZARD",
    "SATELLITE UPLINK COMPLETE BLACKOUT",
    "AUSTRAL WINTER FUEL SHORTAGE",
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>WHAT-IF OPERATIONAL SIMULATION ENGINE</h1>
          <p>Model systemic cascading failure modes across microgrid, thermal envelope and logistics</p>
        </div>
      </div>

      <div className="simulation-grid">
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Simulation Scenarios</h2>
            </div>
          </div>
          <div className="panel-body">
            <div className="scenario-list">
              {scenarios.map((sc) => (
                <button
                  key={sc}
                  className={`scenario-item-btn ${selected === sc ? "active" : ""}`}
                  onClick={() => {
                    setSelected(sc);
                    onRun(sc);
                  }}
                >
                  <span>{sc}</span>
                  {selected === sc && <Check size={14} />}
                </button>
              ))}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => onRun(selected)}
            >
              <Sparkles size={14} /> Execute Cascading Model
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Projected System Cascade: {selected}</h2>
              <span className="alarm-level-tag critical">HIGH OPERATIONAL IMPACT</span>
            </div>
          </div>
          <div className="panel-body">
            <div className="telemetry-row" style={{ marginBottom: 16 }}>
              <div className="telemetry-card">
                <div className="card-top"><span>Affected Systems</span></div>
                <div className="card-value tabular">05 Nodes</div>
              </div>
              <div className="telemetry-card">
                <div className="card-top"><span>Time to Critical</span></div>
                <div className="card-value tabular" style={{ color: "#ef4444" }}>18.4 Hours</div>
              </div>
              <div className="telemetry-card">
                <div className="card-top"><span>Projected Fuel Impact</span></div>
                <div className="card-value tabular" style={{ color: "#f59e0b" }}>+28% Burn</div>
              </div>
              <div className="telemetry-card">
                <div className="card-top"><span>Grid Stability</span></div>
                <div className="card-value tabular" style={{ color: "#f59e0b" }}>Degraded</div>
              </div>
            </div>

            <div style={{ background: "var(--bg-sunken)", padding: 14, borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
              <b style={{ display: "block", fontSize: 13, color: "var(--text-primary)", marginBottom: 8 }}>
                Standard Operating Procedure (SOP) Action Runbook:
              </b>
              <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <li>Initiate automated load shedding for non-essential science payloads (MARA Radar stand-down).</li>
                <li>Verify DG-03 cold standby fuel pre-heaters and cycle automated starter battery test.</li>
                <li>Increase Priyadarshini water pipeline trace heating circuit to maximum (+8°C) to prevent catastrophic line freeze.</li>
                <li>Queue satellite synchronization telemetry in local edge SQLite ring buffer until storm pass clears.</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ==========================================================================
   Page: Alerts
   ========================================================================== */

function Alerts({
  alerts,
  onSelectAsset,
  onSimulate,
}: {
  alerts: DashboardAlert[];
  onSelectAsset: (asset: string) => void;
  onSimulate: (scenario: string) => void;
}) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>ALARM & ANOMALY INCIDENT CONSOLE</h1>
          <p>Real-time alarm management compliant with ISA-18.2 mission control standards</p>
        </div>
      </div>

      <section className="panel">
        <div className="alarm-table-wrap">
          <table className="alarm-table">
            <thead>
              <tr>
                <th>Alarm Code</th>
                <th>Priority</th>
                <th>Equipment Asset</th>
                <th>Diagnostic Alarm Description</th>
                <th>Source Subsystem</th>
                <th>Age</th>
                <th>Resolution Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((al) => (
                <tr key={al.title}>
                  <td className="mono tabular"><b>{al.id ?? "ALT-01"}</b></td>
                  <td><span className={`alarm-level-tag ${al.level}`}>{al.level}</span></td>
                  <td><b>{al.asset}</b></td>
                  <td>{al.detail}</td>
                  <td><small style={{ color: "var(--text-muted)" }}>{al.source ?? "SCADA Loop"}</small></td>
                  <td className="mono tabular">{al.time}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-secondary" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => onSelectAsset(al.asset)}>
                        Inspect
                      </button>
                      <button className="btn btn-secondary" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => onSimulate("GENERATOR DG-02 EXCHANGER FAILURE")}>
                        Simulate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   Page: Satellite Communication & Network
   ========================================================================== */

function Communication({ station }: { station: Station }) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>SATELLITE TELEMETRY & NETWORK UPLINK</h1>
          <p>INSAT-3DR Geostationary transponder and edge-to-mainland synchronization link</p>
        </div>
      </div>

      <div className="telemetry-row">
        <div className="telemetry-card">
          <div className="card-top"><span>Link Health</span><Radio size={14} className="card-icon" /></div>
          <div className="card-value tabular" style={{ color: "#34d399" }}>NOMINAL</div>
          <div className="card-meta"><span>Carrier: <b>INSAT-3DR Ku-Band</b></span><small>Lock: 99.8%</small></div>
        </div>
        <div className="telemetry-card">
          <div className="card-top"><span>Round-Trip Latency</span><Activity size={14} className="card-icon" /></div>
          <div className="card-value tabular">112 ms</div>
          <div className="card-meta"><span>Jitter: <b>3.4 ms</b></span><small>Standard Polar Sync</small></div>
        </div>
        <div className="telemetry-card">
          <div className="card-top"><span>Packet Drop Rate</span><Network size={14} className="card-icon" /></div>
          <div className="card-value tabular">0.02%</div>
          <div className="card-meta"><span>Margin: <b>+14.8 dB</b></span><small>Clear Sky</small></div>
        </div>
        <div className="telemetry-card">
          <div className="card-top"><span>Edge Sync Queue</span><DatabaseIcon size={14} className="card-icon" /></div>
          <div className="card-value tabular">0 Pending</div>
          <div className="card-meta"><span>Reconciled: <b>84,210 batches</b></span><small>PostgreSQL Synced</small></div>
        </div>
      </div>
    </div>
  );
}

function DatabaseIcon(props: any) {
  return <Radio {...props} />;
}

/* ==========================================================================
   Page: Polar Copilot / AI Assistant
   ========================================================================== */

function Assistant({ station }: { station: Station }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "copilot"; text: string; time: string }>>([
    {
      sender: "copilot",
      text: `Polar Mission Control Assistant active for ${station} Station. I have direct access to digital-twin telemetry streams, generator vibration data, meteorological trends, and lake hydraulic parameters. How can I assist with station operations?`,
      time: "14:32 UTC",
    },
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    const newMsg = { sender: "user" as const, text: userMsg, time: "Just now" };
    setMessages((prev) => [...prev, newMsg]);

    setTimeout(() => {
      let reply = `Telemetry inspection for ${station}: Generator DG-01 and DG-02 are currently delivering 142.5 kW against a demand of 118.2 kW. DG-02 secondary exchanger delta is elevated at 16.4°C, presenting a 74% simulated failure risk. Fuel reserve stands at 68% (128,400 L) providing 23.4 days of autonomy. Priyadarshini water pipeline trace heating is active at +4.8°C with 184 L/min flow.`;
      if (userMsg.toLowerCase().includes("weather") || userMsg.toLowerCase().includes("wind")) {
        reply = `Current meteorological observations at ${station} (Campbell AWS): Ambient temperature is -28.4°C with ENE winds at 42.5 km/h. Wind chill is calculated at -44.1°C. A barometric drop of 4.2 hPa / 3h indicates an incoming katabatic wind event over the polar plateau.`;
      } else if (userMsg.toLowerCase().includes("generator") || userMsg.toLowerCase().includes("dg")) {
        reply = `Generator DG-02 requires cooling loop inspection. Recommended action: Cycle DG-03 starter test, shed auxiliary science loads if temperatures exceed 100°C, and flush heat exchanger plates during the next scheduled maintenance window.`;
      }
      setMessages((prev) => [...prev, { sender: "copilot", text: reply, time: "Just now" }]);
    }, 600);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-titles">
          <h1>POLAR DIGITAL TWIN COPILOT</h1>
          <p>Mission control operational intelligence grounded in real-time sensor streams and engineering models</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <section className="panel" style={{ display: "flex", flexDirection: "column", height: 520 }}>
          <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  background: m.sender === "user" ? "var(--bg-subtle)" : "var(--bg-sunken)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 14px",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontFamily: "var(--font-mono)" }}>
                  {m.sender === "user" ? "MISSION CONTROLLER" : "POLAR COPILOT"} · {m.time}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6 }}>{m.text}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 12, borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 8 }}>
            <input
              style={{
                flex: 1,
                background: "var(--bg-sunken)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                color: "var(--text-primary)",
                fontSize: 12,
                outline: 0,
              }}
              placeholder={`Ask regarding ${station} grid stability, fuel burn, or blizzard forecast...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="btn btn-primary" onClick={handleSend}>
              Send
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <h2>Quick Inquiries</h2>
            </div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              "What is the current station status?",
              "Assess DG-02 cooling failure risk",
              "Review Priyadarshini water pipeline trace",
              "Katabatic blizzard impact on fuel autonomy",
            ].map((q) => (
              <button
                key={q}
                className="scenario-item-btn"
                style={{ fontSize: 11 }}
                onClick={() => {
                  setInput(q);
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ==========================================================================
   Asset Drawer: Slide-over Engineering Inspector
   ========================================================================== */

function AssetDrawer({
  asset,
  close,
  onSimulate,
}: {
  asset: string;
  close: () => void;
  onSimulate: () => void;
}) {
  const isGen = asset.toLowerCase().includes("generator") || asset.toLowerCase().includes("dg");

  return (
    <div className="drawer-overlay" onClick={close}>
      <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <div className="drawer-sub">EQUIPMENT TELEMETRY INSPECTOR</div>
            <h2>{asset}</h2>
          </div>
          <button className="icon-btn" onClick={close} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-spec-grid">
            <div className="drawer-spec-card">
              <small>Operational Condition</small>
              <strong style={{ color: isGen ? "#f59e0b" : "#10b981" }}>
                {isGen ? "WARNING (DEGRADED)" : "NOMINAL"}
              </strong>
            </div>
            <div className="drawer-spec-card">
              <small>Simulated Failure Risk</small>
              <strong style={{ color: isGen ? "#ef4444" : "#10b981" }}>
                {isGen ? "74%" : "6%"}
              </strong>
            </div>
            <div className="drawer-spec-card">
              <small>Operating Temperature</small>
              <strong>{isGen ? "98.4°C" : "18.5°C"}</strong>
            </div>
            <div className="drawer-spec-card">
              <small>Vibration Level</small>
              <strong>{isGen ? "3.8 mm/s RMS" : "1.2 mm/s RMS"}</strong>
            </div>
          </div>

          <div style={{ background: "var(--bg-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: 12 }}>
            <b style={{ display: "block", fontSize: 12, color: "var(--text-primary)", marginBottom: 4 }}>
              Diagnostic Predictive Insight:
            </b>
            <p style={{ margin: 0, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {isGen
                ? "Thermal delta across secondary cooling jacket is 16.4°C exceeding the 14.0°C engineering threshold. Predictive failure model projects potential thermal shutdown within 7 operating hours under full station load."
                : "Sensor telemetry indicates stable baseline operation. Fluid flow, pressure differentials and electrical load are within nominal manufacturer specifications."}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onSimulate}>
              Simulate Failure
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={close}>
              Acknowledge Condition
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
