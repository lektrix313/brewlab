/**
 * Higher-level brewing helpers that combine calculations.
 */

import { FermentableAddition, HopAddition, CultureAddition } from '../beerjson/types';
import { predictOG, predictFG, calculateABV, calculateIBU, calculateSRM, srmToEbc } from './calculations';

export function calculateRecipeStats(
  fermentables: FermentableAddition[],
  hops: HopAddition[],
  cultures: CultureAddition[],
  batchSizeL: number,
  efficiencyPct: number,
) {
  const estimated_og = parseFloat(predictOG(fermentables, batchSizeL, efficiencyPct).toFixed(3));
  const estimated_fg = parseFloat(predictFG(estimated_og, cultures).toFixed(3));
  const estimated_abv_pct = parseFloat(calculateABV(estimated_og, estimated_fg).toFixed(1));
  const estimated_ibu = calculateIBU(hops, batchSizeL, estimated_og);
  const estimated_srm = calculateSRM(fermentables, batchSizeL);
  const estimated_ebc = parseFloat(srmToEbc(estimated_srm).toFixed(1));

  return {
    estimated_og,
    estimated_fg,
    estimated_abv_pct,
    estimated_ibu,
    estimated_srm,
    estimated_ebc,
  };
}
