import { Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

import type { Station } from "../types";
import { StationToggle } from "./StationToggle";

export function LoginPage({
  station,
  setStation,
  onLogin,
}: {
  station: Station;
  setStation: (station: Station) => void;
  onLogin: () => void;
}) {
  const [email, setEmail] = useState("controller.ops@ncpor.res.in");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Please provide authorized operator credentials.");
      return;
    }
    setError("");
    onLogin();
  };

  return (
    <main className="login-shell">
      <div className="gov-ribbon" style={{ position: "fixed", top: 0, left: 0, right: 0 }}>
        <i /><i /><i />
      </div>

      <div className="login-card" role="region" aria-labelledby="login-title">
        <div className="login-header">
          <div className="login-header-emblem">
            <div className="brand-emblem" style={{ width: 36, height: 36 }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="agency-logo-text">NATIONAL CENTRE FOR POLAR & OCEAN RESEARCH</div>
              <div className="agency-logo-sub">Ministry of Earth Sciences · Government of India</div>
            </div>
          </div>
          <h1 id="login-title">Polar Digital Twin Operations</h1>
          <p>Mainland Telemetry & Mission Control System (NCPOR HQ, Goa)</p>
        </div>

        <form className="login-body" onSubmit={submit} noValidate>
          <div className="form-group">
            <label>Operational Station Assignment</label>
            <StationToggle station={station} onSelect={setStation} />
          </div>

          <div className="form-group">
            <label htmlFor="operator-email">Operator ID / Email</label>
            <div className="form-input-box">
              <UserRound size={15} />
              <input
                id="operator-email"
                type="email"
                placeholder="operator@ncpor.res.in"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="operator-password">Access Passphrase</label>
            <div className="form-input-box">
              <LockKeyhole size={15} />
              <input
                id="operator-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter clearance passphrase"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="icon-btn"
                style={{ width: 26, height: 26 }}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && <div style={{ color: "#ef4444", fontSize: 11, fontFamily: "var(--font-mono)" }}>{error}</div>}

          <button className="btn btn-primary" style={{ width: "100%", padding: "10px", marginTop: 4 }} type="submit">
            <LogIn size={15} /> Authenticate & Access Telemetry
          </button>
        </form>

        <div className="login-footer-notice">
          <span>CLASSIFICATION: OFFICIAL USE ONLY</span>
          <span style={{ color: "#34d399" }}>● ENCRYPTED LINK</span>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
        Smart India Hackathon · Polar Digital Twin Operational Interface
      </div>
    </main>
  );
}
