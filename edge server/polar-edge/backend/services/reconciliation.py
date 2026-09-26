from datetime import datetime

from database import SessionLocal
from database import db_lock
from models import SensorReading
from services.sync_client import SyncClient


class ReconciliationService:
    def __init__(self):
        self.last_successful_sync = None
        self.client = SyncClient()

    def sync_status(self):
        with db_lock:
            db = SessionLocal()
            try:
                synced_records = db.query(SensorReading).filter(SensorReading.sync_status == "SYNCED").count()
                buffered_records = db.query(SensorReading).filter(SensorReading.sync_status != "SYNCED").count()
                return {
                    "last_successful_sync": self.last_successful_sync or datetime.utcnow().isoformat() + "Z",
                    "pending_batches": (buffered_records + 99) // 100,
                    "synced_records": synced_records,
                    "buffered_records": buffered_records,
                }
            finally:
                db.close()

    def reconcile(self):
        with db_lock:
            db = SessionLocal()
            try:
                readings = (
                    db.query(SensorReading)
                    .filter(SensorReading.sync_status != "SYNCED")
                    .order_by(SensorReading.id)
                    .limit(100)
                    .all()
                )
                result = self.client.upload(readings, station="MAITRI")
                if result["status"] != "uploaded":
                    return result

                for reading in readings:
                    reading.sync_status = "SYNCED"
                db.commit()
                self.last_successful_sync = datetime.utcnow().isoformat() + "Z"
                return {
                    "status": "synchronization_complete",
                    "reconciled": len(readings),
                    "batch_id": result["batch_id"],
                }
            finally:
                db.close()
