"use client";

import { useState, useMemo } from "react";
import { runSimulation, SimResult, SimConfig } from "@/lib/simulation";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import {
  Navigation, Activity, Shield, Zap, MapPin, Radio, Play,
  RefreshCw, CheckCircle2, AlertTriangle,
} from "lucide-react";

export default function Home() {
  const [config, setConfig] = useState<Partial<SimConfig>>({
    duration: 60, outageStart: 15, outageEnd: 40, speed: 15, seed: 42,
  });
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      const r = runSimulation(config);
      setResult(r);
      setRunning(false);
    }, 50);
  };

  const pathData = useMemo(() => {
    if (!result) return [];
    return result.t.map((ti, i) => ({
      t: +ti.toFixed(1),
      trueX: +result.trueX[i].toFixed(2),
      trueY: +result.trueY[i].toFixed(2),
      estX: +result.estX[i].toFixed(2),
      estY: +result.estY[i].toFixed(2),
      error: +result.error[i].toFixed(2),
      conf: +result.confidence[i].toFixed(3),
      gnss: +result.gnssTrust[i].toFixed(3),
      imu: +result.imuTrust[i].toFixed(3),
    }));
  }, [result]);

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-r from-sky-700 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-8 h-8" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">COGNISENSE</h1>
              </div>
              <p className="text-sky-100 text-sm sm:text-base">
                Adaptive AI Intelligence for GNSS-Denied Navigation
              </p>
              <p className="text-sky-200/80 text-xs mt-1">
                SIH 2026 · SIH26168 · Team NIRASYA · Smart Vehicles
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4" />
              <span>Simulation Mode (No Hardware Required)</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <section className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-sky-600" />
            Simulation Controls
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <label className="block">
              <span className="text-xs text-slate-500">Duration (s)</span>
              <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={config.duration} onChange={(e) => setConfig({ ...config, duration: +e.target.value })} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Outage Start (s)</span>
              <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={config.outageStart} onChange={(e) => setConfig({ ...config, outageStart: +e.target.value })} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Outage End (s)</span>
              <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={config.outageEnd} onChange={(e) => setConfig({ ...config, outageEnd: +e.target.value })} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Speed (m/s)</span>
              <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={config.speed} onChange={(e) => setConfig({ ...config, speed: +e.target.value })} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">Seed</span>
              <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={config.seed} onChange={(e) => setConfig({ ...config, seed: +e.target.value })} />
            </label>
            <div className="flex items-end">
              <button onClick={run} disabled={running}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-medium rounded-md px-4 py-2.5 text-sm transition">
                {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? "Running…" : "Run Simulation"}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Generates synthetic smartphone IMU + intermittent GNSS. During the outage the system switches to Dead Reckoning with AI-adapted noise models.
          </p>
        </section>

        {result && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><MapPin className="w-4 h-4" /> Max Outage Error</div>
                <p className="text-2xl font-bold text-slate-800">{result.metrics.maxErrorOutageM.toFixed(2)} <span className="text-base font-normal text-slate-500">m</span></p>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><Activity className="w-4 h-4" /> Mean Outage Error</div>
                <p className="text-2xl font-bold text-slate-800">{result.metrics.meanErrorOutageM.toFixed(2)} <span className="text-base font-normal text-slate-500">m</span></p>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1"><Radio className="w-4 h-4" /> Outage Distance</div>
                <p className="text-2xl font-bold text-slate-800">{result.metrics.outageDistanceM.toFixed(1)} <span className="text-base font-normal text-slate-500">m</span></p>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  {result.metrics.passesSihTarget ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  SIH Target
                </div>
                <p className={`text-2xl font-bold ${result.metrics.passesSihTarget ? "text-emerald-600" : "text-amber-600"}`}>
                  {result.metrics.passesSihTarget ? "PASS" : "TUNE"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Drift {(result.metrics.driftRatio * 100).toFixed(1)}% of distance</p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-3">Trajectory (Truth vs Estimate)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pathData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="trueX" type="number" name="X" unit="m" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="trueY" type="number" name="Y" unit="m" tick={{ fontSize: 11 }} />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="trueY" stroke="#10b981" dot={false} name="Truth Y" strokeWidth={2} />
                      <Line type="monotone" dataKey="estY" stroke="#0ea5e9" dot={false} name="Estimate Y" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-slate-800 mb-3">Position Error over Time</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pathData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="t" tick={{ fontSize: 11 }} unit="s" />
                      <YAxis tick={{ fontSize: 11 }} unit="m" />
                      <Tooltip />
                      <Area type="monotone" dataKey="error" stroke="#ef4444" fill="#fecaca" name="Error (m)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card lg:col-span-2">
                <h3 className="font-semibold text-slate-800 mb-3">AI Confidence & Sensor Trust</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pathData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="t" tick={{ fontSize: 11 }} unit="s" />
                      <YAxis domain={[0, 1.05]} tick={{ fontSize: 11 }} />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="conf" stroke="#0369a1" dot={false} name="Fusion Confidence" strokeWidth={2} />
                      <Line type="monotone" dataKey="gnss" stroke="#10b981" dot={false} name="GNSS Trust" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="imu" stroke="#f59e0b" dot={false} name="IMU Trust" strokeDasharray="2 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </>
        )}

        <section className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">System Highlights</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-sky-50 border border-sky-100">
              <strong className="text-sky-800">Adaptive EKF</strong>
              <p className="text-slate-600 mt-1">Process & measurement noise scaled by real-time AI confidence.</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <strong className="text-emerald-800">Confidence-Aware AI</strong>
              <p className="text-slate-600 mt-1">Learns residual patterns, monitors IMU consistency & GNSS quality.</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <strong className="text-amber-800">Seamless Mode Switch</strong>
              <p className="text-slate-600 mt-1">Instant transition to Dead Reckoning on GNSS blackout + smooth recovery.</p>
            </div>
            <div className="p-3 rounded-lg bg-violet-50 border border-violet-100">
              <strong className="text-violet-800">Smartphone Sensors</strong>
              <p className="text-slate-600 mt-1">Accel, Gyro, Magnetometer + Raw GNSS. No vehicle CAN required.</p>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
              <strong className="text-rose-800">Edge Deployable</strong>
              <p className="text-slate-600 mt-1">Lightweight core suitable for on-device inference.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <strong className="text-slate-800">SIH Target</strong>
              <p className="text-slate-600 mt-1">Drift &lt; 10% of distance or &lt; 5 m over 50 m GNSS-denied segment.</p>
            </div>
          </div>
        </section>

        <footer className="text-center text-xs text-slate-400 py-6">
          COGNISENSE · Team NIRASYA · Smart India Hackathon 2026 · Problem SIH26168
        </footer>
      </main>
    </div>
  );
}
