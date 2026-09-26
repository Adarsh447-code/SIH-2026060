import csv
from datetime import datetime
from pathlib import Path

from database import SessionLocal, db_lock
from models import AnomalyEvent, PriorityEvent, SensorReading


CSV_PATH = Path(__file__).resolve().parents[3] / "data" / "generator_sensor_demo.csv"


def import_generator_demo_data() -> int:
    if not CSV_PATH.exists():
        return 0

    with db_lock:
        db = SessionLocal()
        try:
            existing = {
                (item.station_id, item.asset_id, item.sensor_type, item.timestamp)
                for item in db.query(
                    SensorReading.station_id,
                    SensorReading.asset_id,
                    SensorReading.sensor_type,
                    SensorReading.timestamp,
                ).filter(SensorReading.sensor_type == "generator")
            }
            readings = []
            anomalies = []
            priorities = []

            with CSV_PATH.open(newline="", encoding="utf-8") as csv_file:
                for row in csv.DictReader(csv_file):
                    timestamp = datetime.fromisoformat(row["timestamp"])
                    key = (row["station_id"], row["asset_id"], "generator", timestamp)
                    if key in existing:
                        continue

                    is_anomaly = row["anomaly"].lower() == "true"
                    readings.append({
                        "station_id": row["station_id"],
                        "asset_id": row["asset_id"],
                        "sensor_type": "generator",
                        "timestamp": timestamp,
                        "temperature": float(row["temperature_c"]),
                        "vibration": float(row["vibration_mm_s"]),
                        "load": float(row["load_percent"]),
                        "fuel_level": float(row["fuel_percent"]),
                        "rpm": float(row["rpm"]),
                        "power_output": float(row["power_kw"]),
                        "status": row["status"],
                        "sync_status": "PENDING",
                        "anomaly_status": "ANOMALY" if is_anomaly else "NORMAL",
                        "anomaly_score": 1.0 if is_anomaly else 0.0,
                        "is_anomaly": "TRUE" if is_anomaly else "FALSE",
                    })
                    if is_anomaly:
                        anomalies.append({
                            "timestamp": timestamp,
                            "station": row["station_id"],
                            "asset": row["asset_id"],
                            "sensor_type": "generator",
                            "anomaly_score": 1.0,
                            "is_anomaly": "TRUE",
                            "severity": row["anomaly_severity"],
                        })
                        priorities.append({
                            "timestamp": timestamp,
                            "station": row["station_id"],
                            "asset": row["asset_id"],
                            "anomaly": row["fault_type"] if row["fault_type"] != "NONE" else "GENERATOR_ANOMALY",
                            "priority": row["priority_level"],
                            "score": float(row["priority_score"]),
                            "anomaly_score": 1.0,
                            "operational_impact": float(row["priority_score"]),
                            "trend": 0.0,
                        })
                    existing.add(key)

            if readings:
                db.bulk_insert_mappings(SensorReading, readings)
                db.bulk_insert_mappings(AnomalyEvent, anomalies)
                db.bulk_insert_mappings(PriorityEvent, priorities)
                db.commit()
            return len(readings)
        finally:
            db.close()