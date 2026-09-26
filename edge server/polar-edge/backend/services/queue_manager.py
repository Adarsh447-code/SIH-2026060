import json
from datetime import datetime
from typing import Any, Dict, List

from database import SessionLocal, db_lock
from models import SyncBatch, UplinkQueue


class QueueManager:
    def __init__(self):
        self.priority_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "HISTORICAL"]
        self.priority_rank = {name: index for index, name in enumerate(self.priority_order)}

    def enqueue_event(self, event: Dict[str, Any], category: str = "LOW") -> Dict[str, Any]:
        with db_lock:
            db = SessionLocal()
            try:
                item = UplinkQueue(
                    queue_category=category.upper(),
                    station=event.get("station", "MAITRI"),
                    asset=event.get("asset", "GENERATOR-G02"),
                    payload=json.dumps(event),
                    sequence=0,
                    batch_id=None,
                    created_at=datetime.utcnow(),
                    sync_status="PENDING",
                )
                db.add(item)
                db.commit()
                return {"status": "queued", "category": category.upper()}
            finally:
                db.close()

    def get_pending_queue_counts(self) -> Dict[str, int]:
        with db_lock:
            db = SessionLocal()
            try:
                counts = {}
                for category in self.priority_order:
                    counts[category] = (
                        db.query(UplinkQueue)
                        .filter(UplinkQueue.queue_category == category)
                        .filter(UplinkQueue.sync_status != "SYNCED")
                        .count()
                    )
                return counts
            finally:
                db.close()

    def get_sync_ready_items(self) -> List[UplinkQueue]:
        with db_lock:
            db = SessionLocal()
            try:
                items = db.query(UplinkQueue).filter(UplinkQueue.sync_status != "SYNCED").all()
                return sorted(items, key=lambda item: (self.priority_rank.get(item.queue_category, 99), item.created_at))
            finally:
                db.close()

    def create_batch(self, station: str = "MAITRI") -> Dict[str, Any]:
        with db_lock:
            db = SessionLocal()
            try:
                pending = [item for item in db.query(UplinkQueue).filter(UplinkQueue.sync_status != "SYNCED").all()]
                pending = sorted(pending, key=lambda item: (self.priority_rank.get(item.queue_category, 99), item.created_at))
                if not pending:
                    return {"batch_id": None, "records": 0}

                now = datetime.utcnow()
                batch_id = f"{station}-{now.strftime('%Y%m%d-%H%M%S')}"
                records = len(pending)
                batch = SyncBatch(
                    batch_id=batch_id,
                    station=station,
                    created_at=now,
                    sequence=int(now.timestamp()),
                    records=records,
                    total_records=records,
                    status="PENDING",
                    payload=json.dumps({"records": records, "priority_order": self.priority_order}),
                )
                db.add(batch)
                db.commit()
                for item in pending:
                    item.batch_id = batch_id
                    item.sync_status = "QUEUED"
                db.commit()
                return {"batch_id": batch_id, "records": records}
            finally:
                db.close()

