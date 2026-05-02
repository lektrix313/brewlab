/**
 * Unit conversions — pure functions.
 */

export function sgToPlato(sg: number): number {
  return parseFloat((-616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg).toFixed(2));
}

export function platoToSg(plato: number): number {
  return parseFloat((1 + plato / (258.6 - 0.879551 * plato)).toFixed(3));
}

export function cToF(c: number): number {
  return parseFloat(((c * 9) / 5 + 32).toFixed(1));
}

export function fToC(f: number): number {
  return parseFloat((((f - 32) * 5) / 9).toFixed(1));
}

export function lToGal(l: number): number {
  return parseFloat((l * 0.264172).toFixed(2));
}

export function galToL(gal: number): number {
  return parseFloat((gal * 3.78541).toFixed(2));
}

export function kgToLb(kg: number): number {
  return parseFloat((kg * 2.20462).toFixed(2));
}

export function lbToKg(lb: number): number {
  return parseFloat((lb * 0.453592).toFixed(3));
}

export function gToOz(g: number): number {
  return parseFloat((g * 0.035274).toFixed(2));
}

export function ozToG(oz: number): number {
  return parseFloat((oz * 28.3495).toFixed(1));
}
