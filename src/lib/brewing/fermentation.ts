/**
 * Fermentation simulation — four-parameter logistic model.
 * Pure functions only.
 *
 * V1.1: Multi-stage fermentation profiles with temperature ramping.
 * Walks through FermentationStep[] in order, applying Q10-adjusted
 * parameters for each segment and concatenating the gravity curve.
 */

import { Recipe, BatchStatus, FermentationStep, FermentationProfile } from '../beerjson/types';

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

function tempFactor(tempC: number): number {
  // Q10 ~ 2: a 10°C rise roughly halves fermentation time
  return Math.pow(2, (tempC - 20) / 10);
}

export function fermentationParamsForRecipe(
  recipe: Recipe,
  overrideTempC?: number,
): FermentationParams {
  const culture = recipe.cultures[0]?.culture;
  const profile = profileForCultureType(culture?.type ?? 'ale');
  const tempC = overrideTempC ?? recipe.process?.fermentation?.steps?.[0]?.temperature_c ?? 20;
  const factor = tempFactor(tempC);
  return {
    og: recipe.estimated_og,
    fg: recipe.estimated_fg,
    lag_hrs: profile.lag / factor,
    m_hrs: profile.m / factor,
    b: profile.b,
    total_hrs: profile.total / factor,
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
  step_name: string;
}

// ─── Multi-stage curve builder ──────────────────────────────────────────────

interface StepSegment {
  step: FermentationStep;
  start_hrs: number;
  end_hrs: number;
  start_temp_c: number;
  end_temp_c: number;
}

function buildSegments(
  profile: FermentationProfile,
  og: number,
  fg: number,
): StepSegment[] {
  const segments: StepSegment[] = [];
  let currentHour = 0;
  let previousTemp = profile.pitch_temp_c;

  for (const step of profile.steps) {
    // Determine start condition
    let startHrs = currentHour;
    if (step.start_condition.type === 'time-after-pitch') {
      startHrs = step.start_condition.value;
    }
    // gravity-reaches and attenuation-pct require knowing when gravity hits
    // a target — for prediction we approximate using the simple model
    // and iterate. V1: default to previous step end for these.
    startHrs = Math.max(startHrs, currentHour);

    // Determine end condition
    let endHrs = startHrs + 24; // default 1 day fallback
    if (step.end_condition.type === 'duration-days') {
      endHrs = startHrs + step.end_condition.value * 24;
    } else if (step.end_condition.type === 'gravity-reaches') {
      // Estimate how long to reach target gravity using simple model
      const p = fermentationParamsForRecipe(
        { estimated_og: og, estimated_fg: fg, cultures: [] } as Recipe,
        step.temperature_c,
      );
      // Invert logistic: t = M - (1/B) * ln((Pi-Pe)/(G-Pe) - 1)
      const targetG = step.end_condition.value;
      if (targetG > fg && targetG < og) {
        const tToTarget =
          p.m_hrs - (1 / p.b) * Math.log((p.og - p.fg) / (targetG - p.fg) - 1);
        endHrs = startHrs + p.lag_hrs + tToTarget;
      }
    } else if (step.end_condition.type === 'temp-reaches') {
      // For temp-reaches, the duration is driven by ramp_rate
      if (step.ramp_rate_c_per_day && step.ramp_rate_c_per_day !== 0) {
        const tempDiff = step.temperature_c - previousTemp;
        const daysToReach = tempDiff / step.ramp_rate_c_per_day;
        endHrs = startHrs + daysToReach * 24;
      } else {
        endHrs = startHrs + 24; // immediate if no ramp
      }
    }

    // Ensure minimum duration
    endHrs = Math.max(endHrs, startHrs + 1);

    // Determine temperature at start and end of segment
    let startTemp = previousTemp;
    let endTemp = step.temperature_c;
    if (step.ramp_rate_c_per_day && step.ramp_rate_c_per_day !== 0) {
      const durationDays = (endHrs - startHrs) / 24;
      const tempChange = step.ramp_rate_c_per_day * durationDays;
      // If ramping toward target, clamp
      if (step.ramp_rate_c_per_day > 0) {
        endTemp = Math.min(startTemp + tempChange, step.temperature_c);
      } else {
        endTemp = Math.max(startTemp + tempChange, step.temperature_c);
      }
    }

    segments.push({
      step,
      start_hrs: startHrs,
      end_hrs: endHrs,
      start_temp_c: startTemp,
      end_temp_c: endTemp,
    });

    currentHour = endHrs;
    previousTemp = endTemp;
  }

  return segments;
}

export function buildPredictedCurve(
  recipe: Recipe,
  stepHrs: number = 1,
): PredictedCurvePoint[] {
  const profile = recipe.process?.fermentation;
  if (!profile || profile.steps.length === 0) {
    // Fallback to old single-stage behaviour
    const p = fermentationParamsForRecipe(recipe);
    const points: PredictedCurvePoint[] = [];
    for (let t = 0; t <= p.total_hrs * 1.1; t += stepHrs) {
      points.push({
        hours_since_pitch: t,
        predicted_gravity_sg: predictGravityAt(t, p),
        predicted_abv_pct: predictABVAt(t, p),
        predicted_temperature_c: recipe.process?.fermentation?.steps?.[0]?.temperature_c ?? 20,
        predicted_status: statusFromProgress(t, p.lag_hrs, p.total_hrs),
        step_name: 'Primary',
      });
    }
    return points;
  }

  const segments = buildSegments(profile, recipe.estimated_og, recipe.estimated_fg);
  const totalHrs = segments.length > 0 ? segments[segments.length - 1].end_hrs : 168;

  const points: PredictedCurvePoint[] = [];
  let segIndex = 0;

  for (let t = 0; t <= totalHrs * 1.05; t += stepHrs) {
    // Find current segment
    while (segIndex < segments.length - 1 && t >= segments[segIndex].end_hrs) {
      segIndex++;
    }
    const seg = segments[segIndex];

    // Linear interpolation of temperature within segment
    const segProgress =
      seg.end_hrs === seg.start_hrs
        ? 0
        : Math.min(1, Math.max(0, (t - seg.start_hrs) / (seg.end_hrs - seg.start_hrs)));
    const tempC = seg.start_temp_c + segProgress * (seg.end_temp_c - seg.start_temp_c);

    // Compute gravity using temp-adjusted params
    const p = fermentationParamsForRecipe(recipe, tempC);
    const gravity = predictGravityAt(t, p);
    const abv = predictABVAt(t, p);

    // Status from overall progress (using original total as baseline)
    const status = statusFromProgress(t, p.lag_hrs, totalHrs);

    points.push({
      hours_since_pitch: t,
      predicted_gravity_sg: gravity,
      predicted_abv_pct: abv,
      predicted_temperature_c: parseFloat(tempC.toFixed(1)),
      predicted_status: status,
      step_name: seg.step.name,
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

// ─── Temperature prediction helpers ─────────────────────────────────────────

export function predictTempAt(
  t_hrs: number,
  profile: FermentationProfile,
): number {
  const segments = buildSegments(profile, 1.050, 1.010); // dummy OG/FG for segment calc
  for (const seg of segments) {
    if (t_hrs >= seg.start_hrs && t_hrs <= seg.end_hrs) {
      const progress =
        seg.end_hrs === seg.start_hrs
          ? 0
          : (t_hrs - seg.start_hrs) / (seg.end_hrs - seg.start_hrs);
      return seg.start_temp_c + progress * (seg.end_temp_c - seg.start_temp_c);
    }
  }
  // After last segment, hold final temp
  if (segments.length > 0) {
    return segments[segments.length - 1].end_temp_c;
  }
  return profile.pitch_temp_c;
}

export function currentStepAt(
  t_hrs: number,
  profile: FermentationProfile,
): FermentationStep | null {
  const segments = buildSegments(profile, 1.050, 1.010);
  for (const seg of segments) {
    if (t_hrs >= seg.start_hrs && t_hrs < seg.end_hrs) {
      return seg.step;
    }
  }
  // At exact end or after
  if (segments.length > 0 && t_hrs >= segments[segments.length - 1].end_hrs) {
    return segments[segments.length - 1].step;
  }
  return null;
}
