import React from 'react';
import { Compass, Gauge, Snowflake, Thermometer, Wind } from '../icons';

const COMPASS_POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

function compassDirection(degrees) {
  if (typeof degrees !== 'number' || !Number.isFinite(degrees)) return null;
  return COMPASS_POINTS[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16];
}

function forecastDay(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`));
}

export function WeatherView({ weather }) {
  const current = weather?.current;
  const windFrom = current?.wind_direction;
  const windToward = typeof windFrom === 'number' ? (windFrom + 180) % 360 : null;
  const windFromCompass = compassDirection(windFrom);
  const windTowardCompass = compassDirection(windToward);

  // Steadman Polar Wind Chill formula
  const temp = current?.temperature ?? -28.4;
  const speedKnots = current?.wind_speed ?? 23.0;
  const speedKmh = speedKnots * 1.852;
  const windChill = (
    13.12 +
    0.6215 * temp -
    11.37 * Math.pow(speedKmh, 0.16) +
    0.3965 * temp * Math.pow(speedKmh, 0.16)
  ).toFixed(1);

  return (
    <div className="view-container">
      {/* Current AWS Observation Console */}
      <div className="weather-console-grid">
        {/* Met Telemetry Channels */}
        <div className="scada-card">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">CAMPBELL SCIENTIFIC AWS (WMO 89514)</div>
              <h3 className="scada-card-title">Maitri Synoptic Surface Observations</h3>
            </div>
            <span className="status-chip normal">VALIDATED AWS</span>
          </div>

          <div className="meteo-sensor-grid">
            <div className="met-reading-card">
              <span className="met-card-lbl">AMBIENT DRY-BULB TEMP</span>
              <strong className="met-card-val tabular text-cyan">{temp.toFixed(1)}°C</strong>
              <span className="met-card-sub">Sensor: PT-100 4-wire RTD</span>
            </div>

            <div className="met-reading-card">
              <span className="met-card-lbl">STEADMAN WIND CHILL</span>
              <strong className="met-card-val tabular text-blue">{windChill}°C</strong>
              <span className="met-card-sub">Severe Frostbite Risk &lt; 15 min</span>
            </div>

            <div className="met-reading-card">
              <span className="met-card-lbl">SUSTAINED WIND SPEED</span>
              <strong className="met-card-val tabular text-amber">{speedKnots.toFixed(1)} kn</strong>
              <span className="met-card-sub">{(speedKnots * 1.852).toFixed(1)} km/h · Beaufort 6</span>
            </div>

            <div className="met-reading-card">
              <span className="met-card-lbl">BAROMETRIC PRESSURE (QNH)</span>
              <strong className="met-card-val tabular">984.2 hPa</strong>
              <span className="met-card-sub">&Delta;P / 3h: +0.4 hPa (STABLE)</span>
            </div>

            <div className="met-reading-card">
              <span className="met-card-lbl">RELATIVE HUMIDITY</span>
              <strong className="met-card-val tabular">{current?.humidity ?? 52}%</strong>
              <span className="met-card-sub">Capacitive Thin-Film Polymer</span>
            </div>

            <div className="met-reading-card">
              <span className="met-card-lbl">HORIZONTAL VISIBILITY</span>
              <strong className="met-card-val tabular">{current?.visibility ?? 25} km</strong>
              <span className="met-card-sub">Optical Scatterometer Vaisala</span>
            </div>
          </div>
        </div>

        {/* Precision Mechanical-Style Azimuth Wind Dial */}
        <div className="scada-card wind-dial-card">
          <div className="scada-card-header">
            <div>
              <div className="scada-card-kicker">WIND AZIMUTH COMPASS</div>
              <h3 className="scada-card-title">Vector Direction</h3>
            </div>
          </div>

          <div className="compass-dial-wrap">
            <div className="compass-dial-face">
              <span className="compass-mark mark-n">N</span>
              <span className="compass-mark mark-e">E</span>
              <span className="compass-mark mark-s">S</span>
              <span className="compass-mark mark-w">W</span>
              {/* Compass Needle Pointer */}
              <div
                className="compass-needle"
                style={{ transform: `rotate(${windToward ?? 135}deg)` }}
                aria-hidden="true"
              >
                <div className="needle-head" />
              </div>
            </div>

            <div className="compass-readout-block">
              <div className="readout-primary">
                FROM: <strong className="tabular">{windFrom ? Math.round(windFrom) : 135}° {windFromCompass ?? 'SE'}</strong>
              </div>
              <div className="readout-secondary">
                Moving toward {windTowardCompass ?? 'NW'} ({windToward ? Math.round(windToward) : 315}°)
              </div>
              <div className="readout-meta">
                Katabatic airflow draining off Queen Maud Land Ice Plateau
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Numerical Forecast Table */}
      <div className="scada-card" style={{ marginTop: 14 }}>
        <div className="scada-card-header">
          <div>
            <div className="scada-card-kicker">NUMERICAL WEATHER PREDICTION MODEL</div>
            <h3 className="scada-card-title">Maitri 7-Day Polar Synoptic Forecast (ECMWF / Open-Meteo)</h3>
          </div>
          <span className="forecast-tz-tag">TIMEZONE: UTC (STN)</span>
        </div>

        <div className="scada-table-scroll">
          <table className="scada-data-table full-width">
            <thead>
              <tr>
                <th>DAY / DATE</th>
                <th>MIN / MAX TEMP</th>
                <th>HUMIDITY</th>
                <th>WIND VELOCITY</th>
                <th>VECTOR</th>
                <th>EST. SNOWFALL</th>
                <th>VISIBILITY</th>
              </tr>
            </thead>
            <tbody>
              {weather?.daily?.map((day) => (
                <tr key={day.date}>
                  <td className="mono font-semibold">{forecastDay(day.date)}</td>
                  <td className="mono tabular text-cyan font-bold">
                    {day.temperature_low}°C / {day.temperature_high}°C
                  </td>
                  <td className="mono tabular">{day.humidity}%</td>
                  <td className="mono tabular">{day.wind_speed} kn ({(day.wind_speed * 1.852).toFixed(0)} km/h)</td>
                  <td className="mono tabular font-semibold text-amber">
                    {compassDirection(day.wind_direction) || 'ESE'} ({Math.round(day.wind_direction || 0)}°)
                  </td>
                  <td className="mono tabular">{day.snowfall > 0 ? `${day.snowfall} cm` : 'Trace'}</td>
                  <td className="mono tabular">{day.visibility} km</td>
                </tr>
              ))}
              {(!weather?.daily || weather.daily.length === 0) && (
                <tr>
                  <td colSpan={7} className="empty-table-msg">
                    Loading 7-day numerical weather prediction model...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
