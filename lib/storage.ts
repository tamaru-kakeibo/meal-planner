const PLAN_KEY = 'meal-planner-plan-v1';
const START_KEY = 'meal-planner-start';
const SHOPPING_KEY = 'meal-planner-shopping-v1';
const FAMILY_KEY = 'meal-planner-family-v1';
const SKIPPED_DAYS_KEY = 'meal-planner-skipped-days-v1';

/** スキップする日付の集合（"YYYY-MM-DD" 形式）を週ごとに保存 */
export function loadSkippedDays(weekId: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SKIPPED_DAYS_KEY);
    const all: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    return new Set(all[weekId] ?? []);
  } catch { return new Set(); }
}

export function saveSkippedDays(weekId: string, skipped: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SKIPPED_DAYS_KEY);
    const all: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const keys = Object.keys(all);
    if (keys.length > 8) keys.slice(0, keys.length - 8).forEach(k => delete all[k]);
    all[weekId] = Array.from(skipped);
    localStorage.setItem(SKIPPED_DAYS_KEY, JSON.stringify(all));
  } catch {}
}

import type { FamilySettings } from './meals';
import { DEFAULT_FAMILY } from './meals';

export function loadFamilySettings(): FamilySettings {
  if (typeof window === 'undefined') return DEFAULT_FAMILY;
  try {
    const raw = localStorage.getItem(FAMILY_KEY);
    return raw ? { ...DEFAULT_FAMILY, ...JSON.parse(raw) } : DEFAULT_FAMILY;
  } catch { return DEFAULT_FAMILY; }
}

export function saveFamilySettings(settings: FamilySettings): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(FAMILY_KEY, JSON.stringify(settings)); } catch {}
}

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

/** 買い物チェック状態を週ごとに保存（weekId = "year-month-wN"） */
export function loadShoppingChecked(weekId: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SHOPPING_KEY);
    const all: Record<string, Record<string, boolean>> = raw ? JSON.parse(raw) : {};
    return all[weekId] ?? {};
  } catch { return {}; }
}

export function saveShoppingChecked(weekId: string, checked: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SHOPPING_KEY);
    const all: Record<string, Record<string, boolean>> = raw ? JSON.parse(raw) : {};
    // 古いデータを削除（直近4週分だけ保持）
    const keys = Object.keys(all);
    if (keys.length > 4) keys.slice(0, keys.length - 4).forEach(k => delete all[k]);
    all[weekId] = checked;
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(all));
  } catch {}
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
