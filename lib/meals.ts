export type MealCategory = 'fish' | 'chicken' | 'pork' | 'beef' | 'egg' | 'other';
export type SideCategory = 'vegetable' | 'tofu' | 'seaweed' | 'other';
export type SoupCategory = 'miso' | 'clear' | 'western';

// 常備品（買い物リストから除外）
export const STAPLES = new Set([
  'ごはん', '米', '塩', '醤油', 'みりん', '酒', '砂糖', '味噌',
  '油', 'ごま油', 'オリーブオイル', '酢', 'だし', 'こんぶ', 'かつおぶし',
  '薄力粉', 'パン粉', '片栗粉', '塩こしょう', '牛乳', 'バター',
  'ケチャップ', 'ウスターソース', 'マヨネーズ', '白ごま',
]);

export interface ShoppingItem {
  name: string;
  amount: string; // 例: "3切れ", "200g"
}

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  cookingMinutes: number;
  calories: number;         // 1人分kcal
  shopping: ShoppingItem[]; // 常備品以外の食材+分量
  steps: string[];          // 作り方
  tip?: string;
}

export interface Side {
  id: string;
  name: string;
  category: SideCategory;
  calories: number;
  shopping: ShoppingItem[];
  steps: string[];
}

export interface Soup {
  id: string;
  name: string;
  category: SoupCategory;
  calories: number;
  shopping: ShoppingItem[];
  steps: string[];
}

export interface Fruit {
  id: string;
  name: string;
  calories: number;
  note: string; // 季節・選び方
}

// ─── 主菜 ─────────────────────────────────────────────────────────────────────

export const MEALS: Record<string, Meal> = {
  f1: {
    id: 'f1', name: '鮭の塩焼き', category: 'fish', cookingMinutes: 15, calories: 180,
    shopping: [{ name: '鮭', amount: '3切れ' }, { name: 'レモン', amount: '1/2個' }],
    steps: ['鮭に塩を振って10分おく', '水気を拭いてフライパンで中火5分・裏返して4分焼く', 'レモンを添えて完成'],
    tip: 'クッキングシートを敷くとくっつかず後片付けが楽。',
  },
  f2: {
    id: 'f2', name: 'さばの味噌煮', category: 'fish', cookingMinutes: 25, calories: 220,
    shopping: [{ name: 'さば', amount: '3切れ' }, { name: 'しょうが', amount: '1かけ' }],
    steps: ['さばに熱湯をかけて臭みを取る', '鍋に水・酒・砂糖・みりん・味噌を合わせて煮立てる', 'さばを入れて落し蓋をして15分煮る'],
    tip: '煮汁が少なくなったら完成の合図。高齢者にも食べやすい。',
  },
  f3: {
    id: 'f3', name: 'ぶりの照り焼き', category: 'fish', cookingMinutes: 20, calories: 250,
    shopping: [{ name: 'ぶり', amount: '3切れ' }],
    steps: ['ぶりを醤油・みりん・酒で10分漬ける', 'フライパンに油を熱し中火で両面を焼く', '漬けタレを加えて照りが出るまで煮詰める'],
    tip: '照りが出たら火が通ったサイン。',
  },
  f4: {
    id: 'f4', name: '鮭のムニエル', category: 'fish', cookingMinutes: 15, calories: 210,
    shopping: [{ name: '鮭', amount: '3切れ' }, { name: 'レモン', amount: '1個' }],
    steps: ['鮭に塩こしょうして薄力粉をまぶす', 'バターを溶かしたフライパンで中火5分・裏返して4分焼く', 'レモン汁をかけて完成'],
    tip: 'バターが焦げないよう中火をキープ。',
  },
  f5: {
    id: 'f5', name: 'たらの煮付け', category: 'fish', cookingMinutes: 20, calories: 150,
    shopping: [{ name: 'たら', amount: '3切れ' }, { name: 'しょうが', amount: '1かけ' }],
    steps: ['鍋に水・醤油・みりん・酒・砂糖・しょうがを入れ煮立てる', 'たらを入れて落し蓋をして10分煮る', '煮汁を回しかけながら仕上げる'],
    tip: 'たらはやわらかいので煮崩れに注意。高齢者にぴったり。',
  },
  c1: {
    id: 'c1', name: '鶏の照り焼き', category: 'chicken', cookingMinutes: 20, calories: 280,
    shopping: [{ name: '鶏もも肉', amount: '400g' }],
    steps: ['鶏肉を醤油・みりん・酒で10分漬ける', 'フライパンで皮目から中火で焼く（7分）', '裏返して蓋をして5分蒸し焼き・タレを加え照りを出す'],
    tip: '蓋をして蒸し焼きにすると中までふっくら仕上がる。',
  },
  c2: {
    id: 'c2', name: '親子丼', category: 'chicken', cookingMinutes: 15, calories: 420,
    shopping: [{ name: '鶏もも肉', amount: '300g' }, { name: '玉ねぎ', amount: '1個' }, { name: '卵', amount: '4個' }],
    steps: ['鶏肉と玉ねぎをだし・醤油・みりんで煮る', '溶き卵を2回に分けて回しかける', '半熟で火を止めてごはんにのせる'],
    tip: '卵は半熟がベスト。最後に入れたらすぐ蓋をする。',
  },
  c3: {
    id: 'c3', name: '鶏肉と野菜の煮物', category: 'chicken', cookingMinutes: 25, calories: 260,
    shopping: [{ name: '鶏もも肉', amount: '300g' }, { name: 'じゃがいも', amount: '3個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '1個' }],
    steps: ['鶏肉と野菜を一口大に切る', '鍋に油を熱し鶏肉を炒め、野菜を加える', 'だし・醤油・みりん・砂糖を加えて15分煮る'],
    tip: 'じゃがいもがやわらかくなれば完成。高齢者も食べやすい。',
  },
  c4: {
    id: 'c4', name: '鶏肉の塩レモン炒め', category: 'chicken', cookingMinutes: 20, calories: 240,
    shopping: [{ name: '鶏むね肉', amount: '350g' }, { name: 'レモン', amount: '1個' }, { name: 'パプリカ', amount: '1個' }, { name: 'にんにく', amount: '1かけ' }],
    steps: ['鶏むね肉を薄切りにして塩こしょうをする', 'にんにくを炒めて鶏肉を加えて炒める', 'パプリカを加えてレモン汁をかけて完成'],
    tip: '薄切りにすると火が通りやすく柔らかく仕上がる。',
  },
  c5: {
    id: 'c5', name: 'チキンソテー', category: 'chicken', cookingMinutes: 20, calories: 300,
    shopping: [{ name: '鶏もも肉', amount: '400g' }, { name: 'にんにく', amount: '1かけ' }],
    steps: ['鶏肉に塩こしょうをして常温に戻す', 'にんにくを炒めて香りを出す', '皮目からじっくり焼いてカリッとさせる・裏返して5分'],
    tip: '皮目をパリッと焼くのがポイント。蓋をしないで焼く。',
  },
  p1: {
    id: 'p1', name: '豚の生姜焼き', category: 'pork', cookingMinutes: 15, calories: 320,
    shopping: [{ name: '豚ロース', amount: '350g' }, { name: '玉ねぎ', amount: '1個' }, { name: 'しょうが', amount: '1かけ' }],
    steps: ['豚肉と玉ねぎをフライパンで炒める', '醤油・みりん・酒・しょうがを合わせたタレを加える', 'タレが絡んだら完成'],
    tip: 'しょうがは多めが美味しい。タレは最後に加えて手早く絡める。',
  },
  p2: {
    id: 'p2', name: '豚肉と野菜の味噌炒め', category: 'pork', cookingMinutes: 20, calories: 280,
    shopping: [{ name: '豚こま肉', amount: '300g' }, { name: 'キャベツ', amount: '1/4個' }, { name: 'もやし', amount: '1袋' }, { name: 'にんじん', amount: '1/2本' }],
    steps: ['野菜を食べやすい大きさに切る', '豚肉を炒めて火が通ったら野菜を加える', '味噌・みりん・酒を合わせたタレで炒め合わせる'],
    tip: 'キャベツはしっかり炒めてやわらかくすると高齢者も食べやすい。',
  },
  p3: {
    id: 'p3', name: '肉じゃが（豚肉）', category: 'pork', cookingMinutes: 25, calories: 300,
    shopping: [{ name: '豚こま肉', amount: '250g' }, { name: 'じゃがいも', amount: '4個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '1個' }, { name: 'しらたき', amount: '1袋' }],
    steps: ['野菜を一口大、しらたきを食べやすく切る', '油で豚肉を炒め野菜を加える', 'だし・醤油・みりん・砂糖を加えて20分煮る'],
    tip: 'じゃがいもが煮崩れるくらい煮ると高齢者も食べやすい。',
  },
  p4: {
    id: 'p4', name: '豚汁定食', category: 'pork', cookingMinutes: 20, calories: 250,
    shopping: [{ name: '豚こま肉', amount: '200g' }, { name: 'だいこん', amount: '1/3本' }, { name: 'にんじん', amount: '1本' }, { name: 'ごぼう', amount: '1/2本' }, { name: '豆腐', amount: '1丁' }],
    steps: ['野菜を乱切り、ごぼうはささがきにする', 'ごま油で豚肉と野菜を炒める', 'だしを加えてやわらかくなるまで煮て味噌を溶かす'],
    tip: 'ごぼうはやわらかく煮る。具だくさんで栄養満点。',
  },
  b1: {
    id: 'b1', name: '牛丼', category: 'beef', cookingMinutes: 20, calories: 480,
    shopping: [{ name: '牛こま肉', amount: '300g' }, { name: '玉ねぎ', amount: '2個' }],
    steps: ['玉ねぎを薄切りにしてだしで煮る', '牛肉を加えて醤油・みりん・砂糖で味付け', '10分煮てごはんにのせる'],
    tip: '玉ねぎがとろとろになるまで煮ると美味しい。',
  },
  b2: {
    id: 'b2', name: '肉じゃが（牛肉）', category: 'beef', cookingMinutes: 25, calories: 320,
    shopping: [{ name: '牛こま肉', amount: '250g' }, { name: 'じゃがいも', amount: '4個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '1個' }, { name: 'しらたき', amount: '1袋' }],
    steps: ['野菜を一口大に切る', '油で牛肉を炒め野菜を加える', 'だし・醤油・みりん・砂糖を加えて20分煮る'],
    tip: '牛肉の旨味がじゃがいもに染み込む定番料理。',
  },
  e1: {
    id: 'e1', name: '麻婆豆腐', category: 'egg', cookingMinutes: 20, calories: 260,
    shopping: [{ name: '豚ひき肉', amount: '200g' }, { name: '木綿豆腐', amount: '2丁' }, { name: 'ねぎ', amount: '1本' }, { name: 'にんにく', amount: '1かけ' }, { name: 'しょうが', amount: '1かけ' }, { name: '豆板醤', amount: '少量' }],
    steps: ['にんにく・しょうがを炒めてひき肉を加える', 'だし・醤油・みりん・豆板醤を加えて煮立てる', '豆腐を加えて5分煮てねぎをちらす'],
    tip: '豆板醤は少量にすれば子どもも食べられる。',
  },
  e2: {
    id: 'e2', name: '厚揚げの煮物', category: 'egg', cookingMinutes: 15, calories: 200,
    shopping: [{ name: '厚揚げ', amount: '2枚' }, { name: 'だいこん', amount: '1/4本' }, { name: 'にんじん', amount: '1/2本' }],
    steps: ['厚揚げを食べやすく切る、野菜を乱切りにする', 'だし・醤油・みりん・酒を合わせて煮立てる', '全ての食材を入れて15分煮る'],
    tip: '厚揚げは栄養豊富でやわらかい。全年齢に食べやすい。',
  },
  e3: {
    id: 'e3', name: 'オムライス', category: 'egg', cookingMinutes: 20, calories: 420,
    shopping: [{ name: '卵', amount: '6個' }, { name: '鶏もも肉', amount: '200g' }, { name: '玉ねぎ', amount: '1個' }],
    steps: ['鶏肉と玉ねぎをバターで炒めケチャップライスを作る', '溶き卵2個を薄く焼く', 'ライスを包んで形を整えてケチャップをかける'],
    tip: '子どもに大人気。卵は薄く焼くのがコツ。',
  },
  o1: {
    id: 'o1', name: 'ハンバーグ', category: 'other', cookingMinutes: 30, calories: 380,
    shopping: [{ name: '合いびき肉', amount: '400g' }, { name: '玉ねぎ', amount: '1個' }, { name: '卵', amount: '1個' }],
    steps: ['玉ねぎをみじん切りにして炒めて冷ます', 'ひき肉・卵・パン粉・牛乳・塩こしょうと混ぜてこねる', '成形してフライパンで両面焼き・蓋をして5分蒸し焼き'],
    tip: '多めに作って冷凍しておくと便利。',
  },
  o2: {
    id: 'o2', name: '豆腐ハンバーグ', category: 'other', cookingMinutes: 25, calories: 280,
    shopping: [{ name: '合いびき肉', amount: '300g' }, { name: '絹豆腐', amount: '1丁' }, { name: '玉ねぎ', amount: '1個' }, { name: '卵', amount: '1個' }],
    steps: ['豆腐を水切りしてひき肉・玉ねぎ・卵と混ぜる', '成形してフライパンで両面焼く', '醤油・みりんのタレをかける'],
    tip: '豆腐入りでやわらかく高齢者にも食べやすい。',
  },
  o3: {
    id: 'o3', name: 'カレーライス', category: 'other', cookingMinutes: 30, calories: 500,
    shopping: [{ name: '鶏もも肉', amount: '350g' }, { name: 'じゃがいも', amount: '3個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '2個' }, { name: 'カレールー', amount: '1箱' }],
    steps: ['野菜と鶏肉を切って炒める', '水を加えて野菜がやわらかくなるまで煮る', 'ルーを加えて10分煮込む'],
    tip: '多めに作ると翌日も食べられる。子どもに大人気。',
  },
  o4: {
    id: 'o4', name: 'シチュー', category: 'other', cookingMinutes: 30, calories: 380,
    shopping: [{ name: '鶏もも肉', amount: '350g' }, { name: 'じゃがいも', amount: '3個' }, { name: 'にんじん', amount: '1本' }, { name: '玉ねぎ', amount: '1個' }, { name: 'シチュールー', amount: '1箱' }],
    steps: ['野菜と鶏肉を一口大に切る', '炒めてから水で15分煮る', 'ルーと牛乳を加えて5分煮る'],
    tip: '野菜がやわらかく高齢者にも食べやすい。',
  },
};

// ─── 副菜 ─────────────────────────────────────────────────────────────────────

export const SIDES: Record<string, Side> = {
  s1: {
    id: 's1', name: 'ほうれん草のおひたし', category: 'vegetable', calories: 30,
    shopping: [{ name: 'ほうれん草', amount: '1束' }],
    steps: ['ほうれん草を塩茹でして冷水にとる', '水気を絞って3cm幅に切る', '醤油・だしをかけて白ごまを振る'],
  },
  s2: {
    id: 's2', name: 'ブロッコリーのごまあえ', category: 'vegetable', calories: 45,
    shopping: [{ name: 'ブロッコリー', amount: '1株' }],
    steps: ['ブロッコリーを小房に分けて茹でる', '水気を切る', '醤油・砂糖・白ごまで和える'],
  },
  s3: {
    id: 's3', name: 'きんぴらごぼう', category: 'vegetable', calories: 80,
    shopping: [{ name: 'ごぼう', amount: '1本' }, { name: 'にんじん', amount: '1/2本' }],
    steps: ['ごぼうとにんじんを細切りにする', 'ごま油で炒める', '醤油・みりん・砂糖で味付けして白ごまを振る'],
  },
  s4: {
    id: 's4', name: 'ひじきの煮物', category: 'seaweed', calories: 60,
    shopping: [{ name: 'ひじき（乾燥）', amount: '30g' }, { name: '油揚げ', amount: '1枚' }, { name: 'にんじん', amount: '1/2本' }],
    steps: ['ひじきを水で戻す', 'にんじん・油揚げと一緒に炒める', 'だし・醤油・みりん・砂糖で煮含める'],
  },
  s5: {
    id: 's5', name: 'かぼちゃの煮物', category: 'vegetable', calories: 90,
    shopping: [{ name: 'かぼちゃ', amount: '1/4個' }],
    steps: ['かぼちゃを一口大に切る', 'だし・醤油・みりん・砂糖を合わせて煮立てる', 'やわらかくなるまで15分煮る'],
  },
  s6: {
    id: 's6', name: '小松菜の炒め物', category: 'vegetable', calories: 35,
    shopping: [{ name: '小松菜', amount: '1束' }],
    steps: ['小松菜を3cm幅に切る', 'ごま油で茎から炒める', '醤油・酒で味付けして白ごまを振る'],
  },
  s7: {
    id: 's7', name: 'もやしのナムル', category: 'vegetable', calories: 30,
    shopping: [{ name: 'もやし', amount: '1袋' }],
    steps: ['もやしをさっと茹でて水気を絞る', 'ごま油・醤油・塩こしょうで和える', '白ごまを振る'],
  },
  s8: {
    id: 's8', name: '大根のそぼろ煮', category: 'vegetable', calories: 85,
    shopping: [{ name: 'だいこん', amount: '1/3本' }, { name: '豚ひき肉', amount: '100g' }],
    steps: ['大根を2cm幅に切って下茹でする', 'ひき肉を炒めて大根を加える', 'だし・醤油・みりん・砂糖で10分煮る'],
  },
  s9: {
    id: 's9', name: 'アスパラのバターソテー', category: 'vegetable', calories: 50,
    shopping: [{ name: 'アスパラ', amount: '1束' }],
    steps: ['アスパラを斜め切りにする', 'バターで炒める', '塩こしょうで味付けする'],
  },
  s10: {
    id: 's10', name: '卵焼き', category: 'other', calories: 90,
    shopping: [{ name: '卵', amount: '3個' }],
    steps: ['卵・だし・醤油・砂糖を混ぜる', '卵焼き器に油をひいて3回に分けて巻く', '冷ましてから切る'],
  },
};

// ─── 汁物 ─────────────────────────────────────────────────────────────────────

export const SOUPS: Record<string, Soup> = {
  sp1: {
    id: 'sp1', name: '野菜の味噌汁', category: 'miso', calories: 40,
    shopping: [{ name: 'わかめ（乾燥）', amount: '5g' }, { name: '豆腐', amount: '1/2丁' }],
    steps: ['だしを沸かして豆腐・わかめを入れる', '味噌を溶かし入れる', '沸騰させないように注意'],
  },
  sp2: {
    id: 'sp2', name: 'なめこの味噌汁', category: 'miso', calories: 35,
    shopping: [{ name: 'なめこ', amount: '1袋' }, { name: '豆腐', amount: '1/2丁' }],
    steps: ['だしを沸かしてなめこ・豆腐を入れる', '味噌を溶かし入れる', 'ねぎを散らす'],
  },
  sp3: {
    id: 'sp3', name: 'かき玉汁', category: 'clear', calories: 50,
    shopping: [{ name: '卵', amount: '2個' }, { name: 'ねぎ', amount: '1/2本' }],
    steps: ['だしを沸かして醤油・塩で味付け', '溶き卵を細く流し入れてかき混ぜる', 'ねぎを散らす'],
  },
  sp4: {
    id: 'sp4', name: 'コーンスープ', category: 'western', calories: 80,
    shopping: [{ name: 'コーン缶', amount: '1缶' }],
    steps: ['コーン缶・牛乳・水をミキサーにかける', '鍋で温める', '塩こしょうで味付け'],
  },
  sp5: {
    id: 'sp5', name: 'トマトスープ', category: 'western', calories: 55,
    shopping: [{ name: 'トマト缶', amount: '1缶' }, { name: '玉ねぎ', amount: '1/2個' }],
    steps: ['玉ねぎを炒めてトマト缶・水を加える', '10分煮てコンソメで味付け', '塩こしょうで調整'],
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
    { main: 'f1', sides: ['s1', 's4'], soup: 'sp1' },          // 月
    { main: 'c1', sides: ['s2', 's10'] },                        // 火
    { main: 'p1', sides: ['s3', 's7'], soup: 'sp3' },           // 水
    { main: 'b1', sides: ['s5'] },                                // 木
    { main: 'e1', sides: ['s6', 's2'], soup: 'sp2', fruit: 'fr1' }, // 金
  ],
  // 第2週
  [
    { main: 'f2', sides: ['s8', 's7'], soup: 'sp1' },           // 月
    { main: 'c2', sides: ['s1', 's10'] },                        // 火
    { main: 'p2', sides: ['s9'], soup: 'sp3' },                  // 水
    { main: 'b2', sides: ['s4', 's6'] },                         // 木
    { main: 'e2', sides: ['s2', 's10'], soup: 'sp2', fruit: 'fr2' }, // 金
  ],
  // 第3週
  [
    { main: 'f3', sides: ['s5', 's7'], soup: 'sp4' },           // 月
    { main: 'c3', sides: ['s1'] },                               // 火
    { main: 'p3', sides: ['s10', 's6'], soup: 'sp1' },          // 水
    { main: 'o1', sides: ['s9', 's2'] },                         // 木
    { main: 'e3', sides: ['s3'], soup: 'sp5', fruit: 'fr5' },   // 金
  ],
  // 第4週
  [
    { main: 'f5', sides: ['s8', 's10'], soup: 'sp2' },          // 月
    { main: 'c4', sides: ['s2', 's7'] },                         // 火
    { main: 'p4', sides: ['s5', 's1'], soup: 'sp3' },           // 水
    { main: 'o3', sides: ['s6'] },                               // 木
    { main: 'o2', sides: ['s4', 's9'], soup: 'sp1', fruit: 'fr1' }, // 金
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
