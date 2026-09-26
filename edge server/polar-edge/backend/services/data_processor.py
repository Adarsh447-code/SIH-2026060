import json
from datetime import datetime
from typing import Any, Dict

from ai.anomaly_detector import AnomalyDetector
from database import SessionLocal, db_lock
from models import AnomalyEvent, PriorityEvent, SensorReading, SystemLog, UplinkQueue
from priority.priority_manager import PriorityManager
from sensors.simulator import SensorSimulator
from services.queue_manager import QueueManager


class DataProcessor:
    def __init__(self):
        self.detector = AnomalyDetector()
        self.priority = PriorityManager()
        self.simulator = SensorSimulator()
        self.queue_manager = QueueManager()

    def validate_reading(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        errors = []
        station_id = payload.get("station_id")
        asset_id = payload.get("asset_id")
        sensor_type = payload.get("sensor_type")

        if not station_id:
            errors.append("station_id is required")
        if not asset_id:
            errors.append("asset_id is required")
        if not sensor_type:
            errors.append("sensor_type is required")
        if not payload.get("timestamp"):
            payload["timestamp"] = datetime.utcnow().isoformat() + "Z"

        sensor_checks = {
            "generator": {"temperature": (50, 130), "vibration": (0, 20), "load": (0, 100)},
            "battery": {"voltage": (36, 60), "current": (0, 200), "charge_percentage": (0, 100)},
            "hvac": {"indoor_temperature": (-40, 60), "power_consumption": (0, 20)},
            "pump": {"pressure": (0, 120), "flow_rate": (0, 150), "temperature": (-20, 80)},
            "environmental": {"outside_temperature": (-60, 60), "wind_speed": (0, 120), "wind_direction": (0, 360), "humidity": (0, 100)},
        }

        sensor_spec = sensor_checks.get(sensor_type, {})
        for field, (low, high) in sensor_spec.items():
            value = payload.get(field)
            if value is None:
                continue
            try:
                numeric_value = float(value)
            except (TypeError, ValueError):
                errors.append(f"{field} must be numeric")
                continue
            if not low <= numeric_value <= high:
                errors.append(f"{field} out of range ({low}, {high})")

        return {"valid": not errors, "errors": errors}

    def ingest_reading(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        with db_lock:
            db = SessionLocal()
            try:
                validation = self.validate_reading(payload)
                if not validation["valid"]:
                    return {"status": "invalid", "errors": validation["errors"], "payload": payload}

                payload["timestamp"] = payload.get("timestamp") or datetime.utcnow().isoformat() + "Z"
                reading = SensorReading(**payload)
                reading.timestamp = datetime.utcnow()
                reading.sync_status = "PENDING"
                db.add(reading)
                db.commit()
                db.refresh(reading)

                anomaly = self.detector.detect(payload)
                reading.is_anomaly = "TRUE" if anomaly.get("is_anomaly") else "FALSE"
                reading.anomaly_status = "ANOMALY" if anomaly.get("is_anomaly") else "NORMAL"
                reading.anomaly_score = anomaly.get("anomaly_score", 0.0)
                db.add(reading)
                db.commit()

                if anomaly.get("is_anomaly"):
                    event = AnomalyEvent(
                        timestamp=datetime.utcnow(),
                        station=payload.get("station_id", "MAITRI"),
                        asset=payload.get("asset_id", "GENERATOR-G02"),
                        sensor_type=payload.get("sensor_type", "generator"),
                        anomaly_score=anomaly.get("anomaly_score", 0.0),
                        is_anomaly="TRUE",
                        severity="CRITICAL" if anomaly.get("anomaly_score", 0.0) >= 0.9 else "HIGH",
                    )
                    db.add(event)
                    db.commit()

                    priority_event = self.priority.compute_priority_event(anomaly, payload.get("asset_id", "GENERATOR-G02"))

                    db_event = PriorityEvent(
                        timestamp=datetime.utcnow(),
                        station=priority_event["station"],
                        asset=priority_event["asset"],
                        anomaly=str(priority_event["anomaly"]),
                        priority=priority_event["priority"],
                        score=priority_event["score"],
                        anomaly_score=priority_event["anomaly_score"],
                        operational_impact=priority_event["operational_impact"],
                        trend=priority_event["trend"],
                    )
                    db.add(db_event)
                    db.commit()

                    self.queue_manager.enqueue_event(priority_event, category=priority_event["priority"])

                result = {"status": "stored", "reading_id": reading.id, "anomaly": anomaly}
                return result
            finally:
                db.close()

    def log(self, level: str, event: str, message: str):
        with db_lock:
            db = SessionLocal()
            try:
                log = SystemLog(level=level, event=event, message=message, timestamp=datetime.utcnow())
                db.add(log)
                db.commit()
            finally:
                db.close()

    def list_status(self):
        return {
            "edge_server": "ONLINE",
            "satellite": "CONNECTED",
            "local_database": "ONLINE",
            "ai_engine": "ONLINE",
            "station": "MAITRI",
        }

    def get_latest_sensors(self, station: str | None = None):
        db = SessionLocal()
        try:
            query = db.query(SensorReading)
            if station:
                query = query.filter(SensorReading.station_id == station.upper())
            readings = query.order_by(SensorReading.id.desc()).limit(20).all()
            return [self.serialize_reading(r) for r in readings]
        finally:
            db.close()

    def serialize_reading(self, r):
        return {
            "id": r.id,
            "station_id": r.station_id,
            "asset_id": r.asset_id,
            "sensor_type": r.sensor_type,
            "timestamp": str(r.timestamp),
            "temperature": r.temperature,
            "vibration": r.vibration,
            "load": r.load,
            "pressure": r.pressure,
            "voltage": r.voltage,
            "charge_percentage": r.charge_percentage,
            "indoor_temperature": r.indoor_temperature,
            "outside_temperature": r.outside_temperature,
            "wind_speed": r.wind_speed,
            "wind_direction": r.wind_direction,
            "humidity": r.humidity,
            "atmospheric_pressure": r.atmospheric_pressure,
            "status": r.status,
            "sync_status": r.sync_status,
            "anomaly_status": r.anomaly_status,
            "anomaly_score": r.anomaly_score,
            "is_anomaly": r.is_anomaly,
        }

    def get_history(self):
        db = SessionLocal()
        try:
            readings = db.query(SensorReading).order_by(SensorReading.id.desc()).limit(100).all()
            return [self.serialize_reading(r) for r in readings]
        finally:
            db.close()

    def get_anomalies(self):
        db = SessionLocal()
        try:
            items = db.query(AnomalyEvent).order_by(AnomalyEvent.id.desc()).limit(50).all()
            return [{
                "id": item.id,
                "timestamp": str(item.timestamp),
                "station": item.station,
                "asset": item.asset,
                "sensor_type": item.sensor_type,
                "anomaly_score": item.anomaly_score,
                "is_anomaly": item.is_anomaly,
                "severity": item.severity,
            } for item in items]
        finally:
            db.close()

    def get_events(self):
        db = SessionLocal()
        try:
            items = db.query(PriorityEvent).order_by(PriorityEvent.id.desc()).limit(50).all()
            return [{
                "id": item.id,
                "timestamp": str(item.timestamp),
                "station": item.station,
                "asset": item.asset,
                "anomaly": item.anomaly,
                "priority": item.priority,
                "score": item.score,
                "anomaly_score": item.anomaly_score,
                "operational_impact": item.operational_impact,
                "trend": item.trend,
            } for item in items]
        finally:
            db.close()

    def get_queue(self):
        db = SessionLocal()
        try:
            items = db.query(UplinkQueue).order_by(UplinkQueue.id.desc()).limit(50).all()
            return [{
                "id": item.id,
                "queue_category": item.queue_category,
                "station": item.station,
                "asset": item.asset,
                "payload": json.loads(item.payload) if item.payload else {},
                "sequence": item.sequence,
                "batch_id": item.batch_id,
                "created_at": str(item.created_at),
                "sync_status": item.sync_status,
            } for item in items]
        finally:
            db.close()

    def get_logs(self):
        db = SessionLocal()
        try:
            items = db.query(SystemLog).order_by(SystemLog.id.desc()).limit(30).all()
            return [{
                "id": item.id,
                "level": item.level,
                "event": item.event,
                "message": item.message,
                "timestamp": str(item.timestamp),
            } for item in items]
        finally:
            db.close()
