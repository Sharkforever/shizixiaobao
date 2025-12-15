// 词汇管理
class VocabularyManager {
    constructor() {
        this.vocabulary = null;
        this.currentFilter = 'all';
    }

    /**
     * 生成词汇
     * @param {GLMAPI} llmClient - LLM客户端
     * @param {string} topic - 主题
     * @param {string} title - 标题
     * @returns {Promise<Object>} 词汇对象
     */
    async generateVocabulary(llmClient, topic, title) {
        try {
            this.vocabulary = await llmClient.generateVocabulary(topic, title);
            return this.vocabulary;
        } catch (error) {
            console.error('生成词汇失败:', error);
            throw error;
        }
    }

    /**
     * 获取当前词汇
     * @returns {Object|null} 当前词汇对象
     */
    getVocabulary() {
        return this.vocabulary;
    }

    /**
     * 设置过滤条件
     * @param {string} filter - 过滤条件 (all, core, items, env)
     */
    setFilter(filter) {
        this.currentFilter = filter;
    }

    /**
     * 获取过滤后的词汇列表
     * @returns {Array} 词汇数组
     */
    getFilteredVocabulary() {
        if (!this.vocabulary) {
            return [];
        }

        if (this.currentFilter === 'all') {
            return [
                ...this.vocabulary.core.map(item => ({...item, category: 'core'})),
                ...this.vocabulary.items.map(item => ({...item, category: 'items'})),
                ...this.vocabulary.env.map(item => ({...item, category: 'env'}))
            ];
        }

        return this.vocabulary[this.currentFilter]?.map(item => ({...item, category: this.currentFilter})) || [];
    }

    /**
     * 获取词汇统计信息
     * @returns {Object} 统计信息
     */
    getStatistics() {
        if (!this.vocabulary) {
            return {
                total: 0,
                core: 0,
                items: 0,
                env: 0
            };
        }

        return {
            total: this.vocabulary.core.length + this.vocabulary.items.length + this.vocabulary.env.length,
            core: this.vocabulary.core.length,
            items: this.vocabulary.items.length,
            env: this.vocabulary.env.length
        };
    }

    /**
     * 格式化词汇为HTML
     * @param {Array} vocabularyList - 词汇列表
     * @returns {string} HTML字符串
     */
    formatVocabularyHTML(vocabularyList) {
        return vocabularyList.map(item => `
            <div class="vocabulary-item" data-category="${item.category}">
                <div class="word">${item.word}</div>
                <div class="pinyin">${item.pinyin}</div>
            </div>
        `).join('');
    }

    /**
     * 格式化词汇为提示词文本
     * @returns {string} 格式化的文本
     */
    formatForPrompt() {
        if (!this.vocabulary) {
            return '';
        }

        const formatCategory = (items) => {
            return items.map(item => `${item.pinyin} ${item.word}`).join(', ');
        };

        return {
            core: formatCategory(this.vocabulary.core),
            items: formatCategory(this.vocabulary.items),
            env: formatCategory(this.vocabulary.env)
        };
    }
}