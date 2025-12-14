// 应用配置
const CONFIG = {
    // API配置
    NANOBANANA_API_BASE_URL: 'https://api.kie.ai',
    API_VERSION: 'v1',

    // 默认生成参数
    DEFAULT_ASPECT_RATIO: '3:4',  // 竖版A4
    DEFAULT_RESOLUTION: '2K',
    DEFAULT_FORMAT: 'png',

    // 词汇配置
    VOCABULARY_COUNT: {
        TOTAL_MIN: 15,
        TOTAL_MAX: 20,
        CORE_MIN: 3,
        CORE_MAX: 5,
        ITEM_MIN: 5,
        ITEM_MAX: 8,
        ENV_MIN: 3,
        ENV_MAX: 5
    },

    // 轮询配置
    POLLING: {
        INTERVAL: 2000,  // 2秒轮询一次
        MAX_ATTEMPTS: 150,  // 最多轮询5分钟
        TIMEOUT: 300000  // 5分钟超时
    },

    // 本地存储键名
    STORAGE_KEYS: {
        API_KEY: 'nanobanana_api_key',
        VOCABULARY_CACHE: 'vocabulary_cache',
        GENERATION_HISTORY: 'generation_history'
    },

    // UI配置
    UI: {
        STEPS: {
            INPUT: 'step1',
            VOCABULARY: 'step2',
            GENERATING: 'step3',
            RESULT: 'step4'
        },
        ANIMATION_DURATION: 300
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

    // 支持的主题类别
    CATEGORIES: {
        CORE: 'core',
        ITEM: 'item',
        ENV: 'env'
    },

    // 类别中文名称
    CATEGORY_NAMES: {
        core: '核心角色与设施',
        item: '常见物品',
        env: '环境装饰',
        all: '全部'
    }
};

// 导出配置（兼容不同模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}