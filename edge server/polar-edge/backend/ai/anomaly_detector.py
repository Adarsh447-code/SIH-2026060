import csv
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

import numpy as np
from sklearn.ensemble import IsolationForest


class AnomalyDetector:
    _FEATURE_COLUMNS = ("temperature_c", "vibration_mm_s", "load_percent")

    def __init__(self, training_data_path: str | Path | None = None):
        data_path = Path(training_data_path) if training_data_path else self._default_data_path()
        training_data = self._load_training_data(data_path)
        self.model = IsolationForest(contamination=0.03, random_state=42)
        self.model.fit(training_data)

    @staticmethod
    def _default_data_path() -> Path:
        return Path(__file__).resolve().parents[3] / "data" / "generator_sensor_demo.csv"

    @classmethod
    def _load_training_data(cls, data_path: Path) -> np.ndarray:
        rows = []
        with data_path.open(newline="", encoding="utf-8") as csv_file:
            for row in csv.DictReader(csv_file):
                try:
                    rows.append([float(row[column]) for column in cls._FEATURE_COLUMNS])
                except (KeyError, TypeError, ValueError):
                    continue

        if not rows:
            raise ValueError(f"No valid training rows found in {data_path}")
        return np.asarray(rows, dtype=float)

    def detect(self, reading: Dict[str, Any]) -> Dict[str, Any]:
        sensor_type = reading.get("sensor_type", "generator")
        if sensor_type == "generator":
            values = [
                float(reading.get("temperature", 80.0)),
                float(reading.get("vibration", 3.2)),
                float(reading.get("load", 70.0)),
            ]
            feature_vector = np.array([values], dtype=float)
            prediction = self.model.predict(feature_vector)[0]
            score = float(self.model.score_samples(feature_vector)[0])
            normalized_score = float(np.clip((abs(score) + 0.25) / 1.6, 0.02, 0.99))
            is_anomaly = bool(prediction == -1 or any(v > threshold for v, threshold in zip(values, [95.0, 7.0, 90.0])))
            if is_anomaly and normalized_score < 0.55:
                normalized_score = 0.9
            return {
                "is_anomaly": is_anomaly,
                "anomaly_score": round(normalized_score, 4),
                "timestamp": reading.get("timestamp") or datetime.utcnow().isoformat() + "Z",
                "station": reading.get("station_id", "MAITRI"),
                "asset": reading.get("asset_id", "GENERATOR-G02"),
                "sensor_type": sensor_type,
            }

        return {
            "is_anomaly": False,
            "anomaly_score": 0.02,
            "timestamp": reading.get("timestamp") or datetime.utcnow().isoformat() + "Z",
            "station": reading.get("station_id", "MAITRI"),
            "asset": reading.get("asset_id", "GENERATOR-G02"),
            "sensor_type": sensor_type,
        }
