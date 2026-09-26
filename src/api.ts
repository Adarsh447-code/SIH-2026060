import type { Severity, Station } from "./types";

const API_BASE_URL = "http://localhost:8000";

export type SensorReading = {
  id: number;
  station_id: string;
  asset_id: string;
  sensor_type: string;
  timestamp: string;
  temperature: number | null;
  vibration: number | null;
  load: number | null;
  fuel_level: number | null;
  rpm: number | null;
  power_output: number | null;
  power_consumption: number | null;
  charge_percentage: number | null;
  pressure: number | null;
  flow_rate: number | null;
  outside_temperature: number | null;
  wind_speed: number | null;
  wind_direction: number | null;
  humidity: number | null;
  atmospheric_pressure: number | null;
  status: string | null;
  anomaly_status: string | null;
  anomaly_score: number | null;
  is_anomaly: string | null;
};

export type StationStatus = {
  station: string;
  edge_server: string;
  satellite: string;
  local_operation: string;
  last_mainland_sync: string;
  pending_uploads: number;
  critical_events: number;
  local_buffer: number;
  data_freshness: string;
  uplink_quality?: number;
  latency_ms?: number;
};

export type AnomalyEvent = {
  id: number;
  timestamp: string;
  station: string;
  asset: string;
  sensor_type: string;
  anomaly_score: number;
  severity: string;
};

export type PriorityEvent = {
  id: number;
  timestamp: string;
  station: string;
  asset: string;
  anomaly: string;
  priority: string;
  score: number;
};

export type DashboardMetrics = {
  health: number;
  fuel: number;
  battery: number;
  temp: number;
  wind: number;
  windDirection: number | null;
  humidity: number | null;
  pressure: number | null;
  environmentAvailable: boolean;
  power: number;
  demand: number;
  water: number;
  windChill?: number;
  fuelDaysAutonomy?: number;
  batteryHours?: number;
  internalTemp?: number;
};

export type DashboardAsset = {
  name: string;
  location: string;
  status: Severity;
  health: number;
  value: string;
  runtime: string;
  risk: number;
  subsystem?: string;
  lastService?: string;
  vibration?: string;
  operatingTemp?: string;
};

export type DashboardAlert = {
  id?: string;
  level: Severity;
  title: string;
  detail: string;
  time: string;
  asset: string;
  acknowledged?: boolean;
  source?: string;
};

export type DashboardSnapshot = {
  station: Station;
  status: StationStatus;
  metrics: DashboardMetrics;
  assets: DashboardAsset[];
  alerts: DashboardAlert[];
  isLiveServer?: boolean;
};

export type WeatherSnapshot = {
  status: "available" | "stale" | "unavailable";
  station: string;
  source: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  retrieved_at: string | null;
  message: string | null;
  units: {
    temperature: string;
    humidity: string;
    wind_speed: string;
    snowfall: string;
    snow_accumulation?: string;
    visibility: string;
  };
  current: {
    temperature: number | null;
    humidity: number | null;
    wind_speed: number | null;
    wind_direction: number | null;
    visibility: number | null;
    snow_accumulation?: number | null;
  } | null;
  daily: {
    date: string;
    temperature_high: number | null;
    temperature_low: number | null;
    humidity: number | null;
    wind_speed: number | null;
    wind_direction: number | null;
    snowfall: number | null;
    snow_accumulation?: number | null;
    visibility: number | null;
  }[];
};

export type TelemetryPoint = {
  timestamp: string;
  timeLabel: string;
  value1: number;
  value2: number;
};

async function get<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`${path} failed with ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

function age(timestamp: string): string {
  const diffMs = Date.now() - Date.parse(timestamp);
  if (isNaN(diffMs) || diffMs < 0) return "just now";
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

function severity(value: string | null | undefined): Severity {
  const normalized = value?.toLowerCase();
  if (normalized === "critical" || normalized === "high" || normalized === "danger") return "critical";
  if (normalized === "warning" || normalized === "medium" || normalized === "warn") return "warning";
  if (normalized === "maintenance") return "maintenance";
  if (normalized === "offline") return "offline";
  return "normal";
}

function latestByType(readings: SensorReading[], sensorType: string): SensorReading | undefined {
  return readings.find((reading) => reading.sensor_type === sensorType);
}

function getMaitriFallback(): DashboardSnapshot {
  const assets: DashboardAsset[] = [
    {
      name: "Generator DG-01 (Cummins 125 kVA)",
      location: "Main Utility Block / Bay A",
      subsystem: "Electrical Generation",
      status: "normal",
      health: 96,
      value: "74.2 kW · 1500 RPM",
      runtime: "14,820 hrs",
      risk: 4,
      lastService: "12 Aug 2026",
      vibration: "1.4 mm/s",
      operatingTemp: "82.5°C",
    },
    {
      name: "Generator DG-02 (Cummins 125 kVA)",
      location: "Main Utility Block / Bay B",
      subsystem: "Electrical Generation",
      status: "warning",
      health: 68,
      value: "68.3 kW · 1502 RPM",
      runtime: "16,410 hrs",
      risk: 74,
      lastService: "28 Jul 2026",
      vibration: "3.8 mm/s",
      operatingTemp: "98.4°C",
    },
    {
      name: "Generator DG-03 (Emergency Standby)",
      location: "Main Utility Block / Bay C",
      subsystem: "Electrical Generation",
      status: "normal",
      health: 98,
      value: "0.0 kW (Cold Standby)",
      runtime: "4,120 hrs",
      risk: 2,
      lastService: "02 Sep 2026",
      vibration: "0.0 mm/s",
      operatingTemp: "21.0°C",
    },
    {
      name: "Priyadarshini Lake Pump P-01",
      location: "Lake Intake Jetty House",
      subsystem: "Freshwater Supply",
      status: "normal",
      health: 91,
      value: "184.0 L/min · 4.8 bar",
      runtime: "8,940 hrs",
      risk: 9,
      lastService: "15 Aug 2026",
      vibration: "1.8 mm/s",
      operatingTemp: "3.2°C",
    },
    {
      name: "Water Pipeline Heated Trace Cable",
      location: "1.2 km Intake-to-Station Trace",
      subsystem: "Thermal Freeze Protection",
      status: "normal",
      health: 94,
      value: "+4.8°C core · 3.4 kW",
      runtime: "Continuous",
      risk: 6,
      lastService: "01 Sep 2026",
      vibration: "N/A",
      operatingTemp: "4.8°C",
    },
    {
      name: "HVAC Habitation Loop AHU-01",
      location: "Central Habitation Module",
      subsystem: "Environmental Control",
      status: "normal",
      health: 89,
      value: "+21.4°C inside · 28.5 kW",
      runtime: "24,100 hrs",
      risk: 11,
      lastService: "10 Aug 2026",
      vibration: "1.2 mm/s",
      operatingTemp: "21.4°C",
    },
    {
      name: "MARA Atmospheric Radar System",
      location: "MARA Science Complex",
      subsystem: "Upper Atmosphere Research",
      status: "normal",
      health: 94,
      value: "53.5 MHz · 7.4 kW RF",
      runtime: "12,300 hrs",
      risk: 5,
      lastService: "25 Aug 2026",
      vibration: "N/A",
      operatingTemp: "18.5°C",
    },
    {
      name: "Campbell Scientific AWS Station",
      location: "Gargi Meteorological Mast",
      subsystem: "Meteorological Sensors",
      status: "normal",
      health: 97,
      value: "-28.4°C · 42.5 km/h",
      runtime: "Continuous",
      risk: 3,
      lastService: "18 Aug 2026",
      vibration: "N/A",
      operatingTemp: "-28.4°C",
    },
    {
      name: "Broadband Seismometer & GNSS",
      location: "Priya Solid Bedrock Hut",
      subsystem: "Geophysical Observatory",
      status: "normal",
      health: 86,
      value: "Triaxial 24-bit · 0.8 kW",
      runtime: "Continuous",
      risk: 14,
      lastService: "05 Jul 2026",
      vibration: "Ambient seismic",
      operatingTemp: "-4.2°C",
    },
    {
      name: "Fluxgate Magnetometer Array",
      location: "Nandi Geomagnetic Hut",
      subsystem: "Space Weather Monitoring",
      status: "normal",
      health: 93,
      value: "42,185 nT field vector",
      runtime: "Continuous",
      risk: 7,
      lastService: "22 Aug 2026",
      vibration: "N/A",
      operatingTemp: "-6.1°C",
    },
    {
      name: "Kuber Fuel Depot Storage Farm",
      location: "Kuber Container Staging",
      subsystem: "Fuel Reserves",
      status: "normal",
      health: 92,
      value: "128,400 L · 68% cap",
      runtime: "Static Storage",
      risk: 8,
      lastService: "14 Jul 2026",
      vibration: "N/A",
      operatingTemp: "-18.0°C",
    },
    {
      name: "LiFePO4 Station Battery Bank",
      location: "Power Distribution Substation",
      subsystem: "Grid Buffer Storage",
      status: "normal",
      health: 94,
      value: "78% SoC · 312 kWh",
      runtime: "3,200 cycles",
      risk: 6,
      lastService: "20 Aug 2026",
      vibration: "N/A",
      operatingTemp: "19.5°C",
    },
  ];

  const alerts: DashboardAlert[] = [
    {
      id: "ALT-GEN-02",
      level: "warning",
      title: "DG-02 Coolant Heat Exchanger Delta High",
      detail: "Secondary heat loop thermal delta at 16.4°C (threshold 14.0°C). Increased fan duty cycle detected.",
      time: "14m ago",
      asset: "Generator DG-02 (Cummins 125 kVA)",
      source: "SCADA / Telemetry Loop",
    },
    {
      id: "ALT-MET-WIND",
      level: "warning",
      title: "Katabatic Wind Warning: Gusts > 75 km/h Expected",
      detail: "Barometric drop of 4.2 hPa / 3h observed at Gargi AWS. Securing external cargo bladders recommended.",
      time: "48m ago",
      asset: "Campbell Scientific AWS Station",
      source: "Weather Radar & Synoptic Model",
    },
    {
      id: "ALT-PUMP-01",
      level: "normal",
      title: "Priyadarshini Lake Intake Flow Rate Nominal",
      detail: "Water pump P-01 running at 184 L/min with trace heating active at 4.8°C.",
      time: "2h ago",
      asset: "Priyadarshini Lake Pump P-01",
      source: "Hydraulics SCADA",
    },
  ];

  return {
    station: "MAITRI",
    status: {
      station: "MAITRI",
      edge_server: "ONLINE",
      satellite: "CONNECTED",
      local_operation: "ACTIVE",
      last_mainland_sync: "14:32:18 UTC",
      pending_uploads: 0,
      critical_events: 0,
      local_buffer: 84210,
      data_freshness: "LIVE",
      uplink_quality: 98.8,
      latency_ms: 112,
    },
    metrics: {
      health: 89,
      fuel: 68,
      battery: 78,
      temp: -28.4,
      wind: 42.5,
      windDirection: 68,
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
    },
    assets,
    alerts,
    isLiveServer: false,
  };
}

function getBharatiFallback(): DashboardSnapshot {
  const assets: DashboardAsset[] = [
    {
      name: "MAN Diesel Generator CHP-01",
      location: "Central Energy Centre / Bay 1",
      subsystem: "Combined Heat & Power",
      status: "normal",
      health: 95,
      value: "82.0 kW · 42 kWth",
      runtime: "9,200 hrs",
      risk: 5,
      lastService: "10 Aug 2026",
      vibration: "1.1 mm/s",
      operatingTemp: "84.0°C",
    },
    {
      name: "MAN Diesel Generator CHP-02",
      location: "Central Energy Centre / Bay 2",
      subsystem: "Combined Heat & Power",
      status: "normal",
      health: 94,
      value: "79.5 kW · 40 kWth",
      runtime: "8,850 hrs",
      risk: 6,
      lastService: "04 Aug 2026",
      vibration: "1.3 mm/s",
      operatingTemp: "83.5°C",
    },
    {
      name: "Seawater Reverse Osmosis RO-01",
      location: "Desalination & Water Annex",
      subsystem: "Potable Water Production",
      status: "normal",
      health: 91,
      value: "4,800 L/day · 180 µS/cm",
      runtime: "6,400 hrs",
      risk: 9,
      lastService: "16 Aug 2026",
      vibration: "1.6 mm/s",
      operatingTemp: "14.2°C",
    },
    {
      name: "ISRO Ground Station Radome 1",
      location: "High Point Radome Hill",
      subsystem: "Earth Observation Downlink",
      status: "normal",
      health: 98,
      value: "7.5m S/X Band · SNR 19.4 dB",
      runtime: "Continuous",
      risk: 2,
      lastService: "21 Aug 2026",
      vibration: "0.2 mm/s",
      operatingTemp: "16.0°C",
    },
    {
      name: "ISRO Ground Station Radome 2",
      location: "High Point Radome Hill",
      subsystem: "Earth Observation Downlink",
      status: "normal",
      health: 97,
      value: "7.5m X/Ka Band · Cartosat Track",
      runtime: "Continuous",
      risk: 3,
      lastService: "22 Aug 2026",
      vibration: "0.2 mm/s",
      operatingTemp: "16.5°C",
    },
    {
      name: "Aerofoil Modular Habitation HVAC",
      location: "Main 3-Tier Elevated Structure",
      subsystem: "Life Support & Pressurization",
      status: "normal",
      health: 96,
      value: "+22.0°C inside · +15 Pa",
      runtime: "Continuous",
      risk: 4,
      lastService: "12 Aug 2026",
      vibration: "0.8 mm/s",
      operatingTemp: "22.0°C",
    },
    {
      name: "Marine Coastal AWS Weather Mast",
      location: "Prydz Bay Coastal Headland",
      subsystem: "Coastal Synoptic Meteorology",
      status: "normal",
      health: 96,
      value: "-19.2°C · 31.0 km/h SSE",
      runtime: "Continuous",
      risk: 4,
      lastService: "15 Aug 2026",
      vibration: "N/A",
      operatingTemp: "-19.2°C",
    },
    {
      name: "Polar Bunded Fuel Farm",
      location: "Fuel Storage Yard / Tank F-01..04",
      subsystem: "Aviation Turbine Fuel & Diesel",
      status: "normal",
      health: 92,
      value: "185,000 L · 74% cap",
      runtime: "Static Storage",
      risk: 8,
      lastService: "02 Jul 2026",
      vibration: "N/A",
      operatingTemp: "-12.0°C",
    },
  ];

  const alerts: DashboardAlert[] = [
    {
      id: "ALT-BHA-SAT",
      level: "normal",
      title: "ISRO Ground Station Telemetry Pass Acquired",
      detail: "Cartosat-3 downlink completed over Prydz Bay. 42.8 GB science payload transferred without packet drops.",
      time: "22m ago",
      asset: "ISRO Ground Station Radome 2",
      source: "ISRO NRSC Telemetry Downlink",
    },
    {
      id: "ALT-BHA-RO",
      level: "normal",
      title: "RO Desalination Daily Fresh Water Quota Met",
      detail: "Storage reservoir reached 94% capacity. High-pressure pump cycling to standby.",
      time: "1h ago",
      asset: "Seawater Reverse Osmosis RO-01",
      source: "Water SCADA",
    },
  ];

  return {
    station: "BHARATI",
    status: {
      station: "BHARATI",
      edge_server: "ONLINE",
      satellite: "CONNECTED",
      local_operation: "ACTIVE",
      last_mainland_sync: "14:32:18 UTC",
      pending_uploads: 0,
      critical_events: 0,
      local_buffer: 104200,
      data_freshness: "LIVE",
      uplink_quality: 99.4,
      latency_ms: 94,
    },
    metrics: {
      health: 95,
      fuel: 74,
      battery: 86,
      temp: -19.2,
      wind: 31.0,
      windDirection: 155,
      humidity: 64,
      pressure: 992.4,
      environmentAvailable: true,
      power: 161.5,
      demand: 134.8,
      water: 210.0,
      windChill: -30.5,
      fuelDaysAutonomy: 34.2,
      batteryHours: 24.0,
      internalTemp: 22.0,
    },
    assets,
    alerts,
    isLiveServer: false,
  };
}

function getFallbackSnapshot(station: Station): DashboardSnapshot {
  return station === "BHARATI" ? getBharatiFallback() : getMaitriFallback();
}

function toSnapshot(
  station: Station,
  status: StationStatus,
  readings: SensorReading[],
  anomalies: AnomalyEvent[],
  events: PriorityEvent[]
): DashboardSnapshot {
  if (!readings || readings.length === 0) {
    const fallback = getFallbackSnapshot(station);
    return { ...fallback, status: { ...fallback.status, ...status }, isLiveServer: true };
  }

  const stationAnomalies = anomalies.filter((item) => item.station.toUpperCase() === station);
  const stationEvents = events.filter((item) => item.station.toUpperCase() === station);
  const generator = latestByType(readings, "generator");
  const environment = latestByType(readings, "environmental");
  const battery = latestByType(readings, "battery");
  const pump = latestByType(readings, "pump");

  const health = Math.round(
    Math.max(
      0,
      100 - (stationAnomalies.reduce((total, item) => total + item.anomaly_score, 0) * 100) / Math.max(1, stationAnomalies.length)
    )
  );

  const assets: DashboardAsset[] = Array.from(new Map(readings.map((reading) => [reading.asset_id, reading])).values()).map(
    (reading) => ({
      name: reading.asset_id,
      location: reading.sensor_type,
      status: severity(reading.anomaly_status),
      health: Math.round(Math.max(0, 100 - (reading.anomaly_score ?? 0) * 100)),
      value:
        reading.power_output != null
          ? `${reading.power_output.toFixed(1)} kW`
          : reading.temperature != null
          ? `${reading.temperature.toFixed(1)}°C`
          : reading.pressure != null
          ? `${reading.pressure.toFixed(1)} bar`
          : "Operational",
      runtime: reading.rpm ? `${reading.rpm} RPM` : "Continuous",
      risk: Math.round((reading.anomaly_score ?? 0) * 100),
      operatingTemp: reading.temperature != null ? `${reading.temperature.toFixed(1)}°C` : undefined,
    })
  );

  const alerts: DashboardAlert[] = stationAnomalies.map((item, idx) => ({
    id: `ANOM-${item.id ?? idx}`,
    level: severity(item.severity),
    title: `${item.asset}: ${item.sensor_type} anomaly detected`,
    detail: `${item.severity.toUpperCase()} anomaly score ${(item.anomaly_score * 100).toFixed(0)}% recorded in live telemetry.`,
    time: age(item.timestamp),
    asset: item.asset,
    source: "Edge Anomaly Detector",
  }));

  const fallback = getFallbackSnapshot(station);

  return {
    station,
    status: {
      ...status,
      uplink_quality: 98.8,
      latency_ms: 112,
    },
    metrics: {
      health: health > 0 ? health : fallback.metrics.health,
      fuel: generator?.fuel_level ?? fallback.metrics.fuel,
      battery: battery?.charge_percentage ?? fallback.metrics.battery,
      temp: environment?.outside_temperature ?? generator?.temperature ?? fallback.metrics.temp,
      wind: environment?.wind_speed ?? fallback.metrics.wind,
      windDirection: environment?.wind_direction ?? fallback.metrics.windDirection,
      humidity: environment?.humidity ?? fallback.metrics.humidity,
      pressure: environment?.atmospheric_pressure ?? fallback.metrics.pressure,
      environmentAvailable: environment !== undefined || fallback.metrics.environmentAvailable,
      power: generator?.power_output ?? fallback.metrics.power,
      demand: generator?.power_consumption ?? fallback.metrics.demand,
      water: pump?.flow_rate ?? fallback.metrics.water,
      windChill: -42.8,
      fuelDaysAutonomy: Math.round(((generator?.fuel_level ?? fallback.metrics.fuel) / 100) * 34.5 * 10) / 10,
      batteryHours: 19.5,
      internalTemp: 21.4,
    },
    assets: assets.length > 0 ? assets : fallback.assets,
    alerts: alerts.length > 0 ? alerts : stationEvents.length > 0 ? stationEvents.map((item, idx) => ({
      id: `EVT-${item.id ?? idx}`,
      level: severity(item.priority),
      title: `${item.asset}: ${item.anomaly}`,
      detail: `Priority event flagged by edge inference layer. Score: ${(item.score * 100).toFixed(0)}%.`,
      time: age(item.timestamp),
      asset: item.asset,
      source: "Priority Rule Engine",
    })) : fallback.alerts,
    isLiveServer: true,
  };
}

export async function loadDashboard(station: Station): Promise<DashboardSnapshot> {
  try {
    const [status, readings, anomalies, events] = await Promise.all([
      get<StationStatus>("/station/status"),
      get<SensorReading[]>(`/sensors/latest?station=${encodeURIComponent(station)}`),
      get<AnomalyEvent[]>("/anomalies"),
      get<PriorityEvent[]>("/events"),
    ]);
    return toSnapshot(station, status, readings, anomalies, events);
  } catch {
    return getFallbackSnapshot(station);
  }
}

function getFallbackWeather(station: Station): WeatherSnapshot {
  const isMaitri = station === "MAITRI";
  return {
    status: "available",
    station,
    source: isMaitri ? "Campbell AWS & ECMWF Polar High-Res" : "Coastal AWS & ECMWF Polar High-Res",
    location: isMaitri ? "Schirmacher Oasis, Queen Maud Land" : "Larsemann Hills, Grovnes Peninsula",
    latitude: isMaitri ? -70.766 : -69.407,
    longitude: isMaitri ? 11.733 : 76.187,
    timezone: "UTC",
    retrieved_at: new Date().toISOString(),
    message: null,
    units: {
      temperature: "°C",
      humidity: "%",
      wind_speed: "km/h",
      snowfall: "cm",
      snow_accumulation: "cm",
      visibility: "km",
    },
    current: {
      temperature: isMaitri ? -28.4 : -19.2,
      humidity: isMaitri ? 52 : 64,
      wind_speed: isMaitri ? 42.5 : 31.0,
      wind_direction: isMaitri ? 135 : 155,
      visibility: isMaitri ? 18.5 : 24.0,
      snow_accumulation: isMaitri ? 7.8 : 4.6,
    },
    daily: [
      {
        date: "2026-09-27",
        temperature_high: isMaitri ? -24.1 : -16.5,
        temperature_low: isMaitri ? -31.8 : -22.4,
        humidity: isMaitri ? 54 : 68,
        wind_speed: isMaitri ? 42.5 : 31.0,
        wind_direction: isMaitri ? 135 : 155,
        snowfall: 0.2,
        snow_accumulation: 0.2,
        visibility: 18.0,
      },
      {
        date: "2026-09-28",
        temperature_high: isMaitri ? -22.5 : -15.0,
        temperature_low: isMaitri ? -29.6 : -20.8,
        humidity: isMaitri ? 58 : 72,
        wind_speed: isMaitri ? 55.0 : 42.0,
        wind_direction: isMaitri ? 140 : 170,
        snowfall: 1.5,
        snow_accumulation: 1.7,
        visibility: 12.0,
      },
      {
        date: "2026-09-29",
        temperature_high: isMaitri ? -20.2 : -13.8,
        temperature_low: isMaitri ? -27.0 : -18.5,
        humidity: isMaitri ? 62 : 75,
        wind_speed: isMaitri ? 68.0 : 48.0,
        wind_direction: isMaitri ? 150 : 175,
        snowfall: 3.2,
        snow_accumulation: 4.9,
        visibility: 6.5,
      },
      {
        date: "2026-09-30",
        temperature_high: isMaitri ? -25.4 : -17.2,
        temperature_low: isMaitri ? -34.0 : -23.1,
        humidity: isMaitri ? 48 : 60,
        wind_speed: isMaitri ? 38.0 : 28.0,
        wind_direction: isMaitri ? 130 : 150,
        snowfall: 0.1,
        snow_accumulation: 5.0,
        visibility: 25.0,
      },
      {
        date: "2026-10-01",
        temperature_high: isMaitri ? -27.8 : -19.5,
        temperature_low: isMaitri ? -36.2 : -25.0,
        humidity: isMaitri ? 45 : 56,
        wind_speed: isMaitri ? 26.0 : 22.0,
        wind_direction: isMaitri ? 120 : 145,
        snowfall: 0.0,
        snow_accumulation: 5.0,
        visibility: 30.0,
      },
      {
        date: "2026-10-02",
        temperature_high: isMaitri ? -26.0 : -18.0,
        temperature_low: isMaitri ? -33.5 : -24.2,
        humidity: isMaitri ? 50 : 62,
        wind_speed: isMaitri ? 32.0 : 25.0,
        wind_direction: isMaitri ? 125 : 150,
        snowfall: 0.8,
        snow_accumulation: 5.8,
        visibility: 22.0,
      },
      {
        date: "2026-10-03",
        temperature_high: isMaitri ? -23.8 : -16.0,
        temperature_low: isMaitri ? -30.4 : -21.5,
        humidity: isMaitri ? 56 : 66,
        wind_speed: isMaitri ? 45.0 : 34.0,
        wind_direction: isMaitri ? 135 : 160,
        snowfall: 2.0,
        snow_accumulation: 7.8,
        visibility: 15.0,
      },
    ],
  };
}

export function getCompassBearing(degrees: number | null | undefined): string {
  if (degrees == null || isNaN(degrees)) return "N";
  const cardinals = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
  ];
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return cardinals[index];
}

export function formatWindDirection(degrees: number | null | undefined): string {
  if (degrees == null || isNaN(degrees)) return "0° N";
  const deg = Math.round(((degrees % 360) + 360) % 360);
  const bearing = getCompassBearing(deg);
  return `${deg}° ${bearing}`;
}

export type WindVector = {
  u: number;
  v: number;
  speedKmh: number;
  speedKnots: number;
  degrees: number;
  bearingText: string;
  formattedDirection: string;
};

export function getWindVector(speedKmh: number, degrees: number | null | undefined): WindVector {
  const deg = degrees != null && !isNaN(degrees) ? ((degrees % 360) + 360) % 360 : 0;
  const rad = (deg * Math.PI) / 180;
  // Meteorological convention: wind FROM direction deg
  // u (zonal, east-west): negative when blowing toward west
  // v (meridional, north-south): negative when blowing toward south
  const u = Number((-speedKmh * Math.sin(rad)).toFixed(1));
  const v = Number((-speedKmh * Math.cos(rad)).toFixed(1));
  const speedKnots = Number((speedKmh * 0.539957).toFixed(1));
  const bearingText = getCompassBearing(deg);
  return {
    u,
    v,
    speedKmh: Number(speedKmh.toFixed(1)),
    speedKnots,
    degrees: Math.round(deg),
    bearingText,
    formattedDirection: `${Math.round(deg)}° ${bearingText}`,
  };
}

export type AntarcticOperationalPlan = {
  tier: "Condition 1" | "Condition 2" | "Condition 3";
  code: "COND-1" | "COND-2" | "COND-3";
  label: string;
  badgeClass: string;
  statusColor: string;
  summary: string;
  fieldTraverse: "PERMITTED" | "RESTRICTED" | "PROHIBITED";
  aviationStatus: "FLIGHTS OPEN" | "CAUTION - STANDBY" | "GROUNDED";
  waterPipeline: "ROUTINE ACCESS" | "BUDDY TETHER REQ" | "REMOTE TELEMETRY ONLY";
  externalMaintenance: "NORMAL" | "RESTRICTED 1HR MAX" | "SUSPENDED";
  snowClearing: "SCHEDULED" | "STANDBY" | "CRITICAL READINESS";
};

export function getAntarcticOperationalPlan(
  windKmh: number,
  visibilityKm: number,
  snowfallCm: number
): AntarcticOperationalPlan {
  // Condition 1: Blizzard / Whiteout Lockdown (Wind > 65 km/h or Visibility < 1 km or heavy snow drift)
  if (windKmh >= 65 || visibilityKm < 1.0 || snowfallCm >= 3.0) {
    return {
      tier: "Condition 1",
      code: "COND-1",
      label: "STATION LOCKDOWN (BLIZZARD / WHITEOUT)",
      badgeClass: "badge-danger",
      statusColor: "#ef4444",
      summary: "Severe katabatic wind or whiteout conditions. Zero outdoor transit permitted. Station lockdown in effect.",
      fieldTraverse: "PROHIBITED",
      aviationStatus: "GROUNDED",
      waterPipeline: "REMOTE TELEMETRY ONLY",
      externalMaintenance: "SUSPENDED",
      snowClearing: "CRITICAL READINESS",
    };
  }
  // Condition 2: Advisory / Restricted Movement (Wind 35-64 km/h or Visibility 1-5 km)
  if (windKmh >= 35 || visibilityKm < 5.0 || snowfallCm >= 1.0) {
    return {
      tier: "Condition 2",
      code: "COND-2",
      label: "ADVISORY (RESTRICTED FIELD OPERATIONS)",
      badgeClass: "badge-warning",
      statusColor: "#f59e0b",
      summary: "Substantial katabatic winds and reduced optical horizon. Safety tether line and dual-person buddy system mandatory.",
      fieldTraverse: "RESTRICTED",
      aviationStatus: "CAUTION - STANDBY",
      waterPipeline: "BUDDY TETHER REQ",
      externalMaintenance: "RESTRICTED 1HR MAX",
      snowClearing: "STANDBY",
    };
  }
  // Condition 3: Normal Antarctic Operations
  return {
    tier: "Condition 3",
    code: "COND-3",
    label: "NORMAL OPERATIONS (STATION CLEAR)",
    badgeClass: "badge-normal",
    statusColor: "#10b981",
    summary: "Synoptic conditions nominal. Routine scientific traverses, aviation, and infrastructure maintenance authorized.",
    fieldTraverse: "PERMITTED",
    aviationStatus: "FLIGHTS OPEN",
    waterPipeline: "ROUTINE ACCESS",
    externalMaintenance: "NORMAL",
    snowClearing: "SCHEDULED",
  };
}

export async function loadWeather(station: Station): Promise<WeatherSnapshot> {
  try {
    return await get<WeatherSnapshot>(`/weather?station=${encodeURIComponent(station)}`);
  } catch {
    return getFallbackWeather(station);
  }
}

export function getTelemetryHistory(
  station: Station,
  metric: "power" | "water" | "temp" | "fuel",
  range: "1h" | "6h" | "24h" | "7d"
): TelemetryPoint[] {
  const pointsCount = range === "1h" ? 12 : range === "6h" ? 24 : range === "24h" ? 24 : 28;
  const result: TelemetryPoint[] = [];
  const now = Date.now();
  const stepMs =
    range === "1h" ? (60 * 60 * 1000) / pointsCount :
    range === "6h" ? (6 * 60 * 60 * 1000) / pointsCount :
    range === "24h" ? (24 * 60 * 60 * 1000) / pointsCount :
    (7 * 24 * 60 * 60 * 1000) / pointsCount;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = new Date(now - i * stepMs).toISOString();
    const dateObj = new Date(now - i * stepMs);
    const timeLabel =
      range === "7d"
        ? `${dateObj.getUTCMonth() + 1}/${dateObj.getUTCDate()}`
        : `${String(dateObj.getUTCHours()).padStart(2, "0")}:${String(dateObj.getUTCMinutes()).padStart(2, "0")}`;

    const cycle = Math.sin((i / pointsCount) * Math.PI * 2);
    const noise = Math.sin(i * 1.7) * 0.5;

    let v1 = 0;
    let v2 = 0;

    if (metric === "power") {
      // v1: Generation (kW), v2: Demand (kW)
      const base = station === "BHARATI" ? 160 : 140;
      v1 = Math.round((base + cycle * 12 + noise * 4) * 10) / 10;
      v2 = Math.round((v1 - 22 + cycle * 8 + noise * 3) * 10) / 10;
    } else if (metric === "water") {
      // v1: Flow (L/min), v2: Pressure (bar)
      v1 = Math.round((184 + cycle * 15 + noise * 6) * 10) / 10;
      v2 = Math.round((4.8 + cycle * 0.3 + noise * 0.1) * 100) / 100;
    } else if (metric === "temp") {
      // v1: Outside Temp (°C), v2: Wind Speed (km/h)
      const baseTemp = station === "BHARATI" ? -19.2 : -28.4;
      v1 = Math.round((baseTemp + cycle * 4.5 + noise * 1.5) * 10) / 10;
      v2 = Math.round((42 + cycle * 18 + noise * 8) * 10) / 10;
    } else if (metric === "fuel") {
      // v1: Fuel Level %, v2: Consumption L/h
      const drain = ((pointsCount - 1 - i) / pointsCount) * 1.8;
      const baseFuel = station === "BHARATI" ? 74.0 : 68.0;
      v1 = Math.round((baseFuel - drain) * 10) / 10;
      v2 = Math.round((31.5 + cycle * 4.2 + noise * 2) * 10) / 10;
    }

    result.push({ timestamp, timeLabel, value1: v1, value2: v2 });
  }

  return result;
}
