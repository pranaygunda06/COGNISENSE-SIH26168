# COGNISENSE

**Adaptive AI Intelligence for GNSS-Denied Navigation**

> Smart India Hackathon 2026 · Problem Statement **SIH26168**  
> Theme: Smart Vehicles · Category: Software  
> Team: **NIRASYA**

---

## Problem

GNSS signals are frequently lost in tunnels, urban canyons, underground metros and dense foliage. Stand-alone smartphone IMUs drift rapidly. The challenge is to build a **lightweight, edge-deployable** Intelligent Dead Reckoning (IDR) system that:

- Fuses GNSS + IMU with an AI confidence layer
- Restricts positional drift to **&lt; 10 % of distance travelled** (or &lt; 5 m over 50 m) during blackouts
- Switches seamlessly between GNSS-aided and pure dead-reckoning modes
- Runs on ordinary smartphone sensors (no vehicle CAN bus required)

## Solution Overview

**COGNISENSE** continuously assesses the reliability of every sensor measurement and adaptively controls their influence on an Extended Kalman Filter (EKF).

| Component | Role |
|-----------|------|
| Adaptive EKF | 8-state filter (position, velocity, heading, accel/gyro biases) with confidence-scaled Q & R |
| Confidence-Aware AI | Online residual monitoring, IMU consistency checks, GNSS quality scoring |
| Sensor Bias Learner | Light-weight online bias estimation for accelerometer & gyroscope |
| Mode Manager | Instant transition to Dead Reckoning on outage & smooth GNSS recovery |
| Map / Motion Constraints | (Extensible) road-network & non-holonomic constraints |

## Repository Structure

```
├── python/                 # Core algorithms & offline simulation
│   ├── core/
│   │   ├── ekf.py          # Adaptive Extended Kalman Filter
│   │   └── ai_confidence.py
│   ├── simulation/
│   │   └── trajectory.py   # Synthetic IMU + GNSS generator + full pipeline
│   ├── run_demo.py         # CLI demo + metrics + optional plots
│   └── requirements.txt
├── web/                    # Interactive browser demo (Next.js)
│   └── src/
│       ├── app/            # UI
│       └── lib/simulation.ts  # Pure-TS port of the fusion engine
├── data/                   # Sample run outputs
└── docs/                   # Extra documentation
```

## Quick Start – Simulation (No Hardware)

### Python offline demo

```bash
cd python
pip install -r requirements.txt
python run_demo.py
```

You will see metrics such as:

```
Max position error during outage: ~X.XX m
Mean position error during outage: ~X.XX m
Drift ratio: ~X.X %
SIH target: PASS ✓
```

### Interactive Web Demo

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000, adjust outage window / speed / seed and click **Run Simulation**.  
All computation happens client-side; approximate navigation output is produced instantly from synthetic sensor streams.

## How Input → Output Works (No Hardware)

1. **Input** (simulated or recorded):
   - Timestamped accelerometer & gyroscope readings
   - Intermittent GNSS positions (or “unavailable” flags)
2. **Processing**:
   - AI layer computes per-sensor trust scores
   - EKF predicts with IMU, updates with GNSS when available
   - During outage pure dead-reckoning continues with elevated process noise awareness
3. **Output** (approximate but quantifiable):
   - Continuous position / velocity / heading estimates
   - Confidence timeline
   - Error statistics against ground-truth (in simulation)
   - Pass/fail against SIH drift target

Because the physics and filter are deterministic given the same seed, results are reproducible and suitable for evaluation without physical sensors.

## Performance Target (SIH)

> Dead Reckoning must restrict positional drift to less than **10 % of the total distance travelled** using smartphone IMUs during GNSS blackouts  
> (e.g. &lt; 5 m over 50 m in &lt; 1 min, or &lt; 100 m over 1 km at 60 km/h).

The simulation ships with configurable outage windows so you can verify the claim under different conditions.

## Tech Stack

- **Algorithms**: Python / NumPy, TypeScript port for the browser
- **Filter**: Adaptive EKF (UKF ready)
- **AI layer**: Online statistical confidence + residual learning (PyTorch-ready for deeper models)
- **Frontend**: Next.js 14, Tailwind, Recharts
- **Deployment**: Vercel (web demo) + GitHub

## Future / Hardware Path

When a smartphone is available:

1. Collect raw GNSS measurements + high-rate IMU via Android Sensors / GNSS APIs
2. Feed the same pipeline (already written to accept time-series arrays)
3. Optionally fine-tune the AI residual model on real data
4. Package as a Kotlin/React-Native mobile app for on-device inference

## References

- NATO STO – Navigation in GNSS-Denied Environments
- Jung et al., “Lane Detection Aided Online Dead Reckoning…”, Sensors 2021
- Android Raw GNSS Measurements
- Chen et al., “Inertial Navigation Meets Deep Learning”, arXiv 2023

## License

MIT – built for Smart India Hackathon 2026 by Team NIRASYA.

---

**COGNISENSE** – continuous navigation when the satellites disappear.
