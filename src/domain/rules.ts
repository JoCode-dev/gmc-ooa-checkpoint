/** Loan length and borrowing ceiling identified during analysis. */
export const LOAN_DAYS = 14;
export const MAX_OPEN_LOANS = 3;

export function addDays(from: Date, days: number): Date {
  const next = new Date(from.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${label} est obligatoire.`);
  }
  return trimmed;
}
