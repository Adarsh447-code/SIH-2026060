# POLAR TWIN – Edge Intelligence & Connectivity Layer

A complete runnable local-first edge server prototype for remote Antarctic research station operations.

The edge backend stores sensor readings, anomaly events, priority events, sync
queues, and system logs using SQLAlchemy. Configure `DATABASE_URL` to use
PostgreSQL; SQLite remains the fallback when it is unset.

## Project architecture

Sensor
→ Edge Collector
→ Validation
→ Local Storage
→ Isolation Forest
→ Anomaly Event
→ Priority Manager
→ Priority Queue
→ Satellite
→ Mainland Server

The prototype implements a FastAPI backend with simulated sensor streams, SQLite
persistence, an Isolation Forest-style anomaly detector, deterministic priority
scoring, a local uplink queue, satellite simulation, and a React dashboard.

## Running the backend

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env
# Set DATABASE_URL in ../.env to the local PostgreSQL connection string.
export MAIN_SYNC_URL=http://localhost:9000/internal/edge-sync
export MAIN_SYNC_TOKEN=your-edge-sync-token
uvicorn main:app --reload --port 8000
```

The `.env.example` template targets the local PostgreSQL database using Unix
socket authentication. Adjust the user, socket path, port, or database for your
setup. For TCP connections, include credentials in your local `.env` and do not
commit them. `DATABASE_URL=sqlite:///./polar_edge.db` can be set to use SQLite.

Weather forecasts use the public Open-Meteo API and do not require an API key.
Set `POLAR_WEATHER_<STATION>_LAT` and `POLAR_WEATHER_<STATION>_LON` from the
approved station registry in the backend environment. For example, the keys
are `POLAR_WEATHER_MAITRI_LAT`, `POLAR_WEATHER_MAITRI_LON`,
`POLAR_WEATHER_BHARATI_LAT`, and `POLAR_WEATHER_BHARATI_LON`. Optional
`POLAR_WEATHER_<STATION>_TIMEZONE` and `POLAR_WEATHER_<STATION>_NAME` values
control display timezone and station label. No coordinates are embedded in
application code. The legacy `POLAR_WEATHER_LAT` and `POLAR_WEATHER_LON`
variables remain supported for MAITRI during migration.

`GET /weather?station=MAITRI` and `GET /weather?station=BHARATI` return the
selected station forecast.
The backend caches each station separately for ten minutes. If a refresh fails,
that station's last successful response is returned with `status: "stale"`; if
there is no cached response, `status: "unavailable"` is returned with an empty
forecast. Missing station coordinates return unavailable without querying the
provider.
Weather values are provider model estimates for the station coordinates, not
on-site sensor observations. Temperatures are in Celsius, wind speed in knots,
humidity in percent, snowfall in centimetres, and visibility in kilometres.
The wind bearing is the direction the wind comes from; the dashboard's vector
points in the opposite direction to show where it travels.

The edge schema is created automatically in the configured database. On startup,
the generator demo CSV is imported into `sensor_readings`, `anomaly_events`, and
`priority_events`. Existing sensor rows are skipped using station, asset, sensor
type, and timestamp, so restarting the server does not duplicate imported data.

## Running the frontend

```bash
cd frontend
npm install
npm run dev
```

## API endpoints

- `GET /health`
- `GET /station/status`
- `GET /weather?station=<station-id>`
- `GET /sensors/latest?station=<station-id>`
- `GET /sensors/history`
- `GET /anomalies`
- `GET /events`
- `GET /queue`
- `GET /network/status`
- `POST /network/toggle`
- `POST /simulation/generator/anomaly`
- `POST /simulation/pump/anomaly`
- `POST /simulation/battery/anomaly`
- `POST /sync/start`
- `GET /sync/status`

`GET /weather?station=<station-id>` returns current provider conditions and up
to seven daily summaries, including temperature range, humidity, wind,
snowfall, and visibility. Each unavailable provider value is `null`; the
response includes the requested station, source, configured coordinates,
timezone, units, retrieval timestamp, and freshness status.
`GET /sensors/latest?station=<station-id>` returns readings only for the
selected station. The sensor table's optional `wind_direction` field is added
safely to existing databases at startup without changing existing rows.

`POST /sync/start` uploads up to 100 pending sensor readings to
`MAIN_SYNC_URL`. Readings are marked `SYNCED` only after the main server
returns a successful response. If `MAIN_SYNC_URL` is unset or unavailable,
readings remain in the local database for a later retry.

The main server must accept this JSON shape at `MAIN_SYNC_URL` and use
`edge_reading_id` for idempotent inserts:

```json
{
  "batch_id": "MAITRI-20260925-120000",
  "station": "MAITRI",
  "readings": [{"edge_reading_id": 42, "station_id": "MAITRI"}]
}
```

## Demo controls

The UI includes simulation control buttons: normal operation, trigger generator anomaly, trigger water pump anomaly, trigger battery anomaly, disconnect satellite, and restore satellite.

## Sample sensor payload

```json
{
  "station_id": "MAITRI",
  "asset_id": "GENERATOR-G02",
  "sensor_type": "generator",
  "temperature": 108.7,
  "vibration": 11.4,
  "load": 97.2,
  "fuel_level": 54.5,
  "rpm": 481.0,
  "power_output": 392.2
}
```

## Sample API response

```json
{
  "status": "stored",
  "reading_id": 42,
  "anomaly": {
    "is_anomaly": true,
    "anomaly_score": 0.9,
    "station": "MAITRI",
    "asset": "GENERATOR-G02",
    "sensor_type": "generator"
  }
}
```

## Why this architecture fits Antarctic edge environments

The architecture is local-first. It stores telemetry in PostgreSQL on the station server, performs AI anomaly detection on the station server, determines event priority locally, and buffers uplink data for satellite transmission. This keeps operations active even when the satellite link is unavailable.
