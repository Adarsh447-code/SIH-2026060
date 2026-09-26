import type { LucideIcon } from "lucide-react";

export type PageKey =
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

export type Station = "MAITRI" | "BHARATI";
export type Severity = "normal" | "warning" | "critical" | "offline" | "maintenance";
export type NavItem = readonly [PageKey, string, LucideIcon];
