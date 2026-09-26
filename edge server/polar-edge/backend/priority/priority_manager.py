from datetime import datetime

class PriorityManager:
    def __init__(self):
        self.asset_criticality = {
            "GENERATOR-G02": 100,
            "BATTERY-B01": 95,
            "WATER-PUMP-P01": 80,
            "HVAC-H01": 60,
            "ENV-SENSOR-E01": 30,
        }

    def score_priority(self, anomaly, asset_id, operational_impact=90, trend=80):
        asset_value = self.asset_criticality.get(asset_id, 50)
        anomaly_severity = anomaly.get("anomaly_score", 0) * 100
        priority = int(0.40 * anomaly_severity + 0.30 * asset_value + 0.20 * operational_impact + 0.10 * trend)
        if priority <= 25:
            return "LOW", min(25, priority)
        if priority <= 50:
            return "MEDIUM", min(50, priority)
        if priority <= 75:
            return "HIGH", min(75, priority)
        return "CRITICAL", min(100, priority)

    def compute_priority_event(self, anomaly, asset_id, operational_impact=90, trend=80):
        priority_label, score = self.score_priority(anomaly, asset_id, operational_impact, trend)
        return {
            "priority": priority_label,
            "score": score,
            "timestamp": datetime.utcnow().isoformat(),
            "station": anomaly.get("station", "MAITRI"),
            "asset": anomaly.get("asset", asset_id),
            "anomaly": anomaly.get("is_anomaly", False),
            "anomaly_score": anomaly.get("anomaly_score", 0.0),
            "operational_impact": operational_impact,
            "trend": trend,
        }
