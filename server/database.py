import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

DATABASE_URL = os.getenv(
    "MAIN_DATABASE_URL",
    "postgresql+psycopg://sonu:Test%4012345@127.0.0.1:5433/mydb",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()