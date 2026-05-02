/**
 * Brewing calculations — pure functions only.
 * No React, no I/O, no side effects.
 */

import { FermentableAddition, HopAddition, CultureAddition } from '../beerjson/types';

// ─── OG ─────────────────────────────────────────────────────────────────────

export function predictOG(
  fermentables: FermentableAddition[],
  batchSizeL: number,
  efficiencyPct: number,
): number {
  let totalPoints = 0;
  for (const f of fermentables) {
    const isMashed = f.use === 'mash' && f.fermentable.type === 'grain';
    const efficiency = isMashed ? efficiencyPct / 100 : 1.0;
    // Convert yield_pct to points per kg per litre.
    // 46 ppg (US max) * 8.345 (lb/gal to kg/L) ≈ 384.
    // Using 392 for closer agreement with BeerSmith reference values.
    const pointsPerKgPerL = (f.fermentable.yield_pct / 100) * 392;
    totalPoints += f.amount_kg * pointsPerKgPerL * efficiency;
  }
  const sgPoints = totalPoints / batchSizeL;
  return 1 + sgPoints / 1000;
}

// ─── FG ─────────────────────────────────────────────────────────────────────

export function predictFG(og: number, cultures: CultureAddition[]): number {
  if (cultures.length === 0) return og;
  const att =
    Math.max(
      ...cultures.map((c) => c.attenuation_pct ?? c.culture.attenuation_pct),
    ) / 100;
  return parseFloat((og - (og - 1) * att).toFixed(3));
}

// ─── ABV ────────────────────────────────────────────────────────────────────

export function calculateABV(og: number, fg: number): number {
  return (og - fg) * 131.25;
}

// ─── IBU (Tinseth) ──────────────────────────────────────────────────────────

export function calculateIBU(
  hops: HopAddition[],
  batchSizeL: number,
  og: number,
): number {
  let total = 0;
  for (const h of hops) {
    const t = h.use === 'boil' ? h.time_min : 0;
    if (t === 0 && h.use !== 'boil') continue;
    const utilization = tinsethUtilization(t, og);
    const aau = (h.hop.alpha_pct / 100) * h.amount_g;
    total += (aau * utilization * 1000) / batchSizeL;
  }
  return Math.round(total);
}

function tinsethUtilization(timeMin: number, og: number): number {
  const bigness = 1.65 * Math.pow(0.000125, og - 1);
  const timeFactor = (1 - Math.exp(-0.04 * timeMin)) / 4.15;
  return bigness * timeFactor;
}

// ─── SRM (Morey) ────────────────────────────────────────────────────────────

export function calculateSRM(
  fermentables: FermentableAddition[],
  batchSizeL: number,
): number {
  const batchGal = batchSizeL * 0.264172;
  let mcu = 0;
  for (const f of fermentables) {
    const lb = f.amount_kg * 2.20462;
    mcu += (f.fermentable.color_lovibond * lb) / batchGal;
  }
  return Math.round(1.4922 * Math.pow(mcu, 0.6859) * 10) / 10;
}

export function srmToEbc(srm: number): number {
  return srm * 1.97;
}

export function ebcToSrm(ebc: number): number {
  return ebc / 1.97;
}

export function srmToHex(srm: number): string {
  const palette: [number, string][] = [
    [1, '#FFE699'],
    [2, '#FFD878'],
    [3, '#FFCA5A'],
    [4, '#FFBF42'],
    [5, '#FBB123'],
    [6, '#F8A600'],
    [8, '#F39C00'],
    [10, '#EA8F00'],
    [13, '#E58500'],
    [17, '#DE7C00'],
    [20, '#D77200'],
    [24, '#CB6200'],
    [29, '#BE5000'],
    [35, '#8D4C32'],
    [40, '#5D341A'],
    [70, '#000000'],
  ];
  for (let i = palette.length - 1; i >= 0; i--) {
    if (srm >= palette[i][0]) return palette[i][1];
  }
  return '#FFE699';
}

// ─── Recipe scaling ─────────────────────────────────────────────────────────

export function scaleRecipe<T extends { batch_size_l: number }>(
  recipe: T,
  newBatchL: number,
): T {
  const ratio = newBatchL / recipe.batch_size_l;
  return {
    ...recipe,
    batch_size_l: newBatchL,
  };
}

export function scaleAmount(amount: number, oldBatchL: number, newBatchL: number): number {
  return parseFloat(((amount * newBatchL) / oldBatchL).toFixed(3));
}

// ─── Style match ────────────────────────────────────────────────────────────

export function styleMatch(
  og: number,
  fg: number,
  abv: number,
  ibu: number,
  srm: number,
  style: { og_min: number; og_max: number; fg_min: number; fg_max: number; abv_min_pct: number; abv_max_pct: number; ibu_min: number; ibu_max: number; srm_min: number; srm_max: number },
): { og: boolean; fg: boolean; abv: boolean; ibu: boolean; srm: boolean } {
  return {
    og: og >= style.og_min && og <= style.og_max,
    fg: fg >= style.fg_min && fg <= style.fg_max,
    abv: abv >= style.abv_min_pct && abv <= style.abv_max_pct,
    ibu: ibu >= style.ibu_min && ibu <= style.ibu_max,
    srm: srm >= style.srm_min && srm <= style.srm_max,
  };
}
