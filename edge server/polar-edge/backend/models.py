from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy import JSON
from database import Base
from datetime import datetime

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(String(64), nullable=False)
    asset_id = Column(String(128), nullable=False)
    sensor_type = Column(String(64), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temperature = Column(Float, nullable=True)
    vibration = Column(Float, nullable=True)
    load = Column(Float, nullable=True)
    fuel_level = Column(Float, nullable=True)
    rpm = Column(Float, nullable=True)
    power_output = Column(Float, nullable=True)
    voltage = Column(Float, nullable=True)
    current = Column(Float, nullable=True)
    charge_percentage = Column(Float, nullable=True)
    indoor_temperature = Column(Float, nullable=True)
    outdoor_temperature = Column(Float, nullable=True)
    power_consumption = Column(Float, nullable=True)
    status = Column(String(64), nullable=True)
    pressure = Column(Float, nullable=True)
    flow_rate = Column(Float, nullable=True)
    outside_temperature = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    atmospheric_pressure = Column(Float, nullable=True)
    sync_status = Column(String(32), default="PENDING")
    anomaly_status = Column(String(32), default="NORMAL")
    anomaly_score = Column(Float, default=0.0)
    is_anomaly = Column(String(8), default="FALSE")

class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    station = Column(String(64), nullable=False)
    asset = Column(String(128), nullable=False)
    sensor_type = Column(String(64), nullable=False)
    anomaly_score = Column(Float, default=0.0)
    is_anomaly = Column(String(8), default="FALSE")
    severity = Column(String(32), default="LOW")

class PriorityEvent(Base):
    __tablename__ = "priority_events"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    station = Column(String(64), nullable=False)
    asset = Column(String(128), nullable=False)
    anomaly = Column(String(64), nullable=False)
    priority = Column(String(32), default="LOW")
    score = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    operational_impact = Column(Float, default=0.0)
    trend = Column(Float, default=0.0)

class UplinkQueue(Base):
    __tablename__ = "uplink_queue"

    id = Column(Integer, primary_key=True, index=True)
    queue_category = Column(String(32), default="LOW")
    station = Column(String(64), nullable=False)
    asset = Column(String(128), nullable=False)
    payload = Column(Text, nullable=False)
    sequence = Column(Integer, default=0)
    batch_id = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    sync_status = Column(String(32), default="PENDING")

class SyncBatch(Base):
    __tablename__ = "sync_batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(128), unique=True, nullable=False)
    station = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    sequence = Column(Integer, default=0)
    records = Column(Integer, default=0)
    total_records = Column(Integer, default=0)
    status = Column(String(32), default="PENDING")
    payload = Column(Text, nullable=True)

class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(32), default="INFO")
    event = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
