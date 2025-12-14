// 简化版拼音转换库
// 仅包含常用汉字的拼音，用于儿童识字小报

// 常用汉字拼音字典（部分示例）
const PINYIN_DICT = {
    // 基础汉字
    '一': 'yī', '二': 'èr', '三': 'sān', '四': 'sì', '五': 'wǔ',
    '六': 'liù', '七': 'qī', '八': 'bā', '九': 'jiǔ', '十': 'shí',
    '人': 'rén', '口': 'kǒu', '手': 'shǒu', '足': 'zú', '目': 'mù', '耳': 'ěr',

    // 常见场景词汇
    // 超市相关
    '超': 'chāo', '市': 'shì', '货': 'huò', '架': 'jià', '商': 'shāng', '品': 'pǐn',
    '购': 'gòu', '物': 'wù', '车': 'chē', '收': 'shōu', '银': 'yín', '员': 'yuán',
    '价': 'jià', '钱': 'qián', '牛': 'niú', '奶': 'nǎi', '面': 'miàn', '包': 'bāo',
    '水': 'shuǐ', '果': 'guǒ', '蔬': 'shū', '菜': 'cài', '肉': 'ròu', '蛋': 'dàn',

    // 医院相关
    '医': 'yī', '院': 'yuàn', '生': 'shēng', '护': 'hù', '士': 'shi', '病': 'bìng',
    '房': 'fáng', '药': 'yào', '针': 'zhēn', '头': 'tóu', '痛': 'tòng', '发': 'fā',
    '烧': 'shāo', '咳': 'ké', '嗽': 'sou', '体': 'tǐ', '温': 'wēn', '计': 'jì',
    '血': 'xuè', '压': 'yā', '心': 'xīn', '电': 'diàn', '图': 'tú', '床': 'chuáng',

    // 公园相关
    '公': 'gōng', '园': 'yuán', '树': 'shù', '花': 'huā', '草': 'cǎo', '地': 'dì',
    '湖': 'hú', '河': 'hé', '桥': 'qiáo', '路': 'lù', '椅': 'yǐ', '玩': 'wán',
    '滑': 'huá', '梯': 'tī', '秋': 'qiū', '千': 'qiān', '跷': 'qiāo', '木': 'mù',
    '马': 'mǎ', '鸽': 'gē', '子': 'zi', '喷': 'pēn', '泉': 'quán', '石': 'shí',

    // 学校相关
    '学': 'xué', '校': 'xiào', '老': 'lǎo', '师': 'shī', '同': 'tóng', '学': 'xué',
    '课': 'kè', '桌': 'zhuō', '椅': 'yǐ', '黑': 'hēi', '板': 'bǎn', '粉': 'fěn',
    '笔': 'bǐ', '书': 'shū', '本': 'běn', '铅': 'qiān', '橡': 'xiàng', '皮': 'pí',
    '尺': 'chǐ', '操': 'cāo', '场': 'chǎng', '球': 'qiú', '跑': 'pǎo', '跳': 'tiào',

    // 交通工具
    '汽': 'qì', '车': 'chē', '公': 'gōng', '交': 'jiāo', '自': 'zì', '行': 'xíng',
    '车': 'chē', '火': 'huǒ', '车': 'chē', '飞': 'fēi', '机': 'jī', '船': 'chuán',
    '地': 'dì', '铁': 'tiě', '站': 'zhàn', '牌': 'pái', '灯': 'dēng', '红': 'hóng',
    '绿': 'lǜ', '黄': 'huáng', '停': 'tíng', '走': 'zǒu', '信': 'xìn', '号': 'hào',

    // 动物
    '猫': 'māo', '狗': 'gǒu', '兔': 'tù', '鸟': 'niǎo', '鱼': 'yú', '鸡': 'jī',
    '鸭': 'yā', '猪': 'zhū', '羊': 'yáng', '牛': 'niú', '马': 'mǎ', '猴': 'hóu',
    '老': 'lǎo', '虎': 'hǔ', '狮': 'shī', '子': 'zi', '大': 'dà', '象': 'xiàng',
    '熊': 'xióng', '猫': 'māo', '蛇': 'shé', '青': 'qīng', '蛙': 'wā', '蝴': 'hú',
    '蝶': 'dié', '蜜': 'mì', '蜂': 'fēng', '蚂': 'mǎ', '蚁': 'yǐ',

    // 颜色
    '红': 'hóng', '黄': 'huáng', '蓝': 'lán', '绿': 'lǜ', '白': 'bái', '黑': 'hēi',
    '紫': 'zǐ', '橙': 'chéng', '粉': 'fěn', '灰': 'huī', '棕': 'zōng', '彩': 'cǎi',
    '色': 'sè', '金': 'jīn', '银': 'yín', '铜': 'tóng', '铁': 'tiě',

    // 数字和量词
    '个': 'gè', '只': 'zhī', '条': 'tiáo', '本': 'běn', '支': 'zhī', '朵': 'duǒ',
    '张': 'zhāng', '片': 'piàn', '块': 'kuài', '瓶': 'píng', '盒': 'hé', '包': 'bāo',
    '双': 'shuāng', '对': 'duì', '套': 'tào', '群': 'qún', '队': 'duì', '排': 'pái',

    // 方位
    '上': 'shàng', '下': 'xià', '左': 'zuǒ', '右': 'yòu', '前': 'qián', '后': 'hòu',
    '东': 'dōng', '南': 'nán', '西': 'xī', '北': 'běi', '中': 'zhōng', '里': 'lǐ',
    '外': 'wài', '内': 'nèi', '旁': 'páng', '边': 'biān', '角': 'jiǎo', '中': 'zhōng',
    '间': 'jiān', '侧': 'cè', '面': 'miàn', '底': 'dǐ', '顶': 'dǐng',

    // 常用动词
    '看': 'kàn', '听': 'tīng', '说': 'shuō', '读': 'dú', '写': 'xiě', '吃': 'chī',
    '喝': 'hē', '玩': 'wán', '睡': 'shuì', '起': 'qǐ', '坐': 'zuò', '站': 'zhàn',
    '走': 'zǒu', '跑': 'pǎo', '跳': 'tiào', '飞': 'fēi', '游': 'yóu', '爬': 'pá',
    '笑': 'xiào', '哭': 'kū', '唱': 'chàng', '跳': 'tiào', '画': 'huà', '做': 'zuò',
    '开': 'kāi', '关': 'guān', '进': 'jìn', '出': 'chū', '来': 'lái', '去': 'qù',

    // 常用形容词
    '大': 'dà', '小': 'xiǎo', '多': 'duō', '少': 'shǎo', '长': 'cháng', '短': 'duǎn',
    '高': 'gāo', '矮': 'ǎi', '胖': 'pàng', '瘦': 'shòu', '新': 'xīn', '旧': 'jiù',
    '好': 'hǎo', '坏': 'huài', '快': 'kuài', '慢': 'màn', '美': 'měi', '丑': 'chǒu',
    '干': 'gān', '净': 'jìng', '脏': 'zāng', '冷': 'lěng', '热': 'rè', '温': 'wēn',
    '凉': 'liáng', '暖': 'nuǎn', '软': 'ruǎn', '硬': 'yìng', '甜': 'tián', '酸': 'suān',
    '苦': 'kǔ', '辣': 'là', '咸': 'xián', '淡': 'dàn', '香': 'xiāng', '臭': 'chòu',

    // 自然景物
    '天': 'tiān', '空': 'kōng', '云': 'yún', '风': 'fēng', '雨': 'yǔ', '雪': 'xuě',
    '雷': 'léi', '电': 'diàn', '日': 'rì', '月': 'yuè', '星': 'xīng', '光': 'guāng',
    '山': 'shān', '石': 'shí', '土': 'tǔ', '沙': 'shā', '尘': 'chén', '田': 'tián',
    '海': 'hǎi', '洋': 'yáng', '江': 'jiāng', '河': 'hé', '湖': 'hú', '池': 'chí',
    '泉': 'quán', '瀑': 'pù', '布': 'bù', '岛': 'dǎo', '岸': 'àn', '波': 'bō',

    // 建筑和场所
    '房': 'fáng', '屋': 'wū', '门': 'mén', '窗': 'chuāng', '墙': 'qiáng', '顶': 'dǐng',
    '楼': 'lóu', '梯': 'tī', '院': 'yuàn', '堂': 'táng', '厅': 'tīng', '室': 'shì',
    '厨': 'chú', '卫': 'wèi', '卧': 'wò', '客': 'kè', '餐': 'cān', '书': 'shū',
    '店': 'diàn', '铺': 'pù', '场': 'chǎng', '馆': 'guǎn', '所': 'suǒ', '心': 'xīn'
};

// 声调标记
const TONE_MARKS = {
    'a': ['ā', 'á', 'ǎ', 'à'],
    'e': ['ē', 'é', 'ě', 'è'],
    'i': ['ī', 'í', 'ǐ', 'ì'],
    'o': ['ō', 'ó', 'ǒ', 'ò'],
    'u': ['ū', 'ú', 'ǔ', 'ù'],
    'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
    'A': ['Ā', 'Á', 'Ǎ', 'À'],
    'E': ['Ē', 'É', 'Ě', 'È'],
    'I': ['Ī', 'Í', 'Ǐ', 'Ì'],
    'O': ['Ō', 'Ó', 'Ǒ', 'Ò'],
    'U': ['Ū', 'Ú', 'Ǔ', 'Ù'],
    'Ü': ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ']
};

// 添加声调标记
function addToneMark(pinyin, tone) {
    if (!pinyin || tone === 0 || tone > 4) return pinyin;

    // 找到需要添加声调的元音
    const vowels = ['a', 'e', 'i', 'o', 'u', 'ü', 'A', 'E', 'I', 'O', 'U', 'Ü'];

    // 优先级：a > o > e > i/u/ü
    let markIndex = -1;
    let markVowel = null;

    for (let char of ['a', 'A', 'o', 'O', 'e', 'E', 'i', 'I', 'u', 'U', 'ü', 'Ü']) {
        let index = pinyin.indexOf(char);
        if (index !== -1) {
            markIndex = index;
            markVowel = char;
            break;
        }
    }

    if (markIndex !== -1) {
        const markedVowel = TONE_MARKS[markVowel][tone - 1];
        return pinyin.substring(0, markIndex) + markedVowel + pinyin.substring(markIndex + 1);
    }

    return pinyin;
}

// 获取汉字拼音（带声调）
function getPinyin(hanzi, tone = true) {
    if (!hanzi) return '';

    let result = '';

    // 检查是否是单个字符
    if (hanzi.length === 1) {
        const pinyin = PINYIN_DICT[hanzi] || null;
        if (pinyin) {
            // 从字典中提取声调
            const toneMatch = pinyin.match(/(\w+)(\d)/);
            if (toneMatch && tone) {
                return addToneMark(toneMatch[1], parseInt(toneMatch[2]));
            } else if (!tone && toneMatch) {
                return toneMatch[1]; // 不带声调
            }
            return pinyin;
        }
        return hanzi; // 如果没有找到拼音，返回原字符
    }

    // 处理多个字符
    for (let char of hanzi) {
        const pinyin = PINYIN_DICT[char];
        if (pinyin) {
            const toneMatch = pinyin.match(/(\w+)(\d)/);
            if (toneMatch && tone) {
                result += addToneMark(toneMatch[1], parseInt(toneMatch[2])) + ' ';
            } else if (!tone && toneMatch) {
                result += toneMatch[1] + ' ';
            } else {
                result += pinyin + ' ';
            }
        } else {
            result += char + ' ';
        }
    }

    return result.trim();
}

// 批量转换拼音
function convertToPinyin(text, separator = ' ', tone = true) {
    if (!text) return '';

    const words = text.split('');
    const pinyins = words.map(word => getPinyin(word, tone));

    return pinyins.join(separator);
}

// 检查是否有拼音
function hasPinyin(hanzi) {
    return PINYIN_DICT.hasOwnProperty(hanzi);
}

// 获取所有支持的汉字
function getSupportedCharacters() {
    return Object.keys(PINYIN_DICT);
}

// 动态添加拼音到字典
function addPinyin(hanzi, pinyin) {
    PINYIN_DICT[hanzi] = pinyin;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getPinyin,
        convertToPinyin,
        hasPinyin,
        getSupportedCharacters,
        addPinyin,
        addToneMark
    };
} else if (typeof window !== 'undefined') {
    window.PINYIN = {
        getPinyin,
        convertToPinyin,
        hasPinyin,
        getSupportedCharacters,
        addPinyin,
        addToneMark
    };
}