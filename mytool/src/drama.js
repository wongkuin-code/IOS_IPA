// 短剧改编书单 —— 从古腾堡公共版权书目中精选适合短剧化的作品
// 按短剧主流题材分类：仙侠神话 / 古装权谋 / 武侠公案 / 深宅宫斗 / 才子佳人 / 近代都市 / 志怪悬疑 / 世情百态
// 每本附细分类标签（t），对应短剧爆款套路：强冲突 / 大女主 / 打脸爽点 / 甜宠 / 虐恋 / 权谋 / 悬疑 / 志怪

export const DRAMA_GENRES = {
  xianxia:   { label: '仙侠神话', color: '#7c5cff', desc: '神魔传奇 · 仙法大战' },
  quanmou:   { label: '古装权谋', color: '#c0392b', desc: '乱世争霸 · 君臣博弈' },
  wuxia:     { label: '武侠公案', color: '#2e86c1', desc: '侠客行义 · 探案洗冤' },
  zhaidou:   { label: '深宅宫斗', color: '#8e44ad', desc: '宅门恩怨 · 宫闱争宠' },
  tianchong: { label: '才子佳人', color: '#e67e22', desc: '欢喜冤家 · 甜宠虐恋' },
  dushi:     { label: '近代都市', color: '#16a085', desc: '市井奋斗 · 人心冷暖' },
  xuanyi:    { label: '志怪悬疑', color: '#34495e', desc: '鬼狐奇谈 · 悬案追凶' },
  shiqing:   { label: '世情百态', color: '#b7950b', desc: '人情冷暖 · 众生百相' },
};

export const GENRE_KEYS = Object.keys(DRAMA_GENRES);

// 细分类标签：短剧爆款套路
export const TROPES = {
  conflict: { label: '强冲突', emoji: '⚔️' },
  heroine:  { label: '大女主', emoji: '👸' },
  faceslap: { label: '打脸爽点', emoji: '😤' },
  sweet:    { label: '甜宠', emoji: '🍬' },
  angst:    { label: '虐恋', emoji: '💔' },
  scheming: { label: '权谋', emoji: '♟️' },
  mystery:  { label: '悬疑', emoji: '🕵️' },
  myth:     { label: '志怪', emoji: '👻' },
};

export const TROPE_KEYS = Object.keys(TROPES);

// bookId -> { g: 主分类, note: 短剧看点, t: 细分类标签[] }
export const DRAMA_BOOKS = {
  // ── 仙侠神话 ──
  23962:  { g: 'xianxia',   note: '大圣IP王者 · 降妖打怪单元剧', t: ['conflict', 'faceslap'] },
  54784:  { g: 'xianxia',   note: '取经起源 · 唐僧前传', t: ['conflict'] },
  23910:  { g: 'xianxia',   note: '封神大战 · 神仙打架天花板', t: ['conflict', 'scheming'] },
  57227:  { g: 'xianxia',   note: '妖狐作乱 · 天书平妖', t: ['conflict', 'myth'] },
  25248:  { g: 'xianxia',   note: '妖狐作乱 · 天书平妖', t: ['conflict', 'myth'] },
  25377:  { g: 'xianxia',   note: '才女航海 · 海外奇国历险', t: ['heroine', 'conflict'] },
  23818:  { g: 'xianxia',   note: '才女航海 · 海外奇国历险', t: ['heroine', 'conflict'] },
  27332:  { g: 'xianxia',   note: '西游后传 · 师徒再上路', t: ['conflict', 'myth'] },
  25288:  { g: 'xianxia',   note: '上古神话 · 恐怖/奇幻素材库', t: ['myth', 'conflict'] },
  25362:  { g: 'xianxia',   note: '神仙鬼怪 · 志怪大汇集', t: ['myth'] },
  7260:   { g: 'xianxia',   note: '神仙鬼怪 · 志怪大汇集', t: ['myth'] },
  7266:   { g: 'xianxia',   note: '干将莫邪等 · 复仇奇谭', t: ['conflict', 'faceslap'] },
  25414:  { g: 'xianxia',   note: '成仙列传 · 凡人飞升', t: ['faceslap', 'conflict'] },
  52278:  { g: 'xianxia',   note: '幽冥鬼神 · 阴阳两界', t: ['myth', 'conflict'] },
  54777:  { g: 'xianxia',   note: '妈祖成神 · 护海传奇', t: ['heroine', 'conflict'] },
  24058:  { g: 'xianxia',   note: '周穆王西行 · 见西王母', t: ['myth', 'conflict'] },
  52271:  { g: 'xianxia',   note: '汉武帝仙游 · 洞冥奇谈', t: ['myth'] },
  56202:  { g: 'xianxia',   note: '上古异闻 · 神话拾遗', t: ['myth'] },
  52238:  { g: 'xianxia',   note: '黄粱一梦 · 穿越预演', t: ['faceslap'] },
  27171:  { g: 'xianxia',   note: '鬼谷四友 · 战国谋仙局', t: ['scheming', 'conflict'] },

  // ── 古装权谋 ──
  23950:  { g: 'quanmou',   note: '群像权谋 · 三国混战', t: ['scheming', 'conflict'] },
  25606:  { g: 'quanmou',   note: '正史剪辑 · 争霸爽点密', t: ['scheming', 'faceslap'] },
  23835:  { g: 'quanmou',   note: '隋唐英雄传 · 好汉云集', t: ['conflict', 'faceslap'] },
  23824:  { g: 'quanmou',   note: '瓦岗群雄 · 王朝更迭', t: ['conflict', 'scheming'] },
  25349:  { g: 'quanmou',   note: '列国争霸 · 权谋素材库', t: ['scheming', 'conflict'] },
  23838:  { g: 'quanmou',   note: '杨家满门忠烈 · 血战金沙滩', t: ['conflict', 'heroine'] },
  27082:  { g: 'quanmou',   note: '杨家满门忠烈 · 血战金沙滩', t: ['conflict', 'heroine'] },
  23842:  { g: 'quanmou',   note: '杨家满门忠烈 · 血战金沙滩', t: ['conflict', 'heroine'] },
  27145:  { g: 'quanmou',   note: '五代十国 · 乱世群雄', t: ['conflict', 'scheming'] },
  23863:  { g: 'quanmou',   note: '替天行道 · 江湖草莽逆袭', t: ['conflict', 'faceslap'] },
  25217:  { g: 'quanmou',   note: '水浒遗志 · 余烬复燃', t: ['conflict', 'faceslap'] },
  25350:  { g: 'quanmou',   note: '水浒仇敌 · 剿寇大戏', t: ['conflict', 'faceslap'] },
  25229:  { g: 'quanmou',   note: '赵匡胤崛起 · 帝王养成', t: ['faceslap', 'scheming'] },
  4580:   { g: 'quanmou',   note: '将门后代 · 忠奸大对决', t: ['conflict', 'scheming'] },
  26871:  { g: 'quanmou',   note: '将门后代 · 忠奸大对决', t: ['conflict', 'scheming'] },
  25327:  { g: 'quanmou',   note: '侠女嫁英雄 · 江湖儿女情', t: ['heroine', 'sweet'] },
  57238:  { g: 'quanmou',   note: '寒窑苦守 · 认亲大团圆', t: ['angst', 'faceslap'] },
  23938:  { g: 'quanmou',   note: '木兰从军 · 女扮男装', t: ['heroine', 'faceslap'] },
  27218:  { g: 'quanmou',   note: '郑氏据台 · 海权博弈', t: ['scheming', 'conflict'] },

  // ── 武侠公案 ──
  25376:  { g: 'wuxia',     note: '御猫展昭 · 侠义探案', t: ['mystery', 'conflict'] },
  23825:  { g: 'wuxia',     note: '施公断案 · 拍案叫绝', t: ['mystery', 'faceslap'] },
  25393:  { g: 'wuxia',     note: '施公断案 · 拍案叫绝', t: ['mystery', 'faceslap'] },
  26970:  { g: 'wuxia',     note: '彭公缉凶 · 单元破案', t: ['mystery', 'conflict'] },
  54494:  { g: 'wuxia',     note: '海瑞断奇案 · 一身正气', t: ['mystery', 'faceslap'] },
  27686:  { g: 'wuxia',     note: '狄仁杰探案 · 神探六起', t: ['mystery', 'conflict'] },
  52280:  { g: 'wuxia',     note: '明镜高悬 · 连环公案', t: ['mystery', 'faceslap'] },
  25214:  { g: 'wuxia',     note: '剑客列传 · 江湖快意', t: ['conflict', 'faceslap'] },
  23915:  { g: 'wuxia',     note: '虬髯客 · 风尘三侠', t: ['heroine', 'conflict'] },

  // ── 深宅宫斗 ──
  24264:  { g: 'zhaidou',   note: '金陵十二钗 · 宅斗鼻祖', t: ['heroine', 'angst'] },
  25202:  { g: 'zhaidou',   note: '红楼续篇 · 镜花重照', t: ['heroine', 'angst'] },
  52200:  { g: 'zhaidou',   note: '西门庆世家簿 · 需谨慎改编', t: ['angst', 'scheming'] },
  25348:  { g: 'zhaidou',   note: '昭君出塞 · 宫闱争宠', t: ['heroine', 'angst'] },
  52199:  { g: 'zhaidou',   note: '汉宫恩怨 · 昭君之殇', t: ['heroine', 'angst'] },

  // ── 才子佳人 ──
  23877:  { g: 'tianchong', note: '才子夺魁 · 双美择婿', t: ['sweet', 'faceslap'] },
  24224:  { g: 'tianchong', note: '神童cp · 互相成全', t: ['sweet'] },
  27414:  { g: 'tianchong', note: '多情才子 · 贞烈佳人', t: ['sweet', 'angst'] },
  24422:  { g: 'tianchong', note: '一见钟情 · 万人阻挠', t: ['sweet', 'conflict'] },
  27105:  { g: 'tianchong', note: '定情信物 · 失联相思', t: ['sweet', 'angst'] },
  27107:  { g: 'tianchong', note: '才女历劫 · 姐弟情深', t: ['heroine', 'sweet'] },
  25649:  { g: 'tianchong', note: '月老牵线 · 珠联璧合', t: ['sweet'] },
  25137:  { g: 'tianchong', note: '仙缘赠玉 · 招亲风波', t: ['sweet', 'faceslap'] },
  26922:  { g: 'tianchong', note: '替身入府 · 假戏真做', t: ['heroine', 'faceslap'] },
  27328:  { g: 'tianchong', note: '后花园幽会 · 私奔成亲', t: ['sweet', 'conflict'] },
  25422:  { g: 'tianchong', note: '千金易主 · 阴差阳错', t: ['heroine', 'faceslap'] },
  27734:  { g: 'tianchong', note: '合浦珠还 · 破镜重圆', t: ['sweet', 'angst'] },
  26738:  { g: 'tianchong', note: '画像结缘 · 帮助成婚', t: ['sweet'] },
  25250:  { g: 'tianchong', note: '回文锦书 · 智破奸谋', t: ['heroine', 'scheming'] },
  25146:  { g: 'tianchong', note: '山盟海誓 · 生死相许', t: ['angst', 'sweet'] },
  23908:  { g: 'tianchong', note: '三生石上 · 梦中姻缘', t: ['sweet', 'angst'] },
  23906:  { g: 'tianchong', note: '西厢定情 · 崔莺待月', t: ['sweet', 'faceslap'] },
  23849:  { g: 'tianchong', note: '还魂重生 · 至死不渝', t: ['angst', 'myth'] },
  25246:  { g: 'tianchong', note: '糟糠之妻 · 忠贞不二', t: ['heroine', 'angst'] },
  26737:  { g: 'tianchong', note: '落难小姐 · 患难真情', t: ['heroine', 'sweet'] },
  52270:  { g: 'tianchong', note: '帝妃虐恋 · 长恨一曲', t: ['angst', 'heroine'] },
  24234:  { g: 'tianchong', note: '国破家亡 · 悲情名士', t: ['angst', 'conflict'] },
  52267:  { g: 'tianchong', note: '始乱终弃 · 千古渣男账', t: ['angst', 'heroine'] },
  24051:  { g: 'tianchong', note: '名妓从良 · 花魁逆袭', t: ['heroine', 'faceslap'] },
  52275:  { g: 'tianchong', note: '婆媳大战 · 孔雀东南飞', t: ['angst', 'conflict'] },
  27217:  { g: 'tianchong', note: '牛郎织女 · 银河之恋', t: ['sweet', 'angst'] },
  24185:  { g: 'tianchong', note: '戏班双壁 · 以戏为媒', t: ['sweet', 'faceslap'] },
  27119:  { g: 'tianchong', note: '戏班双壁 · 以戏为媒', t: ['sweet', 'faceslap'] },
  27059:  { g: 'tianchong', note: '双宿双飞 · 鸳鸯情梦', t: ['sweet'] },
  27185:  { g: 'tianchong', note: '女扮男装 · 姐妹情深', t: ['heroine', 'sweet'] },
  25329:  { g: 'tianchong', note: '双双落难 · 终成眷属', t: ['sweet', 'angst'] },
  27023:  { g: 'tianchong', note: '世家奇缘 · 白圭定情', t: ['sweet', 'scheming'] },
  27060:  { g: 'tianchong', note: '红楼式情缘 · 少年风流', t: ['sweet', 'angst'] },

  // ── 近代都市 ──
  24099:  { g: 'dushi',     note: '晚清顶流 · 商战现形', t: ['faceslap', 'scheming'] },
  24138:  { g: 'dushi',     note: '官场现形 · 讽刺神剧', t: ['faceslap', 'scheming'] },
  54756:  { g: 'dushi',     note: '官场现形 · 讽刺神剧', t: ['faceslap', 'scheming'] },
  24139:  { g: 'dushi',     note: '官场现形 · 讽刺神剧', t: ['faceslap', 'scheming'] },
  25128:  { g: 'dushi',     note: '状元堕世 · 官商两茫茫', t: ['angst', 'faceslap'] },
  24079:  { g: 'dushi',     note: '商场如战场 · 生意人图鉴', t: ['faceslap', 'scheming'] },
  25379:  { g: 'dushi',     note: '新潮学洋 · 笑闹百出', t: ['sweet', 'faceslap'] },
  25226:  { g: 'dushi',     note: '纨绔败家 · 潦倒众生', t: ['faceslap'] },
  27302:  { g: 'dushi',     note: '民国留学生 · 家国浮沉', t: ['angst', 'conflict'] },
  23850:  { g: 'dushi',     note: '老残游历 · 官场黑幕', t: ['mystery', 'faceslap'] },
  25124:  { g: 'dushi',     note: '老残游历 · 官场黑幕', t: ['mystery', 'faceslap'] },
  56291:  { g: 'dushi',     note: '老残续篇 · 侠隐情缘', t: ['sweet', 'conflict'] },
  23865:  { g: 'dushi',     note: '庚子国难 · 生死两隔', t: ['angst', 'conflict'] },
  24227:  { g: 'dushi',     note: '观念冲突 · 民国虐恋', t: ['angst', 'conflict'] },
  27636:  { g: 'dushi',     note: '情欲暗涌 · 自我觉醒', t: ['angst', 'heroine'] },
  26872:  { g: 'dushi',     note: '海上名媛 · 纸醉金迷', t: ['heroine', 'faceslap'] },
  25187:  { g: 'dushi',     note: '青楼奇缘 · 痴情错付', t: ['angst', 'heroine'] },
  25219:  { g: 'dushi',     note: '青楼奇缘 · 痴情错付', t: ['angst', 'heroine'] },
  25521:  { g: 'dushi',     note: '艳情哀歌 · 芳华早逝', t: ['angst'] },
  24029:  { g: 'dushi',     note: '冷眼旁观 · 二十年间', t: ['faceslap'] },
  27768:  { g: 'dushi',     note: '骗局连环 · 江湖套路深', t: ['faceslap', 'mystery'] },
  23827:  { g: 'dushi',     note: '糊涂世界 · 笑中带泪', t: ['faceslap'] },
  27166:  { g: 'dushi',     note: '鲁迅呐喊 · 觉醒年代', t: ['conflict', 'faceslap'] },
  24042:  { g: 'dushi',     note: '彷徨之痛 · 时代之伤', t: ['angst', 'conflict'] },
  25332:  { g: 'dushi',     note: '阿Q精神 · 国民性神作', t: ['faceslap'] },
  25260:  { g: 'dushi',     note: '丰收之年 · 农民悲歌', t: ['angst', 'faceslap'] },
  23983:  { g: 'dushi',     note: '情僧断鸿 · 余生漂泊', t: ['angst'] },

  // ── 志怪悬疑 ──
  51828:  { g: 'xuanyi',    note: '狐仙鬼魅 · 单元奇谭', t: ['myth', 'conflict'] },
  25245:  { g: 'xuanyi',    note: '鬼故事汇 · 细思极恐', t: ['myth', 'mystery'] },
  25315:  { g: 'xuanyi',    note: '志怪续篇 · 夜谈奇闻', t: ['myth'] },
  25130:  { g: 'xuanyi',    note: '夜雨秋灯 · 人鬼情未了', t: ['myth', 'angst'] },
  23817:  { g: 'xuanyi',    note: '狐鬼报应 · 因果循环', t: ['myth', 'faceslap'] },
  23867:  { g: 'xuanyi',    note: '钟馗斩鬼 · 斩尽奸邪', t: ['conflict', 'faceslap'] },
  27216:  { g: 'xuanyi',    note: '钟馗斩鬼 · 斩尽奸邪', t: ['conflict', 'faceslap'] },
  27329:  { g: 'xuanyi',    note: '钟馗平鬼 · 大乱斗', t: ['conflict', 'faceslap'] },
  27459:  { g: 'xuanyi',    note: '耳食怪谭 · 人心即鬼', t: ['myth', 'mystery'] },
  27092:  { g: 'xuanyi',    note: '怪事集锦 · 荒诞离奇', t: ['myth', 'mystery'] },
  26997:  { g: 'xuanyi',    note: '朝野怪闻 · 唐朝热搜', t: ['myth', 'mystery'] },
  27172:  { g: 'xuanyi',    note: '庚巳异志 · 鬼影幢幢', t: ['myth', 'mystery'] },
  25375:  { g: 'xuanyi',    note: '谐谑鬼话 · 笑中藏刀', t: ['myth', 'faceslap'] },
  24327:  { g: 'xuanyi',    note: '鬼域奇书 · 死者开口', t: ['myth', 'mystery'] },
  25323:  { g: 'xuanyi',    note: '狐媚报恩 · 痴情孽缘', t: ['myth', 'sweet'] },
  23951:  { g: 'xuanyi',    note: '汉宫秘闻 · 怪谈集锦', t: ['myth', 'mystery'] },
  25368:  { g: 'xuanyi',    note: '西京旧事 · 鬼怪丛生', t: ['myth', 'mystery'] },
  24113:  { g: 'xuanyi',    note: '灭门案 · 追凶二十年', t: ['mystery', 'conflict'] },
  25402:  { g: 'xuanyi',    note: '灭门案 · 追凶二十年', t: ['mystery', 'conflict'] },
  52276:  { g: 'xuanyi',    note: '冤狱血案 · 六月飞雪', t: ['mystery', 'faceslap'] },
  27415:  { g: 'xuanyi',    note: '杀子奇案 · 官场畏罪', t: ['mystery', 'conflict'] },

  // ── 世情百态 ──
  24141:  { g: 'shiqing',   note: '三言之一 · 故事会天花板', t: ['faceslap', 'sweet'] },
  27582:  { g: 'shiqing',   note: '三言之二 · 人情练达', t: ['faceslap', 'scheming'] },
  24239:  { g: 'shiqing',   note: '三言之三 · 悲欢离合', t: ['angst', 'sweet'] },
  24230:  { g: 'shiqing',   note: '古今奇观 · 四十个爽点', t: ['faceslap', 'mystery'] },
  57248:  { g: 'shiqing',   note: '拍案惊奇 · 反转不断', t: ['faceslap', 'mystery'] },
  24162:  { g: 'shiqing',   note: '二刻拍案 · 奇巧轶事', t: ['faceslap', 'mystery'] },
  26729:  { g: 'shiqing',   note: '二刻拍案 · 奇巧轶事', t: ['faceslap', 'mystery'] },
  25392:  { g: 'shiqing',   note: '西湖民间 · 前世今生', t: ['sweet', 'myth'] },
  24273:  { g: 'shiqing',   note: '西湖佳话 · 才子传说', t: ['sweet', 'faceslap'] },
  25399:  { g: 'shiqing',   note: '点头醒世 · 市井寓言', t: ['faceslap'] },
  25328:  { g: 'shiqing',   note: '豆棚闲话 · 说书人夜话', t: ['faceslap', 'mystery'] },
  23907:  { g: 'shiqing',   note: '无声戏 · 巧设机关', t: ['faceslap', 'scheming'] },
  24225:  { g: 'shiqing',   note: '戏中戏 · 假戏真做', t: ['sweet', 'faceslap'] },
  24027:  { g: 'shiqing',   note: '醉醒石 · 劝世奇谭', t: ['faceslap', 'myth'] },
  24032:  { g: 'shiqing',   note: '儒林讽世 · 读书人百态', t: ['faceslap', 'scheming'] },
};

// 🔥 已拍短剧且爆火的经典 IP（VIP 解锁热榜）
export const HOT_RANK = [
  23962, // 西游记
  24264, // 红楼梦
  23950, // 三国演义
  23863, // 水浒传
  23910, // 封神演义
  51828, // 聊斋志异
  23835, // 隋唐演义
  25376, // 三侠五义
  24032, // 儒林外史
  25377, // 镜花缘
  25349, // 东周列国志
  23825, // 施公案
];

export function isHit(id) {
  return HOT_RANK.includes(Number(id));
}

// 每个分类的书目数量（用于分类筛选显示）
export const GENRE_COUNTS = Object.fromEntries(
  GENRE_KEYS.map(k => [k, 0]),
);
for (const t of Object.values(DRAMA_BOOKS)) GENRE_COUNTS[t.g]++;

// 每个细分类标签的书目数量（用于细分类筛选显示）
export const TROPE_COUNTS = Object.fromEntries(
  TROPE_KEYS.map(k => [k, 0]),
);
for (const t of Object.values(DRAMA_BOOKS)) {
  for (const k of t.t || []) TROPE_COUNTS[k]++;
}

export function tagOf(id) {
  const t = DRAMA_BOOKS[Number(id)];
  return t ? { g: t.g, note: t.note, t: t.t || [] } : null;
}
