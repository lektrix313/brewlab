import { z } from 'zod';

export const FermentableSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['grain', 'extract', 'sugar', 'fruit', 'juice', 'honey', 'other']),
  origin: z.string().optional(),
  supplier: z.string().optional(),
  yield_pct: z.number(),
  color_lovibond: z.number(),
  color_ebc: z.number(),
  diastatic_power_lintner: z.number().optional(),
  max_in_grist_pct: z.number().optional(),
  description: z.string().optional(),
  flavour_descriptors: z.array(z.string()),
});

export const FermentableAdditionSchema = z.object({
  fermentable_id: z.string(),
  fermentable: FermentableSchema,
  amount_kg: z.number(),
  use: z.enum(['mash', 'boil', 'fermentation', 'packaging']),
});

export const HopSchema = z.object({
  id: z.string(),
  name: z.string(),
  origin: z.string(),
  type: z.enum(['bittering', 'aroma', 'dual']),
  alpha_pct: z.number(),
  alpha_pct_min: z.number().optional(),
  alpha_pct_max: z.number().optional(),
  beta_pct: z.number().optional(),
  cohumulone_pct: z.number().optional(),
  total_oils_ml_per_100g: z.number().optional(),
  oil_composition: z
    .object({
      myrcene_pct: z.number().optional(),
      humulene_pct: z.number().optional(),
      caryophyllene_pct: z.number().optional(),
      farnesene_pct: z.number().optional(),
      linalool_pct: z.number().optional(),
      geraniol_pct: z.number().optional(),
      other_pct: z.number().optional(),
    })
    .optional(),
  flavour_descriptors: z.array(z.string()),
  substitutes: z.array(z.string()).optional(),
  description: z.string().optional(),
});

export const HopAdditionSchema = z.object({
  hop_id: z.string(),
  hop: HopSchema,
  amount_g: z.number(),
  use: z.enum(['first wort', 'boil', 'whirlpool', 'dry hop']),
  time_min: z.number(),
  form: z.enum(['pellet', 'leaf', 'extract', 'cryo']).optional(),
});

export const CultureSchema = z.object({
  id: z.string(),
  name: z.string(),
  manufacturer: z.string(),
  product_id: z.string().optional(),
  type: z.enum(['ale', 'lager', 'wheat', 'wine', 'champagne', 'mixed', 'wild', 'kveik']),
  attenuation_pct: z.number(),
  attenuation_pct_min: z.number().optional(),
  attenuation_pct_max: z.number().optional(),
  flocculation: z.enum(['low', 'medium', 'medium-high', 'high', 'very high']),
  temperature_min_c: z.number(),
  temperature_max_c: z.number(),
  alcohol_tolerance_pct: z.number().optional(),
  flavour_descriptors: z.array(z.string()),
  pof: z.boolean().optional(),
  description: z.string().optional(),
});

export const CultureAdditionSchema = z.object({
  culture_id: z.string(),
  culture: CultureSchema,
  amount_g_or_ml: z.number(),
  attenuation_pct: z.number().optional(),
});

export const MashStepSchema = z.object({
  name: z.string(),
  temperature_c: z.number(),
  duration_min: z.number(),
  type: z.enum(['infusion', 'temperature', 'decoction']),
  rest_purpose: z.enum(['acid', 'protein', 'beta-glucanase', 'beta-amylase', 'alpha-amylase', 'mash-out']).optional(),
});

export const MashProfileSchema = z.object({
  steps: z.array(MashStepSchema),
  water_grain_ratio_l_per_kg: z.number(),
  sparge: z.enum(['no-sparge', 'batch', 'fly']),
  target_ph: z.number(),
  grain_temp_c: z.number().optional(),
});

export const FermentationStepSchema = z.object({
  name: z.string(),
  type: z.enum(['primary', 'diacetyl-rest', 'free-rise', 'crash', 'lagering', 'dry-hop', 'secondary']),
  start_condition: z.object({
    type: z.enum(['time-after-pitch', 'gravity-reaches', 'attenuation-pct', 'previous-step-end']),
    value: z.number(),
  }),
  temperature_c: z.number(),
  ramp_rate_c_per_day: z.number().optional(),
  end_condition: z.object({
    type: z.enum(['duration-days', 'gravity-reaches', 'temp-reaches']),
    value: z.number(),
  }),
  hop_addition_ids: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const FermentationProfileSchema = z.object({
  steps: z.array(FermentationStepSchema),
  pitch_temp_c: z.number(),
  pitch_rate_million_cells_per_ml_per_plato: z.number().optional(),
  pressure_psi: z.number().optional(),
  yeast_nutrient_g_per_l: z.number().optional(),
  oxygenation: z.enum(['none', 'shake', 'aquarium-pump', 'pure-o2']),
});

export const BeerStyleSchema = z.object({
  bjcp_id: z.string(),
  name: z.string(),
  category: z.enum(['lager', 'ale', 'sour', 'porter', 'stout', 'ipa', 'pale ale', 'wheat', 'specialty']),
  og_min: z.number(),
  og_max: z.number(),
  fg_min: z.number(),
  fg_max: z.number(),
  abv_min_pct: z.number(),
  abv_max_pct: z.number(),
  ibu_min: z.number(),
  ibu_max: z.number(),
  srm_min: z.number(),
  srm_max: z.number(),
});

export const WaterProfileSchema = z.object({
  name: z.string().optional(),
  calcium_ppm: z.number(),
  magnesium_ppm: z.number(),
  sodium_ppm: z.number(),
  sulfate_ppm: z.number(),
  chloride_ppm: z.number(),
  bicarbonate_ppm: z.number(),
});

export const BoilProcessSchema = z.object({
  duration_min: z.number(),
  vigour: z.enum(['gentle', 'rolling', 'vigorous']),
  evaporation_rate_l_per_hr: z.number().optional(),
  whirlpool: z
    .object({
      temperature_c: z.number(),
      hold_min: z.number(),
    })
    .optional(),
});

export const ConditioningProcessSchema = z.object({
  duration_days: z.number(),
  temperature_c: z.number(),
  notes: z.string().optional(),
});

export const PackagingProcessSchema = z.object({
  method: z.enum(['bottle', 'keg', 'cask']),
  carbonation_volumes_co2: z.number(),
  bottle_priming: z
    .object({
      sugar_type: z.enum(['corn-sugar', 'table-sugar', 'dme', 'wort']),
      sugar_g_per_l: z.number(),
      yeast_addition: z.object({ culture_id: z.string(), amount_g: z.number() }).optional(),
      conditioning_temp_c: z.number(),
      conditioning_days: z.number(),
    })
    .optional(),
  force_carb: z
    .object({
      method: z.enum(['set-and-forget', 'shake', 'high-low']),
      pressure_psi: z.number(),
      temperature_c: z.number(),
      duration_hours: z.number(),
    })
    .optional(),
  serving_temp_c: z.number(),
});

export const BrewProcessSchema = z.object({
  water_profile: WaterProfileSchema,
  mash: MashProfileSchema,
  boil: BoilProcessSchema,
  fermentation: FermentationProfileSchema,
  conditioning: ConditioningProcessSchema.optional(),
  packaging: PackagingProcessSchema,
});

export const RecipeSchema = z.object({
  id: z.string(),
  author_id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  style: BeerStyleSchema.optional(),
  type: z.enum(['extract', 'partial mash', 'all grain']),
  batch_size_l: z.number(),
  efficiency_pct: z.number(),
  fermentables: z.array(FermentableAdditionSchema),
  hops: z.array(HopAdditionSchema),
  cultures: z.array(CultureAdditionSchema),
  process: BrewProcessSchema,
  instantiated_from_template_id: z.string().optional(),
  estimated_og: z.number(),
  estimated_fg: z.number(),
  estimated_abv_pct: z.number(),
  estimated_ibu: z.number(),
  estimated_srm: z.number(),
  estimated_ebc: z.number(),
  is_public: z.boolean(),
  forked_from_id: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ExpectedProfileSchema = z.object({
  overall_summary: z.string(),
  dominant_descriptors: z.array(z.string()),
  body: z.enum(['light', 'medium-light', 'medium', 'medium-full', 'full']),
  bitterness_perception: z.enum(['low', 'medium-low', 'medium', 'medium-high', 'high', 'aggressive']),
  sweetness: z.enum(['dry', 'semi-dry', 'balanced', 'sweet']),
  finish: z.string(),
});

export const StyleTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  style_id: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_brew_to_ready_days: z.number(),
  base_batch_size_l: z.number(),
  fermentables: z.array(FermentableAdditionSchema),
  hops: z.array(HopAdditionSchema),
  cultures: z.array(CultureAdditionSchema),
  process: BrewProcessSchema,
  expected_profile: ExpectedProfileSchema,
  tips: z.array(z.string()),
  common_mistakes: z.array(z.string()),
  hero_image: z.string().optional(),
});
