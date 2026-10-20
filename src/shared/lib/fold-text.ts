/** Lower-cased and accent-free, for forgiving comparisons ("Ségolène" ≈ "segolene"). */
export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
