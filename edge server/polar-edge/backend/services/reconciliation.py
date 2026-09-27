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

    def reconcile(self, station: str = None):
        with db_lock:
            db = SessionLocal()
            try:
                query = db.query(SensorReading).filter(SensorReading.sync_status != "SYNCED")
                if station:
                    query = query.filter(SensorReading.station_id == station)
                readings = query.order_by(SensorReading.id).limit(200).all()
                if not readings:
                    return {"status": "nothing_to_sync", "reconciled": 0}

                # Group by station
                stations_present = {r.station_id or "MAITRI" for r in readings}
                total_reconciled = 0
                last_batch_id = None

                for st in stations_present:
                    st_readings = [r for r in readings if (r.station_id or "MAITRI") == st]
                    result = self.client.upload(st_readings, station=st)
                    if result.get("status") == "uploaded":
                        for reading in st_readings:
                            reading.sync_status = "SYNCED"
                        total_reconciled += len(st_readings)
                        last_batch_id = result.get("batch_id")
                    else:
                        return result

                db.commit()
                if total_reconciled > 0:
                    self.last_successful_sync = datetime.utcnow().isoformat() + "Z"
                return {
                    "status": "synchronization_complete",
                    "reconciled": total_reconciled,
                    "batch_id": last_batch_id,
                }
            finally:
                db.close()
