import os
from datetime import datetime
from typing import Any, Dict, Iterable

import requests

from models import SensorReading


class SyncClient:
    def __init__(self):
        self.url = os.getenv("MAIN_SYNC_URL", "http://127.0.0.1:8001/internal/edge-sync").strip()
        self.token = os.getenv("MAIN_SYNC_TOKEN", "polar-twin-sync-2026").strip()

    def upload(self, readings: Iterable[SensorReading], station: str) -> Dict[str, Any]:
        readings = list(readings)
        url = (os.getenv("MAIN_SYNC_URL") or self.url or "http://127.0.0.1:8001/internal/edge-sync").strip()
        token = (os.getenv("MAIN_SYNC_TOKEN") or self.token or "polar-twin-sync-2026").strip()
        if not url:
            return {"status": "not_configured", "uploaded": 0}
        if not readings:
            return {"status": "nothing_to_sync", "uploaded": 0}

        batch_id = f"{station}-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
        payload = {
            "batch_id": batch_id,
            "station": station,
            "readings": [self.serialize(reading) for reading in readings],
        }
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            return {"status": "failed", "uploaded": 0, "error": str(exc)}
        return {"status": "uploaded", "batch_id": batch_id, "uploaded": len(readings)}

    @staticmethod
    def serialize(reading: SensorReading) -> Dict[str, Any]:
        result = {}
        for column in SensorReading.__table__.columns:
            value = getattr(reading, column.name)
            result[column.name] = value.isoformat() if isinstance(value, datetime) else value
        result["edge_reading_id"] = reading.id
        return result