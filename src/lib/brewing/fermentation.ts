/**
 * Fermentation simulation — four-parameter logistic model.
 * Pure functions only.
 */

import { Recipe, BatchStatus } from '../beerjson/types';

export interface FermentationParams {
  og: number;
  fg: number;
  lag_hrs: number;
  m_hrs: number;
  b: number;
  total_hrs: number;
}

interface CultureProfile {
  lag: number;
  m: number;
  b: number;
  total: number;
}

const PROFILES: Record<string, CultureProfile> = {
  ale: { lag: 12, m: 48, b: 0.1, total: 168 },
  lager: { lag: 24, m: 96, b: 0.05, total: 336 },
  kveik: { lag: 4, m: 18, b: 0.18, total: 72 },
  wheat: { lag: 12, m: 36, b: 0.12, total: 144 },
  saison: { lag: 12, m: 60, b: 0.08, total: 240 },
};

function profileForCultureType(type: string): CultureProfile {
  return PROFILES[type] ?? PROFILES['ale'];
}

export function fermentationParamsForRecipe(recipe: Recipe): FermentationParams {
  const culture = recipe.cultures[0]?.culture;
  const profile = profileForCultureType(culture?.type ?? 'ale');
  const tempC = recipe.process?.fermentation?.steps?.[0]?.temperature_c ?? 20;
  const tempFactor = Math.pow(2, (tempC - 20) / 10);
  return {
    og: recipe.estimated_og,
    fg: recipe.estimated_fg,
    lag_hrs: profile.lag / tempFactor,
    m_hrs: profile.m / tempFactor,
    b: profile.b,
    total_hrs: profile.total / tempFactor,
  };
}

export function predictGravityAt(t_hrs: number, p: FermentationParams): number {
  if (t_hrs <= p.lag_hrs) return p.og;
  const t = t_hrs - p.lag_hrs;
  const ratio = (p.og - p.fg) / (1 + Math.exp(p.b * (t - p.m_hrs)));
  return parseFloat((p.fg + ratio).toFixed(4));
}

export function predictABVAt(t_hrs: number, p: FermentationParams): number {
  const sg = predictGravityAt(t_hrs, p);
  return parseFloat(((p.og - sg) * 131.25).toFixed(2));
}

export function statusFromProgress(
  t: number,
  lagHrs: number,
  totalHrs: number,
): BatchStatus {
  if (t < lagHrs) return 'lag-phase';
  const progress = (t - lagHrs) / (totalHrs - lagHrs);
  if (progress < 0.3) return 'active-fermentation';
  if (progress < 0.85) return 'attenuating';
  if (progress < 0.97) return 'conditioning';
  return 'ready';
}

export interface PredictedCurvePoint {
  hours_since_pitch: number;
  predicted_gravity_sg: number;
  predicted_abv_pct: number;
  predicted_temperature_c: number;
  predicted_status: BatchStatus;
}

export function buildPredictedCurve(
  recipe: Recipe,
  stepHrs: number = 1,
): PredictedCurvePoint[] {
  const p = fermentationParamsForRecipe(recipe);
  const points: PredictedCurvePoint[] = [];
  const firstStepTemp = recipe.process?.fermentation?.steps?.[0]?.temperature_c ?? 20;
  for (let t = 0; t <= p.total_hrs * 1.1; t += stepHrs) {
    points.push({
      hours_since_pitch: t,
      predicted_gravity_sg: predictGravityAt(t, p),
      predicted_abv_pct: predictABVAt(t, p),
      predicted_temperature_c: firstStepTemp,
      predicted_status: statusFromProgress(t, p.lag_hrs, p.total_hrs),
    });
  }
  return points;
}

// Simple refit using measured points — adjusts M and B via gradient descent
export function refitCurve(
  measurements: { hours_since_pitch: number; gravity_sg: number }[],
  initial: FermentationParams,
): FermentationParams {
  if (measurements.length < 2) return initial;

  let m = initial.m_hrs;
  let b = initial.b;
  const lr = 0.01;
  const iterations = 100;

  for (let i = 0; i < iterations; i++) {
    let dm = 0;
    let db = 0;
    for (const pt of measurements) {
      if (pt.hours_since_pitch <= initial.lag_hrs) continue;
      const t = pt.hours_since_pitch - initial.lag_hrs;
      const pred = initial.fg + (initial.og - initial.fg) / (1 + Math.exp(b * (t - m)));
      const error = pred - pt.gravity_sg;
      const sigmoid = 1 / (1 + Math.exp(-b * (t - m)));
      const dSigmoidDm = sigmoid * (1 - sigmoid) * b;
      const dSigmoidDb = sigmoid * (1 - sigmoid) * (t - m);
      dm += error * dSigmoidDm * (initial.og - initial.fg);
      db += error * dSigmoidDb * (initial.og - initial.fg);
    }
    m -= lr * dm;
    b -= lr * db;
    // Clamp B to reasonable range
    b = Math.max(0.01, Math.min(0.5, b));
  }

  return { ...initial, m_hrs: m, b };
}
