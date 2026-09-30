"""
COGNISENSE - Extended Kalman Filter for GNSS-INS Fusion
Adaptive process/measurement noise based on AI confidence scores.
"""

import numpy as np
from typing import Optional, Tuple


class AdaptiveEKF:
    """
    2D/3D Adaptive Extended Kalman Filter for vehicle navigation.
    State: [x, y, vx, vy, heading, bias_ax, bias_ay, bias_gyro]
    """

    def __init__(self, dt: float = 0.01, dim: int = 2):
        self.dt = dt
        self.dim = dim
        n = 8  # state dimension
        self.x = np.zeros(n)
        self.P = np.eye(n) * 10.0  # initial covariance

        # Base process noise
        self.Q_base = np.diag([
            0.01, 0.01,      # position
            0.1, 0.1,       # velocity
            0.001,          # heading
            1e-4, 1e-4,     # accel bias
            1e-5            # gyro bias
        ])

        # Base measurement noise (GNSS)
        self.R_gnss_base = np.diag([2.0, 2.0])  # meters

        self.confidence = 1.0  # AI confidence [0,1]
        self.gnss_available = True

    def set_confidence(self, conf: float):
        """AI layer sets sensor trust / confidence."""
        self.confidence = np.clip(conf, 0.05, 1.0)

    def predict(self, accel: np.ndarray, gyro_z: float):
        """
        Prediction step using IMU (body-frame accel + yaw rate).
        accel: [ax, ay] in body frame (m/s^2)
        gyro_z: yaw rate (rad/s)
        """
        x, y, vx, vy, h, bax, bay, bg = self.x
        dt = self.dt

        # Correct biases
        ax = accel[0] - bax
        ay = accel[1] - bay
        omega = gyro_z - bg

        # Rotate body accel to world
        cos_h = np.cos(h)
        sin_h = np.sin(h)
        ax_w = ax * cos_h - ay * sin_h
        ay_w = ax * sin_h + ay * cos_h

        # State transition (constant velocity + accel integration)
        self.x[0] = x + vx * dt + 0.5 * ax_w * dt**2
        self.x[1] = y + vy * dt + 0.5 * ay_w * dt**2
        self.x[2] = vx + ax_w * dt
        self.x[3] = vy + ay_w * dt
        self.x[4] = h + omega * dt
        # biases random walk (unchanged mean)

        # Jacobian F
        F = np.eye(8)
        F[0, 2] = dt
        F[0, 4] = (-vx * sin_h - vy * cos_h) * dt * 0  # simplified
        F[1, 3] = dt
        F[2, 4] = -ax * sin_h - ay * cos_h
        F[3, 4] = ax * cos_h - ay * sin_h
        F[4, 7] = -dt  # gyro bias effect

        # Adaptive Q: higher process noise when confidence low (trust IMU less)
        scale = 1.0 / max(self.confidence, 0.1)
        Q = self.Q_base * scale

        self.P = F @ self.P @ F.T + Q

        return self.x.copy()

    def update_gnss(self, pos: np.ndarray, pos_std: Optional[float] = None):
        """
        GNSS measurement update. pos = [x, y]
        """
        if not self.gnss_available:
            return self.x.copy()

        H = np.zeros((2, 8))
        H[0, 0] = 1.0
        H[1, 1] = 1.0

        z = pos
        y = z - H @ self.x  # innovation

        # Adaptive R: lower confidence → higher measurement noise (trust GNSS less)
        r_scale = 1.0 / max(self.confidence, 0.2)
        R = self.R_gnss_base * r_scale
        if pos_std is not None:
            R = np.diag([pos_std**2, pos_std**2]) * r_scale

        S = H @ self.P @ H.T + R
        K = self.P @ H.T @ np.linalg.inv(S)

        self.x = self.x + K @ y
        self.P = (np.eye(8) - K @ H) @ self.P

        return self.x.copy()

    def get_position(self) -> np.ndarray:
        return self.x[:2].copy()

    def get_velocity(self) -> np.ndarray:
        return self.x[2:4].copy()

    def get_heading(self) -> float:
        return float(self.x[4])

    def get_state(self) -> dict:
        return {
            "position": self.get_position().tolist(),
            "velocity": self.get_velocity().tolist(),
            "heading_deg": float(np.degrees(self.x[4])),
            "accel_bias": self.x[5:7].tolist(),
            "gyro_bias": float(self.x[7]),
            "confidence": float(self.confidence),
            "gnss_available": bool(self.gnss_available),
        }
