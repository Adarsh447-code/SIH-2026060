import threading
import time
from datetime import datetime
from typing import Any, Dict

from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ai.anomaly_detector import AnomalyDetector
from database import Base, SessionLocal, engine
from migrations import migrate_sensor_readings
from models import AnomalyEvent, PriorityEvent, SensorReading, SyncBatch, SystemLog, UplinkQueue
from network.satellite import SatelliteSimulator
from priority.priority_manager import PriorityManager
from schemas import SensorReadingCreate
from sensors.simulator import SensorSimulator
from services.data_processor import DataProcessor
from services.demo_importer import import_generator_demo_data
from services.queue_manager import QueueManager
from services.reconciliation import ReconciliationService
from services.weather_service import WeatherService

app = FastAPI(title="POLAR TWIN Edge Intelligence & Connectivity Layer")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

simulator = SensorSimulator()
satellite = SatelliteSimulator()
processor = DataProcessor()
queue_manager = QueueManager()
reconciliation = ReconciliationService()
priority = PriorityManager()
weather_service = WeatherService()

Base.metadata.create_all(bind=engine)
migrate_sensor_readings(engine)


@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    migrate_sensor_readings(engine)
    import_generator_demo_data()
    processor.log("INFO", "system_started", "POLAR TWIN edge server started")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "polar-twin-edge",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/station/status")
def station_status():
    db = SessionLocal()
    try:
        total_readings = db.query(SensorReading).count()
        pending_uploads = db.query(UplinkQueue).filter(UplinkQueue.sync_status != "SYNCED").count()
        critical_events = db.query(PriorityEvent).filter(PriorityEvent.priority == "CRITICAL").count()
    finally:
        db.close()

    return {
        "station": "MAITRI",
        "edge_server": "ONLINE",
        "satellite": "CONNECTED" if satellite.connected else "OFFLINE",
        "local_operation": "ACTIVE",
        "last_mainland_sync": satellite.last_sync or "---",
        "pending_uploads": pending_uploads,
        "critical_events": critical_events,
        "local_buffer": total_readings,
        "data_freshness": "LIVE",
    }


@app.get("/sensors/latest")
def latest_sensors(station: str | None = None):
    return processor.get_latest_sensors(station)


@app.get("/weather")
def weather(station: str = "MAITRI"):
    return weather_service.get_weather(station)


@app.get("/sensors/history")
def sensors_history():
    return processor.get_history()


@app.get("/anomalies")
def anomalies():
    return processor.get_anomalies()


@app.get("/events")
def events():
    return processor.get_events()


@app.get("/queue")
def queue():
    return processor.get_queue()


@app.get("/logs")
def logs():
    return processor.get_logs()


@app.get("/network/status")
def network_status():
    status = satellite.status()
    db = SessionLocal()
    try:
        status["pending_batches"] = db.query(SyncBatch).filter(SyncBatch.status == "PENDING").count()
        status["buffer_size"] = db.query(UplinkQueue).filter(UplinkQueue.sync_status != "SYNCED").count()
    finally:
        db.close()
    return status


@app.post("/network/toggle")
def network_toggle(payload: Dict[str, Any] = Body(default={})):
    action = payload.get("action") or payload.get("state") or payload.get("status")
    connected = payload.get("connected")

    if isinstance(connected, bool):
        satellite.connected = connected
    else:
        satellite.toggle(action=action)

    processor.log(
        "INFO",
        "satellite_disconnected" if not satellite.connected else "satellite_restored",
        "Satellite link toggled",
    )

    if satellite.connected:
        batch = queue_manager.create_batch(station="MAITRI")
        reconciliation.reconcile()
        return {"connected": True, "message": "satellite restored", "status": "synced", "batch": batch}

    return {"connected": False, "message": "satellite disconnected", "status": "offline"}


@app.post("/simulation/generator/anomaly")
def trigger_generator_anomaly():
    simulator.trigger_anomaly("generator")
    return processor.ingest_reading(simulator.generate_reading("generator"))


@app.post("/simulation/pump/anomaly")
def trigger_pump_anomaly():
    simulator.trigger_anomaly("pump")
    return processor.ingest_reading(simulator.generate_reading("pump"))


@app.post("/simulation/battery/anomaly")
def trigger_battery_anomaly():
    simulator.trigger_anomaly("battery")
    return processor.ingest_reading(simulator.generate_reading("battery"))


@app.post("/simulation/normal")
def normal_operation():
    simulator.reset_anomaly("generator")
    simulator.reset_anomaly("pump")
    simulator.reset_anomaly("battery")
    processor.log("INFO", "normal_operation", "Simulation returned to normal operation")
    return {"status": "normal_operation"}


@app.post("/sync/start")
def sync_start():
    batch = queue_manager.create_batch(station="MAITRI")
    if batch.get("batch_id"):
        processor.log("INFO", "batch_created", f"Batch {batch['batch_id']} created")
    reconciliation.reconcile()
    return {
        "status": "sync_started",
        "priority_order": ["CRITICAL", "HIGH", "MEDIUM", "LOW", "HISTORICAL"],
        "batch": batch,
    }


@app.get("/sync/status")
def sync_status():
    return reconciliation.sync_status()


@app.post("/sensors")
def create_sensor_reading(reading: SensorReadingCreate):
    payload = reading.model_dump(exclude_none=True)
    payload["sensor_type"] = payload.get("sensor_type", "unknown")
    payload["station_id"] = payload.get("station_id", "MAITRI")
    payload["asset_id"] = payload.get("asset_id", "GENERATOR-G02")
    payload["timestamp"] = payload.get("timestamp") or datetime.utcnow().isoformat() + "Z"
    if not payload.get("station_id") or not payload.get("asset_id") or not payload.get("sensor_type"):
        raise HTTPException(status_code=400, detail="Required sensor fields missing")
    return processor.ingest_reading(payload)


@app.post("/sensors/stream")
def stream_sensor():
    results = []
    for sensor_type in ["generator", "battery", "hvac", "pump", "environmental"]:
        results.append(processor.ingest_reading(simulator.generate_reading(sensor_type)))
    return {"status": "streamed", "results": results}


def run_streamer():
    while True:
        try:
            for sensor_type in ["generator", "battery", "hvac", "pump", "environmental"]:
                processor.ingest_reading(simulator.generate_reading(sensor_type))
                time.sleep(0.05)
        except Exception as exc:
            processor.log("ERROR", "sensor_stream_error", str(exc))
        time.sleep(1)


threading.Thread(target=run_streamer, daemon=True).start()
