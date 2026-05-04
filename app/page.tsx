'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MEALS, SIDES, SOUPS, FRUITS, MONTHLY_PLAN, CATEGORY_CONFIG, STAPLES,
  Meal, Side, Soup, DayPlan, ShoppingItem, FamilySettings, DEFAULT_FAMILY, scaleAmount,
  MealCategory, SideCategory,
} from '@/lib/meals';
import { loadPlan, savePlan, weekKey, loadShoppingChecked, saveShoppingChecked, loadFamilySettings, saveFamilySettings, loadSkippedDays, saveSkippedDays } from '@/lib/storage';

const MONTH_JP = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const DOW_JP   = ['日','月','火','水','木','金','土'];
const DOW_FULL = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
const WEEKDAYS = [1, 2, 3, 4, 5];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function calendarGrid(y: number, m: number): (Date | null)[] {
  const startDow = new Date(y, m, 1).getDay();
  const total = daysInMonth(y, m);
  const cells: (Date | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.ceil((date.getDate() + firstDay) / 7);
}

function defaultDayPlan(date: Date): DayPlan | null {
  const dow = date.getDay();
  if (!WEEKDAYS.includes(dow)) return null;
  const week = ((getWeekOfMonth(date) - 1) % 4);
  const dayIndex = dow - 1;
  return MONTHLY_PLAN[week]?.[dayIndex] ?? null;
}

function resolveMainId(date: Date, plan: Record<string, string>): string | null {
  const dow = date.getDay();
  if (!WEEKDAYS.includes(dow)) return null;
  const week = getWeekOfMonth(date);
  const key = weekKey(date.getFullYear(), date.getMonth(), week, dow);
  return plan[key] ?? defaultDayPlan(date)?.main ?? null;
}

interface ResolvedDay {
  dow: number;
  date: Date;
  key: string;
  dayPlan: DayPlan;
  mainMeal: Meal;
  totalCalories: number;
}

function getWeekDays(
  year: number, month: number, week: number,
  plan: Record<string, string>
): ResolvedDay[] {
  const result: ResolvedDay[] = [];
  // カレンダー行の先頭日を逆算（負の値や月超えはDateが自動処理）
  const firstDow = new Date(year, month, 1).getDay();
  const firstDayOfWeek = (week - 1) * 7 - firstDow + 1;
  const startOfMonth = new Date(year, month, 1);

  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(year, month, firstDayOfWeek + offset); // 月跨ぎを自動解決
    if (date < startOfMonth) continue; // 前月の日は除外
    const dow = date.getDay();
    if (!WEEKDAYS.includes(dow)) continue;
    const key = weekKey(year, month, week, dow);
    const defaultPlan = defaultDayPlan(date);
    if (!defaultPlan) continue;
    const overrideMainId = plan[key];
    const mainId = overrideMainId ?? defaultPlan.main;
    const mainMeal = MEALS[mainId];
    if (!mainMeal) continue;
    const dayPlan: DayPlan = overrideMainId
      ? { ...defaultPlan, main: overrideMainId }
      : defaultPlan;

    let cal = mainMeal.calories;
    dayPlan.sides.forEach(sid => { cal += SIDES[sid]?.calories ?? 0; });
    if (dayPlan.soup) cal += SOUPS[dayPlan.soup]?.calories ?? 0;
    if (dayPlan.fruit) cal += FRUITS[dayPlan.fruit]?.calories ?? 0;

    result.push({ dow, date, key, dayPlan, mainMeal, totalCalories: cal });
  }
  return result;
}

/** "1/2" や "1" などの文字列を数値に変換 */
function parseNum(s: string): number | null {
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

/** 数値を見やすい分数・整数に戻す（例: 0.5→"1/2", 2.5→"2と1/2"） */
function formatNum(n: number): string {
  const whole = Math.floor(n);
  const frac = n - whole;
  const FRACS: [number, string][] = [[1/4,'1/4'],[1/3,'1/3'],[1/2,'1/2'],[2/3,'2/3'],[3/4,'3/4']];
  const matched = FRACS.find(([v]) => Math.abs(frac - v) < 0.01);
  if (matched) return whole > 0 ? `${whole}と${matched[1]}` : matched[1];
  if (n === Math.floor(n)) return String(n);
  return String(Math.round(n * 10) / 10);
}

/** "1個・2個・1個" → "4個" のように単位ごとに合算 */
function sumAmounts(amounts: string[]): string {
  if (amounts.length === 1) return amounts[0];
  // "数値+単位" の形に分解して合算を試みる
  const parsed: { num: number; unit: string }[] = [];
  for (const a of amounts) {
    const m = a.match(/^(\d+(?:\/\d+)?)\s*(.*)$/);
    if (!m) return amounts.join('・'); // 解析不能なものが1つでもあれば諦める
    const num = parseNum(m[1]);
    if (num === null) return amounts.join('・');
    parsed.push({ num, unit: m[2].trim() });
  }
  // 単位ごとに集計
  const byUnit: Record<string, number> = {};
  for (const { num, unit } of parsed) {
    byUnit[unit] = (byUnit[unit] ?? 0) + num;
  }
  return Object.entries(byUnit)
    .map(([unit, total]) => `${formatNum(total)}${unit}`)
    .join('・');
}

function buildShoppingItems(weekDays: ResolvedDay[], servings: number): { name: string; amount: string }[] {
  const items: Record<string, string[]> = {};

  function add(si: ShoppingItem) {
    if (STAPLES.has(si.name)) return;
    if (!items[si.name]) items[si.name] = [];
    items[si.name].push(scaleAmount(si.amount, servings));
  }

  weekDays.forEach(({ dayPlan }) => {
    MEALS[dayPlan.main]?.shopping.forEach(add);
    dayPlan.sides.forEach(sid => SIDES[sid]?.shopping.forEach(add));
    if (dayPlan.soup) SOUPS[dayPlan.soup]?.shopping.forEach(add);
    if (dayPlan.fruit) {
      const fruit = FRUITS[dayPlan.fruit];
      if (fruit) add({ name: fruit.name, amount: '適量' });
    }
  });

  return Object.entries(items)
    .map(([name, amounts]) => ({ name, amount: sumAmounts(amounts) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

// ─── メインページ ──────────────────────────────────────────────────────────────

export default function Page() {
  const today = useMemo(() => new Date(), []);
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingChecked, setShoppingChecked] = useState<Record<string, boolean>>({});
  const [swapTarget, setSwapTarget] = useState<{ key: string; date: Date } | null>(null);
  const [detailTarget, setDetailTarget] = useState<ResolvedDay | null>(null);
  const [family, setFamily] = useState<FamilySettings>(DEFAULT_FAMILY);
  const [familyInput, setFamilyInput] = useState<FamilySettings>(DEFAULT_FAMILY);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skippedDates, setSkippedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    setPlan(loadPlan());
    const f = loadFamilySettings();
    setFamily(f);
    setFamilyInput(f);
  }, []);

  const selectedWeek = getWeekOfMonth(selectedDate);
  const shoppingWeekId = `${viewY}-${viewM}-w${selectedWeek}`;

  // 週が変わったらチェック状態をlocalStorageから復元
  useEffect(() => {
    setShoppingChecked(loadShoppingChecked(shoppingWeekId));
  }, [shoppingWeekId]);

  const weekDays = useMemo(
    () => getWeekDays(viewY, viewM, selectedWeek, plan),
    [viewY, viewM, selectedWeek, plan]
  );

  // 週が変わったらスキップ日を初期化（今週は過去の日を自動スキップ）
  useEffect(() => {
    const saved = loadSkippedDays(shoppingWeekId);
    if (saved.size > 0) {
      setSkippedDates(saved);
      return;
    }
    const isCurrentWeek =
      viewY === today.getFullYear() &&
      viewM === today.getMonth() &&
      selectedWeek === getWeekOfMonth(today);
    if (isCurrentWeek) {
      const auto = new Set(
        weekDays
          .filter(d => d.date < today && !sameDay(d.date, today))
          .map(d => toDateStr(d.date))
      );
      setSkippedDates(auto);
    } else {
      setSkippedDates(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingWeekId]);

  const shoppingDays = useMemo(
    () => weekDays.filter(d => !skippedDates.has(toDateStr(d.date))),
    [weekDays, skippedDates]
  );

  const shoppingItems = useMemo(() => buildShoppingItems(shoppingDays, family.servings), [shoppingDays, family.servings]);

  // 週間栄養バランスの集計
  const weekBalance = useMemo(() => {
    const protein: Partial<Record<MealCategory, number>> = {};
    const sides: Partial<Record<SideCategory, number>> = {};
    for (const { mainMeal, dayPlan } of weekDays) {
      protein[mainMeal.category] = (protein[mainMeal.category] ?? 0) + 1;
      for (const sid of dayPlan.sides) {
        const s = SIDES[sid];
        if (s) sides[s.category] = (sides[s.category] ?? 0) + 1;
      }
    }
    const fishDays = protein['fish'] ?? 0;
    const vegDays  = sides['vegetable'] ?? 0;
    const seaweed  = sides['seaweed'] ?? 0;
    const proteinTypes = Object.keys(protein).length;
    const tips: string[] = [];
    if (fishDays === 0) tips.push('今週は魚がありません。1〜2回入れると◎');
    else if (fishDays === 1) tips.push('魚をもう1回入れるとさらにバランスUP');
    if (vegDays < 3) tips.push('野菜の副菜をもう少し増やせると理想的です');
    if (seaweed === 0) tips.push('海藻（ひじき・わかめ）が入ると栄養バランスが整います');
    if (proteinTypes >= 4 && fishDays >= 2 && vegDays >= 3) tips.push('今週はバランス良好です！');
    return { protein, sides, fishDays, vegDays, seaweed, proteinTypes, tips };
  }, [weekDays]);

  function toggleShoppingDay(dateStr: string) {
    setSkippedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr); else next.add(dateStr);
      saveSkippedDays(shoppingWeekId, next);
      return next;
    });
  }

  function prevMonth() {
    if (viewM === 0) { setViewY(y => y - 1); setViewM(11); }
    else setViewM(m => m - 1);
  }
  function nextMonth() {
    if (viewM === 11) { setViewY(y => y + 1); setViewM(0); }
    else setViewM(m => m + 1);
  }

  function selectDate(date: Date) {
    setViewY(date.getFullYear());
    setViewM(date.getMonth());
    setSelectedDate(date);
    setShowShopping(false);
  }

  function openSettings() {
    setFamilyInput(family);
    setSettingsOpen(true);
  }

  function saveSettings() {
    setFamily(familyInput);
    saveFamilySettings(familyInput);
    setSettingsOpen(false);
  }

  function swapMeal(key: string, mealId: string) {
    const next = { ...plan, [key]: mealId };
    setPlan(next);
    savePlan(next);
    setSwapTarget(null);
  }

  const grid = useMemo(() => calendarGrid(viewY, viewM), [viewY, viewM]);

  return (
    <div className="min-h-screen bg-orange-50">

      {/* ヘッダー */}
      <header className="bg-white border-b border-orange-200 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-medium text-stone-800">献立カレンダー</h1>
            <p className="text-xs text-stone-500">
              {family.servings}人家族{family.familyType === 'with_children' ? '（子供あり）' : ''}・平日夕飯
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openSettings}
              className="w-8 h-8 flex items-center justify-center rounded-full text-stone-500 hover:bg-orange-100 transition-colors"
              aria-label="家族設定"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setShowShopping(s => !s)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium hover:bg-orange-200 transition-colors"
            >
              🛒 今週の買い物リスト
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* カレンダー */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orange-50 text-lg">‹</button>
            <h2 className="text-sm font-medium text-stone-800">{viewY}年{MONTH_JP[viewM]}</h2>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-orange-50 text-lg">›</button>
          </div>
          <div className="grid grid-cols-7 border-b border-orange-100">
            {DOW_JP.map((label, i) => (
              <div key={label} className={`text-center py-2 text-xs font-medium
                ${i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-stone-500'}`}>
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((date, idx) => {
              if (!date) return <div key={`pad-${idx}`} className="min-h-[56px] border-t border-orange-50" />;
              const dow = date.getDay();
              const isWeekday = WEEKDAYS.includes(dow);
              const isToday = sameDay(date, today);
              const isSel = sameDay(date, selectedDate);
              const mainId = isWeekday ? resolveMainId(date, plan) : null;
              const meal = mainId ? MEALS[mainId] : null;

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => isWeekday && selectDate(date)}
                  className={`flex flex-col items-center pt-1.5 pb-1 min-h-[56px]
                    border-t border-orange-50 transition-colors
                    ${isWeekday ? (isSel ? 'bg-orange-50' : 'hover:bg-amber-50') : 'cursor-default'}`}
                >
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs
                    ${isToday ? 'bg-orange-500 text-white font-medium'
                      : isSel ? 'bg-orange-100 text-orange-700 font-medium'
                      : dow === 0 ? 'text-rose-400'
                      : dow === 6 ? 'text-sky-500'
                      : 'text-stone-700'}`}>
                    {date.getDate()}
                  </span>
                  {meal && isWeekday && (
                    <span className={`mt-0.5 text-[9px] leading-tight text-center w-full truncate px-0.5
                      ${CATEGORY_CONFIG[meal.category].text}`}>
                      {meal.name}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 週の献立リスト */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-orange-100 flex items-center justify-between">
            <h3 className="text-sm font-medium text-stone-800">第{selectedWeek}週の献立</h3>
            <span className="text-xs text-stone-400">タップで詳細・変更</span>
          </div>
          {weekDays.length === 0 ? (
            <p className="p-6 text-center text-sm text-stone-400">この週に平日がありません</p>
          ) : (
            <div className="divide-y divide-orange-50">
              {weekDays.map((day) => {
                const { dow, date, dayPlan, mainMeal, totalCalories } = day;
                const cfg = CATEGORY_CONFIG[mainMeal.category];
                const sideNames = dayPlan.sides.map(sid => SIDES[sid]?.name).filter(Boolean);
                const soupName = dayPlan.soup ? SOUPS[dayPlan.soup]?.name : null;
                const fruitName = dayPlan.fruit ? FRUITS[dayPlan.fruit]?.name : null;
                return (
                  <button
                    key={dow}
                    onClick={() => setDetailTarget(day)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition-colors"
                  >
                    <div className="w-10 flex-shrink-0 text-center">
                      <p className="text-xs font-medium text-stone-600">{DOW_JP[dow]}曜</p>
                      <p className="text-xs text-stone-400">{date.getDate()}日</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-stone-800">{mainMeal.name}</p>
                        {family.familyType === 'with_children' && !mainMeal.childFriendly && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">辛め</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-stone-400">約{mainMeal.cookingMinutes}分</span>
                        <span className="text-xs text-orange-500 font-medium">{totalCalories}kcal</span>
                      </div>
                      {sideNames.length > 0 && (
                        <p className="mt-1 text-xs text-stone-500 truncate">
                          副菜: {sideNames.join('・')}
                        </p>
                      )}
                      {(soupName || fruitName) && (
                        <p className="mt-0.5 text-xs text-stone-400">
                          {soupName && `🍵 ${soupName}`}
                          {soupName && fruitName && '　'}
                          {fruitName && `🍊 ${fruitName}`}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-orange-300 flex-shrink-0">›</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 週間栄養バランス */}
        {weekDays.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-orange-100">
              <h3 className="text-sm font-medium text-stone-800">今週のバランス</h3>
            </div>
            <div className="px-4 py-3 space-y-3">

              {/* タンパク質 */}
              <div>
                <p className="text-xs text-stone-400 mb-2">🥩 タンパク質</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ['fish',    '魚',     'bg-sky-100 text-sky-700 border-sky-200'],
                    ['chicken', '鶏肉',   'bg-amber-100 text-amber-700 border-amber-200'],
                    ['pork',    '豚肉',   'bg-rose-100 text-rose-700 border-rose-200'],
                    ['beef',    '牛肉',   'bg-red-100 text-red-700 border-red-200'],
                    ['egg',     '卵・豆腐','bg-yellow-100 text-yellow-700 border-yellow-200'],
                    ['other',   'その他', 'bg-emerald-100 text-emerald-700 border-emerald-200'],
                  ] as [MealCategory, string, string][]).map(([cat, label, cls]) => {
                    const count = weekBalance.protein[cat] ?? 0;
                    if (count === 0) return null;
                    return (
                      <span key={cat} className={`text-xs px-2 py-1 rounded-full border font-medium ${cls}`}>
                        {label} {'●'.repeat(count)}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 副菜 */}
              <div>
                <p className="text-xs text-stone-400 mb-2">🥗 副菜の種類</p>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    ['vegetable', '野菜系',   'bg-green-100 text-green-700 border-green-200'],
                    ['seaweed',   '海藻類',   'bg-teal-100 text-teal-700 border-teal-200'],
                    ['tofu',      '豆腐系',   'bg-orange-100 text-orange-700 border-orange-200'],
                    ['other',     'その他副菜','bg-stone-100 text-stone-600 border-stone-200'],
                  ] as [SideCategory, string, string][]).map(([cat, label, cls]) => {
                    const count = weekBalance.sides[cat] ?? 0;
                    if (count === 0) return null;
                    return (
                      <span key={cat} className={`text-xs px-2 py-1 rounded-full border font-medium ${cls}`}>
                        {label} {'●'.repeat(count)}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* アドバイス */}
              <div className={`rounded-xl px-3 py-2.5 ${weekBalance.tips[0]?.includes('良好') ? 'bg-green-50' : 'bg-orange-50'}`}>
                {weekBalance.tips.map((tip, i) => (
                  <p key={i} className={`text-xs leading-relaxed ${weekBalance.tips[0]?.includes('良好') ? 'text-green-700' : 'text-stone-600'}`}>
                    {weekBalance.tips[0]?.includes('良好') ? '✅ ' : i === 0 ? '💡 ' : '　・'}{tip}
                  </p>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* 買い物リストモーダル */}
      {showShopping && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center p-4" onClick={() => setShowShopping(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-4 pb-3 border-b border-orange-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-stone-800">🛒 今週の買い物リスト</h3>
                <button onClick={() => setShowShopping(false)} className="text-xs text-stone-400">閉じる</button>
              </div>
              {/* 曜日トグル */}
              <div className="flex gap-1.5">
                {weekDays.map(d => {
                  const ds = toDateStr(d.date);
                  const included = !skippedDates.has(ds);
                  const isPast = d.date < today && !sameDay(d.date, today);
                  return (
                    <button
                      key={ds}
                      onClick={() => toggleShoppingDay(ds)}
                      className={`flex-1 flex flex-col items-center py-1.5 rounded-xl border text-xs font-medium transition-colors
                        ${included
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-stone-200 text-stone-400 bg-stone-50'}`}
                    >
                      <span>{DOW_JP[d.dow]}曜</span>
                      <span className={`text-[10px] mt-0.5 ${included ? 'text-orange-100' : 'text-stone-300'}`}>
                        {d.date.getDate()}日{isPast ? '(済)' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-stone-400 mt-2">{family.servings}人分・調味料など常備品は除外済み</p>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2.5">
              {shoppingItems.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">食材がありません</p>
              ) : shoppingItems.map(item => (
                <label key={item.name} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shoppingChecked[item.name] ?? false}
                    onChange={() => {
                      const next = { ...shoppingChecked, [item.name]: !shoppingChecked[item.name] };
                      setShoppingChecked(next);
                      saveShoppingChecked(shoppingWeekId, next);
                    }}
                    className="w-4 h-4 rounded accent-orange-500"
                  />
                  <span className={`text-sm flex-1 ${shoppingChecked[item.name] ? 'line-through text-stone-300' : 'text-stone-700'}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-stone-400">{item.amount}</span>
                </label>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-orange-100 flex-shrink-0">
              <p className="text-xs text-stone-400 text-center">チェックはこの週分が保存されます</p>
            </div>
          </div>
        </div>
      )}

      {/* 献立詳細モーダル */}
      {detailTarget && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center p-4" onClick={() => setDetailTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[82vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium text-stone-800">
                {detailTarget.date.getDate()}日（{DOW_FULL[detailTarget.date.getDay()]}）の献立
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSwapTarget({ key: detailTarget.key, date: detailTarget.date });
                    setDetailTarget(null);
                  }}
                  className="text-xs text-orange-500 font-medium"
                >主菜を変更</button>
                <button onClick={() => setDetailTarget(null)} className="text-xs text-stone-400">閉じる</button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              <MealSection meal={detailTarget.mainMeal} servings={family.servings} />

              {detailTarget.dayPlan.sides.map(sid => {
                const side = SIDES[sid];
                return side ? <SideSection key={sid} side={side} servings={family.servings} /> : null;
              })}

              {detailTarget.dayPlan.soup && SOUPS[detailTarget.dayPlan.soup] && (
                <SoupSection soup={SOUPS[detailTarget.dayPlan.soup!]} servings={family.servings} />
              )}

              {detailTarget.dayPlan.fruit && FRUITS[detailTarget.dayPlan.fruit] && (() => {
                const fruit = FRUITS[detailTarget.dayPlan.fruit!];
                return (
                  <div>
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">🍊 果物</p>
                    <p className="text-sm font-semibold text-stone-800">{fruit.name}</p>
                    <p className="text-xs text-stone-400 mt-0.5">{fruit.note}・{fruit.calories}kcal</p>
                  </div>
                );
              })()}

              <div className="bg-orange-50 rounded-xl px-4 py-3">
                <p className="text-xs text-stone-500">この日の合計カロリー（1人分）</p>
                <p className="text-2xl font-bold text-orange-500 mt-0.5">
                  {detailTarget.totalCalories} <span className="text-sm font-normal text-stone-400">kcal</span>
                </p>
                <p className="text-xs text-stone-400 mt-1">{family.servings}人分の材料でお作りください</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 家族設定モーダル */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setSettingsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-orange-100">
              <h3 className="text-sm font-medium text-stone-800">家族の設定</h3>
            </div>
            <div className="px-5 py-4 space-y-5">

              {/* 人数 */}
              <div>
                <p className="text-xs font-medium text-stone-600 mb-2">何人家族ですか？</p>
                <div className="flex gap-2">
                  {[2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setFamilyInput(prev => ({ ...prev, servings: n }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors
                        ${familyInput.servings === n
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-orange-200 text-stone-600 hover:bg-orange-50'}`}
                    >
                      {n}人
                    </button>
                  ))}
                </div>
              </div>

              {/* 家族構成 */}
              <div>
                <p className="text-xs font-medium text-stone-600 mb-2">家族構成は？</p>
                <div className="flex gap-2">
                  {([
                    { value: 'adults_only', label: '大人のみ' },
                    { value: 'with_children', label: '子供あり' },
                  ] as const).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFamilyInput(prev => ({ ...prev, familyType: value }))}
                      className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors
                        ${familyInput.familyType === value
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-orange-200 text-stone-600 hover:bg-orange-50'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {familyInput.familyType === 'with_children' && (
                  <p className="mt-2 text-xs text-stone-400">
                    子供向けでない料理（辛め）には「辛め」マークが表示されます
                  </p>
                )}
              </div>

            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setSettingsOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-orange-200 text-sm text-stone-600 hover:bg-orange-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主菜変更モーダル */}
      {swapTarget && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center p-4" onClick={() => setSwapTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium text-stone-800">
                {swapTarget.date.getDate()}日の主菜を変更
              </h3>
              <button onClick={() => setSwapTarget(null)} className="text-xs text-stone-400">閉じる</button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-orange-50">
              {Object.values(MEALS).map(meal => {
                const cfg = CATEGORY_CONFIG[meal.category];
                return (
                  <button
                    key={meal.id}
                    onClick={() => swapMeal(swapTarget.key, meal.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-stone-800">{meal.name}</p>
                        {meal.childFriendly && family.familyType === 'with_children' && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">子供OK</span>
                        )}
                        {!meal.childFriendly && family.familyType === 'with_children' && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">辛め</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-stone-400">約{meal.cookingMinutes}分</span>
                        <span className="text-xs text-stone-400">{meal.calories}kcal</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 詳細表示コンポーネント ────────────────────────────────────────────────────

/** ステップ内の {{食材名}} を人数スケール済みの分量に置換する */
function renderStep(step: string, shopping: ShoppingItem[], condiments: ShoppingItem[], servings: number): string {
  const all = [...shopping, ...condiments];
  return step.replace(/\{\{([^}]+)\}\}/g, (_, name: string) => {
    const found = all.find(item => item.name === name);
    if (!found) return name;
    return scaleAmount(found.amount, servings);
  });
}

function StepList({ steps, shopping = [], condiments = [], servings = 3 }: {
  steps: string[];
  shopping?: ShoppingItem[];
  condiments?: ShoppingItem[];
  servings?: number;
}) {
  return (
    <ol className="space-y-1.5 mt-1">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2 text-xs text-stone-600">
          <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-[10px] font-medium">
            {i + 1}
          </span>
          <span className="leading-relaxed">{renderStep(step, shopping, condiments, servings)}</span>
        </li>
      ))}
    </ol>
  );
}

function ShoppingBadges({ items, servings }: { items: ShoppingItem[]; servings: number }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
      {items.map(s => (
        <span key={s.name} className="text-xs bg-orange-50 border border-orange-200 rounded-lg px-2 py-0.5 text-stone-700">
          {s.name}　{scaleAmount(s.amount, servings)}
        </span>
      ))}
    </div>
  );
}

function CondimentBadges({ items, servings }: { items: ShoppingItem[]; servings: number }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="text-[11px] font-semibold text-stone-400 mb-1">調味料の目安</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(c => (
          <span key={c.name} className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5 text-stone-700">
            {c.name}　{scaleAmount(c.amount, servings)}
          </span>
        ))}
      </div>
    </div>
  );
}

function MealSection({ meal, servings }: { meal: Meal; servings: number }) {
  const cfg = CATEGORY_CONFIG[meal.category];
  return (
    <div>
      <p className="text-[11px] font-semibold text-stone-400 tracking-wide mb-1">🍽 主菜</p>
      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
        <p className="text-sm font-semibold text-stone-800">{meal.name}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
      </div>
      <p className="text-xs text-stone-400 mb-2">約{meal.cookingMinutes}分・{meal.calories}kcal</p>
      <ShoppingBadges items={meal.shopping} servings={servings} />
      <CondimentBadges items={meal.condiments} servings={servings} />
      <p className="text-[11px] font-semibold text-stone-400 mb-0.5">作り方</p>
      <StepList steps={meal.steps} shopping={meal.shopping} condiments={meal.condiments} servings={servings} />
      {meal.tip && (
        <p className="mt-2 text-xs text-stone-400 bg-amber-50 rounded-lg px-2 py-1.5">💡 {meal.tip}</p>
      )}
    </div>
  );
}

function SideSection({ side, servings }: { side: Side; servings: number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-stone-400 tracking-wide mb-1">🥗 副菜</p>
      <p className="text-sm font-semibold text-stone-800 mb-0.5">{side.name}</p>
      <p className="text-xs text-stone-400 mb-2">{side.calories}kcal</p>
      <ShoppingBadges items={side.shopping} servings={servings} />
      <CondimentBadges items={side.condiments} servings={servings} />
      <StepList steps={side.steps} shopping={side.shopping} condiments={side.condiments} servings={servings} />
    </div>
  );
}

function SoupSection({ soup, servings }: { soup: Soup; servings: number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-stone-400 tracking-wide mb-1">🍵 汁物</p>
      <p className="text-sm font-semibold text-stone-800 mb-0.5">{soup.name}</p>
      <p className="text-xs text-stone-400 mb-2">{soup.calories}kcal</p>
      <ShoppingBadges items={soup.shopping} servings={servings} />
      <CondimentBadges items={soup.condiments} servings={servings} />
      <StepList steps={soup.steps} shopping={soup.shopping} condiments={soup.condiments} servings={servings} />
    </div>
  );
}
