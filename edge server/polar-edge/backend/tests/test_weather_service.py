import unittest
import os
from unittest.mock import Mock, patch

import requests
from sqlalchemy import create_engine, inspect, text

from migrations import migrate_sensor_readings
from services.weather_service import WeatherService


def forecast_payload():
    return {
        "timezone": "UTC",
        "current_units": {"temperature_2m": "°C", "relative_humidity_2m": "%", "wind_speed_10m": "kn"},
        "daily_units": {"snowfall_sum": "cm"},
        "current": {
            "temperature_2m": -18.0,
            "relative_humidity_2m": 72,
            "wind_speed_10m": 18.0,
            "wind_direction_10m": 135,
            "visibility": 12500,
        },
        "daily": {
            "time": ["2026-09-26"],
            "temperature_2m_max": [-12.0],
            "temperature_2m_min": [-24.0],
            "relative_humidity_2m_mean": [70],
            "wind_speed_10m_max": [25.0],
            "wind_direction_10m_dominant": [140],
            "snowfall_sum": [2.4],
            "visibility_min": [6400],
        },
    }


class WeatherServiceTests(unittest.TestCase):
    def setUp(self):
        self.locations = {
            "MAITRI": {"latitude": -70.0, "longitude": 11.0, "timezone": "UTC", "name": "Maitri"},
            "BHARATI": {"latitude": -69.0, "longitude": 76.0, "timezone": "UTC", "name": "Bharati"},
        }

    @patch("services.weather_service.requests.get")
    def test_normalizes_current_and_daily_values(self, get):
        response = Mock()
        response.json.return_value = forecast_payload()
        get.return_value = response
        weather = WeatherService(self.locations).get_weather("MAITRI")

        self.assertEqual(weather["status"], "available")
        self.assertEqual(weather["station"], "MAITRI")
        self.assertEqual(weather["location"], "Maitri")
        self.assertEqual(weather["current"]["wind_direction"], 135)
        self.assertEqual(weather["current"]["visibility"], 12.5)
        self.assertEqual(weather["daily"][0]["visibility"], 6.4)
        self.assertEqual(weather["daily"][0]["snowfall"], 2.4)
        self.assertEqual(get.call_args.kwargs["params"]["forecast_days"], 7)
        self.assertEqual(get.call_args.kwargs["params"]["latitude"], -70.0)

    @patch("services.weather_service.requests.get")
    def test_returns_stale_success_on_provider_failure(self, get):
        response = Mock()
        response.json.return_value = forecast_payload()
        get.side_effect = [response, requests_error()]
        weather = WeatherService(self.locations, cache_seconds=0)

        self.assertEqual(weather.get_weather("MAITRI")["status"], "available")
        self.assertEqual(weather.get_weather("MAITRI")["status"], "stale")

    @patch("services.weather_service.requests.get", side_effect=requests.ConnectionError("offline"))
    def test_returns_unavailable_without_cached_data(self, get):
        weather = WeatherService(self.locations).get_weather("MAITRI")
        self.assertEqual(weather["status"], "unavailable")
        self.assertEqual(weather["daily"], [])

    @patch("services.weather_service.requests.get")
    def test_fetches_and_caches_each_station_independently(self, get):
        response = Mock()
        response.json.return_value = forecast_payload()
        get.return_value = response
        weather_service = WeatherService(self.locations)

        maitri = weather_service.get_weather("MAITRI")
        bharati = weather_service.get_weather("BHARATI")
        maitri_again = weather_service.get_weather("MAITRI")

        self.assertEqual(maitri["location"], "Maitri")
        self.assertEqual(bharati["location"], "Bharati")
        self.assertEqual(maitri_again["station"], "MAITRI")
        self.assertEqual(get.call_count, 2)
        self.assertEqual(get.call_args_list[0].kwargs["params"]["latitude"], -70.0)
        self.assertEqual(get.call_args_list[1].kwargs["params"]["latitude"], -69.0)

    @patch("services.weather_service.requests.get")
    def test_unconfigured_station_is_unavailable_without_provider_call(self, get):
        weather = WeatherService(locations={}).get_weather("BHARATI")

        self.assertEqual(weather["status"], "unavailable")
        self.assertEqual(weather["station"], "BHARATI")
        self.assertIn("not configured", weather["message"])
        get.assert_not_called()

    def test_loads_station_locations_from_environment(self):
        station_environment = {
            "POLAR_WEATHER_MAITRI_LAT": "-70.0",
            "POLAR_WEATHER_MAITRI_LON": "11.0",
            "POLAR_WEATHER_BHARATI_LAT": "-69.0",
            "POLAR_WEATHER_BHARATI_LON": "76.0",
            "POLAR_WEATHER_BHARATI_NAME": "Bharati Station",
        }
        with patch.dict(os.environ, station_environment):
            weather_service = WeatherService()

        self.assertEqual(weather_service.locations["MAITRI"]["latitude"], -70.0)
        self.assertEqual(weather_service.locations["BHARATI"]["longitude"], 76.0)
        self.assertEqual(weather_service.locations["BHARATI"]["name"], "Bharati Station")


def requests_error():
    return requests.ConnectionError("offline")


class SensorMigrationTests(unittest.TestCase):
    def test_adds_optional_column_without_losing_existing_rows(self):
        engine = create_engine("sqlite://")
        with engine.begin() as connection:
            connection.execute(text("CREATE TABLE sensor_readings (id INTEGER PRIMARY KEY, sensor_type VARCHAR(64))"))
            connection.execute(text("INSERT INTO sensor_readings (id, sensor_type) VALUES (1, 'environmental')"))

        migrate_sensor_readings(engine)
        migrate_sensor_readings(engine)

        columns = {column["name"] for column in inspect(engine).get_columns("sensor_readings")}
        with engine.connect() as connection:
            reading = connection.execute(text("SELECT id, sensor_type, wind_direction FROM sensor_readings")).one()
        self.assertIn("wind_direction", columns)
        self.assertEqual(reading, (1, "environmental", None))
        engine.dispose()


if __name__ == "__main__":
    unittest.main()