/**
 * COGNISENSE Browser Simulation Engine
 * Pure TypeScript port of the Adaptive EKF + AI Confidence layer.
 * No hardware required — generates synthetic IMU + GNSS with outages.
 */

export interface SimConfig {
  duration: number;
  dt: number;
  speed: number;
  outageStart: number;
  outageEnd: number;
  seed: number;
}

export interface SimResult {
  t: number[];
  trueX: number[];
  trueY: number[];
  estX: number[];
  estY: number[];
  error: number[];
  confidence: number[];
  gnssTrust: number[];
  imuTrust: number[];
  mode: string[];
  gnssAvailable: boolean[];
  metrics: {
    maxErrorOutageM: number;
    meanErrorOutageM: number;
    outageDistanceM: number;
    driftRatio: number;
    passesSihTarget: boolean;
  };
  meta: SimConfig;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class AdaptiveEKF {
  dt: number;
  x: number[];
  P: number[][];
  Qbase: number[];
  Rbase: number[];
  confidence = 1.0;
  gnssAvailable = true;

  constructor(dt = 0.05) {
    this.dt = dt;
    this.x = [0, 0, 0, 0, 0, 0, 0, 0];
    this.P = Array.from({ length: 8 }, (_, i) =>
      Array.from({ length: 8 }, (_, j) => (i === j ? 10 : 0))
    );
    this.Qbase = [0.01, 0.01, 0.1, 0.1, 0.001, 1e-4, 1e-4, 1e-5];
    this.Rbase = [4, 4];
  }

  setConfidence(c: number) {
    this.confidence = Math.max(0.05, Math.min(1, c));
  }

  predict(ax: number, ay: number, wz: number) {
    const [x, y, vx, vy, h, bax, bay, bg] = this.x;
    const dt = this.dt;
    const axc = ax - bax;
    const ayc = ay - bay;
    const omega = wz - bg;
    const cos = Math.cos(h);
    const sin = Math.sin(h);
    const axw = axc * cos - ayc * sin;
    const ayw = axc * sin + ayc * cos;

    this.x[0] = x + vx * dt + 0.5 * axw * dt * dt;
    this.x[1] = y + vy * dt + 0.5 * ayw * dt * dt;
    this.x[2] = vx + axw * dt;
    this.x[3] = vy + ayw * dt;
    this.x[4] = h + omega * dt;

    const scale = 1 / Math.max(this.confidence, 0.1);
    for (let i = 0; i < 8; i++) {
      this.P[i][i] += this.Qbase[i] * scale;
    }
  }

  updateGnss(px: number, py: number) {
    if (!this.gnssAvailable) return;
    const innovX = px - this.x[0];
    const innovY = py - this.x[1];
    const rScale = 1 / Math.max(this.confidence, 0.2);
    const rx = this.Rbase[0] * rScale;
    const ry = this.Rbase[1] * rScale;

    const pxP = this.P[0][0];
    const pyP = this.P[1][1];
    const kx = pxP / (pxP + rx);
    const ky = pyP / (pyP + ry);

    this.x[0] += kx * innovX;
    this.x[1] += ky * innovY;
    this.P[0][0] *= 1 - kx;
    this.P[1][1] *= 1 - ky;
  }
}

class ConfidenceAI {
  gnssConf = 1;
  imuConf = 0.9;
  residuals: number[] = [];
  consistency: number[] = [];

  updateGnss(residual: number) {
    this.residuals.push(residual);
    if (this.residuals.length > 40) this.residuals.shift();
    const avg = this.residuals.reduce((a, b) => a + b, 0) / this.residuals.length;
    this.gnssConf = Math.max(0.1, Math.min(1, 1 - avg / 15));
    return this.gnssConf;
  }

  updateImu(ax: number, ay: number, wz: number) {
    const mag = Math.hypot(ax, ay);
    const cons = Math.max(0, 1 - Math.abs(mag - 0) / 4);
    this.consistency.push(cons);
    if (this.consistency.length > 40) this.consistency.shift();
    const avg = this.consistency.reduce((a, b) => a + b, 0) / this.consistency.length;
    this.imuConf = Math.max(0.25, Math.min(1, avg - Math.min(Math.abs(wz) * 1.5, 0.25)));
    return this.imuConf;
  }

  fusionConf() {
    return 0.55 * this.gnssConf + 0.45 * this.imuConf;
  }
}

export function runSimulation(config: Partial<SimConfig> = {}): SimResult {
  const cfg: SimConfig = {
    duration: 60,
    dt: 0.05,
    speed: 15,
    outageStart: 15,
    outageEnd: 40,
    seed: 42,
    ...config,
  };

  const rand = mulberry32(cfg.seed);
  const n = Math.floor(cfg.duration / cfg.dt);
  const t: number[] = [];
  const trueX: number[] = [];
  const trueY: number[] = [];
  const trueVx: number[] = [];
  const trueVy: number[] = [];
  const trueH: number[] = [];
  const trueAx: number[] = [];
  const trueAy: number[] = [];
  const trueWz: number[] = [];

  let x = 0, y = 0, vx = 0, vy = 0, h = 0;

  for (let i = 0; i < n; i++) {
    const ti = i * cfg.dt;
    t.push(ti);

    let axb = 0;
    if (ti < 5) axb = 2.5;
    else if (ti > cfg.duration - 5) axb = -2.5;

    let wz = 0;
    if (ti > 10 && ti < 50) wz = 0.06 * Math.sin(0.25 * ti);

    const cos = Math.cos(h);
    const sin = Math.sin(h);
    const axw = axb * cos;
    const ayw = axb * sin;

    vx += axw * cfg.dt;
    vy += ayw * cfg.dt;
    const sp = Math.hypot(vx, vy);
    if (sp > cfg.speed * 1.15) {
      vx *= cfg.speed / sp;
      vy *= cfg.speed / sp;
    }
    x += vx * cfg.dt;
    y += vy * cfg.dt;
    h += wz * cfg.dt;

    trueX.push(x);
    trueY.push(y);
    trueVx.push(vx);
    trueVy.push(vy);
    trueH.push(h);
    trueAx.push(axb);
    trueAy.push(0);
    trueWz.push(wz);
  }

  const biasAx = 0.04;
  const biasAy = -0.025;
  const biasG = 0.0015;
  const imuAx = trueAx.map((v) => v + biasAx + (rand() - 0.5) * 0.3);
  const imuAy = trueAy.map((v) => v + biasAy + (rand() - 0.5) * 0.3);
  const imuWz = trueWz.map((v) => v + biasG + (rand() - 0.5) * 0.02);

  const gnssX = trueX.map((v) => v + (rand() - 0.5) * 6);
  const gnssY = trueY.map((v) => v + (rand() - 0.5) * 6);
  const gnssAvailable = t.map(
    (ti) => !(ti >= cfg.outageStart && ti <= cfg.outageEnd)
  );

  const ekf = new AdaptiveEKF(cfg.dt);
  const ai = new ConfidenceAI();
  ekf.x[0] = gnssX[0];
  ekf.x[1] = gnssY[0];
  ekf.x[2] = trueVx[0];
  ekf.x[3] = trueVy[0];
  ekf.x[4] = trueH[0];

  const estX: number[] = [];
  const estY: number[] = [];
  const error: number[] = [];
  const confidence: number[] = [];
  const gnssTrust: number[] = [];
  const imuTrust: number[] = [];
  const mode: string[] = [];

  for (let i = 0; i < n; i++) {
    ai.updateImu(imuAx[i], imuAy[i], imuWz[i]);
    ekf.predict(imuAx[i], imuAy[i], imuWz[i]);
    ekf.gnssAvailable = gnssAvailable[i];

    if (gnssAvailable[i]) {
      const res = Math.hypot(gnssX[i] - ekf.x[0], gnssY[i] - ekf.x[1]);
      ai.updateGnss(res);
      ekf.setConfidence(ai.fusionConf());
      ekf.updateGnss(gnssX[i], gnssY[i]);
      mode.push("GNSS+INS");
    } else {
      ekf.setConfidence(ai.fusionConf() * 0.75);
      mode.push("DEAD_RECKONING");
    }

    estX.push(ekf.x[0]);
    estY.push(ekf.x[1]);
    error.push(Math.hypot(ekf.x[0] - trueX[i], ekf.x[1] - trueY[i]));
    confidence.push(ekf.confidence);
    gnssTrust.push(ai.gnssConf);
    imuTrust.push(ai.imuConf);
  }

  const outageIdx = t
    .map((ti, i) => (ti >= cfg.outageStart && ti <= cfg.outageEnd ? i : -1))
    .filter((i) => i >= 0);
  const outageErr = outageIdx.map((i) => error[i]);
  const maxErr = outageErr.length ? Math.max(...outageErr) : 0;
  const meanErr = outageErr.length
    ? outageErr.reduce((a, b) => a + b, 0) / outageErr.length
    : 0;

  let outageDist = 0;
  for (let k = 1; k < outageIdx.length; k++) {
    const i = outageIdx[k];
    const prev = outageIdx[k - 1];
    outageDist += Math.hypot(trueX[i] - trueX[prev], trueY[i] - trueY[prev]);
  }
  const driftRatio = maxErr / Math.max(outageDist, 1);
  const passes = maxErr < 0.1 * outageDist || maxErr < 5;

  return {
    t,
    trueX,
    trueY,
    estX,
    estY,
    error,
    confidence,
    gnssTrust,
    imuTrust,
    mode,
    gnssAvailable,
    metrics: {
      maxErrorOutageM: maxErr,
      meanErrorOutageM: meanErr,
      outageDistanceM: outageDist,
      driftRatio,
      passesSihTarget: passes,
    },
    meta: cfg,
  };
}
