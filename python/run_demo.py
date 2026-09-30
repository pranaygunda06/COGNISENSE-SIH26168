#!/usr/bin/env python3
"""
Quick demo: run simulation and print key metrics + optional plot.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from simulation.trajectory import run_simulation, generate_trajectory
import json

def main():
    print("=" * 60)
    print("COGNISENSE - Intelligent Dead Reckoning Simulation Demo")
    print("SIH 2026 | Problem Statement SIH26168 | Team NIRASYA")
    print("=" * 60)

    result = run_simulation(
        duration=60.0,
        dt=0.05,
        speed=15.0,
        outage_start=15.0,
        outage_end=40.0,
        seed=42,
    )

    m = result["metrics"]
    print(f"\nOutage window: {result['meta']['outage_start']}s – {result['meta']['outage_end']}s")
    print(f"Distance travelled during outage: {m['outage_distance_m']:.1f} m")
    print(f"Max position error during outage: {m['max_error_outage_m']:.2f} m")
    print(f"Mean position error during outage: {m['mean_error_outage_m']:.2f} m")
    print(f"Drift ratio (error / distance): {m['drift_ratio']*100:.1f}%")
    print(f"SIH target (<10% drift or <5m @50m): {'PASS ✓' if m['passes_sih_target'] else 'NEEDS TUNING'}")

    out_path = os.path.join(os.path.dirname(__file__), "..", "data", "last_run.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(result, f)
    print(f"\nFull result saved to {out_path}")
    print("\nDone. Use the JSON output as input for the web demo or further analysis.")

if __name__ == "__main__":
    main()
