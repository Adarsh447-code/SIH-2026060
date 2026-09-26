import hmac
import os
from typing import Any, Dict

from fastapi import Body, FastAPI, Header, HTTPException
from sqlalchemy.exc import IntegrityError

from database import Base, SessionLocal, engine
from models import MainlandReading

app = FastAPI(title="Polar Twin Mainland Server")
Base.metadata.create_all(bind=engine)


def authorize(authorization: str | None) -> None:
    expected = os.getenv("MAIN_SYNC_TOKEN", "")
    supplied = authorization.removeprefix("Bearer ") if authorization else ""
    if not expected or not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Invalid sync token")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "polar-twin-mainland"}


@app.post("/internal/edge-sync")
def receive_edge_batch(
    batch: Dict[str, Any] = Body(...),
    authorization: str | None = Header(default=None),
) -> Dict[str, Any]:
    authorize(authorization)
    station = batch.get("station")
    readings = batch.get("readings")
    if not station or not isinstance(readings, list):
        raise HTTPException(status_code=400, detail="station and readings are required")

    db = SessionLocal()
    inserted = 0
    duplicates = 0
    try:
        for reading in readings:
            if reading.get("edge_reading_id") is None:
                raise HTTPException(status_code=400, detail="edge_reading_id is required")
            try:
                with db.begin_nested():
                    db.add(MainlandReading.from_edge(reading, station))
                    db.flush()
                inserted += 1
            except IntegrityError:
                duplicates += 1
        db.commit()
    finally:
        db.close()

    return {"status": "accepted", "batch_id": batch.get("batch_id"), "inserted": inserted, "duplicates": duplicates}