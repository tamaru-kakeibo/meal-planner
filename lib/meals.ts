export type MealCategory = 'fish' | 'chicken' | 'pork' | 'beef' | 'egg' | 'other';
export type SideCategory = 'vegetable' | 'tofu' | 'seaweed' | 'other';
export type SoupCategory = 'miso' | 'clear' | 'western';
export type FamilyType = 'adults_only' | 'with_children';

export interface FamilySettings {
  servings: number;    // 2〜5人
  familyType: FamilyType;
}

export const DEFAULT_FAMILY: FamilySettings = {
  servings: 3,
  familyType: 'adults_only',
};

// 基準人数（レシピの分量はこの人数を基準に書かれている）
export const BASE_SERVINGS = 3;

/** 分量文字列を人数に合わせてスケールする */
export function scaleAmount(amount: string, toServings: number): string {
  if (toServings === BASE_SERVINGS) return amount;
  const ratio = toServings / BASE_SERVINGS;

  // 少量・適量はそのまま
  if (amount === '少量' || amount === '適量') return amount;

  // "大さじN", "小さじN", "カップN" パターン（単位が先）
  const spoon = amount.match(/^(大さじ|小さじ|カップ)(\d+(?:\/\d+)?(?:\.\d+)?)(.*)$/);
  if (spoon) {
    const unit = spoon[1];
    const numStr = spoon[2];
    const num = numStr.includes('/')
      ? parseInt(numStr.split('/')[0]) / parseInt(numStr.split('/')[1])
      : parseFloat(numStr);
    const scaled = num * ratio;
    const rounded = Math.round(scaled * 2) / 2; // 0.5刻み
    if (rounded === Math.floor(rounded)) return `${unit}${rounded}`;
    return `${unit}${rounded}`;
  }

  // その他の数値なし（少量以外）はそのまま
  if (/^[^\d]/.test(amount)) return amount;

  // "数値/数値" の分数を含む文字列をパース
  const m = amount.match(/^(\d+)(?:\/(\d+))?\s*(.*)$/);
  if (!m) return amount;

  const num = m[2] ? parseInt(m[1]) / parseInt(m[2]) : parseFloat(m[1]);
  const unit = m[3].trim();
  const scaled = num * ratio;

  // 整数・分数で買う単位
  const wholeUnits = new Set(['切れ', '個', '枚', '束', '袋', '缶', '丁', '箱', 'かけ', '本']);
  if (wholeUnits.has(unit)) {
    if (scaled < 1) {
      // 1個未満は 1/4 刻みで切り上げ
      const quarters = Math.ceil(scaled * 4);
      const fracMap: Record<number, string> = { 1: '1/4', 2: '1/2', 3: '3/4', 4: '1' };
      return `${fracMap[quarters] ?? '1'}${unit}`;
    }
    return `${Math.ceil(scaled)}${unit}`;
  }

  // g / ml の丸め：50以上は10刻み、それ未満は1刻み（小量が0になるのを防ぐ）
  if (unit === 'g' || unit === 'ml') {
    if (scaled >= 50) {
      const rounded = Math.round(scaled / 10) * 10;
      return `${rounded}${unit}`;
    }
    return `${Math.round(scaled)}${unit}`;
  }

  // その他は0.5刻み
  const rounded = Math.round(scaled * 2) / 2;
  if (rounded === Math.floor(rounded)) return `${rounded}${unit}`;
  return `${rounded}${unit}`;
}

// 常備品（買い物リストから除外）
export const STAPLES = new Set([
  'ごはん', '米', '塩', '醤油', 'みりん', '酒', '砂糖', '味噌',
  '油', 'ごま油', 'オリーブオイル', '酢', 'だし', 'こんぶ', 'かつおぶし',
  '薄力粉', 'パン粉', '片栗粉', '塩こしょう', '牛乳', 'バター',
  'ケチャップ', 'ウスターソース', 'マヨネーズ', '白ごま', 'コンソメ', 'ポン酢',
]);

export interface ShoppingItem {
  name: string;
  amount: string; // 例: "3切れ", "200g", "大さじ2"
}

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  cookingMinutes: number;
  calories: number;          // 1人分kcal
  shopping: ShoppingItem[];  // 常備品以外の食材+分量（BASE_SERVINGS人分）
  condiments: ShoppingItem[]; // 調味料の目安（BASE_SERVINGS人分・スケール対応）
  steps: string[];           // 作り方
  tip?: string;
  childFriendly: boolean;
}

export interface Side {
  id: string;
  name: string;
  category: SideCategory;
  calories: number;
  shopping: ShoppingItem[];
  condiments: ShoppingItem[];
  steps: string[];
}

export interface Soup {
  id: string;
  name: string;
  category: SoupCategory;
  calories: number;
  shopping: ShoppingItem[];
  condiments: ShoppingItem[];
  steps: string[];
}

export interface Fruit {
  id: string;
  name: string;
  calories: number;
  note: string;
}

// ─── 主菜 ─────────────────────────────────────────────────────────────────────

export const MEALS: Record<string, Meal> = {
  f1: {
    id: 'f1', name: '鮭の塩焼き', category: 'fish', cookingMinutes: 15, calories: 180, childFriendly: true,
    shopping: [{ name: '鮭', amount: '3切れ' }, { name: 'レモン', amount: '1/2個' }],
    condiments: [{ name: '塩', amount: '少量' }],
    steps: ['鮭の両面に塩を薄く振り10分おく', '出てきた水分を拭き取る', 'フライパンに油を薄く引き中火で5分・裏返して4分焼く', 'レモンを添えて完成'],
    tip: 'クッキングシートを敷くとくっつかず後片付けが楽。',
  },
  f2: {
    id: 'f2', name: 'さばの味噌煮', category: 'fish', cookingMinutes: 25, calories: 220, childFriendly: true,
    shopping: [{ name: 'さば', amount: '3切れ' }, { name: 'しょうが', amount: '1かけ' }],
    condiments: [
      { name: '水', amount: '200ml' }, { name: '酒', amount: '大さじ2' },
      { name: '砂糖', amount: '大さじ1.5' }, { name: 'みりん', amount: '大さじ2' },
      { name: '醤油', amount: '大さじ1' }, { name: '味噌', amount: '大さじ2' },
    ],
    steps: [
      'さばに熱湯をかけて臭みを取り、水気を拭く',
      '鍋に水200ml・酒大さじ2・砂糖大さじ1.5・みりん大さじ2・醤油大さじ1・しょうがを入れて煮立てる',
      '味噌大さじ2を溶かし入れてさばを加え、落し蓋をして弱中火で15分煮る',
    ],
    tip: '煮汁が少なくなったら完成の合図。高齢者にも食べやすい。',
  },
  f3: {
    id: 'f3', name: 'ぶりの照り焼き', category: 'fish', cookingMinutes: 20, calories: 250, childFriendly: true,
    shopping: [{ name: 'ぶり', amount: '3切れ' }],
    condiments: [
      { name: '醤油', amount: '大さじ2' }, { name: 'みりん', amount: '大さじ2' },
      { name: '酒', amount: '大さじ1' }, { name: '砂糖', amount: '大さじ1' },
    ],
    steps: [
      'ぶりを醤油大さじ2・みりん大さじ2・酒大さじ1・砂糖大さじ1に10分漬ける',
      'フライパンに薄く油を引き、中火で両面を焼く（片面3〜4分）',
      '漬けタレを回し入れて照りが出るまで絡める',
    ],
    tip: 'タレを絡めるとき焦げやすいので、弱火にして手早く。',
  },
  f4: {
    id: 'f4', name: '鮭のムニエル', category: 'fish', cookingMinutes: 15, calories: 210, childFriendly: true,
    shopping: [{ name: '鮭', amount: '3切れ' }, { name: 'レモン', amount: '1個' }],
    condiments: [
      { name: '塩こしょう', amount: '少量' }, { name: 'バター', amount: '大さじ1.5' },
    ],
    steps: [
      '鮭に塩こしょうをして薄力粉を薄くまぶす',
      'フライパンにバター大さじ1.5を溶かし中火で5分焼く',
      '裏返して4分焼き、レモン汁をかけて完成',
    ],
    tip: 'バターが焦げないよう中火をキープ。',
  },
  f5: {
    id: 'f5', name: 'たらの煮付け', category: 'fish', cookingMinutes: 20, calories: 150, childFriendly: true,
    shopping: [{ name: 'たら', amount: '3切れ' }, { name: 'しょうが', amount: '1かけ' }],
    condiments: [
      { name: '水', amount: '200ml' }, { name: '醤油', amount: '大さじ2' },
      { name: 'みりん', amount: '大さじ2' }, { name: '酒', amount: '大さじ2' },
      { name: '砂糖', amount: '大さじ1' },
    ],
    steps: [
      '鍋に水200ml・醤油大さじ2・みりん大さじ2・酒大さじ2・砂糖大さじ1・しょうがを入れて煮立てる',
      'たらを入れて落し蓋をし弱中火で10分煮る',
      '煮汁をスプーンで回しかけながら仕上げる',
    ],
    tip: 'たらはやわらかいので崩れないよう優しく扱う。高齢者にぴったり。',
  },
  c1: {
    id: 'c1', name: '鶏の照り焼き', category: 'chicken', cookingMinutes: 20, calories: 280, childFriendly: true,
    shopping: [{ name: '鶏もも肉', amount: '400g' }],
    condiments: [
      { name: '醤油', amount: '大さじ2' }, { name: 'みりん', amount: '大さじ2' },
      { name: '酒', amount: '大さじ1' }, { name: '砂糖', amount: '小さじ1' },
    ],
    steps: [
      '鶏肉を醤油大さじ2・みりん大さじ2・酒大さじ1・砂糖小さじ1に10分漬ける',
      'フライパンで皮目から中火で7分焼く',
      '裏返して蓋をして5分蒸し焼きにし、漬けタレを加えて照りを出す',
    ],
    tip: '蓋をして蒸し焼きにすると中までふっくら仕上がる。',
  },
  c2: {
    id: 'c2', name: '親子丼', category: 'chicken', cookingMinutes: 15, calories: 420, childFriendly: true,
    shopping: [{ name: '鶏もも肉', amount: '300g' }, { name: '玉ねぎ', amount: '1個' }, { name: '卵', amount: '4個' }],
    condiments: [
      { name: 'だし', amount: '200ml' }, { name: '醤油', amount: '大さじ2' },
      { name: 'みりん', amount: '大さじ2' }, { name: '酒', amount: '大さじ1' },
    ],
    steps: [
      '鶏肉を一口大に切り、玉ねぎを薄切りにする',
      '鍋にだし200ml・醤油大さじ2・みりん大さじ2・酒大さじ1を入れて煮立て、鶏肉と玉ねぎを加えて中火で5分煮る',
      '溶き卵を2回に分けて回しかけ、半熟で火を止めてごはんにのせる',
    ],
    tip: '卵は半熟がベスト。最後に入れたらすぐ蓋をする。',
  },
  c3: {
    id: 'c3', name: '鶏肉と野菜の煮物', category: 'chicken', cookingMinutes: 25, calories: 260, childFriendly: true,
    shopping: [{ name: '鶏もも肉', amount: '300g' }, { name: 'じゃがいも', amount: '3個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '1個' }],
    condiments: [
      { name: 'だし', amount: '400ml' }, { name: '醤油', amount: '大さじ2.5' },
      { name: 'みりん', amount: '大さじ2' }, { name: '砂糖', amount: '大さじ1.5' },
    ],
    steps: [
      '鶏肉と野菜を一口大に切る',
      '鍋に油を熱し鶏肉を炒め、野菜を加えてさらに炒める',
      'だし400ml・醤油大さじ2.5・みりん大さじ2・砂糖大さじ1.5を加えて15分煮る',
    ],
    tip: 'じゃがいもがやわらかくなれば完成。高齢者も食べやすい。',
  },
  c4: {
    id: 'c4', name: '鶏肉の塩レモン炒め', category: 'chicken', cookingMinutes: 20, calories: 240, childFriendly: true,
    shopping: [{ name: '鶏むね肉', amount: '350g' }, { name: 'レモン', amount: '1個' }, { name: 'パプリカ', amount: '1個' }, { name: 'にんにく', amount: '1かけ' }],
    condiments: [
      { name: '塩こしょう', amount: '少量' }, { name: '酒', amount: '大さじ1' },
    ],
    steps: [
      '鶏むね肉を薄切りにして塩こしょう・酒大さじ1をもみ込む',
      'にんにくをみじん切りにして油で炒め、鶏肉を加えて炒める',
      'パプリカを加えてさらに炒め、仕上げにレモン汁を絞る',
    ],
    tip: '薄切りにすると火が通りやすく柔らかく仕上がる。',
  },
  c5: {
    id: 'c5', name: 'チキンソテー', category: 'chicken', cookingMinutes: 20, calories: 300, childFriendly: true,
    shopping: [{ name: '鶏もも肉', amount: '400g' }, { name: 'にんにく', amount: '1かけ' }],
    condiments: [
      { name: '塩こしょう', amount: '少量' }, { name: '醤油', amount: '大さじ1' },
    ],
    steps: [
      '鶏肉に塩こしょうをして30分常温に戻す',
      'にんにくを潰して油で炒め香りを出す',
      '鶏肉を皮目から入れ蓋をせず中火でカリッと7分・裏返して5分焼き、仕上げに醤油大さじ1を回しかける',
    ],
    tip: '皮目をパリッと焼くのがポイント。蓋をしないで焼く。',
  },
  p1: {
    id: 'p1', name: '豚の生姜焼き', category: 'pork', cookingMinutes: 15, calories: 320, childFriendly: true,
    shopping: [{ name: '豚ロース', amount: '350g' }, { name: '玉ねぎ', amount: '1個' }, { name: 'しょうが', amount: '1かけ' }],
    condiments: [
      { name: '醤油', amount: '大さじ2' }, { name: 'みりん', amount: '大さじ1' },
      { name: '酒', amount: '大さじ1' }, { name: '砂糖', amount: '小さじ1' },
    ],
    steps: [
      '玉ねぎを薄切り、しょうがをすりおろす',
      '醤油大さじ2・みりん大さじ1・酒大さじ1・砂糖小さじ1・しょうがを合わせてタレを作る',
      '豚肉と玉ねぎをフライパンで炒め、火が通ったらタレを加えて手早く絡める',
    ],
    tip: 'しょうがは多めが美味しい。タレは最後に加えて手早く絡める。',
  },
  p2: {
    id: 'p2', name: '豚肉と野菜の味噌炒め', category: 'pork', cookingMinutes: 20, calories: 280, childFriendly: true,
    shopping: [{ name: '豚こま肉', amount: '300g' }, { name: 'キャベツ', amount: '1/4個' }, { name: 'もやし', amount: '1袋' }, { name: 'にんじん', amount: '1/2本' }],
    condiments: [
      { name: '味噌', amount: '大さじ2' }, { name: 'みりん', amount: '大さじ1' },
      { name: '酒', amount: '大さじ1' }, { name: '砂糖', amount: '小さじ1' },
    ],
    steps: [
      '野菜を食べやすい大きさに切る',
      '味噌大さじ2・みりん大さじ1・酒大さじ1・砂糖小さじ1を合わせてタレを作る',
      '豚肉を炒めて火が通ったら野菜を加え、タレで炒め合わせる',
    ],
    tip: 'キャベツはしっかり炒めてやわらかくすると高齢者も食べやすい。',
  },
  p3: {
    id: 'p3', name: '肉じゃが（豚肉）', category: 'pork', cookingMinutes: 25, calories: 300, childFriendly: true,
    shopping: [{ name: '豚こま肉', amount: '250g' }, { name: 'じゃがいも', amount: '4個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '1個' }, { name: 'しらたき', amount: '1袋' }],
    condiments: [
      { name: 'だし', amount: '400ml' }, { name: '醤油', amount: '大さじ3' },
      { name: 'みりん', amount: '大さじ3' }, { name: '砂糖', amount: '大さじ2' },
      { name: '酒', amount: '大さじ1' },
    ],
    steps: [
      '野菜を一口大に切り、しらたきを食べやすく切って下茹でする',
      '油で豚肉を炒め野菜・しらたきを加えてさらに炒める',
      'だし400ml・醤油大さじ3・みりん大さじ3・砂糖大さじ2・酒大さじ1を加えて落し蓋をし弱中火で20分煮る',
    ],
    tip: 'じゃがいもが煮崩れるくらい煮ると高齢者も食べやすい。',
  },
  p4: {
    id: 'p4', name: '豚汁定食', category: 'pork', cookingMinutes: 20, calories: 250, childFriendly: true,
    shopping: [{ name: '豚こま肉', amount: '200g' }, { name: 'だいこん', amount: '1/3本' }, { name: 'にんじん', amount: '1本' }, { name: 'ごぼう', amount: '1/2本' }, { name: '木綿豆腐', amount: '1丁' }],
    condiments: [
      { name: '水', amount: '700ml' }, { name: 'だし', amount: '小さじ1' },
      { name: '味噌', amount: '大さじ3' }, { name: 'ごま油', amount: '小さじ1' },
    ],
    steps: [
      '野菜を乱切り、ごぼうはささがきにして水にさらす',
      'ごま油小さじ1で豚肉と野菜を炒める',
      '水700mlとだし小さじ1を加えて野菜がやわらかくなるまで10分煮て、味噌大さじ3を溶かし入れる',
    ],
    tip: 'ごぼうはやわらかく煮る。具だくさんで栄養満点。',
  },
  b1: {
    id: 'b1', name: '牛丼', category: 'beef', cookingMinutes: 20, calories: 480, childFriendly: true,
    shopping: [{ name: '牛こま肉', amount: '300g' }, { name: '玉ねぎ', amount: '2個' }],
    condiments: [
      { name: 'だし', amount: '300ml' }, { name: '醤油', amount: '大さじ3' },
      { name: 'みりん', amount: '大さじ3' }, { name: '砂糖', amount: '大さじ2' },
      { name: '酒', amount: '大さじ1' },
    ],
    steps: [
      '玉ねぎを薄切りにする',
      '鍋にだし300ml・醤油大さじ3・みりん大さじ3・砂糖大さじ2・酒大さじ1を入れて煮立て、玉ねぎを加えて5分煮る',
      '牛肉を加えてほぐしながら10分煮てごはんにのせる',
    ],
    tip: '玉ねぎがとろとろになるまで煮ると美味しい。',
  },
  b2: {
    id: 'b2', name: '肉じゃが（牛肉）', category: 'beef', cookingMinutes: 25, calories: 320, childFriendly: true,
    shopping: [{ name: '牛こま肉', amount: '250g' }, { name: 'じゃがいも', amount: '4個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '1個' }, { name: 'しらたき', amount: '1袋' }],
    condiments: [
      { name: 'だし', amount: '400ml' }, { name: '醤油', amount: '大さじ3' },
      { name: 'みりん', amount: '大さじ3' }, { name: '砂糖', amount: '大さじ2' },
      { name: '酒', amount: '大さじ1' },
    ],
    steps: [
      '野菜を一口大に切り、しらたきを下茹でする',
      '油で牛肉を炒め野菜・しらたきを加えてさらに炒める',
      'だし400ml・醤油大さじ3・みりん大さじ3・砂糖大さじ2・酒大さじ1を加えて落し蓋をし弱中火で20分煮る',
    ],
    tip: '牛肉の旨味がじゃがいもに染み込む定番料理。',
  },
  e1: {
    id: 'e1', name: '麻婆豆腐', category: 'egg', cookingMinutes: 20, calories: 260, childFriendly: false,
    shopping: [{ name: '豚ひき肉', amount: '200g' }, { name: '木綿豆腐', amount: '2丁' }, { name: 'ねぎ', amount: '1本' }, { name: 'にんにく', amount: '1かけ' }, { name: 'しょうが', amount: '1かけ' }, { name: '豆板醤', amount: '少量' }],
    condiments: [
      { name: 'だし', amount: '200ml' }, { name: '醤油', amount: '大さじ1.5' },
      { name: 'みりん', amount: '大さじ1' }, { name: '酒', amount: '大さじ1' },
      { name: '片栗粉', amount: '大さじ1' },
    ],
    steps: [
      'にんにく・しょうがをみじん切りにして油で炒め、ひき肉を加えてよく炒める',
      'だし200ml・醤油大さじ1.5・みりん大さじ1・酒大さじ1・豆板醤を加えて煮立てる',
      '豆腐を加えて5分煮て、水溶き片栗粉（片栗粉大さじ1＋水大さじ2）でとろみをつけ、ねぎをちらす',
    ],
    tip: '豆板醤は少量にすれば子どもも食べられる。',
  },
  e2: {
    id: 'e2', name: '厚揚げの煮物', category: 'egg', cookingMinutes: 15, calories: 200, childFriendly: true,
    shopping: [{ name: '厚揚げ', amount: '2枚' }, { name: 'だいこん', amount: '1/4本' }, { name: 'にんじん', amount: '1/2本' }],
    condiments: [
      { name: 'だし', amount: '300ml' }, { name: '醤油', amount: '大さじ2' },
      { name: 'みりん', amount: '大さじ2' }, { name: '酒', amount: '大さじ1' },
      { name: '砂糖', amount: '小さじ1' },
    ],
    steps: [
      '厚揚げを食べやすく切り、野菜を乱切りにする',
      'だし300ml・醤油大さじ2・みりん大さじ2・酒大さじ1・砂糖小さじ1を合わせて煮立てる',
      '全食材を入れて落し蓋をし弱中火で15分煮る',
    ],
    tip: '厚揚げは栄養豊富でやわらかい。全年齢に食べやすい。',
  },
  e3: {
    id: 'e3', name: 'オムライス', category: 'egg', cookingMinutes: 20, calories: 420, childFriendly: true,
    shopping: [{ name: '卵', amount: '6個' }, { name: '鶏もも肉', amount: '200g' }, { name: '玉ねぎ', amount: '1個' }],
    condiments: [
      { name: 'ケチャップ', amount: '大さじ3' }, { name: 'バター', amount: '大さじ1' },
      { name: '塩こしょう', amount: '少量' },
    ],
    steps: [
      'バター大さじ1で鶏肉と玉ねぎを炒め、ケチャップ大さじ3・塩こしょうでケチャップライスを作る',
      '溶き卵2個（1人分）を薄く焼く',
      'ライスを包んで形を整えてケチャップをかける',
    ],
    tip: '子どもに大人気。卵は薄く焼くのがコツ。',
  },
  o1: {
    id: 'o1', name: 'ハンバーグ', category: 'other', cookingMinutes: 30, calories: 380, childFriendly: true,
    shopping: [{ name: '合いびき肉', amount: '400g' }, { name: '玉ねぎ', amount: '1個' }, { name: '卵', amount: '1個' }],
    condiments: [
      { name: 'パン粉', amount: '大さじ3' }, { name: '牛乳', amount: '大さじ2' },
      { name: '塩こしょう', amount: '少量' },
    ],
    steps: [
      '玉ねぎをみじん切りにして炒めて冷ます',
      'ひき肉・卵・パン粉大さじ3・牛乳大さじ2・塩こしょう・炒め玉ねぎをよくこねる',
      '成形してフライパンで中火両面焼き（片面3分）→蓋をして弱火で5分蒸し焼き',
    ],
    tip: '多めに作って冷凍しておくと便利。',
  },
  o2: {
    id: 'o2', name: '豆腐ハンバーグ', category: 'other', cookingMinutes: 25, calories: 280, childFriendly: true,
    shopping: [{ name: '合いびき肉', amount: '300g' }, { name: '絹豆腐', amount: '1丁' }, { name: '玉ねぎ', amount: '1個' }, { name: '卵', amount: '1個' }],
    condiments: [
      { name: 'パン粉', amount: '大さじ2' }, { name: '醤油', amount: '大さじ1.5' },
      { name: 'みりん', amount: '大さじ1.5' }, { name: '塩こしょう', amount: '少量' },
    ],
    steps: [
      '豆腐をキッチンペーパーで包み重石をして15分水切りする',
      'ひき肉・豆腐・玉ねぎ（みじん切り）・卵・パン粉大さじ2・塩こしょうをよくこねる',
      '成形して中火で両面焼き→蒸し焼き5分・醤油大さじ1.5とみりん大さじ1.5を合わせたタレをかける',
    ],
    tip: '豆腐入りでやわらかく高齢者にも食べやすい。',
  },
  o3: {
    id: 'o3', name: 'カレーライス', category: 'other', cookingMinutes: 30, calories: 500, childFriendly: true,
    shopping: [{ name: '牛こま肉（または豚こま肉）', amount: '350g' }, { name: 'じゃがいも', amount: '3個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '2個' }, { name: 'カレールー', amount: '1箱' }],
    condiments: [{ name: '水', amount: '800ml' }],
    steps: [
      '野菜と肉を一口大に切り、油で炒める',
      '水800mlを加えて野菜がやわらかくなるまで15分煮る',
      '一度火を止めてルーを割り入れて溶かし、弱火で10分煮込む',
    ],
    tip: '多めに作ると翌日も食べられる。子どもに大人気。',
  },
  o4: {
    id: 'o4', name: 'シチュー', category: 'other', cookingMinutes: 30, calories: 380, childFriendly: true,
    shopping: [{ name: '鶏もも肉', amount: '350g' }, { name: 'じゃがいも', amount: '3個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '1個' }, { name: 'シチュールー', amount: '1箱' }],
    condiments: [{ name: '水', amount: '600ml' }, { name: '牛乳', amount: '200ml' }],
    steps: [
      '野菜と鶏肉を一口大に切り、バターで炒める',
      '水600mlを加えて15分煮る',
      '火を止めてルーを溶かし、牛乳200mlを加えて弱火で5分煮る',
    ],
    tip: '野菜がやわらかく高齢者にも食べやすい。',
  },
  c6: {
    id: 'c6', name: 'チキンカレー', category: 'chicken', cookingMinutes: 30, calories: 480, childFriendly: true,
    shopping: [{ name: '鶏もも肉', amount: '350g' }, { name: 'じゃがいも', amount: '3個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '2個' }, { name: 'カレールー', amount: '1箱' }],
    condiments: [{ name: '水', amount: '800ml' }],
    steps: [
      '鶏肉を一口大に切り、野菜も同様に切る',
      '油で鶏肉を炒め色が変わったら野菜を加えてさらに炒める',
      '水800mlを加えて野菜がやわらかくなるまで15分煮る',
      '一度火を止めてルーを割り入れて溶かし、弱火で10分煮込む',
    ],
    tip: '鶏肉はやわらかく煮えるので高齢者にも食べやすい。翌日も美味しい。',
  },
  c7: {
    id: 'c7', name: '鶏のから揚げ', category: 'chicken', cookingMinutes: 25, calories: 350, childFriendly: true,
    shopping: [{ name: '鶏もも肉', amount: '400g' }, { name: 'にんにく', amount: '1かけ' }, { name: 'しょうが', amount: '1かけ' }],
    condiments: [
      { name: '醤油', amount: '大さじ2' }, { name: '酒', amount: '大さじ1' },
      { name: 'ごま油', amount: '小さじ1' }, { name: '片栗粉', amount: '大さじ4' },
    ],
    steps: [
      '鶏肉を一口大に切り、醤油大さじ2・酒大さじ1・ごま油小さじ1・にんにく&しょうがすりおろしをもみ込んで15分漬ける',
      '片栗粉大さじ4をまぶして170℃の油で4〜5分揚げる',
      '一度取り出して2分休ませ、180℃で1分二度揚げするとカリッと仕上がる',
    ],
    tip: '二度揚げで外カリ中ジューシーに。子どもに大人気。',
  },
  p5: {
    id: 'p5', name: '回鍋肉', category: 'pork', cookingMinutes: 20, calories: 290, childFriendly: true,
    shopping: [{ name: '豚バラ肉', amount: '300g' }, { name: 'キャベツ', amount: '1/4個' }, { name: 'ピーマン', amount: '2個' }, { name: 'にんにく', amount: '1かけ' }, { name: 'しょうが', amount: '1かけ' }],
    condiments: [
      { name: '味噌', amount: '大さじ2' }, { name: '醤油', amount: '小さじ1' },
      { name: 'みりん', amount: '大さじ1' }, { name: '酒', amount: '大さじ1' },
      { name: '砂糖', amount: '小さじ1' },
    ],
    steps: [
      '豚バラを食べやすく切り、キャベツはざく切り、ピーマンは乱切りにする',
      'にんにく・しょうがをみじん切りにして油で炒め、豚肉を加えてしっかり炒める',
      '野菜を加えて炒め、味噌大さじ2・醤油小さじ1・みりん大さじ1・酒大さじ1・砂糖小さじ1を合わせたタレで炒め合わせる',
    ],
    tip: '豆板醤を少量加えると本格的な辛みが出る。辛いのが苦手な方はなしでもOK。',
  },
  p6: {
    id: 'p6', name: '豚肉のポン酢炒め', category: 'pork', cookingMinutes: 15, calories: 260, childFriendly: true,
    shopping: [{ name: '豚こま肉', amount: '300g' }, { name: '玉ねぎ', amount: '1個' }, { name: 'もやし', amount: '1袋' }],
    condiments: [
      { name: 'ポン酢', amount: '大さじ3' }, { name: 'ごま油', amount: '小さじ1' },
    ],
    steps: [
      '玉ねぎを薄切りにする',
      'ごま油小さじ1で豚肉を炒め、玉ねぎ・もやしを加えてしんなりするまで炒める',
      '全体に火が通ったらポン酢大さじ3を回しかけ、手早く炒め合わせる',
    ],
    tip: 'ポン酢のさっぱり味で食欲がない日にもおすすめ。',
  },
  o5: {
    id: 'o5', name: 'ドライカレー', category: 'other', cookingMinutes: 25, calories: 420, childFriendly: true,
    shopping: [{ name: '合いびき肉', amount: '300g' }, { name: '玉ねぎ', amount: '2個' }, { name: 'にんじん', amount: '1/2本' }, { name: 'にんにく', amount: '1かけ' }, { name: 'カレー粉', amount: '大さじ1.5' }],
    condiments: [
      { name: 'ケチャップ', amount: '大さじ2' }, { name: 'ウスターソース', amount: '大さじ1' },
      { name: '塩こしょう', amount: '少量' },
    ],
    steps: [
      '玉ねぎ・にんじん・にんにくをみじん切りにする',
      '油でにんにくを炒めて香りを出し、玉ねぎが透き通るまで5〜7分炒める',
      'ひき肉・にんじんを加えて炒め、カレー粉大さじ1.5・ケチャップ大さじ2・ウスターソース大さじ1・塩こしょうで味付けし水分が飛ぶまで炒める',
    ],
    tip: '多めに作って冷凍できる。ごはんにかけてもパンに挟んでもOK。',
  },
  o6: {
    id: 'o6', name: 'スパゲッティミートソース', category: 'other', cookingMinutes: 30, calories: 450, childFriendly: true,
    shopping: [{ name: '合いびき肉', amount: '300g' }, { name: '玉ねぎ', amount: '1個' }, { name: 'トマト缶', amount: '1缶' }, { name: 'スパゲッティ', amount: '300g' }],
    condiments: [
      { name: 'コンソメ', amount: '小さじ1' }, { name: 'ケチャップ', amount: '大さじ2' },
      { name: 'ウスターソース', amount: '大さじ1' }, { name: '塩こしょう', amount: '少量' },
    ],
    steps: [
      '玉ねぎをみじん切りにして油で炒め、ひき肉を加えてよく炒める',
      'トマト缶・コンソメ小さじ1・ケチャップ大さじ2・ウスターソース大さじ1を加えて弱火で15分煮込み、塩こしょうで調整する',
      'スパゲッティを袋の表示通りに茹でてミートソースをかける',
    ],
    tip: 'ソースは多めに作って冷凍しておくと便利。子どもに大人気。',
  },
};

// ─── 副菜 ─────────────────────────────────────────────────────────────────────

export const SIDES: Record<string, Side> = {
  s1: {
    id: 's1', name: 'ほうれん草のおひたし', category: 'vegetable', calories: 30,
    shopping: [{ name: 'ほうれん草', amount: '1束' }],
    condiments: [{ name: '醤油', amount: '大さじ1' }, { name: 'だし', amount: '大さじ1' }],
    steps: ['ほうれん草を塩少量を入れた湯で1〜2分茹でて冷水にとる', '水気をしっかり絞って3cm幅に切る', '醤油大さじ1・だし大さじ1をかけて白ごまを振る'],
  },
  s2: {
    id: 's2', name: 'ブロッコリーのごまあえ', category: 'vegetable', calories: 45,
    shopping: [{ name: 'ブロッコリー', amount: '1株' }],
    condiments: [{ name: '醤油', amount: '大さじ1' }, { name: '砂糖', amount: '小さじ1' }],
    steps: ['ブロッコリーを小房に分けて塩を入れた湯で2〜3分茹でる', 'ザルにあけて水気を切る', '醤油大さじ1・砂糖小さじ1・白ごまで和える'],
  },
  s3: {
    id: 's3', name: 'きんぴらごぼう', category: 'vegetable', calories: 80,
    shopping: [{ name: 'ごぼう', amount: '1本' }, { name: 'にんじん', amount: '1/2本' }],
    condiments: [
      { name: '醤油', amount: '大さじ1.5' }, { name: 'みりん', amount: '大さじ1.5' },
      { name: '砂糖', amount: '小さじ1' }, { name: 'ごま油', amount: '小さじ1' },
    ],
    steps: ['ごぼうとにんじんを細切りにし、ごぼうは水にさらしてアク抜きする', 'ごま油小さじ1で炒める', '醤油大さじ1.5・みりん大さじ1.5・砂糖小さじ1で味付けして白ごまを振る'],
  },
  s4: {
    id: 's4', name: 'ひじきの煮物', category: 'seaweed', calories: 60,
    shopping: [{ name: 'ひじき（乾燥）', amount: '30g' }, { name: '油揚げ', amount: '1枚' }, { name: 'にんじん', amount: '1/2本' }],
    condiments: [
      { name: 'だし', amount: '150ml' }, { name: '醤油', amount: '大さじ2' },
      { name: 'みりん', amount: '大さじ1.5' }, { name: '砂糖', amount: '大さじ1' },
      { name: '酒', amount: '大さじ1' },
    ],
    steps: ['ひじきを水で20分戻してザルにあける', 'にんじん・油揚げと一緒にごま油で炒める', 'だし150ml・醤油大さじ2・みりん大さじ1.5・砂糖大さじ1・酒大さじ1で汁気がなくなるまで煮含める'],
  },
  s5: {
    id: 's5', name: 'かぼちゃの煮物', category: 'vegetable', calories: 90,
    shopping: [{ name: 'かぼちゃ', amount: '1/4個' }],
    condiments: [
      { name: 'だし', amount: '200ml' }, { name: '醤油', amount: '大さじ1.5' },
      { name: 'みりん', amount: '大さじ1.5' }, { name: '砂糖', amount: '大さじ1.5' },
    ],
    steps: ['かぼちゃを3〜4cm角に切る（皮の面が鍋底になるよう並べると煮崩れしにくい）', 'だし200ml・醤油大さじ1.5・みりん大さじ1.5・砂糖大さじ1.5を合わせて煮立てる', '落し蓋をして弱中火で15分、やわらかくなるまで煮る'],
  },
  s6: {
    id: 's6', name: '小松菜の炒め物', category: 'vegetable', calories: 35,
    shopping: [{ name: '小松菜', amount: '1束' }],
    condiments: [
      { name: '醤油', amount: '大さじ1' }, { name: '酒', amount: '大さじ1' },
      { name: 'ごま油', amount: '小さじ1' },
    ],
    steps: ['小松菜を根元から3cm幅に切る', 'ごま油小さじ1で茎から先に炒め、葉を加える', '醤油大さじ1・酒大さじ1で味付けして白ごまを振る'],
  },
  s7: {
    id: 's7', name: 'もやしのナムル', category: 'vegetable', calories: 30,
    shopping: [{ name: 'もやし', amount: '1袋' }],
    condiments: [
      { name: 'ごま油', amount: '大さじ1' }, { name: '醤油', amount: '小さじ1' },
      { name: '塩', amount: '少量' },
    ],
    steps: ['もやしをさっと30秒茹でてザルにあけ、水気をしっかり絞る', 'ごま油大さじ1・醤油小さじ1・塩少量で和える', '白ごまを振る'],
  },
  s8: {
    id: 's8', name: '大根のそぼろ煮', category: 'vegetable', calories: 85,
    shopping: [{ name: 'だいこん', amount: '1/3本' }, { name: '豚ひき肉', amount: '100g' }],
    condiments: [
      { name: 'だし', amount: '250ml' }, { name: '醤油', amount: '大さじ2' },
      { name: 'みりん', amount: '大さじ1.5' }, { name: '砂糖', amount: '大さじ1' },
    ],
    steps: ['大根を2cm幅の半月切りにして下茹で（5分）する', 'ひき肉をごま油で炒めてほぐし、大根を加える', 'だし250ml・醤油大さじ2・みりん大さじ1.5・砂糖大さじ1で10分煮る'],
  },
  s9: {
    id: 's9', name: 'アスパラのバターソテー', category: 'vegetable', calories: 50,
    shopping: [{ name: 'アスパラ', amount: '1束' }],
    condiments: [{ name: 'バター', amount: '大さじ1' }, { name: '塩こしょう', amount: '少量' }],
    steps: ['アスパラを斜め切りにする', 'バター大さじ1を溶かしたフライパンで中火で炒める', '塩こしょうで味付けして完成'],
  },
  s10: {
    id: 's10', name: '卵焼き', category: 'other', calories: 90,
    shopping: [{ name: '卵', amount: '3個' }],
    condiments: [
      { name: 'だし', amount: '大さじ2' }, { name: '醤油', amount: '小さじ1' },
      { name: '砂糖', amount: '大さじ1' },
    ],
    steps: ['卵3個・だし大さじ2・醤油小さじ1・砂糖大さじ1をよく混ぜる', '卵焼き器に薄く油を引き、卵液を3回に分けて入れて巻く', '冷ましてから食べやすく切る'],
  },
};

// ─── 汁物 ─────────────────────────────────────────────────────────────────────

export const SOUPS: Record<string, Soup> = {
  sp1: {
    id: 'sp1', name: 'わかめと豆腐の味噌汁', category: 'miso', calories: 40,
    shopping: [{ name: 'わかめ（乾燥）', amount: '5g' }, { name: '絹豆腐', amount: '1/2丁' }],
    condiments: [
      { name: '水', amount: '600ml' }, { name: 'だし', amount: '小さじ1' },
      { name: '味噌', amount: '大さじ2' },
    ],
    steps: [
      '水600mlにだし小さじ1を溶かして鍋で沸かす',
      '絹豆腐を1cm角に切って加え、水で戻したわかめも入れる',
      '火を弱めて味噌大さじ2を溶かし入れ、沸騰直前で火を止める',
    ],
  },
  sp2: {
    id: 'sp2', name: 'なめこの味噌汁', category: 'miso', calories: 35,
    shopping: [{ name: 'なめこ', amount: '1袋' }, { name: '絹豆腐', amount: '1/2丁' }],
    condiments: [
      { name: '水', amount: '600ml' }, { name: 'だし', amount: '小さじ1' },
      { name: '味噌', amount: '大さじ2' },
    ],
    steps: [
      '水600mlにだし小さじ1を溶かして鍋で沸かす',
      'なめこを軽く洗って加え、絹豆腐を1cm角に切って入れる',
      '火を弱めて味噌大さじ2を溶かし入れ、ねぎを散らす',
    ],
  },
  sp3: {
    id: 'sp3', name: 'かき玉汁', category: 'clear', calories: 50,
    shopping: [{ name: '卵', amount: '2個' }, { name: 'ねぎ', amount: '1/2本' }],
    condiments: [
      { name: '水', amount: '600ml' }, { name: 'だし', amount: '小さじ1' },
      { name: '醤油', amount: '小さじ2' }, { name: '塩', amount: '少量' },
    ],
    steps: [
      '水600mlにだし小さじ1を溶かして煮立て、醤油小さじ2・塩少量で味を整える',
      '溶き卵を箸に沿わせて細く円を描くように流し入れ、大きくひと混ぜする',
      'ねぎを散らして完成',
    ],
  },
  sp4: {
    id: 'sp4', name: 'コーンスープ', category: 'western', calories: 80,
    shopping: [{ name: 'コーン缶', amount: '1缶' }],
    condiments: [
      { name: '水', amount: '300ml' }, { name: '牛乳', amount: '200ml' },
      { name: 'コンソメ', amount: '小さじ1' }, { name: '塩こしょう', amount: '少量' },
    ],
    steps: [
      'コーン缶の汁ごと水300mlとともにミキサーにかけてなめらかにする',
      '鍋に移して牛乳200ml・コンソメ小さじ1を加えて中火で温める',
      '沸騰直前に塩こしょうで味を整える',
    ],
  },
  sp5: {
    id: 'sp5', name: 'トマトスープ', category: 'western', calories: 55,
    shopping: [{ name: 'トマト缶', amount: '1缶' }, { name: '玉ねぎ', amount: '1/2個' }],
    condiments: [
      { name: '水', amount: '300ml' }, { name: 'コンソメ', amount: '小さじ1' },
      { name: '塩こしょう', amount: '少量' },
    ],
    steps: [
      '玉ねぎをみじん切りにしてオリーブオイルで炒める',
      'トマト缶・水300mlを加えて10分煮る',
      'コンソメ小さじ1を加えて塩こしょうで調整する',
    ],
  },
};

// ─── 果物 ─────────────────────────────────────────────────────────────────────

export const FRUITS: Record<string, Fruit> = {
  fr1: { id: 'fr1', name: 'バナナ', calories: 86, note: '通年・手軽にビタミン補給' },
  fr2: { id: 'fr2', name: 'りんご', calories: 54, note: '秋〜春が旬。1/4個が目安' },
  fr3: { id: 'fr3', name: 'みかん', calories: 46, note: '冬が旬。ビタミンC豊富' },
  fr4: { id: 'fr4', name: 'いちご', calories: 34, note: '春が旬。5〜6粒が目安' },
  fr5: { id: 'fr5', name: 'キウイ', calories: 53, note: '通年。ビタミンCが豊富' },
};

// ─── 1週間の献立構成 ─────────────────────────────────────────────────────────

export interface DayPlan {
  main: string;
  sides: string[];
  soup?: string;
  fruit?: string;
}

// 4週間ローテーション（月〜金）
export const MONTHLY_PLAN: DayPlan[][] = [
  // 第1週
  [
    { main: 'f1', sides: ['s1', 's4'], soup: 'sp1' },
    { main: 'c1', sides: ['s2', 's10'] },
    { main: 'p1', sides: ['s3', 's7'], soup: 'sp3' },
    { main: 'b1', sides: ['s5'] },
    { main: 'e1', sides: ['s6', 's2'], soup: 'sp2', fruit: 'fr1' },
  ],
  // 第2週
  [
    { main: 'f2', sides: ['s8', 's7'], soup: 'sp1' },
    { main: 'c7', sides: ['s1', 's10'] },           // 鶏のから揚げ
    { main: 'p6', sides: ['s9'], soup: 'sp3' },     // 豚肉のポン酢炒め
    { main: 'b2', sides: ['s4', 's6'] },
    { main: 'e2', sides: ['s2', 's10'], soup: 'sp2', fruit: 'fr2' },
  ],
  // 第3週
  [
    { main: 'f3', sides: ['s5', 's7'], soup: 'sp4' },
    { main: 'c3', sides: ['s1'] },
    { main: 'p5', sides: ['s10', 's6'], soup: 'sp1' }, // 回鍋肉
    { main: 'o6', sides: ['s9', 's2'] },               // ミートソース
    { main: 'e3', sides: ['s3'], soup: 'sp5', fruit: 'fr5' },
  ],
  // 第4週
  [
    { main: 'f5', sides: ['s8', 's10'], soup: 'sp2' },
    { main: 'c6', sides: ['s2', 's7'] },            // チキンカレー
    { main: 'p4', sides: ['s5', 's1'], soup: 'sp3' },
    { main: 'o5', sides: ['s6'] },                  // ドライカレー
    { main: 'o2', sides: ['s4', 's9'], soup: 'sp1', fruit: 'fr1' },
  ],
];

export const CATEGORY_CONFIG: Record<MealCategory, { label: string; bg: string; text: string; border: string; dot: string }> = {
  fish:    { label: '魚', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', dot: 'bg-sky-400' },
  chicken: { label: '鶏肉', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-400' },
  pork:    { label: '豚肉', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-400' },
  beef:    { label: '牛肉', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-400' },
  egg:     { label: '卵・豆腐', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  other:   { label: 'その他', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-400' },
};
