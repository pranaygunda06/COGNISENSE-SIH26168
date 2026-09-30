"use client";

import { useState, useMemo } from "react";
import { runSimulation, type SimResult, type SimConfig } from "@/lib/simulation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Navigation,
  Activity,
  Shield,
  Zap,
  MapPin,
  Radio,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  const [config, setConfig] = useState<Partial<SimConfig>>({
    duration: 60,
    outageStart: 15,
    outageEnd: 40,
    speed: 15,
    seed: 42,
  });
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    setTimeout(() => {
      setResult(runSimulation(config));
      setRunning(false);
    }, 40);
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-sky-700 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-8 h-8" />
                <h1 className="text-2xl sm:text-3xl font-bold">COGNISENSE</h1>
              </div>
              <p className="text-sky-100">Adaptive AI for GNSS-Denied Navigation</p>
              <p className="text-sky-200/80 text-xs mt-1">SIH 2026 · SIH26168 · Team NIRASYA</p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-2">
              <Shield className="w-4 h-4" /> Simulation Mode
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-sky-600" /> Simulation Controls
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            {([
              ["duration", "Duration (s)"],
              ["outageStart", "Outage Start (s)"],
              ["outageEnd", "Outage End (s)"],
              ["speed", "Speed (m/s)"],
              ["seed", "Seed"],
            ] as const).map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs text-slate-500">{label}</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={(config as any)[key]}
                  onChange={(e) => setConfig({ ...config, [key]: +e.target.value })}
                />
              </label>
            ))}
            <div className="flex items-end">
              <button
                onClick={run}
                disabled={running}
                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md px-4 py-2.5 text-sm"
              >
                {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? "Running…" : "Run Simulation"}
              </button>
            </div>
          </div>
        </section>

        {result && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <div className="text-slate-500 text-sm mb-1">Max Outage Error</div>
                <p className="text-2xl font-bold">{result.metrics.maxErrorOutageM.toFixed(2)} m</p>
              </div>
              <div className="card">
                <div className="text-slate-500 text-sm mb-1">Mean Outage Error</div>
                <p className="text-2xl font-bold">{result.metrics.meanErrorOutageM.toFixed(2)} m</p>
              </div>
              <div className="card">
                <div className="text-slate-500 text-sm mb-1">Outage Distance</div>
                <p className="text-2xl font-bold">{result.metrics.outageDistanceM.toFixed(1)} m</p>
              </div>
              <div className="card">
                <div className="text-slate-500 text-sm mb-1">SIH Target</div>
                <p className={`text-2xl font-bold ${result.metrics.passesSihTarget ? "text-emerald-600" : "text-amber-600"}`}>
                  {result.metrics.passesSihTarget ? "PASS" : "TUNE"}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-semibold mb-3">Trajectory</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pathData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="trueX" type="number" />
                      <YAxis dataKey="trueY" type="number" />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="trueY" stroke="#10b981" dot={false} name="Truth" strokeWidth={2} />
                      <Line type="monotone" dataKey="estY" stroke="#0ea5e9" dot={false} name="Estimate" strokeWidth={2} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card">
                <h3 className="font-semibold mb-3">Position Error</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pathData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="error" stroke="#ef4444" fill="#fecaca" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card lg:col-span-2">
                <h3 className="font-semibold mb-3">AI Confidence</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pathData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="t" />
                      <YAxis domain={[0, 1.05]} />
                      <Tooltip /><Legend />
                      <Line type="monotone" dataKey="conf" stroke="#0369a1" dot={false} name="Fusion" strokeWidth={2} />
                      <Line type="monotone" dataKey="gnss" stroke="#10b981" dot={false} name="GNSS" />
                      <Line type="monotone" dataKey="imu" stroke="#f59e0b" dot={false} name="IMU" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </>
        )}

        <footer className="text-center text-xs text-slate-400 py-6">
          COGNISENSE · Team NIRASYA · SIH 2026 · SIH26168
        </footer>
      </main>
    </div>
  );
}
