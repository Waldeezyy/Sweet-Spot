export const RUSH_FEE_CENTS = 1500;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseScheduledDate(scheduledDate: string): Date {
  return startOfDay(new Date(`${scheduledDate}T00:00:00`));
}

export function getEarliestStandardDate(leadTimeDays: number, from: Date = new Date()): Date {
  const min = startOfDay(from);
  min.setDate(min.getDate() + leadTimeDays);
  return min;
}

export function isRushOrderDate(scheduledDate: string, leadTimeDays: number): boolean {
  const selected = parseScheduledDate(scheduledDate);
  const today = startOfDay(new Date());
  const earliest = getEarliestStandardDate(leadTimeDays, today);
  return selected >= today && selected < earliest;
}

export function isPastScheduledDate(scheduledDate: string): boolean {
  const selected = parseScheduledDate(scheduledDate);
  const today = startOfDay(new Date());
  return selected < today;
}

export function todayDateInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
