"""
COGNISENSE - AI Confidence Layer
Learns sensor error patterns and outputs trust scores for adaptive fusion.
Lightweight model suitable for edge (smartphone) deployment.
"""

import numpy as np
from collections import deque
from typing import Deque, Optional, Tuple


class ConfidenceAwareAI:
    """
    Confidence-Aware AI Layer.
    - Monitors innovation residuals, IMU consistency, GNSS quality
    - Outputs per-sensor trust scores [0,1]
    - Simple online statistics + optional tiny neural residual predictor
    """

    def __init__(self, window: int = 50):
        self.window = window
        self.gnss_residuals: Deque[float] = deque(maxlen=window)
        self.imu_consistency: Deque[float] = deque(maxlen=window)
        self.accel_mag_history: Deque[float] = deque(maxlen=window)
        self.gyro_history: Deque[float] = deque(maxlen=window)

        # Simple learned bias offsets (online)
        self.bias_ax = 0.0
        self.bias_ay = 0.0
        self.bias_gyro = 0.0
        self.lr = 0.001  # learning rate for online bias

        self.last_gnss_conf = 1.0
        self.last_imu_conf = 1.0

    def update_gnss_quality(self, residual_norm: float, hdop: float = 1.0, num_sats: int = 8):
        """Call when GNSS measurement arrives."""
        self.gnss_residuals.append(residual_norm)
        # Quality score from HDOP & sats
        sat_score = min(num_sats / 10.0, 1.0)
        hdop_score = max(0.0, 1.0 - (hdop - 1.0) / 5.0)
        residual_score = max(0.0, 1.0 - residual_norm / 20.0)
        conf = 0.4 * sat_score + 0.3 * hdop_score + 0.3 * residual_score
        self.last_gnss_conf = float(np.clip(conf, 0.05, 1.0))
        return self.last_gnss_conf

    def update_imu(self, accel: np.ndarray, gyro_z: float, expected_accel_mag: float = 9.81):
        """
        Monitor IMU health.
        accel in body frame (m/s^2), including gravity when static.
        """
        mag = np.linalg.norm(accel)
        self.accel_mag_history.append(mag)
        self.gyro_history.append(abs(gyro_z))

        # Consistency: magnitude should be near g when low dynamics, or reasonable otherwise
        mag_err = abs(mag - expected_accel_mag)
        # During motion expected can vary; use soft check
        consistency = max(0.0, 1.0 - mag_err / 5.0)
        self.imu_consistency.append(consistency)

        avg_cons = np.mean(self.imu_consistency) if self.imu_consistency else 0.8
        gyro_activity = np.mean(self.gyro_history) if self.gyro_history else 0.0
        # High gyro noise lowers confidence slightly
        noise_penalty = min(gyro_activity * 2.0, 0.3)
        self.last_imu_conf = float(np.clip(avg_cons - noise_penalty, 0.2, 1.0))
        return self.last_imu_conf

    def correct_biases(self, accel: np.ndarray, gyro_z: float) -> Tuple[np.ndarray, float]:
        """Return bias-corrected measurements."""
        ax = accel[0] - self.bias_ax
        ay = accel[1] - self.bias_ay
        gz = gyro_z - self.bias_gyro
        return np.array([ax, ay]), gz

    def learn_bias_from_static(self, accel: np.ndarray, gyro_z: float, is_static: bool):
        """When vehicle is detected static, learn gravity & zero gyro."""
        if not is_static:
            return
        self.bias_gyro = (1 - self.lr) * self.bias_gyro + self.lr * gyro_z
        self.bias_ax = (1 - self.lr * 0.5) * self.bias_ax + self.lr * 0.5 * accel[0]
        self.bias_ay = (1 - self.lr * 0.5) * self.bias_ay + self.lr * 0.5 * (accel[1] - 0.0)

    def get_fusion_confidence(self) -> float:
        """Overall confidence for adaptive Q/R scaling."""
        return float(0.6 * self.last_gnss_conf + 0.4 * self.last_imu_conf)

    def get_sensor_trusts(self) -> dict:
        return {
            "gnss": self.last_gnss_conf,
            "imu": self.last_imu_conf,
            "fusion": self.get_fusion_confidence(),
        }
