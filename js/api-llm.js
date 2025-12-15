// GLM API集成
class GLMAPI {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // 移除末尾斜杠
        this.apiKey = apiKey;
    }

    /**
     * 生成词汇
     * @param {string} topic - 主题
     * @param {string} title - 标题
     * @returns {Promise<Object>} 词汇对象
     */
    async generateVocabulary(topic, title) {
        const prompt = `请为"${topic}"这个主题生成15-20个适合5-9岁儿童认识的名词，分为三类：
1. 核心角色与设施(3-5个) - 该场景的主要人物和关键设施
2. 常见物品(5-8个) - 该场景中常见的物品和工具
3. 环境装饰(3-5个) - 该场景的环境元素和装饰

要求：
- 每个词必须是具体名词，适合5-9岁儿童认知
- 每个词包含汉字和准确的带声调拼音
- 拼音格式示例：shōu yín yuán

请严格按照以下JSON格式返回，不要包含任何其他文字：
{
  "core": [
    {"word": "收银员", "pinyin": "shōu yín yuán"},
    {"word": "货架", "pinyin": "huò jià"}
  ],
  "items": [
    {"word": "苹果", "pinyin": "píng guǒ"},
    {"word": "牛奶", "pinyin": "niú nǎi"}
  ],
  "env": [
    {"word": "出口", "pinyin": "chū kǒu"},
    {"word": "灯", "pinyin": "dēng"}
  ]
}`;

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: CONFIG.GLM.MODEL,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的儿童教育内容生成助手，专门为5-9岁儿童生成适合的识字词汇。请严格按要求返回JSON格式的数据。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: CONFIG.GLM.DEFAULT_TEMPERATURE,
                max_tokens: CONFIG.GLM.DEFAULT_MAX_TOKENS
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'GLM API返回错误');
        }

        // 获取响应内容
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('GLM API返回了空的内容');
        }

        // 解析词汇
        return this.parseVocabularyResponse(content);
    }

    /**
     * 解析词汇响应
     * @param {string} content - 响应内容
     * @returns {Object} 解析后的词汇对象
     */
    parseVocabularyResponse(content) {
        // 尝试提取JSON
        let jsonStr = content;

        // 如果内容包含```json，提取其中的JSON部分
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        // 尝试解析JSON
        try {
            const vocabulary = JSON.parse(jsonStr);

            // 验证格式
            if (this.validateVocabulary(vocabulary)) {
                return vocabulary;
            } else {
                throw new Error('词汇格式不正确');
            }
        } catch (error) {
            console.warn('解析GLM响应失败，使用默认词汇:', error);
            return this.getDefaultVocabulary();
        }
    }

    /**
     * 验证词汇格式
     * @param {Object} vocabulary - 词汇对象
     * @returns {boolean} 是否有效
     */
    validateVocabulary(vocabulary) {
        return vocabulary &&
               typeof vocabulary === 'object' &&
               vocabulary.core && vocabulary.items && vocabulary.env &&
               Array.isArray(vocabulary.core) &&
               Array.isArray(vocabulary.items) &&
               Array.isArray(vocabulary.env) &&
               vocabulary.core.length >= 3 &&
               vocabulary.items.length >= 5 &&
               vocabulary.env.length >= 3;
    }

    /**
     * 获取默认词汇
     * @returns {Object} 默认词汇对象
     */
    getDefaultVocabulary() {
        return {
            core: [
                {word: "教师", pinyin: "jiào shī"},
                {word: "学生", pinyin: "xué shēng"},
                {word: "黑板", pinyin: "hēi bǎn"}
            ],
            items: [
                {word: "书本", pinyin: "shū běn"},
                {word: "铅笔", pinyin: "qiān bǐ"},
                {word: "课桌", pinyin: "kè zhuō"},
                {word: "椅子", pinyin: "yǐ zi"},
                {word: "书包", pinyin: "shū bāo"}
            ],
            env: [
                {word: "教室", pinyin: "jiào shì"},
                {word: "窗户", pinyin: "chuāng hù"},
                {word: "门", pinyin: "mén"}
            ]
        };
    }

    /**
     * 测试API连接
     * @returns {Promise<Object>} 测试结果
     */
    async testConnection() {
        try {
            // 首先验证API密钥格式
            if (!this.apiKey || !this.apiKey.startsWith('eyJ')) {
                return {
                    success: false,
                    error: 'API密钥格式不正确'
                };
            }

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: CONFIG.GLM.MODEL,
                    messages: [
                        {
                            role: 'user',
                            content: '测试连接，请回复"连接成功"'
                        }
                    ],
                    max_tokens: 10,
                    temperature: 0.1
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.error?.message || data.error?.type || `HTTP ${response.status}`;
                return {
                    success: false,
                    error: errorMessage,
                    status: response.status
                };
            }

            if (data.error) {
                return {
                    success: false,
                    error: data.error.message || data.error.type
                };
            }

            if (!data.choices || data.choices.length === 0) {
                return {
                    success: false,
                    error: 'API响应中没有返回内容'
                };
            }

            return {
                success: true,
                response: data.choices[0].message.content
            };
        } catch (error) {
            console.error('GLM API连接测试失败:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}