// 词汇生成引擎
class VocabularyEngine {
    constructor() {
        this.cache = storage.get(CONFIG.STORAGE_KEYS.VOCABULARY_CACHE, {});
        this.aiApiKey = null;
        this.aiApiEndpoint = null; // 可以配置不同的AI服务
    }

    // 设置AI API配置
    setAIConfig(apiKey, endpoint) {
        this.aiApiKey = apiKey;
        this.aiApiEndpoint = endpoint;
    }

    // 生成词汇
    async generateVocabulary(topic, options = {}) {
        const {
            useCache = true,
            useAI = true,
            customCount = null
        } = options;

        // 检查缓存
        const cacheKey = topic.toLowerCase();
        if (useCache && this.cache[cacheKey]) {
            console.log('使用缓存的词汇:', topic);
            return this.cache[cacheKey];
        }

        // 尝试使用预设词汇
        let vocabulary = this.getPresetVocabulary(topic);

        // 如果没有预设词汇且允许使用AI
        if (!vocabulary.length && useAI && this.aiApiKey) {
            try {
                console.log('使用AI生成词汇:', topic);
                vocabulary = await this.generateAIVocabulary(topic);
            } catch (error) {
                console.error('AI生成词汇失败:', error);
                // 降级到基础词汇生成
                vocabulary = this.generateBasicVocabulary(topic);
            }
        }

        // 如果还是没有词汇，使用基础生成
        if (!vocabulary.length) {
            vocabulary = this.generateBasicVocabulary(topic);
        }

        // 验证词汇数量
        vocabulary = this.validateVocabularyCount(vocabulary, customCount);

        // 添加拼音（如果缺少）
        vocabulary = this.ensurePinyin(vocabulary);

        // 保存到缓存
        if (useCache) {
            this.cache[cacheKey] = vocabulary;
            storage.set(CONFIG.STORAGE_KEYS.VOCABULARY_CACHE, this.cache);
        }

        return vocabulary;
    }

    // 获取预设词汇
    getPresetVocabulary(topic) {
        const preset = PRESET_VOCABULARY[topic];
        if (!preset) return [];

        const vocabulary = [];

        // 合并所有类别的词汇
        ['core', 'item', 'env'].forEach(category => {
            if (preset[category]) {
                preset[category].forEach(item => {
                    vocabulary.push({
                        hanzi: item.hanzi,
                        pinyin: this.formatPinyin(item.pinyin),
                        category: category
                    });
                });
            }
        });

        return vocabulary;
    }

    // 使用AI生成词汇
    async generateAIVocabulary(topic) {
        const prompt = VOCABULARY_ENHANCE_PROMPT.replace('{topic}', topic);

        const response = await fetch(this.aiApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.aiApiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的儿童教育内容生成助手，专门为5-9岁儿童生成适合的识字词汇。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error('AI API请求失败');
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // 尝试解析JSON
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const vocabularyData = JSON.parse(jsonMatch[0]);
                return this.convertAIVocabulary(vocabularyData);
            }
        } catch (error) {
            console.error('解析AI返回结果失败:', error);
        }

        throw new Error('无法解析AI生成的词汇');
    }

    // 转换AI返回的词汇格式
    convertAIVocabulary(aiData) {
        const vocabulary = [];

        ['core', 'item', 'env'].forEach(category => {
            if (aiData[category]) {
                aiData[category].forEach(item => {
                    vocabulary.push({
                        hanzi: item.hanzi,
                        pinyin: this.formatPinyin(item.pinyin),
                        category: category
                    });
                });
            }
        });

        return vocabulary;
    }

    // 基础词汇生成（降级方案）
    generateBasicVocabulary(topic) {
        // 根据主题生成一些基础词汇
        const basicTemplates = {
            '学校': [
                { hanzi: '老师', category: 'core' },
                { hanzi: '学生', category: 'core' },
                { hanzi: '课桌', category: 'item' },
                { hanzi: '黑板', category: 'item' },
                { hanzi: '书本', category: 'item' }
            ],
            '动物园': [
                { hanzi: '熊猫', category: 'core' },
                { hanzi: '老虎', category: 'core' },
                { hanzi: '笼子', category: 'env' },
                { hanzi: '草地', category: 'env' },
                { hanzi: '标牌', category: 'env' }
            ]
        };

        // 匹配主题
        for (let key in basicTemplates) {
            if (topic.includes(key)) {
                return basicTemplates[key].map(item => ({
                    ...item,
                    pinyin: PINYIN.getPinyin(item.hanzi)
                }));
            }
        }

        // 默认返回一些通用词汇
        return [
            { hanzi: '人', pinyin: 'rén', category: 'core' },
            { hanzi: '门', pinyin: 'mén', category: 'env' },
            { hanzi: '窗', pinyin: 'chuāng', category: 'env' },
            { hanzi: '桌子', pinyin: 'zhuō zi', category: 'item' }
        ];
    }

    // 格式化拼音
    formatPinyin(pinyin) {
        if (!pinyin) return '';

        // 移除声调数字，使用拼音库生成带声调的拼音
        const cleanPinyin = pinyin.replace(/\d/g, '');
        return PINYIN.getPinyin(cleanPinyin, true);
    }

    // 验证词汇数量
    validateVocabularyCount(vocabulary, customCount) {
        if (!vocabulary || !vocabulary.length) return vocabulary;

        // 统计各类别数量
        const counts = {
            core: vocabulary.filter(v => v.category === 'core').length,
            item: vocabulary.filter(v => v.category === 'item').length,
            env: vocabulary.filter(v => v.category === 'env').length
        };

        // 如果总数不达标，尝试添加一些通用词汇
        const total = counts.core + counts.item + counts.env;
        const targetTotal = customCount || this.getRandomBetween(15, 20);

        if (total < targetTotal) {
            const commonWords = [
                { hanzi: '灯', category: 'env' },
                { hanzi: '墙', category: 'env' },
                { hanzi: '门', category: 'env' },
                { hanzi: '窗', category: 'env' },
                { hanzi: '椅子', category: 'item' },
                { hanzi: '桌子', category: 'item' }
            ];

            for (let word of commonWords) {
                if (total >= targetTotal) break;
                if (!vocabulary.find(v => v.hanzi === word.hanzi)) {
                    vocabulary.push({
                        hanzi: word.hanzi,
                        pinyin: PINYIN.getPinyin(word.hanzi),
                        category: word.category
                    });
                }
            }
        }

        return vocabulary;
    }

    // 确保每个词汇都有拼音
    ensurePinyin(vocabulary) {
        return vocabulary.map(item => ({
            ...item,
            pinyin: item.pinyin || PINYIN.getPinyin(item.hanzi)
        }));
    }

    // 获取随机数
    getRandomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 清理缓存
    clearCache() {
        this.cache = {};
        storage.remove(CONFIG.STORAGE_KEYS.VOCABULARY_CACHE);
    }

    // 获取词汇统计信息
    getVocabularyStats(vocabulary) {
        const stats = {
            total: vocabulary.length,
            core: vocabulary.filter(v => v.category === 'core').length,
            item: vocabulary.filter(v => v.category === 'item').length,
            env: vocabulary.filter(v => v.category === 'env').length
        };

        // 检查是否有重复
        const duplicates = vocabulary.filter((item, index) =>
            vocabulary.findIndex(v => v.hanzi === item.hanzi) !== index
        );

        if (duplicates.length > 0) {
            stats.hasDuplicates = true;
            stats.duplicates = duplicates.map(d => d.hanzi);
        } else {
            stats.hasDuplicates = false;
        }

        return stats;
    }

    // 保存生成的词汇到历史记录
    saveToHistory(topic, title, vocabulary) {
        const history = storage.get(CONFIG.STORAGE_KEYS.GENERATION_HISTORY, []);
        history.push({
            id: generateId('vocab_'),
            topic,
            title,
            vocabulary,
            createdAt: Date.now()
        });

        // 限制历史记录数量
        if (history.length > 50) {
            history.shift();
        }

        storage.set(CONFIG.STORAGE_KEYS.GENERATION_HISTORY, history);
    }

    // 从历史记录加载
    loadFromHistory(id) {
        const history = storage.get(CONFIG.STORAGE_KEYS.GENERATION_HISTORY, []);
        return history.find(item => item.id === id);
    }

    // 获取历史记录列表
    getHistory() {
        return storage.get(CONFIG.STORAGE_KEYS.GENERATION_HISTORY, []);
    }
}

// 创建全局实例
const vocabularyEngine = new VocabularyEngine();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VocabularyEngine, vocabularyEngine };
} else if (typeof window !== 'undefined') {
    window.VocabularyEngine = VocabularyEngine;
    window.vocabularyEngine = vocabularyEngine;
}