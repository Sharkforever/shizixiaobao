// 主应用逻辑
class ReportApp {
    constructor() {
        this.currentStep = CONFIG.UI.STEPS.INPUT;
        this.currentTask = null;
        this.currentVocabulary = [];
        this.promptTemplate = new PromptTemplate();
        this.pollingTimer = null;

        this.init();
    }

    // 初始化应用
    init() {
        // 加载保存的API密钥
        const savedApiKey = storage.get(CONFIG.STORAGE_KEYS.API_KEY);
        if (savedApiKey) {
            $('#apiKey').value = savedApiKey;
            nanoBananaAPI.setApiKey(savedApiKey);
        }

        // 绑定事件
        this.bindEvents();

        // 显示第一步
        this.showStep(CONFIG.UI.STEPS.INPUT);
    }

    // 绑定事件
    bindEvents() {
        // API密钥保存
        $('#saveApiKey')?.addEventListener('click', () => this.saveApiKey());

        // 表单提交
        $('#topicForm')?.addEventListener('submit', (e) => this.handleTopicSubmit(e));

        // 词汇相关按钮
        $('#regenerateBtn')?.addEventListener('click', () => this.regenerateVocabulary());
        $('#confirmBtn')?.addEventListener('click', () => this.confirmVocabulary());

        // 生成相关按钮
        $('#cancelBtn')?.addEventListener('click', () => this.cancelGeneration());

        // 结果相关按钮
        $('#downloadBtn')?.addEventListener('click', () => this.downloadImage());
        $('#regenerateImageBtn')?.addEventListener('click', () => this.regenerateImage());
        $('#newReportBtn')?.addEventListener('click', () => this.createNewReport());

        // 词汇分类标签
        $$('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterVocabulary(e.target.dataset.category));
        });

        // 错误模态框关闭
        $('#closeErrorModal')?.addEventListener('click', () => {
            $('#errorModal').classList.remove('active');
        });

        // 点击模态框外部关闭
        $('#errorModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'errorModal') {
                $('#errorModal').classList.remove('active');
            }
        });

        // API密钥回车保存
        $('#apiKey')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey();
            }
        });
    }

    // 保存API密钥
    saveApiKey() {
        const apiKey = $('#apiKey').value.trim();
        if (!apiKey) {
            showError(CONFIG.ERROR_MESSAGES.API_KEY_MISSING);
            return;
        }

        nanoBananaAPI.setApiKey(apiKey);
        showSuccess(CONFIG.SUCCESS_MESSAGES.API_KEY_SAVED);

        // 测试API密钥是否有效
        this.testApiKey(apiKey);
    }

    // 测试API密钥
    async testApiKey(apiKey) {
        try {
            const result = await nanoBananaAPI.validateApiKey();
            if (result.valid) {
                console.log('API密钥验证成功');
            } else {
                showError(result.message);
            }
        } catch (error) {
            console.error('API密钥验证失败:', error);
        }
    }

    // 处理主题表单提交
    async handleTopicSubmit(e) {
        e.preventDefault();

        const topic = $('#topic').value.trim();
        const title = $('#title').value.trim();

        // 验证输入
        if (!topic) {
            showError(CONFIG.ERROR_MESSAGES.EMPTY_TOPIC);
            return;
        }

        if (!title) {
            showError(CONFIG.ERROR_MESSAGES.EMPTY_TITLE);
            return;
        }

        // 检查API密钥
        if (!nanoBananaAPI.getApiKey()) {
            showError(CONFIG.ERROR_MESSAGES.API_KEY_MISSING);
            return;
        }

        // 生成词汇
        await this.generateVocabulary(topic, title);
    }

    // 生成词汇
    async generateVocabulary(topic, title) {
        // 显示加载状态
        const loader = createLoader('step2', '正在生成词汇列表...');

        try {
            // 调用词汇生成引擎
            const vocabulary = await vocabularyEngine.generateVocabulary(topic, {
                useCache: true,
                useAI: true
            });

            if (!vocabulary || vocabulary.length < CONFIG.VOCABULARY_COUNT.TOTAL_MIN) {
                throw new Error('生成的词汇数量不足');
            }

            // 保存词汇
            this.currentVocabulary = vocabulary;

            // 保存到历史
            vocabularyEngine.saveToHistory(topic, title, vocabulary);

            // 显示词汇列表
            this.displayVocabulary(vocabulary);

            // 切换到词汇确认步骤
            this.showStep(CONFIG.UI.STEPS.VOCABULARY);

        } catch (error) {
            console.error('生成词汇失败:', error);
            showError(error.message || '生成词汇失败，请重试');
        } finally {
            removeLoader(loader);
        }
    }

    // 显示词汇列表
    displayVocabulary(vocabulary) {
        const container = $('#vocabularyList');
        if (!container) return;

        container.innerHTML = '';

        vocabulary.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'vocabulary-item';
            itemEl.dataset.category = item.category;
            itemEl.dataset.index = index;

            itemEl.innerHTML = `
                <div class="word-content">
                    <div class="hanzi">${item.hanzi}</div>
                    <div class="pinyin">${item.pinyin}</div>
                    <div class="category">${CONFIG.CATEGORY_NAMES[item.category]}</div>
                </div>
            `;

            // 点击选择/取消选择
            itemEl.addEventListener('click', () => {
                itemEl.classList.toggle('selected');
            });

            container.appendChild(itemEl);
        });

        // 默认全选
        $$('.vocabulary-item').forEach(item => {
            item.classList.add('selected');
        });
    }

    // 筛选词汇
    filterVocabulary(category) {
        // 更新标签状态
        $$('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        // 筛选词汇项
        const items = $$('.vocabulary-item');
        items.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // 重新生成词汇
    async regenerateVocabulary() {
        const topic = $('#topic').value.trim();
        const title = $('#title').value.trim();

        if (!topic || !title) return;

        // 清除缓存
        vocabularyEngine.cache = {};

        // 重新生成
        await this.generateVocabulary(topic, title);
    }

    // 确认词汇
    confirmVocabulary() {
        // 获取选中的词汇
        const selectedItems = $$('.vocabulary-item.selected');
        if (selectedItems.length < CONFIG.VOCABULARY_COUNT.TOTAL_MIN) {
            showError(`请至少选择${CONFIG.VOCABULARY_COUNT.TOTAL_MIN}个词汇`);
            return;
        }

        // 更新当前词汇列表
        this.currentVocabulary = Array.from(selectedItems).map(item => {
            const index = parseInt(item.dataset.index);
            return this.currentVocabulary[index];
        });

        // 生成提示词
        this.generatePrompt();
    }

    // 生成提示词
    generatePrompt() {
        const topic = $('#topic').value.trim();
        const title = $('#title').value.trim();

        // 生成完整提示词
        const fullPrompt = this.promptTemplate.generatePrompt(topic, title, this.currentVocabulary);

        // 开始生成图片
        this.startGeneration(fullPrompt);
    }

    // 开始生成图片
    async startGeneration(prompt) {
        // 切换到生成步骤
        this.showStep(CONFIG.UI.STEPS.GENERATING);

        try {
            // 创建生成任务
            const result = await nanoBananaAPI.generateImage(prompt, {
                aspectRatio: CONFIG.DEFAULT_ASPECT_RATIO,
                resolution: CONFIG.DEFAULT_RESOLUTION,
                onTaskCreated: (task) => {
                    this.currentTask = task;
                    $('#taskId').textContent = `任务ID: ${task.taskId}`;
                },
                onProgress: (status, attempts) => {
                    this.updateProgress(status, attempts);
                }
            });

            if (result.success) {
                // 生成成功
                this.handleGenerationSuccess(result);
            } else {
                // 生成失败
                this.handleGenerationError(result);
            }

        } catch (error) {
            console.error('生成失败:', error);
            this.handleGenerationError({ error: error.message });
        }
    }

    // 更新进度
    updateProgress(status, attempts) {
        // 更新进度条
        const progress = Math.min((attempts / 30) * 100, 90); // 假设30次查询完成90%
        $('#progressFill').style.width = `${progress}%`;

        // 更新状态文本
        let statusText = '正在生成中...';
        switch (status.state) {
            case 'waiting':
                statusText = '等待处理中...';
                break;
            case 'processing':
                statusText = 'AI正在绘画中...';
                break;
        }

        $('#progressText').textContent = statusText;

        // 添加状态指示器
        this.addStatusIndicator(status.state);
    }

    // 添加状态指示器
    addStatusIndicator(state) {
        let container = $('.status-indicator');
        if (!container) {
            container = document.createElement('div');
            container.className = 'status-indicator';
            $('#progressText').after(container);
        }

        container.className = `status-indicator ${state}`;
        container.textContent = this.getStatusText(state);
    }

    // 获取状态文本
    getStatusText(state) {
        const statusTexts = {
            'waiting': '等待中',
            'processing': '生成中',
            'success': '已完成',
            'failed': '失败'
        };
        return statusTexts[state] || '未知状态';
    }

    // 处理生成成功
    handleGenerationSuccess(result) {
        // 完成进度条
        $('#progressFill').style.width = '100%';
        $('#progressText').textContent = '生成完成！';

        // 保存任务记录
        nanoBananaAPI.saveTask(result);

        // 显示结果
        this.displayResult(result.result);

        // 切换到结果步骤
        setTimeout(() => {
            this.showStep(CONFIG.UI.STEPS.RESULT);
        }, 1000);
    }

    // 处理生成错误
    handleGenerationError(error) {
        console.error('生成错误:', error);

        // 显示错误信息
        $('#progressText').textContent = '生成失败';
        $('#progressFill').style.backgroundColor = 'var(--danger-color)';

        // 显示错误模态框
        setTimeout(() => {
            showError(error.error || CONFIG.ERROR_MESSAGES.GENERATION_ERROR);

            // 返回上一步
            setTimeout(() => {
                this.showStep(CONFIG.UI.STEPS.VOCABULARY);
            }, 1000);
        }, 1000);
    }

    // 显示结果
    displayResult(result) {
        const container = $('#reportPreview');
        if (!container || !result || !result.urls || !result.urls.length) {
            container.innerHTML = '<div class="placeholder">没有生成的图片</div>';
            return;
        }

        const imageUrl = result.urls[0];
        container.innerHTML = `
            <img src="${imageUrl}" alt="生成的识字小报" />
        `;

        // 保存图片URL供下载使用
        this.currentImageUrl = imageUrl;
    }

    // 下载图片
    downloadImage() {
        if (!this.currentImageUrl) {
            showError('没有可下载的图片');
            return;
        }

        const topic = $('#topic').value.trim();
        const title = $('#title').value.trim();
        const filename = `${title}_${formatTime(Date.now()).replace(/[^\d]/g, '')}.png`;

        downloadFile(this.currentImageUrl, filename);
    }

    // 重新生成图片
    regenerateImage() {
        // 确认对话框
        if (confirm('确定要重新生成图片吗？之前的图片将会丢失。')) {
            // 重新生成提示词
            this.generatePrompt();
        }
    }

    // 创建新的报告
    createNewReport() {
        // 重置表单
        $('#topicForm').reset();

        // 清空数据
        this.currentVocabulary = [];
        this.currentTask = null;
        this.currentImageUrl = null;

        // 重置进度条
        $('#progressFill').style.width = '0%';
        $('#progressText').textContent = '正在调用AI生成...';

        // 返回第一步
        this.showStep(CONFIG.UI.STEPS.INPUT);
    }

    // 取消生成
    cancelGeneration() {
        if (this.currentTask) {
            nanoBananaAPI.cancelTask(this.currentTask.taskId);
            this.currentTask = null;
        }

        // 停止轮询
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }

        // 返回上一步
        this.showStep(CONFIG.UI.STEPS.VOCABULARY);
    }

    // 显示步骤
    showStep(stepId) {
        // 隐藏所有步骤
        $$('.step').forEach(step => {
            step.classList.remove('active');
        });

        // 显示目标步骤
        const targetStep = $(`#${stepId}`);
        if (targetStep) {
            // 使用setTimeout确保动画效果
            setTimeout(() => {
                targetStep.classList.add('active');
            }, 50);
        }

        this.currentStep = stepId;

        // 滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 确保所有依赖都已加载
    if (typeof CONFIG === 'undefined' ||
        typeof storage === 'undefined' ||
        typeof nanoBananaAPI === 'undefined' ||
        typeof vocabularyEngine === 'undefined' ||
        typeof PromptTemplate === 'undefined') {
        console.error('缺少必要的依赖模块');
        alert('应用加载失败，请刷新页面重试');
        return;
    }

    // 创建应用实例
    window.reportApp = new ReportApp();
});

// 防止页面刷新时丢失数据
window.addEventListener('beforeunload', (e) => {
    // 如果正在生成，提示用户
    if (window.reportApp && window.reportApp.currentTask) {
        e.preventDefault();
        e.returnValue = '正在生成图片，确定要离开吗？';
    }
});

// 导出应用类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportApp;
}