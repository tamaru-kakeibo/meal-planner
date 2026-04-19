'use client';

import { useState, useEffect, useMemo } from 'react';
import { MEALS, MONTHLY_PLAN, CATEGORY_CONFIG, Meal } from '@/lib/meals';
import { loadPlan, savePlan, weekKey } from '@/lib/storage';

const MONTH_JP = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const DOW_JP   = ['日','月','火','水','木','金','土'];
const DOW_FULL = ['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
const WEEKDAYS = [1, 2, 3, 4, 5];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
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

function defaultMealId(date: Date): string | null {
  const dow = date.getDay();
  if (!WEEKDAYS.includes(dow)) return null;
  const week = ((getWeekOfMonth(date) - 1) % 4);
  const dayIndex = dow - 1;
  return MONTHLY_PLAN[week][dayIndex] ?? null;
}

function getWeekMeals(
  year: number, month: number, week: number,
  plan: Record<string, string>
): Array<{ dow: number; date: Date; mealId: string; meal: Meal }> {
  const result = [];
  const dim = daysInMonth(year, month);
  for (let d = 1; d <= dim; d++) {
    const date = new Date(year, month, d);
    if (getWeekOfMonth(date) !== week) continue;
    const dow = date.getDay();
    if (!WEEKDAYS.includes(dow)) continue;
    const key = weekKey(year, month, week, dow);
    const mealId = plan[key] ?? defaultMealId(date) ?? 'f1';
    const meal = MEALS[mealId];
    if (meal) result.push({ dow, date, mealId, meal });
  }
  return result;
}

function getShoppingList(weekMeals: Array<{ meal: Meal }>): Record<string, boolean> {
  const items: Record<string, boolean> = {};
  weekMeals.forEach(({ meal }) => {
    meal.ingredients.forEach(ing => { items[ing] = false; });
  });
  return items;
}

export default function Page() {
  const today = useMemo(() => new Date(), []);
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [showShopping, setShowShopping] = useState(false);
  const [shoppingChecked, setShoppingChecked] = useState<Record<string, boolean>>({});
  const [swapTarget, setSwapTarget] = useState<{ key: string; date: Date } | null>(null);

  useEffect(() => { setPlan(loadPlan()); }, []);

  const selectedWeek = getWeekOfMonth(selectedDate);

  const weekMeals = useMemo(
    () => getWeekMeals(viewY, viewM, selectedWeek, plan),
    [viewY, viewM, selectedWeek, plan]
  );

  const shoppingItems = useMemo(() => getShoppingList(weekMeals), [weekMeals]);

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
            <p className="text-xs text-stone-500">平日5日の夕飯、AIが考えます</p>
          </div>
          <button
            onClick={() => { setShowShopping(s => !s); setShoppingChecked({ ...shoppingItems }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium hover:bg-orange-200 transition-colors"
          >
            🛒 今週の買い物リスト
          </button>
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
              const week = getWeekOfMonth(date);
              const key = weekKey(date.getFullYear(), date.getMonth(), week, dow);
              const mealId = plan[key] ?? defaultMealId(date);
              const meal = mealId ? MEALS[mealId] : null;

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
            <span className="text-xs text-stone-400">タップで変更</span>
          </div>
          {weekMeals.length === 0 ? (
            <p className="p-6 text-center text-sm text-stone-400">この週に平日がありません</p>
          ) : (
            <div className="divide-y divide-orange-50">
              {weekMeals.map(({ dow, date, meal }) => {
                const cfg = CATEGORY_CONFIG[meal.category];
                const key = weekKey(date.getFullYear(), date.getMonth(), selectedWeek, dow);
                return (
                  <button
                    key={dow}
                    onClick={() => setSwapTarget({ key, date })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-orange-50 transition-colors"
                  >
                    <div className="w-10 flex-shrink-0 text-center">
                      <p className="text-xs font-medium text-stone-600">{DOW_JP[dow]}曜</p>
                      <p className="text-xs text-stone-400">{date.getDate()}日</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-800">{meal.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-stone-400">約{meal.cookingMinutes}分</span>
                      </div>
                      {meal.tip && (
                        <p className="mt-1 text-xs text-stone-400 bg-orange-50 rounded-lg px-2 py-1">{meal.tip}</p>
                      )}
                    </div>
                    <span className="text-xs text-orange-300">›</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 買い物リストモーダル */}
      {showShopping && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center p-4" onClick={() => setShowShopping(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium text-stone-800">🛒 今週の買い物リスト</h3>
              <button onClick={() => setShowShopping(false)} className="text-xs text-stone-400">閉じる</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2.5">
              {Object.keys(shoppingItems).sort().map(item => (
                <label key={item} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shoppingChecked[item] ?? false}
                    onChange={() => setShoppingChecked(prev => ({ ...prev, [item]: !prev[item] }))}
                    className="w-4 h-4 rounded accent-orange-500"
                  />
                  <span className={`text-sm ${shoppingChecked[item] ? 'line-through text-stone-300' : 'text-stone-700'}`}>
                    {item}
                  </span>
                </label>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-orange-100 flex-shrink-0">
              <p className="text-xs text-stone-400 text-center">チェックは閉じるとリセットされます</p>
            </div>
          </div>
        </div>
      )}

      {/* 献立変更モーダル */}
      {swapTarget && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center p-4" onClick={() => setSwapTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium text-stone-800">
                {swapTarget.date.getDate()}日（{DOW_FULL[swapTarget.date.getDay()]}）を変更
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
                      <p className="text-sm font-medium text-stone-800">{meal.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                        <span className="text-xs text-stone-400">約{meal.cookingMinutes}分</span>
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
