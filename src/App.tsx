import { useMemo, useState } from "react";
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
  CloudSnow,
  Compass,
  Droplets,
  ExternalLink,
  Fuel,
  Gauge,
  Globe2,
  Hexagon,
  LayoutDashboard,
  LifeBuoy,
  Map,
  Menu,
  MessageSquare,
  Network,
  Package,
  Radio,
  Search,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Thermometer,
  Truck,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PageKey =
  | "overview"
  | "digital-twin"
  | "infrastructure"
  | "energy"
  | "environment"
  | "water"
  | "logistics"
  | "equipment"
  | "maintenance"
  | "simulation"
  | "alerts"
  | "communication"
  | "ai-assistant";
type Station = "MAITRI" | "BHARATI";
type Severity = "normal" | "warning" | "critical" | "offline" | "maintenance";
type NavItem = readonly [PageKey, string, LucideIcon];

const navGroups: { label: string; items: readonly NavItem[] }[] = [
  {
    label: "COMMAND",
    items: [
      ["overview", "Overview", LayoutDashboard],
      ["digital-twin", "Digital Twin", Hexagon],
    ],
  },
  {
    label: "SYSTEMS",
    items: [
      ["infrastructure", "Infrastructure", Box],
      ["energy", "Energy", Zap],
      ["environment", "Environment", CloudSnow],
      ["water", "Water System", Droplets],
      ["logistics", "Logistics", Package],
      ["equipment", "Equipment", Gauge],
    ],
  },
  {
    label: "OPERATIONS",
    items: [
      ["maintenance", "Maintenance", Wrench],
      ["simulation", "Simulation", SlidersHorizontal],
      ["alerts", "Alerts", ShieldAlert],
      ["communication", "Communication", Radio],
      ["ai-assistant", "AI Assistant", Bot],
    ],
  },
] as const;

const stationData: Record<Station, { health: number; fuel: number; battery: number; temp: number; wind: number }> = {
  MAITRI: { health: 89, fuel: 68, battery: 71, temp: -27.4, wind: 44 },
  BHARATI: { health: 94, fuel: 76, battery: 84, temp: -24.1, wind: 31 },
};

const assetData = [
  { name: "Generator G-01", location: "Utility Block", status: "normal" as Severity, health: 91, value: "72°C", runtime: "4,281 hrs", risk: 8 },
  { name: "Generator G-02", location: "Utility Block", status: "warning" as Severity, health: 68, value: "92°C", runtime: "4,892 hrs", risk: 74 },
  { name: "HVAC-W-01", location: "West Wing", status: "warning" as Severity, health: 76, value: "—", runtime: "2,901 hrs", risk: 39 },
  { name: "Water Pump P-01", location: "Pump House", status: "normal" as Severity, health: 93, value: "4.8 bar", runtime: "1,827 hrs", risk: 7 },
];

const alertData = [
  { level: "critical" as Severity, title: "Generator G-02 overheating", detail: "Cooling-system degradation detected", time: "2 min ago", asset: "G-02" },
  { level: "critical" as Severity, title: "Cooling system degradation confirmed", detail: "Thermal load above safe operating limit", time: "4 min ago", asset: "G-02" },
  { level: "warning" as Severity, title: "Spare parts inventory below threshold", detail: "42% stock · 19 days remaining", time: "14 min ago", asset: "KUBER-C5" },
  { level: "warning" as Severity, title: "Extreme wind expected", detail: "Forecast peak 75 km/h in 6 hours", time: "26 min ago", asset: "WEATHER" },
  { level: "warning" as Severity, title: "HVAC-W-01 efficiency degraded to 76%", detail: "West wing cooling performance reduced", time: "41 min ago", asset: "HVAC-W-01" },
  { level: "normal" as Severity, title: "Battery charging completed", detail: "Reserve stable at 71%", time: "31 min ago", asset: "BATTERY-01" },
];

const statusLabels: Record<Severity, string> = {
  normal: "NORMAL",
  warning: "WARNING",
  critical: "CRITICAL",
  offline: "OFFLINE",
  maintenance: "MAINTENANCE",
};

function App() {
  const [page, setPage] = useState<PageKey>("overview");
  const [station, setStation] = useState<Station>("MAITRI");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const data = stationData[station];

  const goTo = (next: PageKey) => {
    setPage(next);
    setSidebarOpen(false);
    window.history.replaceState(null, "", `#/${next}`);
  };

  const pageTitle = page === "overview" ? "Digital Operations Center" : navGroups.flatMap((g) => g.items).find((item) => item[0] === page)?.[1] ?? "Mission Control";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Snowflake size={19} /></div>
          <div className="brand-copy"><strong>POLAR TWIN</strong><span>REMOTE OPERATIONS PLATFORM</span></div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}><X size={17} /></button>
        </div>
        <div className="sidebar-scroll">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map(([key, label, Icon]) => (
                <button className={`nav-item ${page === key ? "active" : ""}`} key={key} onClick={() => goTo(key)}>
                  <Icon size={16} strokeWidth={1.8} /><span>{label}</span>{key === "alerts" && <b className="nav-count">2</b>}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <div className="station-mini">
            <div className="nav-label">ACTIVE STATION</div>
            <button onClick={() => setStation(station === "MAITRI" ? "BHARATI" : "MAITRI")}><span className="status-dot green" />{station}<ChevronDown size={14} /></button>
          </div>
          <div className="system-online"><span className="pulse green" /><div><b>SYSTEM ONLINE</b><small>All systems nominal</small></div></div>
        </div>
      </aside>

      <main className="main">
        <div className="tricolour-rule"><i /><i /><i /></div>
        <header className="topbar">
          <div className="mobile-top"><button className="icon-button" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button><span className="mobile-title">POLAR TWIN</span></div>
          <div className="station-selector"><span className="status-dot blue" />{station} STATION<ChevronDown size={13} /></div>
          <div className="topbar-right">
            <div className="top-stat"><span className="status-dot green" />LIVE</div>
            <div className="top-stat sync"><span>SYNC</span><b>14:32:18 <em>UTC</em></b></div>
            <div className="top-stat temp"><Thermometer size={15} /><b>{data.temp}°C</b></div>
            <button className="icon-button"><Search size={17} /></button>
            <button className="icon-button alert-button" onClick={() => goTo("alerts")}><Bell size={17} /><span>2</span></button>
            <div className="operator"><span className="operator-avatar">MC</span><div><b>Mission Control</b><small>Operator</small></div><ChevronDown size={14} /></div>
          </div>
        </header>

        <div className="content">
          {page === "overview" && <Overview data={data} station={station} onSelectAsset={setSelectedAsset} onSimulate={setSimulation} goTo={goTo} />}
          {page === "digital-twin" && <TwinPage station={station} onSelectAsset={setSelectedAsset} />}
          {page === "infrastructure" && <Infrastructure onSelectAsset={setSelectedAsset} />}
          {page === "energy" && <Energy data={data} />}
          {page === "environment" && <Environment data={data} />}
          {page === "water" && <Water onSimulate={() => setSimulation("WATER PUMP FAILURE")} />}
          {page === "logistics" && <Logistics />}
          {page === "equipment" && <Equipment />}
          {page === "maintenance" && <Maintenance onSelectAsset={setSelectedAsset} />}
          {page === "simulation" && <Simulation active={simulation} onRun={setSimulation} />}
          {page === "alerts" && <Alerts onSelectAsset={setSelectedAsset} onSimulate={setSimulation} />}
          {page === "communication" && <Communication />}
          {page === "ai-assistant" && <Assistant station={station} />}
        </div>
      </main>

      {selectedAsset && <AssetDrawer asset={selectedAsset} close={() => setSelectedAsset(null)} onSimulate={() => { setSelectedAsset(null); setSimulation("GENERATOR FAILURE"); goTo("simulation"); }} />}
      {simulation && page !== "simulation" && <SimulationToast scenario={simulation} onOpen={() => goTo("simulation")} onClose={() => setSimulation(null)} />}
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function DataLabel() { return <span className="data-label"><span className="status-dot blue" />SIMULATED DIGITAL TWIN DATA</span>; }

function Overview({ data, station, onSelectAsset, onSimulate, goTo }: { data: typeof stationData.MAITRI; station: Station; onSelectAsset: (asset: string) => void; onSimulate: (scenario: string) => void; goTo: (page: PageKey) => void }) {
  return <div className="page">
    <PageHeader eyebrow="70°46′S 11°44′E  ·  SCHIRMACHER OASIS, ANTARCTICA" title={`${station} STATION`} description="Real-time digital representation of station infrastructure, energy, logistics and environmental conditions." action={<DataLabel />} />
    <div className="metric-grid">
      <Metric icon={Thermometer} label="TEMPERATURE" value={`${data.temp}°C`} note="−2.1° from avg" tone="cyan" />
      <Metric icon={Compass} label="WIND SPEED" value={`${data.wind} km/h`} note="NE · steady" tone="blue" />
      <Metric icon={Zap} label="POWER GENERATION" value="184 kW" note="+8.2% vs demand" tone="yellow" />
      <Metric icon={Activity} label="POWER CONSUMPTION" value="143 kW" note="Within baseline" tone="green" />
      <Metric icon={BatteryCharging} label="BATTERY RESERVE" value={`${data.battery}%`} note="~18.4 hours runtime" tone="blue" />
      <Metric icon={Fuel} label="DIESEL RESERVE" value={`${data.fuel}%`} note="23 days estimated" tone="yellow" />
      <Metric icon={Droplets} label="WATER RESERVE" value="82%" note="Flow normal" tone="green" />
      <Metric icon={CircleGauge} label="SYSTEM HEALTH" value={`${data.health}%`} note="2 systems at risk" tone="cyan" />
    </div>
    <div className="overview-grid">
      <section className="panel twin-panel">
        <PanelTitle title={`${station} Digital Twin`} subtitle="Interactive operational model" action={<div className="segmented"><button className="selected">3D</button><button onClick={() => goTo("digital-twin")}>2D MAP</button><button>LAYERS</button></div>} />
        <TwinCanvas onSelectAsset={onSelectAsset} />
        <div className="twin-layers"><span>LAYERS:</span><button className="selected">Infrastructure</button><button>Energy</button><button>Water</button><button>Research</button><button>Alerts</button></div>
        <div className="twin-footer"><div className="legend"><span><i className="legend-dot green" />Normal</span><span><i className="legend-dot amber" />Warning</span><span><i className="legend-dot red" />Critical</span><span><i className="legend-dot gray" />Offline</span></div><button className="text-button" onClick={() => goTo("digital-twin")}>FULL VIEW <ExternalLink size={13} /></button></div>
      </section>
      <section className="panel alerts-panel">
        <PanelTitle title="Active Alerts" subtitle="Requires operator attention" action={<button className="text-button" onClick={() => goTo("alerts")}>ALL <ArrowUpRight size={13} /></button>} />
        <div className="alert-list">{alertData.map((alert) => <AlertRow key={alert.title} alert={alert} onClick={() => onSelectAsset(alert.asset === "G-02" ? "Generator G-02" : alert.asset)} />)}</div>
      </section>
    </div>
    <div className="overview-bottom">
      <section className="panel health-panel">
        <PanelTitle title="Station Health" subtitle="Weighted operational score" action={<span className="panel-time">NOW</span>} />
        <div className="health-ring"><div><strong>{data.health}</strong><span>/100</span><small>OVERALL HEALTH</small></div></div>
        <div className="health-list"><HealthRow label="Infrastructure" value={94} /><HealthRow label="Energy" value={87} /><HealthRow label="Environment" value={82} /><HealthRow label="Logistics" value={91} /><HealthRow label="Communication" value={98} /></div>
        <div className="risk-note"><AlertTriangle size={16} /><div><b>Primary risk detected</b><span>Generator G-02 cooling system</span></div><button onClick={() => onSelectAsset("Generator G-02")}><ArrowUpRight size={15} /></button></div>
      </section>
      <section className="panel chain-panel"><PanelTitle title="Operational Risk Chain" subtitle="Live dependency analysis" action={<span className="live-badge"><span className="pulse green" />LIVE</span>} /><div className="chain">{["EXTREME WIND", "HVAC LOAD", "ENERGY DEMAND", "GENERATOR LOAD", "FUEL RESERVE"].map((item, i) => <div className="chain-node" key={item}><div className={`chain-icon ${i > 1 ? "amber" : ""}`}>{i === 0 ? <CloudSnow size={15} /> : i === 4 ? <Fuel size={15} /> : <Zap size={15} />}</div><span>{item}</span><b>{i === 0 ? "+18%" : i === 4 ? "68%" : "NORMAL"}</b>{i < 4 && <ArrowDownRight className="chain-arrow" size={15} />}</div>)}</div><button className="ghost-action" onClick={() => onSimulate("EXTREME STORM")}>RUN WHAT-IF SIMULATION <ArrowUpRight size={14} /></button></section>
    </div>
  </div>;
}

function Metric({ icon: Icon, label, value, note, tone }: { icon: LucideIcon; label: string; value: string; note: string; tone: string }) {
  return <div className={`metric-card ${tone}`}><div className={`metric-icon ${tone}`}><Icon size={16} /></div><div className="metric-label">{label}</div><strong>{value}</strong><small>{note}</small></div>;
}

function PanelTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) { return <div className="panel-title"><div><h2>{title}</h2>{subtitle && <span>{subtitle}</span>}</div>{action}</div>; }
function HealthRow({ label, value }: { label: string; value: number }) { return <div className="health-row"><span>{label}</span><div className="progress"><i style={{ width: `${value}%` }} /></div><b>{value}%</b></div>; }

function TwinCanvas({ onSelectAsset }: { onSelectAsset: (asset: string) => void }) {
  const objects = [{ id: "main", x: 39, y: 43, w: 27, h: 23, label: "MAIN COMPLEX", status: "green" }, { id: "generator", x: 70, y: 35, w: 11, h: 13, label: "UTILITY BLOCK", status: "amber" }, { id: "workshop", x: 24, y: 67, w: 18, h: 10, label: "WORKSHOP", status: "green" }, { id: "depot", x: 62, y: 71, w: 16, h: 9, label: "KUBER DEPOT", status: "green" }];
  return <div className="twin-canvas"><div className="canvas-grid" /><div className="compass-mark"><span>N</span><Compass size={22} /></div><div className="canvas-tag tag-top">MAITRI / SECTOR 04</div><div className="water-shape"><span>PRIYADARSHINI LAKE</span></div>{objects.map((object) => <button key={object.id} className={`twin-object ${object.status}`} style={{ left: `${object.x}%`, top: `${object.y}%`, width: `${object.w}%`, height: `${object.h}%` }} onClick={() => onSelectAsset(object.id === "generator" ? "Generator G-02" : object.label)}><span className="object-pulse" /><b>{object.label}</b></button>)}<div className="pipeline" /><div className="facility facility-one" onClick={() => onSelectAsset("MARA Radar")}><span className="status-dot green" />MARA LAB</div><div className="facility facility-two" onClick={() => onSelectAsset("Water Pump P-01")}><span className="status-dot green" />PUMP HOUSE</div><div className="canvas-scale">100 m</div></div>;
}

function TwinPage({ station, onSelectAsset }: { station: Station; onSelectAsset: (asset: string) => void }) {
  const assets = [
    ["Generator G-01", "Utility Block", "91%", "normal"],
    ["Generator G-02", "Utility Block", "68%", "warning"],
    ["HVAC West Wing", "West Wing", "76%", "warning"],
    ["Water Pump P-01", "Pump House", "93%", "normal"],
    ["MARA Atmospheric Radar", "MARA Lab", "94%", "normal"],
    ["Satellite Radome", "Comms Tower", "98%", "normal"],
    ["HVAC East Wing", "East Wing", "88%", "warning"],
    ["Gargi AWS Station", "Gargi Hut", "97%", "normal"],
    ["GNSS / Seismometer", "Priya Hut", "89%", "normal"],
  ] as const;
  return <div className="page twin-view-page">
    <div className="twin-view-heading"><div><div className="eyebrow">{station} STATION / DIGITAL TWIN</div><h1>{station} Digital Twin Viewer</h1><p>Interactive 2D map · Click any marker to inspect operational status</p></div><DataLabel /></div>
    <div className="twin-toolbar"><div className="twin-search"><Search size={14} /><span>Search assets...</span></div><div className="segmented"><button>3D</button><button className="selected">2D MAP</button><button>SATELLITE</button></div><div className="toolbar-icon"><Map size={14} /></div><div className="toolbar-icon"><Compass size={14} /></div><div className="toolbar-icon"><ExternalLink size={14} /></div><div className="twin-legend"><span><i className="legend-dot green" />Normal</span><span><i className="legend-dot amber" />Warning</span><span><i className="legend-dot red" />Critical</span><span><i className="legend-dot gray" />Offline</span><span><i className="legend-dot blue-dot" />Maintenance</span></div></div>
    <div className="twin-workspace">
      <aside className="asset-navigator"><div className="navigator-tabs"><button className="selected">ALL</button><button>POWER</button><button>CLIMATE</button><button>WATER</button></div><div className="asset-count">{assets.length} operational assets</div>{assets.map(([name, location, health, status]) => <button className="asset-row" key={name} onClick={() => onSelectAsset(name)}><span className={`asset-status ${status}`} /><span className="asset-row-copy"><b>{name}</b><small>{location}</small></span><strong className={status === "warning" ? "warning-text" : ""}>{health}</strong></button>)}</aside>
      <section className="map-stage"><TwinCanvas onSelectAsset={onSelectAsset} /><div className="map-label">MAITRI STATION<div>70°45′S 11°44′E · QUEEN MAUD LAND</div></div><button className="map-marker marker-radar" onClick={() => onSelectAsset("MARA Atmospheric Radar")}><i className="legend-dot green" />MARA</button><button className="map-marker marker-gargi" onClick={() => onSelectAsset("Gargi AWS Station")}><i className="legend-dot green" />GARGI HUT</button><button className="map-marker marker-priya" onClick={() => onSelectAsset("GNSS / Seismometer")}><i className="legend-dot green" />PRIYA HUT</button><button className="map-marker marker-nandi" onClick={() => onSelectAsset("Nandi Geomagnetic Station")}><i className="legend-dot green" />NANDI HUT</button><button className="map-marker marker-comet" onClick={() => onSelectAsset("Comet Lab")}><i className="legend-dot amber" />COMET</button><div className="map-layers"><b><Box size={13} /> LAYERS</b><span><i className="layer infrastructure" />Infrastructure</span><span><i className="layer energy" />Energy</span><span><i className="layer water" />Water</span><span><i className="layer logistics" />Logistics</span><span><i className="layer research" />Research</span><span><i className="layer vehicles" />Vehicles</span></div><div className="map-status"><span>STATUS</span><b><i className="legend-dot green" />Healthy</b><b><i className="legend-dot amber" />Warning</b><b><i className="legend-dot red" />Critical</b><b><i className="legend-dot gray" />Offline</b><b><i className="legend-dot blue-dot" />Maintenance</b></div></section>
      <aside className="asset-inspector"><div className="inspector-top"><StatusBadge status="normal" /><button className="icon-button"><X size={15} /></button></div><h2>MARA Atmospheric Radar</h2><span className="inspector-location">MARA Lab · Research Facility</span><div className="inspector-scores"><div><small>HEALTH</small><b>94%</b></div><div><small>FAIL RISK</small><b>5%</b></div></div><div className="inspector-tabs"><button>OVERVIEW</button><button>SENSORS</button><button className="selected">HISTORY</button></div><div className="maintenance-log"><div className="log-title">MAINTENANCE LOG</div><div className="log-item"><small>2026-08-25 <em>Routine</em></small><b>Scheduled inspection completed</b><span>Tech: R. Sharma</span></div><div className="log-item"><small>2026-08-10 <em className="repair">Repair</em></small><b>Minor coolant replacement</b><span>Tech: A. Nair</span></div><div className="log-item"><small>2026-07-18 <em>Routine</em></small><b>Sensor calibration verified</b><span>Tech: R. Sharma</span></div></div><button className="inspector-action">↻ &nbsp; VIEW HISTORY <ArrowUpRight size={13} /></button><button className="inspector-action" onClick={() => onSelectAsset("MARA Atmospheric Radar")}>◉ &nbsp; RUN SIMULATION <ArrowUpRight size={13} /></button><button className="inspector-action primary">⚒ &nbsp; CREATE TASK <ArrowUpRight size={13} /></button></aside>
    </div>
    <div className="twin-timeline"><b><Activity size={13} /> TIMELINE</b><span>PAST</span>{["08:00", "10:00", "12:00", "14:00", "14:32", "16:00", "18:00", "20:00"].map((time, i) => <div className={`timeline-point ${i === 4 ? "active" : ""}`} key={time}><i />{time}</div>)}<span>FORECAST</span><button>‹</button><button>›</button><strong>LIVE</strong></div>
  </div>;
}

function Infrastructure({ onSelectAsset }: { onSelectAsset: (asset: string) => void }) { return <div className="page"><PageHeader eyebrow="SYSTEMS / INFRASTRUCTURE" title="Infrastructure Health" description="Asset condition, utilization and predicted failure risk across the station." action={<DataLabel />} /><div className="stat-strip"><Metric icon={CircleGauge} label="ASSETS MONITORED" value="24" note="2 require attention" tone="cyan" /><Metric icon={ShieldAlert} label="AT RISK" value="02" note="1 critical pathway" tone="yellow" /><Metric icon={Wrench} label="OPEN TASKS" value="06" note="2 due today" tone="blue" /></div><section className="panel table-panel"><PanelTitle title="Asset Register" subtitle="Updated 14:32:18 UTC" action={<button className="filter-button"><SlidersHorizontal size={14} /> FILTER</button>} /><AssetTable onSelectAsset={onSelectAsset} /></section></div>; }

function AssetTable({ onSelectAsset }: { onSelectAsset: (asset: string) => void }) { return <div className="table-wrap"><table><thead><tr><th>ASSET</th><th>LOCATION</th><th>STATUS</th><th>HEALTH</th><th>TELEMETRY</th><th>RUNTIME</th><th>FAILURE RISK</th><th>LAST SERVICE</th></tr></thead><tbody>{assetData.map((asset) => <tr key={asset.name} onClick={() => onSelectAsset(asset.name)}><td><b>{asset.name}</b><small>Operational asset</small></td><td>{asset.location}</td><td><StatusBadge status={asset.status} /></td><td><div className="table-health"><div className="progress"><i style={{ width: `${asset.health}%` }} /></div><b>{asset.health}%</b></div></td><td className="mono">{asset.value}</td><td className="mono">{asset.runtime}</td><td><span className={`risk-value ${asset.risk > 60 ? "high" : asset.risk > 30 ? "med" : ""}`}>{asset.risk}%</span></td><td>12 days ago</td></tr>)}</tbody></table></div>; }
function StatusBadge({ status }: { status: Severity }) { return <span className={`status-badge ${status}`}><i />{statusLabels[status]}</span>; }

function Energy({ data }: { data: typeof stationData.MAITRI }) { return <div className="page"><PageHeader eyebrow="SYSTEMS / ENERGY COMMAND" title="Energy Operations" description="Generation, demand, storage, and forecast for critical station loads." action={<DataLabel />} /><div className="metric-grid four"><Metric icon={Zap} label="TOTAL GENERATION" value="184 kW" note="+8.2% surplus" tone="yellow" /><Metric icon={Activity} label="CONSUMPTION" value="143 kW" note="−4.1% vs forecast" tone="cyan" /><Metric icon={BatteryCharging} label="BATTERY HEALTH" value={`${data.battery}%`} note="Good condition" tone="green" /><Metric icon={Fuel} label="EST. RUNTIME" value="23 days" note="At current load" tone="blue" /></div><div className="two-col"><ChartPanel title="Power Generation vs Consumption" subtitle="Last 24 hours" /><ChartPanel title="Fuel & Battery Reserve" subtitle="Forecast horizon" variant="reserve" /></div><section className="panel energy-flow"><PanelTitle title="Energy Dependency Model" subtitle="Failure propagation across station systems" /><div className="flow-row">{["GENERATOR", "DISTRIBUTION", "BUILDINGS", "HVAC", "RESEARCH"].map((item, i) => <div className="flow-node" key={item}><div className={`flow-icon ${i === 0 ? "amber" : ""}`}>{i === 0 ? <Fuel size={17} /> : <Zap size={17} />}</div><b>{item}</b><span>{i === 0 ? "184 kW" : i === 1 ? "97.8%" : i === 2 ? "12 loads" : i === 3 ? "42 kW" : "7.4 kW"}</span>{i < 4 && <ArrowUpRight size={15} />}</div>)}</div></section></div>; }

function ChartPanel({ title, subtitle, variant }: { title: string; subtitle: string; variant?: string }) { return <section className="panel chart-panel"><PanelTitle title={title} subtitle={subtitle} action={<span className="panel-time">24H</span>} /><div className={`chart ${variant ?? ""}`}><div className="chart-y"><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div><svg viewBox="0 0 600 170" preserveAspectRatio="none"><defs><linearGradient id={`fill-${variant ?? "main"}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#5bd6f5" stopOpacity=".25" /><stop offset="1" stopColor="#5bd6f5" stopOpacity="0" /></linearGradient></defs><path d="M0 125 C45 115, 65 130, 90 105 S145 75, 180 93 S230 55, 260 78 S310 105, 345 75 S405 50, 440 72 S490 38, 530 60 S570 48, 600 35 V170 H0 Z" fill={`url(#fill-${variant ?? "main"})`} /><path d="M0 125 C45 115, 65 130, 90 105 S145 75, 180 93 S230 55, 260 78 S310 105, 345 75 S405 50, 440 72 S490 38, 530 60 S570 48, 600 35" fill="none" stroke="#62d8f6" strokeWidth="2" /><path d="M0 145 C50 130, 72 145, 110 130 S160 116, 200 126 S250 105, 290 118 S350 135, 390 110 S450 100, 490 115 S550 90, 600 100" fill="none" stroke="#f2b64b" strokeWidth="2" strokeDasharray="5 5" /></svg><div className="chart-x"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>NOW</span></div></div><div className="chart-legend"><span><i className="line cyan" />Generation</span><span><i className="line amber" />Consumption</span></div></section>; }

function Environment({ data }: { data: typeof stationData.MAITRI }) { return <div className="page"><PageHeader eyebrow="SYSTEMS / ENVIRONMENT" title="Antarctic Environment Monitor" description="Weather and ice conditions influencing station operations." action={<DataLabel />} /><div className="environment-hero panel"><div className="weather-main"><div className="weather-icon"><CloudSnow size={45} /></div><div><span className="eyebrow">CURRENT CONDITIONS</span><strong>{data.temp}°C</strong><span>Heavy snow · Visibility 2.4 km</span></div></div><div className="weather-risk"><span>ENVIRONMENTAL RISK</span><b>MODERATE</b><small>Wind intensifying in 6 hours</small></div></div><div className="environment-grid"><div className="metric-grid four"><Metric icon={Compass} label="WIND SPEED" value={`${data.wind} km/h`} note="NE direction" tone="blue" /><Metric icon={Gauge} label="PRESSURE" value="982 hPa" note="−6 hPa / 6h" tone="cyan" /><Metric icon={CloudSnow} label="SNOW CONDITION" value="HEAVY" note="Accumulation active" tone="blue" /><Metric icon={Globe2} label="ICE CONDITION" value="STABLE" note="Margin monitored" tone="green" /></div><ChartPanel title="Temperature & Wind History" subtitle="Last 24 hours" /></div></div>; }

function Water({ onSimulate }: { onSimulate: () => void }) { return <div className="page"><PageHeader eyebrow="SYSTEMS / WATER" title="Freshwater Management" description="Monitor the complete lake-to-station water supply chain." action={<DataLabel />} /><section className="panel water-flow"><PanelTitle title="Water System Flow" subtitle="Priyadarshini Lake → Maitri Station" /><div className="water-chain">{[["LAKE", "Priyadarshini", "92%"], ["INTAKE JETTY", "Intake open", "NORMAL"], ["PUMP HOUSE", "P-01 running", "184 L/min"], ["PIPELINE", "4.8 bar", "NORMAL"], ["STATION", "Storage reserve", "82%"]].map(([label, sub, value], i) => <div className="water-node" key={label}><div className="water-node-icon"><Droplets size={18} /></div><span>{label}</span><b>{sub}</b><small>{value}</small>{i < 4 && <div className="water-connector"><i /></div>}</div>)}</div></section><div className="two-col"><section className="panel"><PanelTitle title="Water Operations" subtitle="Current telemetry" /><div className="detail-list"><Detail label="Pump status" value="RUNNING" tone="green" /><Detail label="Flow rate" value="184 L/min" /><Detail label="Pipeline pressure" value="4.8 bar" /><Detail label="Leak detection" value="NORMAL" tone="green" /><Detail label="Estimated reserve" value="11 days" /></div></section><section className="panel failure-card"><PanelTitle title="Failure Simulation" subtitle="Assess operational impact" /><div className="failure-icon"><Droplets size={20} /></div><h3>What if Pump P-01 fails?</h3><p>Storage begins decreasing immediately. Estimate affected facilities and time to shortage.</p><button className="primary-button" onClick={onSimulate}>RUN PUMP FAILURE <ArrowUpRight size={15} /></button></section></div></div>; }
function Detail({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className="detail-row"><span>{label}</span><b className={tone ? `text-${tone}` : ""}>{tone === "green" && <i className="status-dot green" />}{value}</b></div>; }

function Logistics() { return <div className="page"><PageHeader eyebrow="OPERATIONS / LOGISTICS" title="Polar Logistics Control" description="Inventory, resupply timing and depot readiness for remote operations." action={<DataLabel />} /><div className="stat-strip"><Metric icon={Fuel} label="FUEL" value="68%" note="23 days remaining" tone="yellow" /><Metric icon={Package} label="SPARE PARTS" value="42%" note="Below threshold" tone="yellow" /><Metric icon={Truck} label="VEHICLES" value="4 / 5" note="1 in maintenance" tone="blue" /></div><section className="panel table-panel"><PanelTitle title="Station Inventory" subtitle="Kuber Logistics Depot · Container C5" action={<button className="filter-button"><Package size={14} /> RESUPPLY PLAN</button>} /><div className="inventory-grid">{[["Fuel", "68%", "23 days", "normal"], ["Food", "81%", "42 days", "normal"], ["Medical Supplies", "74%", "36 days", "normal"], ["Spare Parts", "42%", "19 days", "warning"], ["Research Equipment", "93%", "—", "normal"], ["Emergency Supplies", "87%", "51 days", "normal"]].map(([name, stock, days, status]) => <div className="inventory-card" key={name}><div className="inventory-top"><span>{name}</span><StatusBadge status={status as Severity} /></div><strong>{stock}</strong><div className="progress"><i className={status === "warning" ? "amber-fill" : ""} style={{ width: stock }} /></div><small>{days} remaining</small></div>)}</div></section></div>; }

function Equipment() { return <div className="page"><PageHeader eyebrow="SYSTEMS / RESEARCH" title="Research Equipment" description="Scientific assets and the quality of data they produce." action={<DataLabel />} /><div className="equipment-grid">{[["MARA Atmospheric Radar", "ONLINE", "94%", "98%", "7.4 kW", "normal"], ["AWS Sensors", "ONLINE", "96%", "99%", "0.8 kW", "normal"], ["GNSS / Seismometer", "DEGRADED", "71%", "84%", "1.2 kW", "warning"], ["All-Sky Camera", "ONLINE", "91%", "97%", "0.6 kW", "normal"], ["VLF Equipment", "MAINTENANCE", "—", "—", "0 kW", "maintenance"], ["Geomagnetic Sensors", "ONLINE", "93%", "96%", "1.1 kW", "normal"]].map(([name, status, health, quality, power, tone]) => <section className="panel equipment-card" key={name}><div className="equipment-heading"><div className="equipment-symbol"><Radio size={17} /></div><div><h3>{name}</h3><StatusBadge status={tone as Severity} /></div></div><div className="equipment-values"><Detail label="Sensor health" value={health} /><Detail label="Data quality" value={quality} /><Detail label="Power usage" value={power} /><Detail label="Last update" value="14:32:18 UTC" /></div></section>)}</div></div>; }

function Maintenance({ onSelectAsset }: { onSelectAsset: (asset: string) => void }) { return <div className="page"><PageHeader eyebrow="OPERATIONS / PREDICTIVE MAINTENANCE" title="Maintenance Center" description="Prioritized interventions based on simulated asset health and failure probability." action={<DataLabel />} /><div className="maintenance-banner"><div className="maintenance-score"><Wrench size={18} /><span>MAINTENANCE READINESS</span><b>86%</b></div><div><b>2 assets require attention</b><span>Generator G-02 is the highest-priority intervention.</span></div><button className="primary-button" onClick={() => onSelectAsset("Generator G-02")}>OPEN PRIORITY ASSET <ArrowUpRight size={14} /></button></div><section className="panel table-panel"><PanelTitle title="Predicted Maintenance Queue" subtitle="Ranked by failure probability and operational impact" /><div className="maintenance-list">{[["Generator G-02", "Cooling-system degradation", "74%", "7 hrs", "critical"], ["HVAC-W-01", "Reduced thermal efficiency", "39%", "11 days", "warning"], ["GNSS / Seismometer", "Sensor drift", "22%", "18 days", "normal"]].map(([name, cause, probability, life, tone]) => <div className="maintenance-row" key={name}><div className={`priority-bar ${tone}`} /><div className="maintenance-asset"><b>{name}</b><span>{cause}</span></div><div><small>FAILURE PROBABILITY</small><strong className={`text-${tone}`}>{probability}</strong></div><div><small>REMAINING USEFUL LIFE</small><strong>{life}</strong></div><StatusBadge status={tone as Severity} /><button className="icon-button"><ArrowUpRight size={15} /></button></div>)}</div></section></div>; }

function Simulation({ active, onRun }: { active: string | null; onRun: (scenario: string) => void }) { const [scenario, setScenario] = useState(active ?? "EXTREME STORM"); const scenarios = ["EXTREME STORM", "GENERATOR FAILURE", "POWER OUTAGE", "FUEL SHORTAGE", "HVAC FAILURE", "WATER PUMP FAILURE", "COMMUNICATION OUTAGE", "COMBINED EMERGENCY"]; return <div className="page"><PageHeader eyebrow="OPERATIONS / WHAT-IF ENGINE" title="Simulation Center" description="Simulate operational scenarios and observe cascading effects across station systems." action={<DataLabel />} /><div className="simulation-layout"><section className="panel scenario-panel"><PanelTitle title="Scenario Controls" subtitle="Set parameters or load a preset" /><div className="scenario-grid">{scenarios.map((item) => <button className={`scenario-button ${scenario === item ? "selected" : ""}`} key={item} onClick={() => setScenario(item)}><span className="scenario-number">{String(scenarios.indexOf(item) + 1).padStart(2, "0")}</span>{item}{scenario === item && <Check size={15} />}</button>)}</div><div className="scenario-fields"><label>Temperature<input value={scenario === "EXTREME STORM" ? "-38°C" : "-27.4°C"} readOnly /></label><label>Wind speed<input value={scenario === "EXTREME STORM" ? "75 km/h" : "44 km/h"} readOnly /></label><label>Generator status<input value={scenario === "GENERATOR FAILURE" ? "FAILED" : "OPERATIONAL"} readOnly /></label><label>Battery level<input value={scenario === "POWER OUTAGE" ? "48%" : "71%"} readOnly /></label></div><button className="primary-button run-button" onClick={() => onRun(scenario)}><Sparkles size={16} /> RUN SIMULATION</button></section><SimulationResult active={active ?? scenario} /></div></div>; }

function SimulationResult({ active }: { active: string }) { return <section className="panel result-panel"><PanelTitle title="Scenario Result" subtitle={active} action={<span className="status-badge critical"><i />HIGH RISK</span>} /><div className="impact-grid"><div><small>AFFECTED SYSTEMS</small><b>05</b></div><div><small>CRITICAL SYSTEMS</small><b className="text-critical">02</b></div><div><small>TIME TO CRITICAL</small><b>18 hrs</b></div><div><small>FUEL IMPACT</small><b className="text-warning">+29%</b></div></div><div className="cascade"><div className="cascade-line" />{["EXTREME WEATHER", "HVAC LOAD ↑31%", "ENERGY DEMAND ↑26%", "GENERATOR LOAD ↑18%", "FUEL RESERVE ↓17%", "RESUPPLY RISK ↑"].map((item, i) => <div className={`cascade-node ${i > 2 ? "danger" : ""}`} key={item}><span>{String(i + 1).padStart(2, "0")}</span><b>{item}</b></div>)}</div><div className="recommendation"><div className="recommendation-icon"><Sparkles size={16} /></div><div><b>Recommended actions</b><ol><li>Reduce non-essential power load.</li><li>Inspect Generator G-02 cooling system.</li><li>Prepare emergency fuel plan.</li></ol></div></div></section>; }

function Alerts({ onSelectAsset, onSimulate }: { onSelectAsset: (asset: string) => void; onSimulate: (scenario: string) => void }) { return <div className="page"><PageHeader eyebrow="OPERATIONS / ALERT CENTER" title="Active Alerts" description="Prioritized operational signals requiring review or action." action={<DataLabel />} /><div className="alert-summary"><div><ShieldAlert size={19} /><span>CRITICAL</span><b>01</b></div><div><AlertTriangle size={19} /><span>WARNING</span><b>02</b></div><div><MessageSquare size={19} /><span>INFORMATION</span><b>01</b></div><div><Wrench size={19} /><span>MAINTENANCE</span><b>03</b></div></div><section className="panel table-panel"><PanelTitle title="Alert Queue" subtitle="Newest first" action={<button className="filter-button"><SlidersHorizontal size={14} /> FILTER</button>} /><div className="full-alert-list">{alertData.map((alert) => <div className="full-alert" key={alert.title}><div className={`alert-severity ${alert.level}`}><AlertTriangle size={17} /></div><div className="full-alert-content"><div><StatusBadge status={alert.level} /><small>{alert.time}</small></div><h3>{alert.title}</h3><p>{alert.detail}</p></div><div className="alert-actions"><button onClick={() => onSelectAsset(alert.asset === "G-02" ? "Generator G-02" : alert.asset)}>VIEW ASSET</button><button onClick={() => onSimulate(alert.asset === "G-02" ? "GENERATOR FAILURE" : "EXTREME STORM")}>SIMULATE IMPACT</button><button className="ack-button"><Check size={14} /> ACKNOWLEDGE</button></div></div>)}</div></section></div>; }

function AlertRow({ alert, onClick }: { alert: (typeof alertData)[number]; onClick: () => void }) { return <button className="alert-row" onClick={onClick}><div className={`alert-severity ${alert.level}`}><AlertTriangle size={14} /></div><div><b>{alert.title}</b><span>{alert.detail}</span></div><small>{alert.time}</small><ArrowUpRight size={15} /></button>; }

function Communication() { return <div className="page"><PageHeader eyebrow="OPERATIONS / NETWORK" title="Station Communication" description="Connectivity across satellite, telemetry, research data and internal network systems." action={<DataLabel />} /><div className="communication-hero panel"><div className="signal-orbit"><Radio size={28} /><div className="orbit-ring" /></div><div><span className="eyebrow">PRIMARY SATELLITE LINK</span><h2>CONNECTED</h2><p>Last connection 14:32:18 UTC</p></div><div className="signal-stat"><small>SIGNAL QUALITY</small><b>98.7%</b></div><div className="signal-stat"><small>LATENCY</small><b>112 ms</b></div><div className="signal-stat"><small>PACKET LOSS</small><b>0.4%</b></div></div><div className="communication-grid">{[["Satellite Communication", "CONNECTED", "98.7%", "112 ms"], ["Telemetry Uplink", "CONNECTED", "99.9%", "86 ms"], ["Research Data", "CONNECTED", "97.4%", "164 ms"], ["Internal Network", "CONNECTED", "100%", "3 ms"]].map(([name, status, quality, latency]) => <section className="panel comm-card" key={name}><div className="comm-icon"><Network size={18} /></div><h3>{name}</h3><StatusBadge status="normal" /><div className="comm-metrics"><div><small>QUALITY</small><b>{quality}</b></div><div><small>LATENCY</small><b>{latency}</b></div></div></section>)}</div></div>; }

function Assistant({ station }: { station: Station }) { const [query, setQuery] = useState(""); const [asked, setAsked] = useState(false); return <div className="page assistant-page"><PageHeader eyebrow="POLAR INTELLIGENCE / ASSISTANT" title="Polar AI" description="Station intelligence assistant grounded in the digital-twin operational model." action={<DataLabel />} /><div className="assistant-layout"><section className="panel assistant-chat"><div className="assistant-head"><div className="ai-avatar"><Bot size={21} /></div><div><h2>Station Intelligence Assistant</h2><span>Grounded in {station} digital-twin data · Demo mode</span></div><span className="live-badge"><span className="pulse green" />READY</span></div><div className="chat-body"><div className="chat-message ai"><div className="message-mark"><Sparkles size={14} /></div><div><span className="message-label">POLAR AI · NOW</span><p>Good evening, operator. I can help interpret station health, identify operational risk, and run what-if analysis. What would you like to know?</p></div></div>{asked && <><div className="chat-message user"><p>{query}</p></div><div className="chat-message ai"><div className="message-mark"><Sparkles size={14} /></div><div><span className="message-label">POLAR AI · NOW</span><p><b>{station} STATION STATUS</b><br />Overall health is <strong>89%</strong> with two systems requiring attention. Generator G-02 has a simulated failure risk of <strong>74%</strong>. Fuel is at <strong>68%</strong> with approximately 23 days of reserve at current load. Recommendation: inspect the cooling system and reduce non-essential generator load.</p><DataLabel /></div></div></>}</div><div className="suggested"><span>TRY ASKING</span>{["What is the current condition?", "Which systems are at risk?", "What happens if G-02 fails?"].map((q) => <button key={q} onClick={() => { setQuery(q); setAsked(true); }}>{q}</button>)}</div><div className="chat-input"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && query && setAsked(true)} placeholder="Ask about station operations..." /><button onClick={() => query && setAsked(true)}><ArrowUpRight size={17} /></button></div></section><section className="panel assistant-side"><PanelTitle title="Priority Context" subtitle="What Polar AI is monitoring" /><div className="context-list"><div><AlertTriangle size={16} /><span>Generator G-02</span><b>74% risk</b></div><div><Fuel size={16} /><span>Fuel reserve</span><b>23 days</b></div><div><CloudSnow size={16} /><span>Weather window</span><b>MODERATE</b></div><div><Package size={16} /><span>Spare parts</span><b>42% stock</b></div></div></section></div></div>; }

function AssetDrawer({ asset, close, onSimulate }: { asset: string; close: () => void; onSimulate: () => void }) { const generator = asset.includes("Generator"); return <div className="drawer-backdrop" onClick={close}><aside className="asset-drawer" onClick={(e) => e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">ASSET DETAIL / {generator ? "UTILITY BLOCK" : "STATION SYSTEM"}</span><h2>{asset}</h2></div><button className="icon-button" onClick={close}><X size={18} /></button></div><div className="drawer-status"><StatusBadge status={generator ? "warning" : "normal"} /><span>Last updated 14:32:18 UTC</span></div><div className="drawer-score"><div><small>HEALTH SCORE</small><strong>{generator ? "68%" : "93%"}</strong></div><div><small>FAILURE RISK</small><strong className={generator ? "text-critical" : ""}>{generator ? "74%" : "7%"}</strong></div></div><div className="drawer-section"><div className="drawer-section-title">LIVE TELEMETRY</div><Detail label="Temperature" value={generator ? "92°C" : "4.8 bar"} /><Detail label="Load" value={generator ? "87%" : "184 L/min"} /><Detail label="Vibration" value={generator ? "HIGH" : "NORMAL"} tone={generator ? "critical" : "green"} /><Detail label="Runtime" value={generator ? "4,892 hrs" : "1,827 hrs"} /></div><div className="drawer-section"><div className="drawer-section-title">PREDICTIVE INSIGHT</div><div className="insight-box"><Sparkles size={16} /><div><b>{generator ? "Cooling-system degradation" : "Operating within baseline"}</b><span>{generator ? "Inspect cooling system before next high-load cycle." : "No intervention recommended at this time."}</span></div></div></div><div className="drawer-actions"><button className="secondary-button">VIEW HISTORY</button><button className="secondary-button" onClick={onSimulate}>RUN SIMULATION</button><button className="primary-button">CREATE TASK <ArrowUpRight size={14} /></button></div><DataLabel /></aside></div>; }
function SimulationToast({ scenario, onOpen, onClose }: { scenario: string; onOpen: () => void; onClose: () => void }) { return <div className="simulation-toast"><div className="toast-icon"><Sparkles size={17} /></div><div><b>Simulation ready</b><span>{scenario} · High operational risk</span></div><button onClick={onOpen}>VIEW RESULT</button><button className="toast-close" onClick={onClose}><X size={15} /></button></div>; }

export default App;
