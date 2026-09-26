# Graph Report - edge server  (2026-09-17)

## Corpus Check
- Corpus is ~4,004 words - fits in a single context window. You may not need a graph.

## Summary
- 169 nodes · 292 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 19 edges (avg confidence: 0.95)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- API and Satellite
- Frontend Dashboard
- Data Persistence
- Project Architecture
- Sensor Simulation
- Anomaly Detection
- Data Processing
- Domain Concepts
- API Schemas
- Uplink Queueing
- Edge System Vision

## God Nodes (most connected - your core abstractions)
1. `DataProcessor` - 23 edges
2. `FastAPI Backend` - 13 edges
3. `UplinkQueue` - 12 edges
4. `QueueManager` - 12 edges
5. `AnomalyDetector` - 9 edges
6. `SyncBatch` - 9 edges
7. `SensorSimulator` - 9 edges
8. `PriorityManager` - 8 edges
9. `SensorReading` - 7 edges
10. `PriorityEvent` - 7 edges

## Surprising Connections (you probably didn't know these)
- `DataProcessor` --uses--> `AnomalyDetector`  [INFERRED]
  polar-edge/backend/services/data_processor.py → polar-edge/backend/ai/anomaly_detector.py
- `network_status()` --uses--> `SyncBatch`  [INFERRED]
  polar-edge/backend/main.py → polar-edge/backend/models.py
- `network_status()` --uses--> `UplinkQueue`  [INFERRED]
  polar-edge/backend/main.py → polar-edge/backend/models.py
- `create_sensor_reading()` --uses--> `SensorReadingCreate`  [INFERRED]
  polar-edge/backend/main.py → polar-edge/backend/schemas.py
- `DataProcessor` --uses--> `SensorReading`  [INFERRED]
  polar-edge/backend/services/data_processor.py → polar-edge/backend/models.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **POLAR TWIN edge architecture flow** — polar_edge_readme_sensor, polar_edge_readme_edge_collector, polar_edge_readme_validation, polar_edge_readme_local_storage, polar_edge_readme_isolation_forest, polar_edge_readme_anomaly_event, polar_edge_readme_priority_manager, polar_edge_readme_priority_queue, polar_edge_readme_satellite, polar_edge_readme_mainland_server [EXTRACTED 1.00]

## Communities (11 total, 2 thin omitted)

### Community 0 - "API and Satellite"
Cohesion: 0.09
Nodes (25): fastapi, fastapi_middleware_cors, get, on_event, anomalies(), create_sensor_reading(), events(), health() (+17 more)

### Community 1 - "Frontend Dashboard"
Cohesion: 0.09
Nodes (23): dependencies, react, react-dom, recharts, vite, @vitejs/plugin-react, devDependencies, name (+15 more)

### Community 2 - "Data Persistence"
Cohesion: 0.19
Nodes (16): Base, datetime, json, os, station_status(), AnomalyEvent, PriorityEvent, SensorReading (+8 more)

### Community 3 - "Project Architecture"
Cohesion: 0.12
Nodes (19): FastAPI, NumPy, Pydantic, python-dotenv, Requests, scikit-learn, SQLAlchemy, Uvicorn standard (+11 more)

### Community 4 - "Sensor Simulation"
Cohesion: 0.15
Nodes (5): PriorityManager, Any, SensorSimulator, random, time

### Community 5 - "Anomaly Detection"
Cohesion: 0.21
Nodes (8): csv, ndarray, numpy, Path, pathlib, AnomalyDetector, Any, sklearn_ensemble

### Community 7 - "Domain Concepts"
Cohesion: 0.20
Nodes (10): Anomaly Event, Edge Collector, Isolation Forest, Local Storage, Mainland Server, Priority Manager, Priority Queue, Satellite (+2 more)

### Community 8 - "API Schemas"
Cohesion: 0.43
Nodes (6): BaseModel, NetworkStatus, QueueItem, SensorReadingCreate, StationStatus, pydantic

### Community 10 - "Edge System Vision"
Cohesion: 0.67
Nodes (3): Remote Antarctic research station operations, Edge Intelligence & Connectivity Layer, POLAR TWIN

## Knowledge Gaps
- **31 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+26 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 67 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DataProcessor` connect `Data Processing` to `API and Satellite`, `Data Persistence`, `Sensor Simulation`, `Anomaly Detection`, `Uplink Queueing`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `AnomalyDetector` connect `Anomaly Detection` to `API and Satellite`, `Data Persistence`, `Sensor Simulation`, `Data Processing`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `SensorSimulator` connect `Sensor Simulation` to `API and Satellite`, `Data Persistence`, `Data Processing`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `DataProcessor` (e.g. with `AnomalyDetector` and `AnomalyEvent`) actually correct?**
  _`DataProcessor` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `UplinkQueue` (e.g. with `network_status()` and `station_status()`) actually correct?**
  _`UplinkQueue` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `QueueManager` (e.g. with `DataProcessor` and `SyncBatch`) actually correct?**
  _`QueueManager` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._