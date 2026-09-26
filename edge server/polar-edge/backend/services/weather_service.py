import os
import re
import threading
import time
from datetime import datetime, timezone
from typing import Any

import requests


class WeatherService:
    endpoint = "https://api.open-meteo.com/v1/forecast"

    def __init__(self, locations=None, cache_seconds=600):
        configured_locations = locations if locations is not None else self._locations_from_environment()
        self.locations = self._normalize_locations(configured_locations)
        self.cache_seconds = cache_seconds
        self._cache = {}
        self._lock = threading.Lock()

    @staticmethod
    def _locations_from_environment() -> dict[str, dict[str, Any]]:
        locations = {}
        pattern = re.compile(r"^POLAR_WEATHER_(.+)_(LAT|LON|TIMEZONE|NAME)$")
        for key, value in os.environ.items():
            match = pattern.match(key)
            if match:
                station, field = match.groups()
                locations.setdefault(station.upper(), {})[field.lower()] = value

        if "MAITRI" not in locations and os.getenv("POLAR_WEATHER_LAT") and os.getenv("POLAR_WEATHER_LON"):
            locations["MAITRI"] = {
                "lat": os.environ["POLAR_WEATHER_LAT"],
                "lon": os.environ["POLAR_WEATHER_LON"],
                "timezone": os.getenv("POLAR_WEATHER_TIMEZONE", "UTC"),
            }
        return locations

    @staticmethod
    def _normalize_locations(locations: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
        normalized = {}
        for station, location in locations.items():
            try:
                normalized[station.upper()] = {
                    "latitude": float(location.get("latitude", location.get("lat"))),
                    "longitude": float(location.get("longitude", location.get("lon"))),
                    "timezone": location.get("timezone") or os.getenv("POLAR_WEATHER_TIMEZONE", "UTC"),
                    "name": location.get("name") or station,
                }
            except (AttributeError, TypeError, ValueError):
                continue
        return normalized

    def get_weather(self, station: str = "MAITRI") -> dict[str, Any]:
        station = station.strip().upper()
        location = self.locations.get(station)
        if location is None:
            return self._unavailable(station)

        with self._lock:
            now = time.monotonic()
            cached = self._cache.get(station)
            if cached and now - cached[0] < self.cache_seconds:
                return cached[1]

            try:
                response = requests.get(self.endpoint, params=self._params(location), timeout=8)
                response.raise_for_status()
                weather = self._normalize(response.json(), station, location)
                self._cache[station] = (now, weather)
                return weather
            except (requests.RequestException, ValueError, KeyError, TypeError):
                if cached:
                    return {**cached[1], "status": "stale"}
                return self._unavailable(station, location)

    @staticmethod
    def _params(location: dict[str, Any]) -> dict[str, Any]:
        return {
            "latitude": location["latitude"],
            "longitude": location["longitude"],
            "timezone": location["timezone"],
            "forecast_days": 7,
            "temperature_unit": "celsius",
            "wind_speed_unit": "kn",
            "current": ",".join((
                "temperature_2m",
                "relative_humidity_2m",
                "wind_speed_10m",
                "wind_direction_10m",
                "visibility",
            )),
            "daily": ",".join((
                "temperature_2m_max",
                "temperature_2m_min",
                "relative_humidity_2m_mean",
                "wind_speed_10m_max",
                "wind_direction_10m_dominant",
                "snowfall_sum",
                "visibility_min",
            )),
        }

    def _normalize(self, payload: dict[str, Any], station: str, location: dict[str, Any]) -> dict[str, Any]:
        current = payload["current"]
        current_units = payload.get("current_units", {})
        daily = payload["daily"]
        daily_units = payload.get("daily_units", {})
        forecast = []

        running_snow = 0.0
        for index, date in enumerate(daily["time"]):
            snow = self._at(daily, "snowfall_sum", index)
            snow_val = float(snow) if snow is not None else 0.0
            running_snow += snow_val
            forecast.append({
                "date": date,
                "temperature_high": self._at(daily, "temperature_2m_max", index),
                "temperature_low": self._at(daily, "temperature_2m_min", index),
                "humidity": self._at(daily, "relative_humidity_2m_mean", index),
                "wind_speed": self._at(daily, "wind_speed_10m_max", index),
                "wind_direction": self._at(daily, "wind_direction_10m_dominant", index),
                "snowfall": snow,
                "snow_accumulation": round(running_snow, 2),
                "visibility": self._meters_to_km(self._at(daily, "visibility_min", index)),
            })

        return {
            "status": "available",
            "source": "Open-Meteo",
            "station": station,
            "location": location["name"],
            "latitude": location["latitude"],
            "longitude": location["longitude"],
            "timezone": payload.get("timezone", location["timezone"]),
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "message": None,
            "units": {
                "temperature": current_units.get("temperature_2m", "°C"),
                "humidity": current_units.get("relative_humidity_2m", "%"),
                "wind_speed": current_units.get("wind_speed_10m", "kn"),
                "snowfall": daily_units.get("snowfall_sum", "cm"),
                "snow_accumulation": "cm",
                "visibility": "km",
            },
            "current": {
                "temperature": current.get("temperature_2m"),
                "humidity": current.get("relative_humidity_2m"),
                "wind_speed": current.get("wind_speed_10m"),
                "wind_direction": current.get("wind_direction_10m"),
                "visibility": self._meters_to_km(current.get("visibility")),
                "snow_accumulation": round(running_snow, 2) if forecast else 0.0,
            },
            "daily": forecast,
        }

    @staticmethod
    def _at(values: dict[str, list], key: str, index: int):
        items = values.get(key, [])
        return items[index] if index < len(items) else None

    @staticmethod
    def _meters_to_km(value):
        return round(value / 1000, 1) if value is not None else None

    @staticmethod
    def _unavailable(station: str, location: dict[str, Any] | None = None) -> dict[str, Any]:
        return {
            "status": "unavailable",
            "source": "Open-Meteo",
            "station": station,
            "location": location["name"] if location else station,
            "latitude": location["latitude"] if location else None,
            "longitude": location["longitude"] if location else None,
            "timezone": location["timezone"] if location else os.getenv("POLAR_WEATHER_TIMEZONE", "UTC"),
            "retrieved_at": None,
            "message": "Forecast location is not configured for this station." if location is None else "Weather provider is unavailable.",
            "units": {"temperature": "°C", "humidity": "%", "wind_speed": "kn", "snowfall": "cm", "visibility": "km"},
            "current": None,
            "daily": [],
        }