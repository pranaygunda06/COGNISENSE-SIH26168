# COGNISENSE Architecture

## High-Level Data Flow

```
Smartphone Sensors
   ├── Accelerometer  ──┐
   ├── Gyroscope      ──┤
   ├── Magnetometer   ──┼──► AI Confidence Layer ──► Adaptive Gains (Q, R)
   └── GNSS (raw)     ──┘              │
                                       ▼
                              Adaptive EKF / UKF
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
              Position / Velocity   Heading / Bias     Mode Flag
                    │                  │                  │
                    └──────────────────┼──────────────────┘
                                       ▼
                              Navigation Output
                         (map-matched, constrained)
```

## State Vector (EKF)

```
x = [p_x, p_y, v_x, v_y, ψ, b_ax, b_ay, b_ω]
```

- Position (m)
- Velocity (m/s)
- Heading (rad)
- Accelerometer biases
- Gyroscope bias (yaw rate)

## AI Confidence Layer

Inputs:
- GNSS innovation residual magnitude
- HDOP / satellite count (when available)
- IMU magnitude consistency
- Gyro activity / noise level

Outputs:
- `gnss_trust ∈ [0,1]`
- `imu_trust ∈ [0,1]`
- `fusion_confidence` used to scale process & measurement noise matrices

When GNSS is lost the filter automatically raises process-noise awareness and continues pure inertial propagation (Dead Reckoning). On GNSS re-acquisition the measurement update resumes with appropriate trust weighting, producing a smooth recovery.

## Simulation Mode

Because physical hardware is not required for development and demonstration:

1. A kinematic trajectory generator produces ground-truth states.
2. Realistic smartphone-grade noise + constant biases are added to IMU.
3. GNSS positions are corrupted with typical urban noise and completely removed inside a configurable outage window.
4. The identical fusion pipeline used for real data is executed.
5. Position error, drift ratio and SIH pass/fail metrics are computed against ground truth.

This allows rapid iteration, reproducible benchmarks and a fully functional web demo that anyone can run in a browser.
