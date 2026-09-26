import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Bot,
  Box,
  CloudSnow,
  Compass,
  Droplets,
  Fuel,
  Gauge,
  Hexagon,
  LayoutDashboard,
  Package,
  Radio,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Thermometer,
  Wrench,
  Zap,
} from "lucide-react";

import type { NavItem, Severity } from "../types";

export const navGroups: { label: string; items: readonly NavItem[] }[] = [
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

export const statusLabels: Record<Severity, string> = {
  normal: "NORMAL",
  warning: "WARNING",
  critical: "CRITICAL",
  offline: "OFFLINE",
  maintenance: "MAINTENANCE",
};

export const dashboardSignals = {
  temperature: Thermometer,
  wind: Compass,
  power: Zap,
  demand: Activity,
  battery: BatteryCharging,
  fuel: Fuel,
  water: Droplets,
  health: Gauge,
  snow: CloudSnow,
  alert: AlertTriangle,
  spark: Sparkles,
};
