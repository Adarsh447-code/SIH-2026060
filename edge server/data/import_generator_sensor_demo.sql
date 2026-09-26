BEGIN;

CREATE TEMP TABLE generator_sensor_import (
    reading_timestamp timestamp,
    station_id text,
    asset_id text,
    temperature_c double precision,
    vibration_mm_s double precision,
    load_percent double precision,
    rpm double precision,
    fuel_percent double precision,
    power_kw double precision,
    reading_status text,
    fault_type text,
    maintenance_required boolean,
    anomaly boolean,
    anomaly_severity text,
    priority_score double precision,
    priority_level text
);

\copy generator_sensor_import FROM 'edge server/data/generator_sensor_demo.csv' WITH (FORMAT csv, HEADER true)

INSERT INTO sensor_readings (
    station_id,
    asset_id,
    sensor_type,
    timestamp,
    temperature,
    vibration,
    load,
    fuel_level,
    rpm,
    power_output,
    status,
    sync_status,
    anomaly_status,
    anomaly_score,
    is_anomaly
)
SELECT
    station_id,
    asset_id,
    'generator',
    reading_timestamp,
    temperature_c,
    vibration_mm_s,
    load_percent,
    fuel_percent,
    rpm,
    power_kw,
    reading_status,
    'PENDING',
    CASE WHEN anomaly THEN 'ANOMALY' ELSE 'NORMAL' END,
    CASE WHEN anomaly THEN 1.0 ELSE 0.0 END,
    CASE WHEN anomaly THEN 'TRUE' ELSE 'FALSE' END
FROM generator_sensor_import
WHERE NOT EXISTS (
        SELECT 1
        FROM sensor_readings existing
        WHERE existing.station_id = generator_sensor_import.station_id
            AND existing.asset_id = generator_sensor_import.asset_id
            AND existing.sensor_type = 'generator'
            AND existing.timestamp = generator_sensor_import.reading_timestamp
);

INSERT INTO anomaly_events (
    timestamp,
    station,
    asset,
    sensor_type,
    anomaly_score,
    is_anomaly,
    severity
)
SELECT
    reading_timestamp,
    station_id,
    asset_id,
    'generator',
    1.0,
    'TRUE',
    anomaly_severity
FROM generator_sensor_import
WHERE anomaly
    AND NOT EXISTS (
            SELECT 1
            FROM anomaly_events existing
            WHERE existing.station = generator_sensor_import.station_id
                AND existing.asset = generator_sensor_import.asset_id
                AND existing.sensor_type = 'generator'
                AND existing.timestamp = generator_sensor_import.reading_timestamp
    );

INSERT INTO priority_events (
    timestamp,
    station,
    asset,
    anomaly,
    priority,
    score,
    anomaly_score,
    operational_impact,
    trend
)
SELECT
    reading_timestamp,
    station_id,
    asset_id,
    COALESCE(NULLIF(fault_type, 'NONE'), 'GENERATOR_ANOMALY'),
    priority_level,
    priority_score,
    1.0,
    priority_score,
    0.0
FROM generator_sensor_import
WHERE anomaly
    AND NOT EXISTS (
            SELECT 1
            FROM priority_events existing
            WHERE existing.station = generator_sensor_import.station_id
                AND existing.asset = generator_sensor_import.asset_id
                AND existing.timestamp = generator_sensor_import.reading_timestamp
                AND existing.anomaly = COALESCE(NULLIF(generator_sensor_import.fault_type, 'NONE'), 'GENERATOR_ANOMALY')
    );

COMMIT;

SELECT 'sensor_readings' AS table_name, count(*) AS imported_rows
FROM sensor_readings
WHERE sensor_type = 'generator'
UNION ALL
SELECT 'anomaly_events', count(*)
FROM anomaly_events
WHERE sensor_type = 'generator'
UNION ALL
SELECT 'priority_events', count(*)
FROM priority_events
WHERE station = 'MAITRI' AND asset = 'GEN-G01';
