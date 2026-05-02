/**
 * Core data types for TUN — aligned with BeerJSON 1.0.
 * Types are inferred from Zod schemas where possible, but we need
 * these interfaces for cleaner imports in pure function modules.
 */

export type RecipeType = 'extract' | 'partial mash' | 'all grain';

export type StyleCategory =
  | 'lager'
  | 'ale'
  | 'sour'
  | 'porter'
  | 'stout'
  | 'ipa'
  | 'pale ale'
  | 'wheat'
  | 'specialty';

export interface Fermentable {
  id: string;
  name: string;
  type: 'grain' | 'extract' | 'sugar' | 'fruit' | 'juice' | 'honey' | 'other';
  origin?: string;
  supplier?: string;
  yield_pct: number;
  color_lovibond: number;
  color_ebc: number;
  diastatic_power_lintner?: number;
  max_in_grist_pct?: number;
  description?: string;
  flavour_descriptors: string[];
}

export interface FermentableAddition {
  fermentable_id: string;
  fermentable: Fermentable;
  amount_kg: number;
  use: 'mash' | 'boil' | 'fermentation' | 'packaging';
}

export interface Hop {
  id: string;
  name: string;
  origin: string;
  type: 'bittering' | 'aroma' | 'dual';
  alpha_pct: number;
  alpha_pct_min?: number;
  alpha_pct_max?: number;
  beta_pct?: number;
  cohumulone_pct?: number;
  total_oils_ml_per_100g?: number;
  oil_composition?: {
    myrcene_pct?: number;
    humulene_pct?: number;
    caryophyllene_pct?: number;
    farnesene_pct?: number;
    linalool_pct?: number;
    geraniol_pct?: number;
    other_pct?: number;
  };
  flavour_descriptors: string[];
  substitutes?: string[];
  description?: string;
}

export interface HopAddition {
  hop_id: string;
  hop: Hop;
  amount_g: number;
  use: 'first wort' | 'boil' | 'whirlpool' | 'dry hop';
  time_min: number;
  form?: 'pellet' | 'leaf' | 'extract' | 'cryo';
}

export interface Culture {
  id: string;
  name: string;
  manufacturer: string;
  product_id?: string;
  type: 'ale' | 'lager' | 'wheat' | 'wine' | 'champagne' | 'mixed' | 'wild' | 'kveik';
  attenuation_pct: number;
  attenuation_pct_min?: number;
  attenuation_pct_max?: number;
  flocculation: 'low' | 'medium' | 'medium-high' | 'high' | 'very high';
  temperature_min_c: number;
  temperature_max_c: number;
  alcohol_tolerance_pct?: number;
  flavour_descriptors: string[];
  pof?: boolean;
  description?: string;
}

export interface CultureAddition {
  culture_id: string;
  culture: Culture;
  amount_g_or_ml: number;
  attenuation_pct?: number;
}

export interface MashStep {
  name: string;
  temperature_c: number;
  duration_min: number;
  type: 'infusion' | 'temperature' | 'decoction';
  rest_purpose?: 'acid' | 'protein' | 'beta-glucanase' | 'beta-amylase' | 'alpha-amylase' | 'mash-out';
}

export interface MashProfile {
  steps: MashStep[];
  water_grain_ratio_l_per_kg: number;
  sparge: 'no-sparge' | 'batch' | 'fly';
  target_ph: number;
  grain_temp_c?: number;
}

export interface FermentationStep {
  name: string;
  type: 'primary' | 'diacetyl-rest' | 'free-rise' | 'crash' | 'lagering' | 'dry-hop' | 'secondary';
  start_condition: {
    type: 'time-after-pitch' | 'gravity-reaches' | 'attenuation-pct' | 'previous-step-end';
    value: number;
  };
  temperature_c: number;
  ramp_rate_c_per_day?: number;
  end_condition: {
    type: 'duration-days' | 'gravity-reaches' | 'temp-reaches';
    value: number;
  };
  hop_addition_ids?: string[];
  notes?: string;
}

export interface FermentationProfile {
  steps: FermentationStep[];
  pitch_temp_c: number;
  pitch_rate_million_cells_per_ml_per_plato?: number;
  pressure_psi?: number;
  yeast_nutrient_g_per_l?: number;
  oxygenation: 'none' | 'shake' | 'aquarium-pump' | 'pure-o2';
}

export interface BeerStyle {
  bjcp_id: string;
  name: string;
  category: StyleCategory;
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
}

export interface WaterProfile {
  name?: string;
  calcium_ppm: number;
  magnesium_ppm: number;
  sodium_ppm: number;
  sulfate_ppm: number;
  chloride_ppm: number;
  bicarbonate_ppm: number;
}

export interface BoilProcess {
  duration_min: number;
  vigour: 'gentle' | 'rolling' | 'vigorous';
  evaporation_rate_l_per_hr?: number;
  whirlpool?: {
    temperature_c: number;
    hold_min: number;
  };
}

export interface ConditioningProcess {
  duration_days: number;
  temperature_c: number;
  notes?: string;
}

export interface PackagingProcess {
  method: 'bottle' | 'keg' | 'cask';
  carbonation_volumes_co2: number;
  bottle_priming?: {
    sugar_type: 'corn-sugar' | 'table-sugar' | 'dme' | 'wort';
    sugar_g_per_l: number;
    yeast_addition?: { culture_id: string; amount_g: number };
    conditioning_temp_c: number;
    conditioning_days: number;
  };
  force_carb?: {
    method: 'set-and-forget' | 'shake' | 'high-low';
    pressure_psi: number;
    temperature_c: number;
    duration_hours: number;
  };
  serving_temp_c: number;
}

export interface BrewProcess {
  water_profile: WaterProfile;
  mash: MashProfile;
  boil: BoilProcess;
  fermentation: FermentationProfile;
  conditioning?: ConditioningProcess;
  packaging: PackagingProcess;
}

export interface Recipe {
  id: string;
  author_id: string;
  name: string;
  description?: string;
  style?: BeerStyle;
  type: RecipeType;
  batch_size_l: number;
  efficiency_pct: number;
  fermentables: FermentableAddition[];
  hops: HopAddition[];
  cultures: CultureAddition[];
  miscs?: MiscAddition[];
  process: BrewProcess;
  instantiated_from_template_id?: string;
  estimated_og: number;
  estimated_fg: number;
  estimated_abv_pct: number;
  estimated_ibu: number;
  estimated_srm: number;
  estimated_ebc: number;
  is_public: boolean;
  forked_from_id?: string;
  created_at: string;
  updated_at: string;
}

export interface MiscAddition {
  name: string;
  amount: number;
  unit: string;
  use: 'mash' | 'boil' | 'fermentation' | 'packaging';
}

export interface ExpectedProfile {
  overall_summary: string;
  dominant_descriptors: string[];
  body: 'light' | 'medium-light' | 'medium' | 'medium-full' | 'full';
  bitterness_perception: 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high' | 'aggressive';
  sweetness: 'dry' | 'semi-dry' | 'balanced' | 'sweet';
  finish: string;
}

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  style_id: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_brew_to_ready_days: number;
  base_batch_size_l: number;
  fermentables: FermentableAddition[];
  hops: HopAddition[];
  cultures: CultureAddition[];
  process: BrewProcess;
  expected_profile: ExpectedProfile;
  tips: string[];
  common_mistakes: string[];
  hero_image?: string;
}

// ─── Batch types ────────────────────────────────────────────────────────────

export type BatchStatus =
  | 'planned'
  | 'brew-day'
  | 'lag-phase'
  | 'active-fermentation'
  | 'attenuating'
  | 'conditioning'
  | 'cold-crash'
  | 'ready'
  | 'archived';

export interface Batch {
  id: string;
  user_id: string;
  recipe_id: string;
  recipe_snapshot: Recipe;
  name?: string;
  status: BatchStatus;
  started_at: string;
  estimated_ready_at: string;
  measurements: BatchMeasurement[];
  predicted_curve: PredictedCurvePoint[];
  notes: BatchNote[];
  photos: string[];
  is_public: boolean;
  tasting?: TastingNote;
  created_at: string;
  updated_at: string;
}

export interface BatchMeasurement {
  id: string;
  recorded_at: string;
  type: 'gravity' | 'temperature' | 'ph' | 'volume';
  value: number;
  unit: 'sg' | 'plato' | 'celsius' | 'fahrenheit' | 'ph' | 'litre';
  source: 'manual' | 'tilt' | 'plaato' | 'rapt';
  note?: string;
}

export interface PredictedCurvePoint {
  hours_since_pitch: number;
  predicted_gravity_sg: number;
  predicted_abv_pct: number;
  predicted_temperature_c: number;
  predicted_status: BatchStatus;
}

export interface BatchNote {
  id: string;
  recorded_at: string;
  text: string;
}

export interface TastingNote {
  recorded_at: string;
  rating: number;
  aroma: string;
  appearance: string;
  flavour: string;
  mouthfeel: string;
  overall: string;
  flavour_tags: string[];
}

// ─── Alert types ────────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertTrigger =
  | 'gravity-stuck'
  | 'lag-phase-extended'
  | 'fermentation-too-fast'
  | 'fermentation-too-slow'
  | 'temp-out-of-range'
  | 'temp-out-of-style-range'
  | 'attenuation-low'
  | 'diacetyl-rest-due'
  | 'dry-hop-due'
  | 'cold-crash-due'
  | 'lagering-ramp-due'
  | 'package-due';

export interface BatchAlert {
  id: string;
  batch_id: string;
  triggered_at: string;
  trigger: AlertTrigger;
  severity: AlertSeverity;
  message: string;
  ai_suggestions?: AISuggestion[];
  acknowledged_at?: string;
  resolved_at?: string;
}

export interface AISuggestion {
  action: string;
  rationale: string;
  risk: 'low' | 'medium' | 'high';
  reversible: boolean;
}
