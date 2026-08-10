// 短剧改编书单 —— 从古腾堡公共版权书目中精选适合短剧化的作品
// 按短剧主流题材分类：仙侠神话 / 古装权谋 / 武侠公案 / 深宅宫斗 / 才子佳人 / 近代都市 / 志怪悬疑 / 世情百态

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

// bookId -> { g: 主分类, note: 短剧看点 }
export const DRAMA_BOOKS = {
  // ── 仙侠神话 ──
  23962:  { g: 'xianxia',   note: '大圣IP王者 · 降妖打怪单元剧' },
  54784:  { g: 'xianxia',   note: '取经起源 · 唐僧前传' },
  23910:  { g: 'xianxia',   note: '封神大战 · 神仙打架天花板' },
  57227:  { g: 'xianxia',   note: '妖狐作乱 · 天书平妖' },
  25248:  { g: 'xianxia',   note: '妖狐作乱 · 天书平妖' },
  25377:  { g: 'xianxia',   note: '才女航海 · 海外奇国历险' },
  23818:  { g: 'xianxia',   note: '才女航海 · 海外奇国历险' },
  27332:  { g: 'xianxia',   note: '西游后传 · 师徒再上路' },
  25288:  { g: 'xianxia',   note: '上古神话 · 恐怖/奇幻素材库' },
  25362:  { g: 'xianxia',   note: '神仙鬼怪 · 志怪大汇集' },
  7260:   { g: 'xianxia',   note: '神仙鬼怪 · 志怪大汇集' },
  7266:   { g: 'xianxia',   note: '干将莫邪等 · 复仇奇谭' },
  25414:  { g: 'xianxia',   note: '成仙列传 · 凡人飞升' },
  52278:  { g: 'xianxia',   note: '幽冥鬼神 · 阴阳两界' },
  54777:  { g: 'xianxia',   note: '妈祖成神 · 护海传奇' },
  24058:  { g: 'xianxia',   note: '周穆王西行 · 见西王母' },
  52271:  { g: 'xianxia',   note: '汉武帝仙游 · 洞冥奇谈' },
  56202:  { g: 'xianxia',   note: '上古异闻 · 神话拾遗' },
  52238:  { g: 'xianxia',   note: '黄粱一梦 · 穿越预演' },
  27171:  { g: 'xianxia',   note: '鬼谷四友 · 战国谋仙局' },

  // ── 古装权谋 ──
  23950:  { g: 'quanmou',   note: '群像权谋 · 三国混战' },
  25606:  { g: 'quanmou',   note: '正史剪辑 · 争霸爽点密' },
  23835:  { g: 'quanmou',   note: '隋唐英雄传 · 好汉云集' },
  23824:  { g: 'quanmou',   note: '瓦岗群雄 · 王朝更迭' },
  25349:  { g: 'quanmou',   note: '列国争霸 · 权谋素材库' },
  23838:  { g: 'quanmou',   note: '杨家满门忠烈 · 血战金沙滩' },
  27082:  { g: 'quanmou',   note: '杨家满门忠烈 · 血战金沙滩' },
  23842:  { g: 'quanmou',   note: '杨家满门忠烈 · 血战金沙滩' },
  27145:  { g: 'quanmou',   note: '五代十国 · 乱世群雄' },
  23863:  { g: 'quanmou',   note: '替天行道 · 江湖草莽逆袭' },
  25217:  { g: 'quanmou',   note: '水浒遗志 · 余烬复燃' },
  25350:  { g: 'quanmou',   note: '水浒仇敌 · 剿寇大戏' },
  25229:  { g: 'quanmou',   note: '赵匡胤崛起 · 帝王养成' },
  4580:   { g: 'quanmou',   note: '将门后代 · 忠奸大对决' },
  26871:  { g: 'quanmou',   note: '将门后代 · 忠奸大对决' },
  25327:  { g: 'quanmou',   note: '侠女嫁英雄 · 江湖儿女情' },
  57238:  { g: 'quanmou',   note: '寒窑苦守 · 认亲大团圆' },
  23938:  { g: 'quanmou',   note: '木兰从军 · 女扮男装' },
  27218:  { g: 'quanmou',   note: '郑氏据台 · 海权博弈' },

  // ── 武侠公案 ──
  25376:  { g: 'wuxia',     note: '御猫展昭 · 侠义探案' },
  23825:  { g: 'wuxia',     note: '施公断案 · 拍案叫绝' },
  25393:  { g: 'wuxia',     note: '施公断案 · 拍案叫绝' },
  26970:  { g: 'wuxia',     note: '彭公缉凶 · 单元破案' },
  54494:  { g: 'wuxia',     note: '海瑞断奇案 · 一身正气' },
  27686:  { g: 'wuxia',     note: '狄仁杰探案 · 神探六起' },
  52280:  { g: 'wuxia',     note: '明镜高悬 · 连环公案' },
  25214:  { g: 'wuxia',     note: '剑客列传 · 江湖快意' },
  23915:  { g: 'wuxia',     note: '虬髯客 · 风尘三侠' },

  // ── 深宅宫斗 ──
  24264:  { g: 'zhaidou',   note: '金陵十二钗 · 宅斗鼻祖' },
  25202:  { g: 'zhaidou',   note: '红楼续篇 · 镜花重照' },
  52200:  { g: 'zhaidou',   note: '西门庆世家簿 · 需谨慎改编' },
  25348:  { g: 'zhaidou',   note: '昭君出塞 · 宫闱争宠' },
  52199:  { g: 'zhaidou',   note: '汉宫恩怨 · 昭君之殇' },

  // ── 才子佳人 ──
  23877:  { g: 'tianchong', note: '才子夺魁 · 双美择婿' },
  24224:  { g: 'tianchong', note: '神童cp · 互相成全' },
  27414:  { g: 'tianchong', note: '多情才子 · 贞烈佳人' },
  24422:  { g: 'tianchong', note: '一见钟情 · 万人阻挠' },
  27105:  { g: 'tianchong', note: '定情信物 · 失联相思' },
  27107:  { g: 'tianchong', note: '才女历劫 · 姐弟情深' },
  25649:  { g: 'tianchong', note: '月老牵线 · 珠联璧合' },
  25137:  { g: 'tianchong', note: '仙缘赠玉 · 招亲风波' },
  26922:  { g: 'tianchong', note: '替身入府 · 假戏真做' },
  27328:  { g: 'tianchong', note: '后花园幽会 · 私奔成亲' },
  25422:  { g: 'tianchong', note: '千金易主 · 阴差阳错' },
  27734:  { g: 'tianchong', note: '合浦珠还 · 破镜重圆' },
  26738:  { g: 'tianchong', note: '画像结缘 · 帮助成婚' },
  25250:  { g: 'tianchong', note: '回文锦书 · 智破奸谋' },
  25146:  { g: 'tianchong', note: '山盟海誓 · 生死相许' },
  23908:  { g: 'tianchong', note: '三生石上 · 梦中姻缘' },
  23906:  { g: 'tianchong', note: '西厢定情 · 崔莺待月' },
  23849:  { g: 'tianchong', note: '还魂重生 · 至死不渝' },
  25246:  { g: 'tianchong', note: '糟糠之妻 · 忠贞不二' },
  26737:  { g: 'tianchong', note: '落难小姐 · 患难真情' },
  52270:  { g: 'tianchong', note: '帝妃虐恋 · 长恨一曲' },
  24234:  { g: 'tianchong', note: '国破家亡 · 悲情名士' },
  52267:  { g: 'tianchong', note: '始乱终弃 · 千古渣男账' },
  24051:  { g: 'tianchong', note: '名妓从良 · 花魁逆袭' },
  52275:  { g: 'tianchong', note: '婆媳大战 · 孔雀东南飞' },
  27217:  { g: 'tianchong', note: '牛郎织女 · 银河之恋' },
  24185:  { g: 'tianchong', note: '戏班双壁 · 以戏为媒' },
  27119:  { g: 'tianchong', note: '戏班双壁 · 以戏为媒' },
  27059:  { g: 'tianchong', note: '双宿双飞 · 鸳鸯情梦' },
  27185:  { g: 'tianchong', note: '女扮男装 · 姐妹情深' },
  25329:  { g: 'tianchong', note: '双双落难 · 终成眷属' },
  27023:  { g: 'tianchong', note: '世家奇缘 · 白圭定情' },
  27060:  { g: 'tianchong', note: '红楼式情缘 · 少年风流' },

  // ── 近代都市 ──
  24099:  { g: 'dushi',     note: '晚清顶流 · 商战现形' },
  24138:  { g: 'dushi',     note: '官场现形 · 讽刺神剧' },
  54756:  { g: 'dushi',     note: '官场现形 · 讽刺神剧' },
  24139:  { g: 'dushi',     note: '官场现形 · 讽刺神剧' },
  25128:  { g: 'dushi',     note: '状元堕世 · 官商两茫茫' },
  24079:  { g: 'dushi',     note: '商场如战场 · 生意人图鉴' },
  25379:  { g: 'dushi',     note: '新潮学洋 · 笑闹百出' },
  25226:  { g: 'dushi',     note: '纨绔败家 · 潦倒众生' },
  27302:  { g: 'dushi',     note: '民国留学生 · 家国浮沉' },
  23850:  { g: 'dushi',     note: '老残游历 · 官场黑幕' },
  25124:  { g: 'dushi',     note: '老残游历 · 官场黑幕' },
  56291:  { g: 'dushi',     note: '老残续篇 · 侠隐情缘' },
  23865:  { g: 'dushi',     note: '庚子国难 · 生死两隔' },
  24227:  { g: 'dushi',     note: '观念冲突 · 民国虐恋' },
  27636:  { g: 'dushi',     note: '情欲暗涌 · 自我觉醒' },
  26872:  { g: 'dushi',     note: '海上名媛 · 纸醉金迷' },
  25187:  { g: 'dushi',     note: '青楼奇缘 · 痴情错付' },
  25219:  { g: 'dushi',     note: '青楼奇缘 · 痴情错付' },
  25521:  { g: 'dushi',     note: '艳情哀歌 · 芳华早逝' },
  24029:  { g: 'dushi',     note: '冷眼旁观 · 二十年间' },
  27768:  { g: 'dushi',     note: '骗局连环 · 江湖套路深' },
  23827:  { g: 'dushi',     note: '糊涂世界 · 笑中带泪' },
  27166:  { g: 'dushi',     note: '鲁迅呐喊 · 觉醒年代' },
  24042:  { g: 'dushi',     note: '彷徨之痛 · 时代之伤' },
  25332:  { g: 'dushi',     note: '阿Q精神 · 国民性神作' },
  25260:  { g: 'dushi',     note: '丰收之年 · 农民悲歌' },
  23983:  { g: 'dushi',     note: '情僧断鸿 · 余生漂泊' },

  // ── 志怪悬疑 ──
  51828:  { g: 'xuanyi',    note: '狐仙鬼魅 · 单元奇谭' },
  25245:  { g: 'xuanyi',    note: '鬼故事汇 · 细思极恐' },
  25315:  { g: 'xuanyi',    note: '志怪续篇 · 夜谈奇闻' },
  25130:  { g: 'xuanyi',    note: '夜雨秋灯 · 人鬼情未了' },
  23817:  { g: 'xuanyi',    note: '狐鬼报应 · 因果循环' },
  23867:  { g: 'xuanyi',    note: '钟馗斩鬼 · 斩尽奸邪' },
  27216:  { g: 'xuanyi',    note: '钟馗斩鬼 · 斩尽奸邪' },
  27329:  { g: 'xuanyi',    note: '钟馗平鬼 · 大乱斗' },
  27459:  { g: 'xuanyi',    note: '耳食怪谭 · 人心即鬼' },
  27092:  { g: 'xuanyi',    note: '怪事集锦 · 荒诞离奇' },
  26997:  { g: 'xuanyi',    note: '朝野怪闻 · 唐朝热搜' },
  27172:  { g: 'xuanyi',    note: '庚巳异志 · 鬼影幢幢' },
  25375:  { g: 'xuanyi',    note: '谐谑鬼话 · 笑中藏刀' },
  24327:  { g: 'xuanyi',    note: '鬼域奇书 · 死者开口' },
  25323:  { g: 'xuanyi',    note: '狐媚报恩 · 痴情孽缘' },
  23951:  { g: 'xuanyi',    note: '汉宫秘闻 · 怪谈集锦' },
  25368:  { g: 'xuanyi',    note: '西京旧事 · 鬼怪丛生' },
  24113:  { g: 'xuanyi',    note: '灭门案 · 追凶二十年' },
  25402:  { g: 'xuanyi',    note: '灭门案 · 追凶二十年' },
  52276:  { g: 'xuanyi',    note: '冤狱血案 · 六月飞雪' },
  27415:  { g: 'xuanyi',    note: '杀子奇案 · 官场畏罪' },

  // ── 世情百态 ──
  24141:  { g: 'shiqing',   note: '三言之一 · 故事会天花板' },
  27582:  { g: 'shiqing',   note: '三言之二 · 人情练达' },
  24239:  { g: 'shiqing',   note: '三言之三 · 悲欢离合' },
  24230:  { g: 'shiqing',   note: '古今奇观 · 四十个爽点' },
  57248:  { g: 'shiqing',   note: '拍案惊奇 · 反转不断' },
  24162:  { g: 'shiqing',   note: '二刻拍案 · 奇巧轶事' },
  26729:  { g: 'shiqing',   note: '二刻拍案 · 奇巧轶事' },
  25392:  { g: 'shiqing',   note: '西湖民间 · 前世今生' },
  24273:  { g: 'shiqing',   note: '西湖佳话 · 才子传说' },
  25399:  { g: 'shiqing',   note: '点头醒世 · 市井寓言' },
  25328:  { g: 'shiqing',   note: '豆棚闲话 · 说书人夜话' },
  23907:  { g: 'shiqing',   note: '无声戏 · 巧设机关' },
  24225:  { g: 'shiqing',   note: '戏中戏 · 假戏真做' },
  24027:  { g: 'shiqing',   note: '醉醒石 · 劝世奇谭' },
  24032:  { g: 'shiqing',   note: '儒林讽世 · 读书人百态' },
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

export function tagOf(id) {
  const t = DRAMA_BOOKS[Number(id)];
  return t ? { g: t.g, note: t.note } : null;
}