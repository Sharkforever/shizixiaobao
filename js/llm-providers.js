// LLM提供商系统
// 提供统一的接口来处理不同的大语言模型API

/**
 * LLM提供商基类
 */
class LLMProvider {
    constructor(name, baseUrl, apiKey, model = null) {
        this.name = name;
        this.baseUrl = baseUrl.replace(/\/$/, ''); // 移除末尾斜杠
        this.apiKey = apiKey;
        this.model = model;
    }

    /**
     * 设置模型
     * @param {string} model - 模型名称
     */
    setModel(model) {
        this.model = model;
    }

    /**
     * 生成词汇 - 抽象方法，子类必须实现
     * @param {string} topic - 主题
     * @param {string} title - 标题
     * @returns {Promise<Object>} 词汇对象
     */
    async generateVocabulary(topic, title) {
        throw new Error(`子类必须实现 generateVocabulary 方法`);
    }

    /**
     * 测试连接
     * @returns {Promise<Object>} 测试结果
     */
    async testConnection() {
        try {
            const testPrompt = '测试连接，请回复"连接成功"';
            const result = await this.generateVocabulary('测试', '测试');
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取可用模型列表
     * @returns {Promise<Array>} 模型列表
     */
    async getModels() {
        // 默认实现，子类可以覆盖
        return [];
    }
}

/**
 * 硅基流动提供商 - 推荐的默认提供商
 */
class SiliconFlowProvider extends LLMProvider {
    constructor(apiKey, model = null) {
        super('SiliconFlow', 'https://api.siliconflow.cn/v1', apiKey, model);
    }

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
                model: this.model || 'Qwen/Qwen2.5-7B-Instruct', // 使用指定模型或默认模型
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
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'SiliconFlow API返回错误');
        }

        // 获取响应内容
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('SiliconFlow API返回了空的内容');
        }

        // 解析词汇
        return this.parseVocabularyResponse(content);
    }

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
            console.warn('解析SiliconFlow响应失败，使用默认词汇:', error);
            return this.getDefaultVocabulary();
        }
    }

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

    async getModels() {
        const models = [
            { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B-Instruct' },
            { id: 'Qwen/Qwen2.5-14B-Instruct', name: 'Qwen2.5-14B-Instruct' },
            { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen2.5-32B-Instruct' },
            { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B-Instruct' },
            { id: 'Qwen/Qwen2.5-Coder-7B-Instruct', name: 'Qwen2.5-Coder-7B-Instruct' },
            { id: 'ChatGLM3', name: 'ChatGLM3' },
            { id: 'deepseek-ai/DeepSeek-V2.5', name: 'DeepSeek-V2.5' },
            { id: 'deepseek-ai/DeepSeek-Coder-V2', name: 'DeepSeek-Coder-V2' },
            { id: '01-ai/Yi-1.5-9B-Chat', name: 'Yi-1.5-9B-Chat' },
            { id: 'internlm/internlm2_5-7b-chat', name: 'InternLM2.5-7B-Chat' },
            { id: 'meta-llama/Llama-3.2-3B-Instruct', name: 'Llama-3.2-3B-Instruct' }
        ];

        return models;
    }
}

/**
 * 智谱AI GLM提供商
 */
class ZhipuProvider extends LLMProvider {
    constructor(apiKey, model = null) {
        super('Zhipu', 'https://open.bigmodel.cn/api/paas/v4', apiKey, model);
    }

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
                model: this.model || 'glm-4',
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
                temperature: 0.7,
                max_tokens: 2000
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

    async getModels() {
        const models = [
            { id: 'glm-4', name: 'GLM-4' },
            { id: 'glm-4-plus', name: 'GLM-4-Plus' },
            { id: 'glm-4-flash', name: 'GLM-4-Flash' },
            { id: 'glm-4-air', name: 'GLM-4-Air' },
            { id: 'glm-4-long', name: 'GLM-4-Long' }
        ];

        return models;
    }
}

/**
 * OpenAI提供商
 */
class OpenAIProvider extends LLMProvider {
    constructor(apiKey, model = null) {
        super('OpenAI', 'https://api.openai.com/v1', apiKey, model);
    }

    async generateVocabulary(topic, title) {
        const prompt = `请为"${topic}"这个主题生成15-20个适合5-9岁儿童认识的名词，分为三类：
1. 核心角色与设施(3-5个)
2. 常见物品(5-8个)
3. 环境装饰(3-5个)

每个词包含汉字和带声调拼音。返回JSON格式：
{
  "core": [{"word": "收银员", "pinyin": "shōu yín yuán"}],
  "items": [{"word": "苹果", "pinyin": "píng guǒ"}],
  "env": [{"word": "出口", "pinyin": "chū kǒu"}]
}`;

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model || 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的儿童教育内容生成助手。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'OpenAI API返回错误');
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error('OpenAI API返回了空的内容');
        }

        return this.parseVocabularyResponse(content);
    }

    parseVocabularyResponse(content) {
        // 类似的解析逻辑
        let jsonStr = content;
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        try {
            const vocabulary = JSON.parse(jsonStr);
            if (this.validateVocabulary(vocabulary)) {
                return vocabulary;
            }
            return this.getDefaultVocabulary();
        } catch {
            return this.getDefaultVocabulary();
        }
    }

    validateVocabulary(vocabulary) {
        return vocabulary &&
               typeof vocabulary === 'object' &&
               vocabulary.core && vocabulary.items && vocabulary.env &&
               Array.isArray(vocabulary.core) &&
               Array.isArray(vocabulary.items) &&
               Array.isArray(vocabulary.env);
    }

    getDefaultVocabulary() {
        return SiliconFlowProvider.prototype.getDefaultVocabulary();
    }

    async getModels() {
        const models = [
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
        ];

        return models;
    }
}

/**
 * Anthropic Claude提供商
 */
class AnthropicProvider extends LLMProvider {
    constructor(apiKey, model = null) {
        super('Anthropic', 'https://api.anthropic.com/v1', apiKey, model);
    }

    async generateVocabulary(topic, title) {
        const prompt = `请为"${topic}"这个主题生成15-20个适合5-9岁儿童认识的名词，分为三类：核心角色与设施、常见物品、环境装饰。每个词包含汉字和拼音。返回JSON格式。`;

        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.model || 'claude-3-haiku-20240307',
                max_tokens: 2000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message || 'Claude API返回错误');
        }

        const content = data.content[0]?.text;
        if (!content) {
            throw new Error('Claude API返回了空的内容');
        }

        return this.parseVocabularyResponse(content);
    }

    parseVocabularyResponse(content) {
        // 类似的解析逻辑
        try {
            const vocabulary = JSON.parse(content);
            if (this.validateVocabulary(vocabulary)) {
                return vocabulary;
            }
            return this.getDefaultVocabulary();
        } catch {
            return this.getDefaultVocabulary();
        }
    }

    validateVocabulary(vocabulary) {
        return vocabulary &&
               typeof vocabulary === 'object' &&
               vocabulary.core && vocabulary.items && vocabulary.env &&
               Array.isArray(vocabulary.core) &&
               Array.isArray(vocabulary.items) &&
               Array.isArray(vocabulary.env);
    }

    getDefaultVocabulary() {
        return SiliconFlowProvider.prototype.getDefaultVocabulary();
    }

    async getModels() {
        const models = [
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
        ];

        return models;
    }
}

// 导出所有提供商
window.LLMProviders = {
    SiliconFlowProvider,
    ZhipuProvider,
    OpenAIProvider,
    AnthropicProvider
};

// 导出提供商映射
window.LLM_PROVIDER_MAP = {
    'siliconflow': SiliconFlowProvider,
    'zhipu': ZhipuProvider,
    'openai': OpenAIProvider,
    'anthropic': AnthropicProvider
};