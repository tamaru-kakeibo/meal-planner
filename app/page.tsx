'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  MEALS, SIDES, SOUPS, FRUITS, MONTHLY_PLAN, CATEGORY_CONFIG, STAPLES,
  Meal, Side, Soup, DayPlan, ShoppingItem,
} from '@/lib/meals';
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
  const dim = daysInMonth(year, month);
  for (let d = 1; d <= dim; d++) {
    const date = new Date(year, month, d);
    if (getWeekOfMonth(date) !== week) continue;
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

function buildShoppingItems(weekDays: ResolvedDay[]): { name: string; amount: string }[] {
  const items: Record<string, string[]> = {};

  function add(si: ShoppingItem) {
    if (STAPLES.has(si.name)) return;
    if (!items[si.name]) items[si.name] = [];
    items[si.name].push(si.amount);
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
    .map(([name, amounts]) => ({ name, amount: amounts.join('・') }))
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

  useEffect(() => { setPlan(loadPlan()); }, []);

  const selectedWeek = getWeekOfMonth(selectedDate);

  const weekDays = useMemo(
    () => getWeekDays(viewY, viewM, selectedWeek, plan),
    [viewY, viewM, selectedWeek, plan]
  );

  const shoppingItems = useMemo(() => buildShoppingItems(weekDays), [weekDays]);

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
            onClick={() => {
              const checked: Record<string, boolean> = {};
              shoppingItems.forEach(i => { checked[i.name] = false; });
              setShoppingChecked(checked);
              setShowShopping(s => !s);
            }}
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
                      <p className="text-sm font-medium text-stone-800">{mainMeal.name}</p>
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
      </div>

      {/* 買い物リストモーダル */}
      {showShopping && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-end justify-center p-4" onClick={() => setShowShopping(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-orange-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-medium text-stone-800">🛒 今週の買い物リスト</h3>
                <p className="text-xs text-stone-400 mt-0.5">調味料・常備品は除いています</p>
              </div>
              <button onClick={() => setShowShopping(false)} className="text-xs text-stone-400">閉じる</button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2.5">
              {shoppingItems.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">食材がありません</p>
              ) : shoppingItems.map(item => (
                <label key={item.name} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shoppingChecked[item.name] ?? false}
                    onChange={() => setShoppingChecked(prev => ({ ...prev, [item.name]: !prev[item.name] }))}
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
              <p className="text-xs text-stone-400 text-center">チェックは閉じるとリセットされます</p>
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
              <MealSection meal={detailTarget.mainMeal} />

              {detailTarget.dayPlan.sides.map(sid => {
                const side = SIDES[sid];
                return side ? <SideSection key={sid} side={side} /> : null;
              })}

              {detailTarget.dayPlan.soup && SOUPS[detailTarget.dayPlan.soup] && (
                <SoupSection soup={SOUPS[detailTarget.dayPlan.soup!]} />
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
                <p className="text-2xl font-bold text-orange-500 mt-0.5">{detailTarget.totalCalories} <span className="text-sm font-normal text-stone-400">kcal</span></p>
              </div>
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
                      <p className="text-sm font-medium text-stone-800">{meal.name}</p>
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

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-1.5 mt-1">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2 text-xs text-stone-600">
          <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-[10px] font-medium">
            {i + 1}
          </span>
          <span className="leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function ShoppingBadges({ items }: { items: ShoppingItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
      {items.map(s => (
        <span key={s.name} className="text-xs bg-orange-50 border border-orange-200 rounded-lg px-2 py-0.5 text-stone-700">
          {s.name}　{s.amount}
        </span>
      ))}
    </div>
  );
}

function MealSection({ meal }: { meal: Meal }) {
  const cfg = CATEGORY_CONFIG[meal.category];
  return (
    <div>
      <p className="text-[11px] font-semibold text-stone-400 tracking-wide mb-1">🍽 主菜</p>
      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
        <p className="text-sm font-semibold text-stone-800">{meal.name}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span>
      </div>
      <p className="text-xs text-stone-400 mb-2">約{meal.cookingMinutes}分・{meal.calories}kcal</p>
      <ShoppingBadges items={meal.shopping} />
      <p className="text-[11px] font-semibold text-stone-400 mb-0.5">作り方</p>
      <StepList steps={meal.steps} />
      {meal.tip && (
        <p className="mt-2 text-xs text-stone-400 bg-amber-50 rounded-lg px-2 py-1.5">💡 {meal.tip}</p>
      )}
    </div>
  );
}

function SideSection({ side }: { side: Side }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-stone-400 tracking-wide mb-1">🥗 副菜</p>
      <p className="text-sm font-semibold text-stone-800 mb-0.5">{side.name}</p>
      <p className="text-xs text-stone-400 mb-2">{side.calories}kcal</p>
      <ShoppingBadges items={side.shopping} />
      <StepList steps={side.steps} />
    </div>
  );
}

function SoupSection({ soup }: { soup: Soup }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-stone-400 tracking-wide mb-1">🍵 汁物</p>
      <p className="text-sm font-semibold text-stone-800 mb-0.5">{soup.name}</p>
      <p className="text-xs text-stone-400 mb-2">{soup.calories}kcal</p>
      <ShoppingBadges items={soup.shopping} />
      <StepList steps={soup.steps} />
    </div>
  );
}
