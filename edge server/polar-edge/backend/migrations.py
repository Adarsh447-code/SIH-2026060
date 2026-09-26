from sqlalchemy import inspect, text


def migrate_sensor_readings(engine):
    if not inspect(engine).has_table("sensor_readings"):
        return

    columns = {column["name"] for column in inspect(engine).get_columns("sensor_readings")}
    if "wind_direction" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE sensor_readings ADD COLUMN wind_direction FLOAT"))