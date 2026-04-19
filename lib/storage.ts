const PLAN_KEY = 'meal-planner-plan-v1';
const START_KEY = 'meal-planner-start';

/** key = "year-month-week-dow" → mealId */
export function weekKey(year: number, month: number, week: number, dow: number): string {
  return `${year}-${month}-w${week}-d${dow}`;
}

export function loadPlan(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function savePlan(data: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(PLAN_KEY, JSON.stringify(data)); } catch {}
}

export function loadStartDate(): Date | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(START_KEY);
    if (!raw) return null;
    const [y, m, d] = raw.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  } catch { return null; }
}

export function saveStartDate(date: Date): void {
  if (typeof window === 'undefined') return;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  localStorage.setItem(START_KEY, `${y}-${m}-${d}`);
}
