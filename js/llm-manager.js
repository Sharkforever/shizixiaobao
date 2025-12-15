// LLM管理器
// 管理多个LLM提供商，提供统一的接口

/**
 * LLM管理器类
 */
class LLMManager {
    constructor() {
        this.providers = {};
        this.currentProvider = null;
        this.currentProviderConfig = null;
        this.loadSavedConfig();
    }

    /**
     * 注册LLM提供商
     * @param {string} name - 提供商名称
     * @param {Function} ProviderClass - 提供商类
     */
    registerProvider(name, ProviderClass) {
        this.providers[name] = ProviderClass;
    }

    /**
     * 获取所有已注册的提供商
     * @returns {Object} 提供商映射
     */
    getProviders() {
        return this.providers;
    }

    /**
     * 设置当前提供商
     * @param {string} providerName - 提供商名称
     * @param {string} apiKey - API密钥
     * @param {string} model - 模型名称（可选）
     */
    setCurrentProvider(providerName, apiKey, model = null) {
        const ProviderClass = this.providers[providerName];
        if (!ProviderClass) {
            throw new Error(`未知的提供商: ${providerName}`);
        }

        this.currentProvider = new ProviderClass(apiKey, model);
        this.currentProviderConfig = {
            name: providerName,
            apiKey: apiKey,
            model: model
        };
    }

    /**
     * 获取当前提供商
     * @returns {LLMProvider|null} 当前提供商实例
     */
    getCurrentProvider() {
        return this.currentProvider;
    }

    /**
     * 使用当前提供商生成词汇
     * @param {string} topic - 主题
     * @param {string} title - 标题
     * @returns {Promise<Object>} 词汇对象
     */
    async generateVocabulary(topic, title) {
        if (!this.currentProvider) {
            throw new Error('请先配置LLM提供商');
        }

        try {
            return await this.currentProvider.generateVocabulary(topic, title);
        } catch (error) {
            console.error('词汇生成失败:', error);
            throw error;
        }
    }

    /**
     * 测试当前提供商的连接
     * @returns {Promise<Object>} 测试结果
     */
    async testConnection() {
        if (!this.currentProvider) {
            return { success: false, error: '请先配置LLM提供商' };
        }

        try {
            const result = await this.currentProvider.testConnection();
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取当前提供商的可用模型
     * @returns {Promise<Array>} 模型列表
     */
    async getModels() {
        if (!this.currentProvider) {
            return [];
        }

        try {
            return await this.currentProvider.getModels();
        } catch (error) {
            console.error('获取模型列表失败:', error);
            return [];
        }
    }

    /**
     * 获取当前提供商配置
     * @returns {Object|null} 当前配置
     */
    getCurrentConfig() {
        return this.currentProviderConfig;
    }

    /**
     * 保存当前配置到本地存储
     */
    saveConfig() {
        if (!this.currentProviderConfig) return;

        const config = {
            provider: this.currentProviderConfig.name,
            apiKey: this.currentProviderConfig.apiKey
        };

        try {
            localStorage.setItem('llm_current_config', JSON.stringify(config));
        } catch (error) {
            console.error('保存LLM配置失败:', error);
        }
    }

    /**
     * 从本地存储加载保存的配置
     */
    loadSavedConfig() {
        try {
            const saved = localStorage.getItem('llm_current_config');
            if (saved) {
                const config = JSON.parse(saved);
                if (config.provider && config.apiKey) {
                    this.setCurrentProvider(config.provider, config.apiKey, config.model);
                }
            }
        } catch (error) {
            console.error('加载LLM配置失败:', error);
        }

        // 加载所有提供商的配置
        this.loadProviderConfigs();
    }

    /**
     * 加载所有提供商的配置
     */
    loadProviderConfigs() {
        // 这里可以从localStorage加载各提供商的配置
        // 暂时返回空对象
        return {};
    }

    /**
     * 保存提供商特定配置
     * @param {string} providerName - 提供商名称
     * @param {Object} config - 配置对象
     */
    saveProviderConfig(providerName, config) {
        const key = `llm_config_${providerName}`;
        try {
            localStorage.setItem(key, JSON.stringify(config));
        } catch (error) {
            console.error(`保存${providerName}配置失败:`, error);
        }
    }

    /**
     * 获取提供商特定配置
     * @param {string} providerName - 提供商名称
     * @returns {Object|null} 配置对象
     */
    getProviderConfig(providerName) {
        const key = `llm_config_${providerName}`;
        try {
            const saved = localStorage.getItem(key);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error(`获取${providerName}配置失败:`, error);
            return null;
        }
    }

    /**
     * 删除提供商配置
     * @param {string} providerName - 提供商名称
     */
    removeProviderConfig(providerName) {
        const key = `llm_config_${providerName}`;
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`删除${providerName}配置失败:`, error);
        }
    }

    /**
     * 获取所有保存的提供商配置
     * @returns {Object} 所有配置
     */
    getAllProviderConfigs() {
        const configs = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('llm_config_')) {
                const providerName = key.replace('llm_config_', '');
                const config = this.getProviderConfig(providerName);
                if (config) {
                    configs[providerName] = config;
                }
            }
        }
        return configs;
    }
}

// 导出LLM管理器
window.LLMManager = LLMManager;