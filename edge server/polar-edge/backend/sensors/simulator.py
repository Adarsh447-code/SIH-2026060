import random
import time
from datetime import datetime, timezone
from typing import Dict, Any

class SensorSimulator:
    def __init__(self):
        self.generator_anomaly = False
        self.pump_anomaly = False
        self.battery_anomaly = False
        self.station_id = "MAITRI"

    def generate_reading(self, sensor_type: str = "generator") -> Dict[str, Any]:
        now = datetime.utcnow().isoformat() + 'Z'
        if sensor_type == "generator":
            base = {
                "station_id": self.station_id,
                "asset_id": "GENERATOR-G02",
                "sensor_type": "generator",
                "timestamp": now,
                "temperature": random.uniform(75,90) if not self.generator_anomaly else random.uniform(100,115),
                "vibration": random.uniform(2,5) if not self.generator_anomaly else random.uniform(8,15),
                "load": random.uniform(60,90) if not self.generator_anomaly else random.uniform(95,100),
                "fuel_level": random.uniform(40,80),
                "rpm": random.uniform(420,520),
                "power_output": random.uniform(250,450),
                "status": "NORMAL" if not self.generator_anomaly else "ANOMALY",
            }
            return base
        elif sensor_type == "battery":
            base = {
                "station_id": self.station_id,
                "asset_id": "BATTERY-B01",
                "sensor_type": "battery",
                "timestamp": now,
                "voltage": random.uniform(48,52) if not self.battery_anomaly else random.uniform(40,45),
                "current": random.uniform(20,80) if not self.battery_anomaly else random.uniform(100,150),
                "charge_percentage": random.uniform(82,96) if not self.battery_anomaly else random.uniform(40,60),
                "temperature": random.uniform(20,30),
                "status": "NORMAL" if not self.battery_anomaly else "ANOMALY",
            }
            return base
        elif sensor_type == "hvac":
            return {
                "station_id": self.station_id,
                "asset_id": "HVAC-H01",
                "sensor_type": "hvac",
                "timestamp": now,
                "indoor_temperature": random.uniform(18,22),
                "outdoor_temperature": random.uniform(-30,-12),
                "power_consumption": random.uniform(1.5,4.0),
                "status": "NORMAL",
            }
        elif sensor_type == "pump":
            base = {
                "station_id": self.station_id,
                "asset_id": "WATER-PUMP-P01",
                "sensor_type": "pump",
                "timestamp": now,
                "pressure": random.uniform(50,75) if not self.pump_anomaly else random.uniform(85,105),
                "flow_rate": random.uniform(30,70) if not self.pump_anomaly else random.uniform(10,20),
                "vibration": random.uniform(1,4) if not self.pump_anomaly else random.uniform(8,12),
                "temperature": random.uniform(15,30),
                "status": "NORMAL" if not self.pump_anomaly else "ANOMALY",
            }
            return base
        elif sensor_type == "environmental":
            return {
                "station_id": self.station_id,
                "asset_id": "ENV-SENSOR-E01",
                "sensor_type": "environmental",
                "timestamp": now,
                "outside_temperature": random.uniform(-25,-10),
                "wind_speed": random.uniform(10,35),
                "wind_direction": random.uniform(0,360),
                "humidity": random.uniform(30,80),
                "atmospheric_pressure": random.uniform(970,1030),
                "status": "NORMAL",
            }
        return {}

    def trigger_anomaly(self, asset: str):
        if asset == "generator":
            self.generator_anomaly = True
        elif asset == "pump":
            self.pump_anomaly = True
        elif asset == "battery":
            self.battery_anomaly = True
        return {"status": "anomaly_triggered", "asset": asset}

    def reset_anomaly(self, asset: str):
        if asset == "generator":
            self.generator_anomaly = False
        elif asset == "pump":
            self.pump_anomaly = False
        elif asset == "battery":
            self.battery_anomaly = False
        return {"status": "normal_operation", "asset": asset}
