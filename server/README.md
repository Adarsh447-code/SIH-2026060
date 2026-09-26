# Mainland server

The root project is the mainland service. It stores edge batches in PostgreSQL.

```bash
cd server
pip install -r requirements.txt
export MAIN_DATABASE_URL='postgresql+psycopg://sonu@127.0.0.1:5433/mydb'
export MAIN_SYNC_TOKEN='your-edge-sync-token'
uvicorn main:app --host 0.0.0.0 --port 9000
```

The edge server uses SQLite locally and sends batches to:

```text
http://localhost:9000/internal/edge-sync
```

The Vite dashboard may continue running separately on port `5175`.