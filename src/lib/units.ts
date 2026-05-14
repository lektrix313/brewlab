/**
 * Unit conversion engine for brewing measurements.
 * Supports metric, US customary, and imperial.
 */

import type { UnitSystem } from '../stores/appStore';

// ─── Constants ──────────────────────────────────────────

const LB_PER_KG = 2.20462;
const OZ_PER_KG = 35.274;
const GAL_PER_L = 0.264172;
const QT_PER_L = 1.05669;
const F_PER_C_OFFSET = 32;
const F_PER_C_RATIO = 9 / 5;
const INCH_PER_CM = 0.393701;

// ─── Temperature ────────────────────────────────────────

export function cToF(c: number): number {
  return c * F_PER_C_RATIO + F_PER_C_OFFSET;
}

export function fToC(f: number): number {
  return (f - F_PER_C_OFFSET) / F_PER_C_RATIO;
}

export function formatTemp(c: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') return `${c.toFixed(1)}°C`;
  return `${cToF(c).toFixed(1)}°F`;
}

// ─── Mass ───────────────────────────────────────────────

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

export function kgToOz(kg: number): number {
  return kg * OZ_PER_KG;
}

export function formatMass(kg: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    if (kg >= 1) return `${kg.toFixed(2)} kg`;
    return `${(kg * 1000).toFixed(0)} g`;
  }
  const lb = kgToLb(kg);
  if (lb >= 1) return `${lb.toFixed(2)} lb`;
  return `${(lb * 16).toFixed(1)} oz`;
}

export function formatSmallMass(kg: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') {
    return `${(kg * 1000).toFixed(0)} g`;
  }
  return `${kgToOz(kg).toFixed(1)} oz`;
}

// ─── Volume ─────────────────────────────────────────────

export function lToGal(l: number): number {
  return l * GAL_PER_L;
}

export function galToL(gal: number): number {
  return gal / GAL_PER_L;
}

export function lToQt(l: number): number {
  return l * QT_PER_L;
}

export function formatVolume(l: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') return `${l.toFixed(1)} L`;
  return `${lToGal(l).toFixed(2)} gal`;
}

export function formatSmallVolume(l: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') return `${(l * 1000).toFixed(0)} mL`;
  return `${lToGal(l).toFixed(2)} gal`;
}

// ─── Density / Gravity ──────────────────────────────────

export function formatGravity(sg: number): string {
  return sg.toFixed(3);
}

// ─── Percentage ─────────────────────────────────────────

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── General display ────────────────────────────────────

export function formatValue(value: number, unit: string, decimals = 1): string {
  return `${value.toFixed(decimals)} ${unit}`;
}

// ─── Water calculations with unit awareness ─────────────

export function calculateStrikeWater(
  grainMassKg: number,
  targetTempC: number,
  grainTempC: number,
  ratioLPerKg: number,
  unitSystem: UnitSystem
): { waterVolume: string; strikeTemp: string } {
  // Simple heat equation: Tw = (0.4 / R) * (Tm - Tg) + Tm
  const waterTempC = (0.4 / ratioLPerKg) * (targetTempC - grainTempC) + targetTempC;
  const waterVolumeL = grainMassKg * ratioLPerKg;

  return {
    waterVolume: formatVolume(waterVolumeL, unitSystem),
    strikeTemp: formatTemp(waterTempC, unitSystem),
  };
}

export function calculateSpargeVolume(
  preBoilVolumeL: number,
  mashWaterL: number,
  grainMassKg: number,
  absorptionLPerKg: number,
  unitSystem: UnitSystem
): string {
  const absorbedL = grainMassKg * absorptionLPerKg;
  const firstRunningsL = mashWaterL - absorbedL;
  const spargeL = preBoilVolumeL - firstRunningsL;
  return formatVolume(Math.max(0, spargeL), unitSystem);
}
