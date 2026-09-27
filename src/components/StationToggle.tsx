import type { Station } from "../types";

export function StationToggle({
  station,
  onSelect,
  compact = false,
  showDot = true,
}: {
  station: Station;
  onSelect: (station: Station) => void;
  compact?: boolean;
  showDot?: boolean;
}) {
  const options = ["MAITRI", "BHARATI"] as const;

  return (
    <div className={compact ? "station-mini-toggle" : "station-toggle"} role="tablist" aria-label={compact ? "Select active station" : "Select station"}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`station-toggle-button ${station === option ? "selected" : ""}`}
          onClick={() => onSelect(option)}
          aria-pressed={station === option}
        >
          {showDot && !compact && <span className="status-dot blue" />}
          {option}
        </button>
      ))}
    </div>
  );
}
