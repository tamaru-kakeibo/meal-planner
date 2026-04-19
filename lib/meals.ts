export type MealCategory = 'fish' | 'chicken' | 'pork' | 'beef' | 'egg' | 'other';

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  cookingMinutes: number;
  ingredients: string[];   // 買い物リスト用
  tip?: string;
}

export const MEALS: Record<string, Meal> = {
  // 魚
  f1: {
    id: 'f1', name: '鮭の塩焼き', category: 'fish', cookingMinutes: 15,
    ingredients: ['鮭', 'レモン', '塩'],
    tip: 'フライパンにクッキングシートを敷くとくっつかない。',
  },
  f2: {
    id: 'f2', name: 'さばの味噌煮', category: 'fish', cookingMinutes: 25,
    ingredients: ['さば', '味噌', '砂糖', 'みりん', 'しょうが'],
    tip: '煮汁が煮詰まったら完成。骨がやわらかくなるので高齢者にも食べやすい。',
  },
  f3: {
    id: 'f3', name: 'ぶりの照り焼き', category: 'fish', cookingMinutes: 20,
    ingredients: ['ぶり', '醤油', 'みりん', '酒', '砂糖'],
    tip: '照り焼きのタレは醤油：みりん：酒＝1：1：1で簡単に作れる。',
  },
  f4: {
    id: 'f4', name: '鮭のムニエル', category: 'fish', cookingMinutes: 15,
    ingredients: ['鮭', '薄力粉', 'バター', 'レモン', '塩こしょう'],
    tip: '鮭に薄力粉をまぶしてバターで焼くだけ。',
  },
  f5: {
    id: 'f5', name: 'たらの煮付け', category: 'fish', cookingMinutes: 20,
    ingredients: ['たら', '醤油', 'みりん', '酒', '砂糖'],
    tip: 'たらはやわらかく煮えやすいので高齢者向けにぴったり。',
  },
  f6: {
    id: 'f6', name: 'かれいの煮付け', category: 'fish', cookingMinutes: 25,
    ingredients: ['かれい', '醤油', 'みりん', '酒', '砂糖', 'しょうが'],
    tip: '骨がやわらかく崩れやすいので食べやすい。',
  },

  // 鶏肉
  c1: {
    id: 'c1', name: '鶏の照り焼き', category: 'chicken', cookingMinutes: 20,
    ingredients: ['鶏もも肉', '醤油', 'みりん', '酒', '砂糖'],
    tip: '鶏肉はしっかり火を通すこと。蓋をして蒸し焼きにすると中までふっくら。',
  },
  c2: {
    id: 'c2', name: '親子丼', category: 'chicken', cookingMinutes: 15,
    ingredients: ['鶏もも肉', '玉ねぎ', '卵', '醤油', 'みりん', '酒', 'だし', 'ごはん'],
    tip: '卵は半熟に仕上げると美味しい。最後に回しかけてすぐ蓋をする。',
  },
  c3: {
    id: 'c3', name: '鶏肉と野菜の煮物', category: 'chicken', cookingMinutes: 25,
    ingredients: ['鶏もも肉', 'じゃがいも', 'にんじん', '玉ねぎ', '醤油', 'みりん', '酒', '砂糖'],
    tip: 'じゃがいもはやわらかく煮ると高齢者も食べやすい。',
  },
  c4: {
    id: 'c4', name: '鶏肉の塩レモン炒め', category: 'chicken', cookingMinutes: 20,
    ingredients: ['鶏むね肉', 'レモン汁', '塩こしょう', 'にんにく', 'オリーブオイル', 'パプリカ'],
    tip: '鶏むね肉は薄切りにすると火が通りやすく柔らかくなる。',
  },
  c5: {
    id: 'c5', name: 'チキンソテー', category: 'chicken', cookingMinutes: 20,
    ingredients: ['鶏もも肉', '塩こしょう', 'にんにく', 'オリーブオイル'],
    tip: '皮目をパリッと焼いてから裏返すと美味しく仕上がる。',
  },

  // 豚肉
  p1: {
    id: 'p1', name: '豚の生姜焼き', category: 'pork', cookingMinutes: 15,
    ingredients: ['豚ロース', '玉ねぎ', 'しょうが', '醤油', 'みりん', '酒'],
    tip: 'しょうがは多めに入れると風味がよくなる。',
  },
  p2: {
    id: 'p2', name: '豚肉と野菜の味噌炒め', category: 'pork', cookingMinutes: 20,
    ingredients: ['豚こま肉', 'キャベツ', 'もやし', 'にんじん', '味噌', 'みりん', '酒'],
    tip: 'キャベツはやわらかくなるまで炒めると高齢者も食べやすい。',
  },
  p3: {
    id: 'p3', name: '肉じゃが（豚肉）', category: 'pork', cookingMinutes: 25,
    ingredients: ['豚こま肉', 'じゃがいも', 'にんじん', '玉ねぎ', 'しらたき', '醤油', 'みりん', '酒', '砂糖'],
    tip: 'じゃがいもはしっかり煮崩れるくらい煮ると高齢者も食べやすい。',
  },
  p4: {
    id: 'p4', name: '豚汁定食', category: 'pork', cookingMinutes: 20,
    ingredients: ['豚こま肉', 'だいこん', 'にんじん', 'ごぼう', '豆腐', '味噌', 'だし'],
    tip: 'ごぼうはやわらかく煮ると食べやすい。具だくさんで栄養満点。',
  },
  p5: {
    id: 'p5', name: '豚肉の梅しそ蒸し', category: 'pork', cookingMinutes: 20,
    ingredients: ['豚ロース', '梅干し', '大葉', '酒', '醤油'],
    tip: '電子レンジでも作れる。梅の酸味でさっぱり仕上がる。',
  },

  // 牛肉
  b1: {
    id: 'b1', name: '牛丼', category: 'beef', cookingMinutes: 20,
    ingredients: ['牛こま肉', '玉ねぎ', '醤油', 'みりん', '酒', '砂糖', 'だし', 'ごはん'],
    tip: '玉ねぎがやわらかくなるまで煮ると高齢者も食べやすい。',
  },
  b2: {
    id: 'b2', name: '肉じゃが（牛肉）', category: 'beef', cookingMinutes: 25,
    ingredients: ['牛こま肉', 'じゃがいも', 'にんじん', '玉ねぎ', 'しらたき', '醤油', 'みりん', '酒', '砂糖'],
    tip: '牛肉の旨味がじゃがいもに染み込む。定番の家庭料理。',
  },
  b3: {
    id: 'b3', name: '牛肉と野菜の炒め物', category: 'beef', cookingMinutes: 15,
    ingredients: ['牛こま肉', 'ピーマン', 'にんじん', 'もやし', '醤油', 'みりん', 'ごま油'],
    tip: '強火で手早く炒めるのがポイント。',
  },

  // 卵・豆腐
  e1: {
    id: 'e1', name: '麻婆豆腐', category: 'egg', cookingMinutes: 20,
    ingredients: ['豚ひき肉', '木綿豆腐', 'ねぎ', 'にんにく', 'しょうが', '豆板醤（少量）', '醤油', 'みりん', 'だし'],
    tip: '豆板醤は少量にすれば子どもも食べられる。豆腐がやわらかく高齢者向け。',
  },
  e2: {
    id: 'e2', name: '厚揚げの煮物', category: 'egg', cookingMinutes: 15,
    ingredients: ['厚揚げ', 'だいこん', 'にんじん', '醤油', 'みりん', '酒', 'だし'],
    tip: '厚揚げはやわらかく栄養豊富。高齢者・子どもどちらにも食べやすい。',
  },
  e3: {
    id: 'e3', name: '茶碗蒸し', category: 'egg', cookingMinutes: 25,
    ingredients: ['卵', 'だし', '鶏もも肉', 'しいたけ', 'かまぼこ', '醤油', 'みりん'],
    tip: 'やわらかく高齢者にも食べやすい。蒸し器がなければ電子レンジでもOK。',
  },
  e4: {
    id: 'e4', name: 'オムライス', category: 'egg', cookingMinutes: 20,
    ingredients: ['卵', '鶏もも肉', 'たまねぎ', 'ごはん', 'ケチャップ', 'バター', '塩こしょう'],
    tip: '子どもに人気。ケチャップライスを包むだけ。',
  },

  // その他
  o1: {
    id: 'o1', name: 'ハンバーグ', category: 'other', cookingMinutes: 30,
    ingredients: ['合いびき肉', '玉ねぎ', '卵', 'パン粉', '牛乳', '塩こしょう', 'ケチャップ', 'ウスターソース'],
    tip: '子どもに大人気。多めに作って冷凍しておくと便利。',
  },
  o2: {
    id: 'o2', name: '豆腐ハンバーグ', category: 'other', cookingMinutes: 25,
    ingredients: ['合いびき肉', '絹豆腐', '玉ねぎ', '卵', '醤油', 'みりん', 'しょうが'],
    tip: '豆腐入りでやわらかく高齢者にも食べやすい。ヘルシーで栄養満点。',
  },
  o3: {
    id: 'o3', name: 'うどんすき', category: 'other', cookingMinutes: 20,
    ingredients: ['うどん', '鶏もも肉', '白菜', 'にんじん', '豆腐', 'だし', '醤油', 'みりん'],
    tip: '具がやわらかく高齢者に食べやすい。体が温まる。',
  },
  o4: {
    id: 'o4', name: 'カレーライス', category: 'other', cookingMinutes: 30,
    ingredients: ['鶏もも肉', 'じゃがいも', 'にんじん', '玉ねぎ', 'カレールー', 'ごはん'],
    tip: '子どもに大人気。多めに作って翌日も食べられる。',
  },
  o5: {
    id: 'o5', name: 'シチュー', category: 'other', cookingMinutes: 30,
    ingredients: ['鶏もも肉', 'じゃがいも', 'にんじん', '玉ねぎ', 'シチュールー', '牛乳'],
    tip: '野菜がやわらかく高齢者にも食べやすい。パンにも合う。',
  },
};

export const CATEGORY_CONFIG: Record<MealCategory, { label: string; bg: string; text: string; border: string; dot: string }> = {
  fish:    { label: '魚', bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', dot: 'bg-sky-400' },
  chicken: { label: '鶏肉', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-400' },
  pork:    { label: '豚肉', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', dot: 'bg-rose-400' },
  beef:    { label: '牛肉', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-400' },
  egg:     { label: '卵・豆腐', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-400' },
  other:   { label: 'その他', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-400' },
};

// 栄養バランスを考えた4週間の献立（月〜金）
// タンパク源をローテーション：魚→鶏→豚→牛→卵の順
export const MONTHLY_PLAN: string[][] = [
  // 第1週 月〜金
  ['f1', 'c1', 'p1', 'b1', 'e1'],
  // 第2週
  ['f2', 'c2', 'p2', 'b2', 'e2'],
  // 第3週
  ['f3', 'c3', 'p3', 'b3', 'e3'],
  // 第4週
  ['f5', 'c4', 'p4', 'o1', 'e4'],
];
