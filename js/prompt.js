// 提示词模板系统
class PromptTemplate {
    constructor() {
        this.template = this.getDefaultTemplate();
    }

    // 获取默认模板
    getDefaultTemplate() {
        return `请生成一张儿童识字小报《{{topic}}》，竖版 A4，学习小报版式，适合 5–9 岁孩子认字与看图识物。

# 一、小报标题区（顶部）

**顶部居中大标题**：《{{title}}》
* **风格**：十字小报 / 儿童学习报感
* **文本要求**：大字、醒目、卡通手写体、彩色描边
* **装饰**：周围添加与 {{topic}} 相关的贴纸风装饰，颜色鲜艳

# 二、小报主体（中间主画面）

画面中心是一幅 **卡通插画风的「{{topic}}」场景**：
* **整体气氛**：明亮、温暖、积极
* **构图**：物体边界清晰，方便对应文字，不要过于拥挤。

**场景分区与核心内容**
1. **核心区域 A（主要对象）**：表现 {{topic}} 的核心活动。
2. **核心区域 B（配套设施）**：展示相关的工具或物品。
3. **核心区域 C（环境背景）**：体现环境特征（如墙面、指示牌等）。

**主题人物**
* **角色**：1 位可爱卡通人物（职业/身份：与 {{topic}} 匹配）。
* **动作**：正在进行与场景相关的自然互动。

# 三、必画物体与识字清单（Generated Content）

**请务必在画面中清晰绘制以下物体，并为其预留贴标签的位置：**

**1. 核心角色与设施：**
{{coreVocabulary}}

**2. 常见物品/工具：**
{{itemVocabulary}}

**3. 环境与装饰：**
{{envVocabulary}}

*(注意：画面中的物体数量不限于此，但以上列表必须作为重点描绘对象)*

# 四、识字标注规则

对上述清单中的物体，贴上中文识字标签：
* **格式**：两行制（第一行拼音带声调，第二行简体汉字）。
* **样式**：彩色小贴纸风格，白底黑字或深色字，清晰可读。
* **排版**：标签靠近对应的物体，不遮挡主体。

# 五、画风参数
* **风格**：儿童绘本风 + 识字小报风
* **色彩**：高饱和、明快、温暖 (High Saturation, Warm Tone)
* **质量**：8k resolution, high detail, vector illustration style, clean lines.`;
    }

    // 格式化词汇列表
    formatVocabulary(vocabulary, category) {
        const filtered = vocabulary.filter(v => v.category === category);
        return filtered.map(v => `${v.pinyin} ${v.hanzi}`).join(', ');
    }

    // 生成完整的提示词
    generatePrompt(topic, title, vocabulary) {
        let prompt = this.template;

        // 替换基本变量
        prompt = prompt.replace(/\{\{topic\}\}/g, topic);
        prompt = prompt.replace(/\{\{title\}\}/g, title);

        // 替换词汇列表
        const coreList = this.formatVocabulary(vocabulary, 'core');
        const itemList = this.formatVocabulary(vocabulary, 'item');
        const envList = this.formatVocabulary(vocabulary, 'env');

        prompt = prompt.replace(/\{\{coreVocabulary\}\}/g, coreList);
        prompt = prompt.replace(/\{\{itemVocabulary\}\}/g, itemList);
        prompt = prompt.replace(/\{\{envVocabulary\}\}/g, envList);

        return prompt;
    }

    // 获取简化的提示词（用于快速预览）
    getSimplePrompt(topic, title, vocabulary) {
        const coreList = this.formatVocabulary(vocabulary, 'core');
        const itemList = this.formatVocabulary(vocabulary, 'item');
        const envList = this.formatVocabulary(vocabulary, 'env');

        return `儿童识字小报《${title}》，主题：${topic}

核心内容：${coreList}

常见物品：${itemList}

环境装饰：${envList}

要求：卡通插画风格，适合5-9岁儿童，每个物体标注拼音和汉字，A4竖版，色彩鲜艳。`;
    }

    // 自定义模板
    setTemplate(template) {
        if (typeof template === 'string' && template.includes('{{topic}}') && template.includes('{{title}}')) {
            this.template = template;
            return true;
        }
        return false;
    }

    // 验证模板格式
    validateTemplate(template) {
        const requiredVars = ['{{topic}}', '{{title}}', '{{coreVocabulary}}', '{{itemVocabulary}}', '{{envVocabulary}}'];
        for (let variable of requiredVars) {
            if (!template.includes(variable)) {
                return {
                    valid: false,
                    missing: variable
                };
            }
        }
        return { valid: true };
    }
}

// 词汇增强提示词
const VOCABULARY_ENHANCE_PROMPT = `请为儿童识字小报生成一个场景下的词汇列表。要求：

1. 场景主题：{topic}
2. 词汇要求：
   - 总共15-20个词汇
   - 分为3类：核心角色与设施(3-5个)、常见物品(5-8个)、环境装饰(3-5个)
   - 每个词汇必须包含：汉字、拼音（带声调数字，如：shāng chǎng1）
   - 词汇必须是5-9岁儿童常见的事物

请直接返回JSON格式，不要包含任何其他文字：
{
  "core": [
    {"hanzi": "词汇1", "pinyin": "pinyin1"}
  ],
  "item": [
    {"hanzi": "词汇2", "pinyin": "pinyin2"}
  ],
  "env": [
    {"hanzi": "词汇3", "pinyin": "pinyin3"}
  ]
}`;

// 预设场景词汇库
const PRESET_VOCABULARY = {
    '超市': {
        core: [
            { hanzi: '收银员', pinyin: 'shōu yín yuán2' },
            { hanzi: '购物车', pinyin: 'gòu wù chē1' },
            { hanzi: '货架', pinyin: 'huò jià4' },
            { hanzi: '收银台', pinyin: 'shōu yín tái2' }
        ],
        item: [
            { hanzi: '苹果', pinyin: 'píng guǒ3' },
            { hanzi: '牛奶', pinyin: 'niú nǎi3' },
            { hanzi: '面包', pinyin: 'miàn bāo1' },
            { hanzi: '鸡蛋', pinyin: 'jī dàn4' },
            { hanzi: '香蕉', pinyin: 'xiāng jiāo1' },
            { hanzi: '饼干', pinyin: 'bǐng gān1' },
            { hanzi: '果汁', pinyin: 'guǒ zhī1' }
        ],
        env: [
            { hanzi: '入口', pinyin: 'rù kǒu3' },
            { hanzi: '出口', pinyin: 'chū kǒu3' },
            { hanzi: '灯', pinyin: 'dēng1' },
            { hanzi: '墙', pinyin: 'qiáng2' }
        ]
    },
    '医院': {
        core: [
            { hanzi: '医生', pinyin: 'yī shēng1' },
            { hanzi: '护士', pinyin: 'hù shi4' },
            { hanzi: '病人', pinyin: 'bìng rén2' },
            { hanzi: '病床', pinyin: 'bìng chuáng2' }
        ],
        item: [
            { hanzi: '体温计', pinyin: 'tǐ wēn jì4' },
            { hanzi: '听诊器', pinyin: 'tīng zhěn qì4' },
            { hanzi: '药', pinyin: 'yào4' },
            { hanzi: '针筒', pinyin: 'zhēn tǒng3' },
            { hanzi: '纱布', pinyin: 'shā bù4' },
            { hanzi: '病历', pinyin: 'bìng lì4' }
        ],
        env: [
            { hanzi: '诊室', pinyin: 'zhěn shì4' },
            { hanzi: '药房', pinyin: 'yào fáng2' },
            { hanzi: '挂号处', pinyin: 'guà hào chù4' },
            { hanzi: '走廊', pinyin: 'zǒu láng2' }
        ]
    },
    '公园': {
        core: [
            { hanzi: '树', pinyin: 'shù4' },
            { hanzi: '花', pinyin: 'huā1' },
            { hanzi: '草', pinyin: 'cǎo3' },
            { hanzi: '长椅', pinyin: 'cháng yǐ3' }
        ],
        item: [
            { hanzi: '滑梯', pinyin: 'huá tī1' },
            { hanzi: '秋千', pinyin: 'qiū qiān1' },
            { hanzi: '跷跷板', pinyin: 'qiāo qiāo bǎn3' },
            { hanzi: '气球', pinyin: 'qì qiú2' },
            { hanzi: '风筝', pinyin: 'fēng zheng1' },
            { hanzi: '球', pinyin: 'qiú2' }
        ],
        env: [
            { hanzi: '湖', pinyin: 'hú2' },
            { hanzi: '桥', pinyin: 'qiáo2' },
            { hanzi: '路', pinyin: 'lù4' },
            { hanzi: '喷泉', pinyin: 'pēn quán2' }
        ]
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PromptTemplate,
        VOCABULARY_ENHANCE_PROMPT,
        PRESET_VOCABULARY
    };
} else if (typeof window !== 'undefined') {
    window.PromptTemplate = PromptTemplate;
    window.VOCABULARY_ENHANCE_PROMPT = VOCABULARY_ENHANCE_PROMPT;
    window.PRESET_VOCABULARY = PRESET_VOCABULARY;
}