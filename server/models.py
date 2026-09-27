import json
from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text, UniqueConstraint

from database import Base


class MainlandReading(Base):
    __tablename__ = "mainland_sensor_readings"
    __table_args__ = (UniqueConstraint("station_id", "edge_reading_id"),)

    id = Column(Integer, primary_key=True)
    edge_reading_id = Column(Integer, nullable=False)
    station_id = Column(String(64), nullable=False)
    asset_id = Column(String(128), nullable=False)
    sensor_type = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    received_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    payload = Column(Text, nullable=False)

    @classmethod
    def from_edge(cls, reading, station):
        return cls(
            edge_reading_id=reading["edge_reading_id"],
            station_id=reading.get("station_id") or station,
            asset_id=reading.get("asset_id", "unknown"),
            sensor_type=reading.get("sensor_type", "unknown"),
            timestamp=datetime.fromisoformat(
                str(reading.get("timestamp", datetime.utcnow().isoformat())).replace("Z", "+00:00")
            ).replace(tzinfo=None),
            payload=json.dumps(reading),
        )