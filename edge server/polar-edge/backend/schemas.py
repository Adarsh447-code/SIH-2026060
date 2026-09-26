from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class SensorReadingCreate(BaseModel):
    station_id: str
    asset_id: str
    sensor_type: str
    timestamp: Optional[str] = None
    temperature: Optional[float] = None
    vibration: Optional[float] = None
    load: Optional[float] = None
    fuel_level: Optional[float] = None
    rpm: Optional[float] = None
    power_output: Optional[float] = None
    voltage: Optional[float] = None
    current: Optional[float] = None
    charge_percentage: Optional[float] = None
    indoor_temperature: Optional[float] = None
    outdoor_temperature: Optional[float] = None
    power_consumption: Optional[float] = None
    status: Optional[str] = None
    pressure: Optional[float] = None
    flow_rate: Optional[float] = None
    outside_temperature: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = Field(default=None, ge=0, le=360)
    humidity: Optional[float] = None
    atmospheric_pressure: Optional[float] = None

class StationStatus(BaseModel):
    station: str
    edge_server: str
    satellite: str
    local_operation: str
    last_mainland_sync: Optional[str]
    pending_uploads: int
    critical_events: int
    local_buffer: int
    data_freshness: str

class QueueItem(BaseModel):
    queue_category: str
    station: str
    asset: str
    payload: Dict[str, Any]

class NetworkStatus(BaseModel):
    connected: bool
    last_sync: Optional[str]
    pending_batches: int
    buffer_size: int
