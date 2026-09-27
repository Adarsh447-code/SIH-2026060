## environment
# 🧊 DRISHTI — SIH-2026060

> Real-time digital twin platform for India's Antarctic research stations **Maitri** and **Bharati**

## 1 DRISHTI
We are praposing DRISHTI, a Digital Twin based platform for the remote management of India’s Maitri and Bharati Antarctic research stations.
## 2 Praposed Solution
It Provides Unified Monitoring: Integrates infrastructure, energy, logistics, and environmental data into a single platform.

It is based on Edge–Mainland Architecture: Collects, validates, aggregates, compresses, and securely transmits station data.

It has AI-Powered Intelligence: Provides dashboards, anomaly detection, risk assessment, forecasting, and what-if scenario simulation.

Follows Data-Driven Management: Enables remote monitoring and informed decision-making using real and simulated data during the prototype phase.

## 3 How it address the Problem:
Unified Operations: Combines fragmented station data into a single operational view.

Connectivity Resilience: Reduces dependence on continuous satellite connectivity through local buffering and store-and-forward synchronization.

Early Risk Detection: Identifies equipment faults, energy shortages, environmental hazards, and inventory risks before they become critical.

## 4 Inovation & Uniqueness:
Unified Station Digital Twin: Integrates infrastructure, energy, logistics & environmental data into one station-specific digital twin.

Antarctic-Ready Architecture: Uses an edge-first approach for limited bandwidth and intermittent connectivity.

Scenario-Based Decision Support: Evaluates storms, generator failures, energy shortages, and shipment delays to compare risks and mitigation options.


---

## Architecture

```
[Edge Server] ─── SQLite ──→ Satellite Sync ──→ [Main Server] ─── PostgreSQL ──→ [Dashboard]
   Port 8000                  every 3 seconds      Port 8001                       Port 5173
```

| Layer | Tech | Details |
|-------|------|---------|
| **Frontend** | React 18 + TypeScript + Vite | Dashboard UI |
| **Main API** | FastAPI + SQLAlchemy | Mainland server |
| **Edge API** | FastAPI + SQLAlchemy | Station-side edge |
| **Main DB** | PostgreSQL 18 | `mainland_sensor_readings` |
| **Edge DB** | SQLite | `polar_edge.db` (60k+ demo rows) |
| **ML** | scikit-learn | IsolationForest anomaly detection |

---

## Quick Start

### 1 — Start PostgreSQL
```bash
sudo systemctl start postgresql@18-main
```

### 2 — Start Main Server (port 8001)
```bash
cd server
MAIN_DATABASE_URL="postgresql+psycopg://sonu:Test%4012345@127.0.0.1:5433/mydb" \
MAIN_SYNC_TOKEN="polar-twin-sync-2026" \
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8001
```

### 3 — Start Edge Server (port 8000)
```bash
cd "edge server/polar-edge/backend"
../../.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```

### 4 — Start Frontend (port 5173)
```bash
npm run dev
# Open http://localhost:5173
```

---

## Key Features

- ✅ **Real-time monitoring** — 10 second dashboard refresh from live PostgreSQL
- ✅ **Offline-first edge** — SQLite local buffer; no data loss when satellite drops
- ✅ **ML anomaly detection** — IsolationForest + Z-score on-device at edge
- ✅ **Dual-station support** — MAITRI and BHARATI independently tracked
- ✅ **Idempotent sync** — duplicate readings auto-rejected via UNIQUE constraint
- ✅ **Live freshness** — wall-clock `received_at` tracks actual data arrival
- ✅ **Secure sync** — Bearer token with `hmac.compare_digest`

---

## API Endpoints (Main Server)

| Endpoint | Description |
|----------|-------------|
| `POST /internal/edge-sync` | Ingest edge batch (auth required) |
| `GET /station/status?station=MAITRI` | Live station health + freshness |
| `GET /sensors/latest?station=MAITRI` | Latest reading per asset/sensor type |
| `GET /anomalies?station=MAITRI` | ML-detected anomaly events |
| `GET /events?station=MAITRI` | Priority events |
| `GET /telemetry/history` | Time-series data |
| `GET /weather?station=MAITRI` | Environmental conditions |

---

## Project Structure

```
60/
├── src/                          # React frontend
│   ├── App.tsx                   # Dashboard (2600 lines)
│   ├── api.ts                    # API client + types
│   └── types.ts                  # Shared types
├── server/                       # Main server (FastAPI + PostgreSQL)
│   ├── main.py                   # All REST endpoints
│   ├── models.py                 # MainlandReading SQLAlchemy model
│   ├── database.py               # Engine + session
│   └── .env                      # DB URL + sync token
├── edge server/polar-edge/backend/  # Edge server (FastAPI + SQLite)
│   ├── main.py                   # App + background threads
│   ├── services/
│   │   ├── sync_client.py        # HTTP sync to mainland
│   │   ├── reconciliation.py     # Pick + batch unsynced rows
│   │   └── data_processor.py     # Anomaly detection
│   └── sensors/                  # Per-type simulators
└── architecture/                 # Architecture diagrams (HTML + PNG)
```

---

*Smart India Hackathon 2026 | Problem #60 | Polar Infrastructure Monitoring*

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/c3ff501c-88ac-46e6-955c-0c66f280d079" />

<img width="1920" height="1020" alt="image" src="https://github.com/user-attachments/assets/c3904a45-97c5-43b1-973f-b59fb13b2104" />



