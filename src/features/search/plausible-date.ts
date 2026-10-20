/** A complete, plausible date: typing a year digit by digit passes through 0002, 0020, 0202… */
export function isPlausibleDate(value: string): boolean {
  const year = Number(value.slice(0, 4));
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && year >= 1900 && year <= 2100;
}
