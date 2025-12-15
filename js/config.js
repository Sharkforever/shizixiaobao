// 应用配置
const CONFIG = {
    // API配置存储键名
    STORAGE_KEYS: {
        NANOBANANA: 'nanobanana_config',
        LLM: 'llm_config'
    },

    // 默认配置
    DEFAULTS: {
        nanobanana: {
            url: 'https://api.kie.ai',
            key: ''
        },
        llm: {
            url: 'https://open.bigmodel.cn/api/paas/v4/',
            key: '5fa16f6e3bbc42be8ef961267db1a0fc.mFY3GH2AqsakYnEF'
        }
    },

    // Nano Banana Pro API配置
    NANOBANANA: {
        MODEL: 'nano-banana-pro',
        DEFAULT_ASPECT_RATIO: '3:4',  // 竖版A4
        DEFAULT_RESOLUTION: '2K',
        DEFAULT_FORMAT: 'png'
    },

    // GLM API配置
    GLM: {
        MODEL: 'glm-4',  // 默认模型
        DEFAULT_TEMPERATURE: 0.7,
        DEFAULT_MAX_TOKENS: 2000
    },

    // 轮询配置
    POLLING: {
        INTERVAL: 2000,  // 2秒轮询一次
        MAX_ATTEMPTS: 150,  // 最多轮询5分钟
        TIMEOUT: 300000  // 5分钟超时
    },

    // 错误消息
    ERROR_MESSAGES: {
        API_KEY_MISSING: '请输入API密钥',
        API_KEY_INVALID: 'API密钥无效，请检查后重试',
        NETWORK_ERROR: '网络连接失败，请检查网络后重试',
        TASK_FAILED: '生成任务失败，请重试',
        TASK_TIMEOUT: '生成超时，请重试',
        EMPTY_TOPIC: '请输入主题',
        EMPTY_TITLE: '请输入标题',
        INSUFFICIENT_VOCABULARY: '词汇数量不足，请重新生成',
        GENERATION_ERROR: '生成过程中出现错误',
        DOWNLOAD_ERROR: '下载失败，请重试'
    },

    // 成功消息
    SUCCESS_MESSAGES: {
        API_KEY_SAVED: 'API密钥已保存',
        VOCABULARY_GENERATED: '词汇列表已生成',
        REPORT_GENERATED: '小报生成成功',
        DOWNLOADED: '下载成功'
    },

    // 支持的LLM提供商
    LLM_PROVIDERS: {
        siliconflow: {
            name: '硅基流动 SiliconFlow',
            baseUrl: 'https://api.siliconflow.cn/v1',
            defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
            description: '推荐，价格低廉，支持多种开源模型'
        },
        zhipu: {
            name: '智谱AI GLM',
            baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
            defaultModel: 'glm-4',
            description: '智谱AI大模型'
        },
        openai: {
            name: 'OpenAI GPT',
            baseUrl: 'https://api.openai.com/v1',
            defaultModel: 'gpt-3.5-turbo',
            description: 'OpenAI GPT系列模型'
        },
        anthropic: {
            name: 'Anthropic Claude',
            baseUrl: 'https://api.anthropic.com/v1',
            defaultModel: 'claude-3-haiku-20240307',
            description: 'Anthropic Claude系列模型'
        },
        alibaba: {
            name: '阿里通义千问',
            baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
            defaultModel: 'qwen-plus',
            description: '阿里云通义千问'
        },
        baidu: {
            name: '百度文心一言',
            baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
            defaultModel: 'ernie_speed',
            description: '百度文心一言'
        },
        moonshot: {
            name: '月之暗面 Kimi',
            baseUrl: 'https://api.moonshot.cn/v1',
            defaultModel: 'moonshot-v1-8k',
            description: '月之暗面Kimi'
        },
        yi: {
            name: '零一万物 Yi',
            baseUrl: 'https://api.lingyiwanwu.com/v1',
            defaultModel: 'yi-large',
            description: '零一万物Yi系列'
        },
        deepseek: {
            name: 'DeepSeek',
            baseUrl: 'https://api.deepseek.com',
            defaultModel: 'deepseek-chat',
            description: 'DeepSeek深度求索'
        }
    },

    // 默认LLM提供商
    DEFAULT_LLM_PROVIDER: 'siliconflow'
};