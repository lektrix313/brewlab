/**
 * BeerXML 1.0 export for recipe sharing.
 */
import type { Recipe } from './beerjson/types';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function recipeToBeerXML(recipe: Recipe): string {
  const fermentablesXml = recipe.fermentables
    .map((f) => {
      const fg = f.fermentable;
      return `    <FERMENTABLE>
      <NAME>${escapeXml(fg.name)}</NAME>
      <VERSION>1</VERSION>
      <TYPE>${fg.type ?? 'Grain'}</TYPE>
      <AMOUNT>${f.amount_kg}</AMOUNT>
      <YIELD>${fg.yield_potential ?? 75}</YIELD>
      <COLOR>${fg.color_srm ?? 2}</COLOR>
    </FERMENTABLE>`;
    })
    .join('\n');

  const hopsXml = recipe.hops
    .map((h) => {
      const hop = h.hop;
      return `    <HOP>
      <NAME>${escapeXml(hop.name)}</NAME>
      <VERSION>1</VERSION>
      <ALPHA>${hop.alpha_acid_min ?? 5}</ALPHA>
      <AMOUNT>${(h.amount_g ?? 0) / 1000}</AMOUNT>
      <USE>${h.use ?? 'Boil'}</USE>
      <TIME>${h.time_min ?? 60}</TIME>
      <FORM>${hop.type ?? 'Pellet'}</FORM>
    </HOP>`;
    })
    .join('\n');

  const yeastsXml = recipe.cultures
    .map((c) => {
      const culture = c.culture;
      return `    <YEAST>
      <NAME>${escapeXml(culture.name)}</NAME>
      <VERSION>1</VERSION>
      <TYPE>${culture.type ?? 'Ale'}</TYPE>
      <FORM>${culture.form ?? 'Liquid'}</FORM>
      <ATTENUATION>${culture.attenuation_min ?? 75}</ATTENUATION>
    </YEAST>`;
    })
    .join('\n');

  const mashStepsXml = (recipe.process?.mash?.steps ?? [])
    .map((step, i) => `    <MASH_STEP>
      <NAME>${escapeXml(step.name ?? `Step ${i + 1}`)}</NAME>
      <VERSION>1</VERSION>
      <TYPE>${step.type ?? 'Infusion'}</TYPE>
      <STEP_TEMP>${step.temperature_c ?? 67}</STEP_TEMP>
      <STEP_TIME>${step.duration_min ?? 60}</STEP_TIME>
    </MASH_STEP>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<RECIPES>
  <RECIPE>
    <NAME>${escapeXml(recipe.name)}</NAME>
    <VERSION>1</VERSION>
    <TYPE>All Grain</TYPE>
    <BREWER>TUN BrewLab</BREWER>
    <BATCH_SIZE>${recipe.batch_size_l}</BATCH_SIZE>
    <BOIL_SIZE>${recipe.batch_size_l * 1.2}</BOIL_SIZE>
    <BOIL_TIME>${recipe.process?.boil?.duration_min ?? 60}</BOIL_TIME>
    <EFFICIENCY>${recipe.efficiency_pct}</EFFICIENCY>
    <OG>${recipe.estimated_og}</OG>
    <FG>${recipe.estimated_fg}</FG>
    <ABV>${recipe.estimated_abv_pct}</ABV>
    <IBU>${recipe.estimated_ibu}</IBU>
    <COLOR>${recipe.estimated_srm}</COLOR>
    <STYLE>
      <NAME>${escapeXml(recipe.style?.name ?? 'Custom')}</NAME>
      <VERSION>1</VERSION>
      <CATEGORY>${escapeXml(recipe.style?.category ?? 'Ale')}</CATEGORY>
      <OG_MIN>${recipe.style?.og_min ?? 1.0}</OG_MIN>
      <OG_MAX>${recipe.style?.og_max ?? 1.2}</OG_MAX>
      <FG_MIN>${recipe.style?.fg_min ?? 1.0}</FG_MIN>
      <FG_MAX>${recipe.style?.fg_max ?? 1.03}</FG_MAX>
      <ABV_MIN>${recipe.style?.abv_min_pct ?? 0}</ABV_MIN>
      <ABV_MAX>${recipe.style?.abv_max_pct ?? 20}</ABV_MAX>
      <IBU_MIN>${recipe.style?.ibu_min ?? 0}</IBU_MIN>
      <IBU_MAX>${recipe.style?.ibu_max ?? 200}</IBU_MAX>
      <COLOR_MIN>${recipe.style?.srm_min ?? 0}</COLOR_MIN>
      <COLOR_MAX>${recipe.style?.srm_max ?? 50}</COLOR_MAX>
    </STYLE>
    <FERMENTABLES>
${fermentablesXml}
    </FERMENTABLES>
    <HOPS>
${hopsXml}
    </HOPS>
    <YEASTS>
${yeastsXml}
    </YEASTS>
    <MASH>
      <NAME>${escapeXml(recipe.name)} Mash</NAME>
      <VERSION>1</VERSION>
      <GRAIN_TEMP>20</GRAIN_TEMP>
      <MASH_STEPS>
${mashStepsXml}
      </MASH_STEPS>
    </MASH>
  </RECIPE>
</RECIPES>`;
}

export function recipeToJSON(recipe: Recipe): string {
  return JSON.stringify(recipe, null, 2);
}
