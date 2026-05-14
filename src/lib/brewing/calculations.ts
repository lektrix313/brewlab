/**
 * Brewing calculations — pure functions only.
 * No React, no I/O, no side effects.
 */

import {
  FermentableAddition,
  HopAddition,
  CultureAddition,
  Recipe,
  WaterProfile,
} from '../beerjson/types';

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

export function scaleAmount(amount: number, oldBatchL: number, newBatchL: number): number {
  return parseFloat(((amount * newBatchL) / oldBatchL).toFixed(3));
}

export function scaleRecipe(recipe: Recipe, newBatchL: number): Recipe {
  const ratio = newBatchL / recipe.batch_size_l;
  const scale = (amount: number) => parseFloat((amount * ratio).toFixed(3));

  return {
    ...recipe,
    batch_size_l: newBatchL,
    fermentables: recipe.fermentables.map((f) => ({
      ...f,
      amount_kg: scale(f.amount_kg),
    })),
    hops: recipe.hops.map((h) => ({
      ...h,
      amount_g: scale(h.amount_g),
    })),
    cultures: recipe.cultures.map((c) => ({
      ...c,
      amount_g_or_ml: scale(c.amount_g_or_ml),
    })),
    // Recompute derived stats
    estimated_og: parseFloat(
      predictOG(
        recipe.fermentables.map((f) => ({ ...f, amount_kg: scale(f.amount_kg) })),
        newBatchL,
        recipe.efficiency_pct,
      ).toFixed(3),
    ),
    estimated_fg: recipe.estimated_fg, // Will be recalculated by caller if needed
    estimated_ibu: calculateIBU(
      recipe.hops.map((h) => ({ ...h, amount_g: scale(h.amount_g) })),
      newBatchL,
      recipe.estimated_og, // Use original OG as approximation; caller should iterate
    ),
    estimated_srm: calculateSRM(
      recipe.fermentables.map((f) => ({ ...f, amount_kg: scale(f.amount_kg) })),
      newBatchL,
    ),
  };
}

export function fullyScaleRecipe(recipe: Recipe, newBatchL: number): Recipe {
  const scaled = scaleRecipe(recipe, newBatchL);
  const og = predictOG(scaled.fermentables, newBatchL, recipe.efficiency_pct);
  const fg = predictFG(og, scaled.cultures);
  const abv = calculateABV(og, fg);
  const ibu = calculateIBU(scaled.hops, newBatchL, og);
  const srm = calculateSRM(scaled.fermentables, newBatchL);
  return {
    ...scaled,
    estimated_og: parseFloat(og.toFixed(3)),
    estimated_fg: parseFloat(fg.toFixed(3)),
    estimated_abv_pct: parseFloat(abv.toFixed(1)),
    estimated_ibu: Math.round(ibu),
    estimated_srm: Math.round(srm * 10) / 10,
    estimated_ebc: parseFloat(srmToEbc(srm).toFixed(1)),
  };
}

// ─── Style match ────────────────────────────────────────────────────────────

export function styleMatch(
  og: number,
  fg: number,
  abv: number,
  ibu: number,
  srm: number,
  style: {
    og_min: number;
    og_max: number;
    fg_min: number;
    fg_max: number;
    abv_min_pct: number;
    abv_max_pct: number;
    ibu_min: number;
    ibu_max: number;
    srm_min: number;
    srm_max: number;
  },
): { og: boolean; fg: boolean; abv: boolean; ibu: boolean; srm: boolean } {
  return {
    og: og >= style.og_min && og <= style.og_max,
    fg: fg >= style.fg_min && fg <= style.fg_max,
    abv: abv >= style.abv_min_pct && abv <= style.abv_max_pct,
    ibu: ibu >= style.ibu_min && ibu <= style.ibu_max,
    srm: srm >= style.srm_min && srm <= style.srm_max,
  };
}

// ─── Water chemistry ────────────────────────────────────────────────────────

export interface WaterChemistry {
  sulfate_chloride_ratio: number;
  residual_alkalinity_ppm: number;
  flavour_character: 'very hoppy' | 'hoppy' | 'balanced' | 'malty' | 'very malty';
  estimated_mash_ph: number;
}

/**
 * Residual Alkalinity (simplified Palmer method)
 * RA = HCO3 * (50/61) - (Ca/1.4 + Mg/1.7)
 * Returns ppm as CaCO3
 */
export function calculateResidualAlkalinity(water: WaterProfile): number {
  const bicarbonateAsCaCO3 = water.bicarbonate_ppm * (50 / 61);
  const calciumHardness = water.calcium_ppm / 1.4;
  const magnesiumHardness = water.magnesium_ppm / 1.7;
  return parseFloat((bicarbonateAsCaCO3 - (calciumHardness + magnesiumHardness)).toFixed(1));
}

/**
 * Sulfate to Chloride ratio with flavour interpretation
 * > 2.0 = very hoppy/dry
 * 1.3-2.0 = hoppy
 * 0.8-1.3 = balanced
 * 0.5-0.8 = malty
 * < 0.5 = very malty/round
 */
export function calculateSulfateChlorideRatio(water: WaterProfile): {
  ratio: number;
  character: WaterChemistry['flavour_character'];
} {
  const ratio =
    water.chloride_ppm === 0 ? 999 : parseFloat((water.sulfate_ppm / water.chloride_ppm).toFixed(2));

  let character: WaterChemistry['flavour_character'];
  if (ratio >= 2.0) character = 'very hoppy';
  else if (ratio >= 1.3) character = 'hoppy';
  else if (ratio >= 0.8) character = 'balanced';
  else if (ratio >= 0.5) character = 'malty';
  else character = 'very malty';

  return { ratio, character };
}

/**
 * Very simplified mash pH estimator.
 * Base distilled water pH ≈ 5.8 for pale malts.
 * Roasted malts lower pH (~0.3 per lb/gal of 500L malt).
 * RA raises pH (~0.1 per 50 ppm RA).
 * This is a rough estimate — for accurate pH, brewers should measure.
 */
export function estimateMashPH(
  water: WaterProfile,
  fermentables: FermentableAddition[],
  batchSizeL: number,
  waterGrainRatioLPerKg: number,
): number {
  // Start with distilled water + pale malt baseline
  let ph = 5.8;

  // Adjust for roasted malts (Crystal 120+, Chocolate, Roasted Barley, Black)
  const darkMalts = fermentables.filter(
    (f) =>
      f.use === 'mash' &&
      f.fermentable.type === 'grain' &&
      f.fermentable.color_lovibond >= 120,
  );

  const totalDarkLovibond = darkMalts.reduce(
    (sum, f) => sum + f.fermentable.color_lovibond * f.amount_kg,
    0,
  );
  // Rough: every 1000 °L·kg in 20L drops pH by ~0.1
  const darkPhDrop = (totalDarkLovibond / batchSizeL) * 0.002;
  ph -= darkPhDrop;

  // Adjust for RA
  const ra = calculateResidualAlkalinity(water);
  // Every 50 ppm RA raises pH by ~0.1
  const raPhShift = (ra / 50) * 0.1;
  ph += raPhShift;

  // Clamp to realistic brewing range
  return parseFloat(Math.max(4.8, Math.min(6.0, ph)).toFixed(2));
}

export function calculateWaterChemistry(
  water: WaterProfile,
  fermentables: FermentableAddition[],
  batchSizeL: number,
  waterGrainRatioLPerKg: number,
): WaterChemistry {
  const ra = calculateResidualAlkalinity(water);
  const { ratio, character } = calculateSulfateChlorideRatio(water);
  const mashPh = estimateMashPH(water, fermentables, batchSizeL, waterGrainRatioLPerKg);

  return {
    residual_alkalinity_ppm: ra,
    sulfate_chloride_ratio: ratio,
    flavour_character: character,
    estimated_mash_ph: mashPh,
  };
}

// ─── Carbonation / Priming ──────────────────────────────────────────────────

export function calculatePrimingSugar(
  beerVolumeL: number,
  targetVolumesCO2: number,
  beerTempC: number,
  sugarType: 'corn-sugar' | 'table-sugar' | 'dme' | 'wort' = 'corn-sugar',
): number {
  // CO2 already in solution based on temp
  // Simplified: residual CO2 ≈ 3.0378 - 0.050062 * tempC + 0.00026555 * tempC²
  const residualCO2 =
    3.0378 - 0.050062 * beerTempC + 0.00026555 * beerTempC * beerTempC;

  const co2Needed = Math.max(0, targetVolumesCO2 - residualCO2);

  // g/L of sugar needed (corn sugar ≈ 4.02g/L per vol CO2)
  const sugarMultiplier: Record<string, number> = {
    'corn-sugar': 4.02,
    'table-sugar': 3.82,
    dme: 4.54,
    wort: 4.54, // approximate
  };

  const gramsPerLitre = co2Needed * sugarMultiplier[sugarType];
  return parseFloat((gramsPerLitre * beerVolumeL).toFixed(1));
}

// ─── Whirlpool IBU (simplified) ─────────────────────────────────────────────

export function calculateWhirlpoolIBU(
  hops: HopAddition[],
  batchSizeL: number,
  og: number,
  whirlpoolTempC: number,
): number {
  let total = 0;
  for (const h of hops) {
    if (h.use !== 'whirlpool') continue;
    // Utilisation at whirlpool temp is lower than boil
    // Approximate: utilisation factor = 1 - ((100 - tempC) / 100) * 0.85
    // At 100°C: 1.0, At 80°C: ~0.83, At 70°C: ~0.745
    const tempFactor = Math.max(0, 1 - ((100 - whirlpoolTempC) / 100) * 0.85);
    // Time factor for whirlpool: assume 15min equivalent for most whirlpool additions
    const equivalentTime = Math.min(h.time_min, 30);
    const utilization = tinsethUtilization(equivalentTime, og) * tempFactor * 0.35; // 35% of boil util
    const aau = (h.hop.alpha_pct / 100) * h.amount_g;
    total += (aau * utilization * 1000) / batchSizeL;
  }
  return Math.round(total);
}

// ─── Brewhouse efficiency ───────────────────────────────────────────────────

export function calculateBrewhouseEfficiency(
  actualOg: number,
  predictedOg: number,
): number {
  if (predictedOg <= 1) return 0;
  return parseFloat((((actualOg - 1) / (predictedOg - 1)) * 100).toFixed(1));
}
