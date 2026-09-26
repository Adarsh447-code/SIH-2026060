from datetime import datetime


class SatelliteSimulator:
    def __init__(self):
        self.connected = True
        self.last_sync = None
        self.priority_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "HISTORICAL"]

    def status(self):
        return {
            "connected": self.connected,
            "last_sync": self.last_sync or datetime.utcnow().isoformat() + "Z",
            "pending_batches": 0,
            "buffer_size": 0,
        }

    def toggle(self, action: str | None = None):
        if action is None:
            self.connected = not self.connected
        else:
            action = action.upper()
            if action in {"CONNECTED", "RESTORE", "ON"}:
                self.connected = True
            elif action in {"DISCONNECTED", "OFFLINE", "OFF", "DISCONNECT"}:
                self.connected = False
            else:
                self.connected = not self.connected

        if self.connected:
            self.last_sync = datetime.utcnow().isoformat() + "Z"
            return {"connected": True, "message": "satellite restored"}
        return {"connected": False, "message": "satellite disconnected"}

    def queue_order(self):
        return self.priority_order
