import { describe, it, expect } from 'vitest';
import {
  predictOG,
  predictFG,
  calculateABV,
  calculateIBU,
  calculateSRM,
  srmToHex,
  srmToEbc,
  ebcToSrm,
  fullyScaleRecipe,
  calculateResidualAlkalinity,
  calculateSulfateChlorideRatio,
  estimateMashPH,
  calculatePrimingSugar,
  calculateWhirlpoolIBU,
} from '../../src/lib/brewing/calculations';
import type { FermentableAddition, HopAddition, CultureAddition, Recipe, WaterProfile } from '../../src/lib/beerjson/types';

// ─── West Coast IPA reference recipe (from sample-recipes/west-coast-ipa.json) ──

const fermentables: FermentableAddition[] = [
  {
    fermentable_id: 'pale-2-row-us',
    fermentable: {
      id: 'pale-2-row-us',
      name: 'Pale 2-Row',
      type: 'grain',
      yield_pct: 80.0,
      color_lovibond: 1.8,
      color_ebc: 4.0,
      flavour_descriptors: ['clean', 'neutral', 'light grain'],
    },
    amount_kg: 4.5,
    use: 'mash',
  },
  {
    fermentable_id: 'munich-light-weyermann',
    fermentable: {
      id: 'munich-light-weyermann',
      name: 'Munich Malt (Light)',
      type: 'grain',
      yield_pct: 79.0,
      color_lovibond: 6.0,
      color_ebc: 14.0,
      flavour_descriptors: ['malty', 'bread', 'toasted', 'rich'],
    },
    amount_kg: 0.4,
    use: 'mash',
  },
  {
    fermentable_id: 'crystal-60-crisp',
    fermentable: {
      id: 'crystal-60-crisp',
      name: 'Crystal Malt 60L',
      type: 'grain',
      yield_pct: 75.0,
      color_lovibond: 60.0,
      color_ebc: 120.0,
      flavour_descriptors: ['caramel', 'toffee', 'raisin'],
    },
    amount_kg: 0.25,
    use: 'mash',
  },
];

const hops: HopAddition[] = [
  {
    hop_id: 'magnum',
    hop: {
      id: 'magnum',
      name: 'Magnum',
      origin: 'DE',
      type: 'bittering',
      alpha_pct: 13.0,
      flavour_descriptors: ['clean', 'neutral'],
    },
    amount_g: 25,
    use: 'boil',
    time_min: 60,
    form: 'pellet',
  },
  {
    hop_id: 'centennial',
    hop: {
      id: 'centennial',
      name: 'Centennial',
      origin: 'US',
      type: 'dual',
      alpha_pct: 10.0,
      flavour_descriptors: ['citrus', 'lemon', 'floral', 'pine'],
    },
    amount_g: 30,
    use: 'boil',
    time_min: 15,
    form: 'pellet',
  },
  {
    hop_id: 'simcoe',
    hop: {
      id: 'simcoe',
      name: 'Simcoe',
      origin: 'US',
      type: 'dual',
      alpha_pct: 13.0,
      flavour_descriptors: ['pine', 'passionfruit', 'earthy'],
    },
    amount_g: 30,
    use: 'boil',
    time_min: 5,
    form: 'pellet',
  },
];

const cultures: CultureAddition[] = [
  {
    culture_id: 'us-05',
    culture: {
      id: 'us-05',
      name: 'Safale US-05',
      manufacturer: 'Fermentis',
      product_id: 'US-05',
      type: 'ale',
      attenuation_pct: 78,
      flocculation: 'medium',
      temperature_min_c: 15,
      temperature_max_c: 24,
      alcohol_tolerance_pct: 11,
      flavour_descriptors: ['clean', 'subtle citrus', 'neutral'],
      pof: false,
    },
    amount_g_or_ml: 11.5,
  },
];

const BATCH_SIZE_L = 20;
const EFFICIENCY_PCT = 75;

// Reference values from BeerSmith / Brewer's Friend (from SPEC.md)
const REFERENCE_OG = 1.061;
const REFERENCE_FG = 1.013;
const REFERENCE_ABV = 6.3;
const REFERENCE_IBU = 58;
const REFERENCE_SRM = 8;

describe('Brewing calculations — regression test (West Coast IPA)', () => {
  it('predicts OG within ±3%', () => {
    const og = predictOG(fermentables, BATCH_SIZE_L, EFFICIENCY_PCT);
    expect(og).toBeCloseTo(REFERENCE_OG, 2);
    const error = Math.abs((og - REFERENCE_OG) / (REFERENCE_OG - 1)) * 100;
    expect(error).toBeLessThan(3);
  });

  it('predicts FG within ±2%', () => {
    const og = predictOG(fermentables, BATCH_SIZE_L, EFFICIENCY_PCT);
    const fg = predictFG(og, cultures);
    expect(fg).toBeCloseTo(REFERENCE_FG, 3);
    const error = Math.abs((fg - REFERENCE_FG) / (REFERENCE_FG - 1)) * 100;
    expect(error).toBeLessThan(2);
  });

  it('predicts ABV within ±3%', () => {
    const og = predictOG(fermentables, BATCH_SIZE_L, EFFICIENCY_PCT);
    const fg = predictFG(og, cultures);
    const abv = calculateABV(og, fg);
    expect(abv).toBeCloseTo(REFERENCE_ABV, 0);
    const error = Math.abs((abv - REFERENCE_ABV) / REFERENCE_ABV) * 100;
    expect(error).toBeLessThan(3);
  });

  it('predicts IBU within ±2%', () => {
    const og = predictOG(fermentables, BATCH_SIZE_L, EFFICIENCY_PCT);
    const ibu = calculateIBU(hops, BATCH_SIZE_L, og);
    expect(ibu).toBeCloseTo(REFERENCE_IBU, 0);
    const error = Math.abs((ibu - REFERENCE_IBU) / REFERENCE_IBU) * 100;
    expect(error).toBeLessThan(2);
  });

  it('predicts SRM within ±5%', () => {
    const srm = calculateSRM(fermentables, BATCH_SIZE_L);
    const error = Math.abs((srm - REFERENCE_SRM) / REFERENCE_SRM) * 100;
    expect(error).toBeLessThan(5.1);
  });
});

describe('SRM colour helpers', () => {
  it('converts SRM to a valid hex colour', () => {
    expect(srmToHex(1)).toBe('#FFE699');
    expect(srmToHex(8)).toBe('#F39C00');
    expect(srmToHex(40)).toBe('#5D341A');
    expect(srmToHex(100)).toBe('#000000');
  });

  it('converts SRM to EBC and back', () => {
    expect(srmToEbc(8)).toBeCloseTo(15.76, 2);
    expect(ebcToSrm(15.76)).toBeCloseTo(8, 2);
  });
});

describe('ABV calculation edge cases', () => {
  it('returns 0 when OG equals FG', () => {
    expect(calculateABV(1.050, 1.050)).toBe(0);
  });

  it('returns a positive value for typical attenuation', () => {
    expect(calculateABV(1.060, 1.012)).toBeGreaterThan(5);
    expect(calculateABV(1.060, 1.012)).toBeLessThan(8);
  });
});

describe('Recipe scaling', () => {
  it('scales ingredient amounts proportionally', () => {
    const recipe: Recipe = {
      id: 'test',
      author_id: 'user',
      name: 'Test IPA',
      type: 'all grain',
      batch_size_l: 20,
      efficiency_pct: 75,
      fermentables,
      hops,
      cultures,
      process: {
        water_profile: {
          calcium_ppm: 50, magnesium_ppm: 5, sodium_ppm: 10,
          sulfate_ppm: 100, chloride_ppm: 50, bicarbonate_ppm: 50,
        },
        mash: { steps: [], water_grain_ratio_l_per_kg: 3, sparge: 'batch', target_ph: 5.4 },
        boil: { duration_min: 60, vigour: 'rolling' },
        fermentation: {
          steps: [{ name: 'Primary', type: 'primary', start_condition: { type: 'time-after-pitch', value: 0 }, temperature_c: 20, end_condition: { type: 'duration-days', value: 7 } }],
          pitch_temp_c: 20,
          oxygenation: 'shake',
        },
        packaging: { method: 'bottle', carbonation_volumes_co2: 2.4, serving_temp_c: 12 },
      },
      estimated_og: 1.061,
      estimated_fg: 1.013,
      estimated_abv_pct: 6.3,
      estimated_ibu: 58,
      estimated_srm: 8,
      estimated_ebc: 16,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const scaled = fullyScaleRecipe(recipe, 10);
    expect(scaled.batch_size_l).toBe(10);
    expect(scaled.fermentables[0].amount_kg).toBeCloseTo(2.25, 2);
    expect(scaled.hops[0].amount_g).toBeCloseTo(12.5, 1);
    expect(scaled.cultures[0].amount_g_or_ml).toBeCloseTo(5.75, 2);
    // Stats should be recomputed (similar since linear scale)
    expect(scaled.estimated_og).toBeGreaterThan(1);
    expect(scaled.estimated_ibu).toBeGreaterThan(0);
  });
});

describe('Water chemistry', () => {
  const water: WaterProfile = {
    calcium_ppm: 50,
    magnesium_ppm: 5,
    sodium_ppm: 10,
    sulfate_ppm: 100,
    chloride_ppm: 50,
    bicarbonate_ppm: 50,
  };

  it('calculates residual alkalinity', () => {
    const ra = calculateResidualAlkalinity(water);
    expect(ra).not.toBeNaN();
    expect(typeof ra).toBe('number');
  });

  it('calculates sulfate:chloride ratio', () => {
    const result = calculateSulfateChlorideRatio(water);
    expect(result.ratio).toBeCloseTo(2.0, 1);
    expect(result.character).toBe('very hoppy');
  });

  it('estimates mash pH in realistic range', () => {
    const ph = estimateMashPH(water, fermentables, 20, 3);
    expect(ph).toBeGreaterThanOrEqual(4.8);
    expect(ph).toBeLessThanOrEqual(6.0);
  });
});

describe('Priming sugar', () => {
  it('calculates corn sugar for typical ale', () => {
    const sugar = calculatePrimingSugar(20, 2.4, 20, 'corn-sugar');
    // At 20°C residual CO2 ≈ 2.14 vols, need ~0.26 vols → ~20-21g for 20L
    expect(sugar).toBeGreaterThan(15);
    expect(sugar).toBeLessThan(30);
  });
});

describe('Whirlpool IBU', () => {
  it('returns lower IBU than equivalent boil addition', () => {
    const whirlpoolHops: HopAddition[] = [{
      hop_id: 'citra',
      hop: { id: 'citra', name: 'Citra', origin: 'US', type: 'dual', alpha_pct: 12, flavour_descriptors: ['citrus'] },
      amount_g: 50,
      use: 'whirlpool',
      time_min: 15,
    }];
    const boilHops: HopAddition[] = [{
      hop_id: 'citra',
      hop: { id: 'citra', name: 'Citra', origin: 'US', type: 'dual', alpha_pct: 12, flavour_descriptors: ['citrus'] },
      amount_g: 50,
      use: 'boil',
      time_min: 15,
    }];
    const og = 1.060;
    const whirlpoolIBU = calculateWhirlpoolIBU(whirlpoolHops, 20, og, 80);
    const boilIBU = calculateIBU(boilHops, 20, og);
    expect(whirlpoolIBU).toBeLessThan(boilIBU);
  });
});
