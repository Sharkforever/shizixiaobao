// 主应用
class LiteracyReportApp {
    constructor() {
        this.nanobananaAPI = null;
        this.llmManager = new LLMManager();
        this.vocabularyManager = new VocabularyManager();
        this.promptGenerator = new PromptGenerator();
        this.currentTopic = '';
        this.currentTitle = '';
        this.generationTaskId = null;

        this.init();
    }

    async init() {
        // 初始化LLM提供商
        this.initLLMProviders();

        // 加载保存的配置
        this.loadSavedConfigs();

        // 初始化API客户端
        this.initAPIClients();

        // 初始化LLM界面
        this.initLLMInterface();

        // 绑定事件
        this.bindEvents();

        // 显示第一步
        showStep('step1');
    }

    // 初始化LLM提供商
    initLLMProviders() {
        // 注册所有可用的LLM提供商
        this.llmManager.registerProvider('siliconflow', SiliconFlowProvider);
        this.llmManager.registerProvider('zhipu', ZhipuProvider);
        this.llmManager.registerProvider('openai', OpenAIProvider);
        this.llmManager.registerProvider('anthropic', AnthropicProvider);
    }

    // 初始化LLM界面
    initLLMInterface() {
        // 填充提供商选择下拉框
        const providerSelect = $('#llmProvider');
        if (providerSelect) {
            // 清空现有选项
            providerSelect.innerHTML = '<option value="">请选择提供商</option>';

            // 添加提供商选项
            Object.entries(CONFIG.LLM_PROVIDERS).forEach(([key, provider]) => {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = provider.name;
                providerSelect.appendChild(option);
            });

            // 设置默认值
            providerSelect.value = CONFIG.DEFAULT_LLM_PROVIDER;
            this.updateProviderFields();
        }
    }

    // 更新提供商相关字段
    updateProviderFields() {
        const providerSelect = $('#llmProvider');
        const urlInput = $('#llmUrl');
        const modelSelect = $('#llmModel');
        const description = $('#providerDescription');

        if (!providerSelect.value) {
            urlInput.value = '';
            urlInput.readOnly = true;
            modelSelect.innerHTML = '<option value="">请先选择提供商</option>';
            modelSelect.disabled = true;
            description.textContent = '';
            return;
        }

        const provider = CONFIG.LLM_PROVIDERS[providerSelect.value];
        if (provider) {
            // 更新URL
            urlInput.value = provider.baseUrl;
            urlInput.readOnly = true;

            // 更新描述
            description.textContent = provider.description;

            // 加载模型列表
            this.loadModels(providerSelect.value);
        }
    }

    // 加载模型列表
    async loadModels(providerName) {
        const modelSelect = $('#llmModel');
        modelSelect.innerHTML = '<option value="">加载中...</option>';
        modelSelect.disabled = true;

        try {
            // 创建临时提供商实例来获取模型列表
            const ProviderClass = window.LLM_PROVIDER_MAP[providerName];
            if (ProviderClass) {
                const tempProvider = new ProviderClass('temp_key');
                const models = await tempProvider.getModels();

                modelSelect.innerHTML = '';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.name;
                    modelSelect.appendChild(option);
                });

                // 设置默认模型
                const defaultModel = CONFIG.LLM_PROVIDERS[providerName].defaultModel;
                if (defaultModel) {
                    modelSelect.value = defaultModel;
                }
            }
        } catch (error) {
            console.warn('加载模型列表失败:', error);
            // 使用默认模型
            const defaultModel = CONFIG.LLM_PROVIDERS[providerName].defaultModel;
            modelSelect.innerHTML = `<option value="${defaultModel}">${defaultModel}</option>`;
            modelSelect.value = defaultModel;
        }

        modelSelect.disabled = false;
    }

    // 加载保存的配置
    loadSavedConfigs() {
        const nanobananaConfig = loadConfig(CONFIG.STORAGE_KEYS.NANOBANANA);

        if (nanobananaConfig) {
            $('#nanobananaUrl').value = nanobananaConfig.url || CONFIG.DEFAULTS.nanobanana.url;
            $('#nanobananaKey').value = nanobananaConfig.key || '';
        }

        // 加载LLM配置（如果有保存的配置）
        const savedLLMProvider = localStorage.getItem('llm_current_provider');
        if (savedLLMProvider) {
            const config = this.llmManager.getProviderConfig(savedLLMProvider);
            if (config) {
                $('#llmProvider').value = savedLLMProvider;
                this.updateProviderFields();
                $('#llmModel').value = config.model || CONFIG.LLM_PROVIDERS[savedLLMProvider].defaultModel;
                $('#llmKey').value = config.apiKey || '';
                $('#llmUrl').value = config.baseUrl || CONFIG.LLM_PROVIDERS[savedLLMProvider].baseUrl;
            }
        }
    }

    // 初始化API客户端
    initAPIClients() {
        const nanobananaUrl = $('#nanobananaUrl').value;
        const nanobananaKey = $('#nanobananaKey').value;

        if (nanobananaKey) {
            this.nanobananaAPI = new NanoBananaAPI(nanobananaUrl, nanobananaKey);
        }

        // 初始化LLM提供商
        const currentProvider = this.llmManager.getCurrentConfig();
        if (currentProvider && currentProvider.name && currentProvider.apiKey) {
            try {
                this.llmManager.setCurrentProvider(currentProvider.name, currentProvider.apiKey, currentProvider.model);
            } catch (error) {
                console.warn('初始化LLM提供商失败:', error);
            }
        }
    }

    // 绑定事件
    bindEvents() {
        // API配置相关
        $('#saveNanobananaConfig')?.addEventListener('click', () => this.saveNanobananaConfig());
        $('#saveLlmConfig')?.addEventListener('click', () => this.saveLlmConfig());
        $('#testLlmConnection')?.addEventListener('click', () => this.testLlmConnection());

        // LLM提供商相关
        $('#llmProvider')?.addEventListener('change', () => this.updateProviderFields());
        $('#unlockUrl')?.addEventListener('click', () => this.toggleUrlInput());

        // 表单提交
        $('#topicForm')?.addEventListener('submit', (e) => this.handleTopicSubmit(e));

        // 词汇相关按钮
        $('#regenerateBtn')?.addEventListener('click', () => this.regenerateVocabulary());
        $('#confirmBtn')?.addEventListener('click', () => this.confirmVocabulary());

        // 生成相关按钮
        $('#cancelBtn')?.addEventListener('click', () => this.cancelGeneration());

        // 结果相关按钮
        $('#downloadBtn')?.addEventListener('click', () => this.downloadImage());
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
    }

    // 保存Nano Banana Pro配置
    async saveNanobananaConfig() {
        const url = $('#nanobananaUrl').value.trim();
        const key = $('#nanobananaKey').value.trim();

        if (!key) {
            showError(CONFIG.ERROR_MESSAGES.API_KEY_MISSING);
            return;
        }

        if (!isValidUrl(url)) {
            showError('请输入有效的API地址');
            return;
        }

        const config = { url, key };

        if (saveConfig(CONFIG.STORAGE_KEYS.NANOBANANA, config)) {
            this.nanobananaAPI = new NanoBananaAPI(url, key);
            showStatus('nanobananaStatus', 'success', '✓ 已保存');
            showSuccess(CONFIG.SUCCESS_MESSAGES.API_KEY_SAVED);
        }
    }

    // 保存LLM配置
    async saveLlmConfig() {
        const provider = $('#llmProvider').value;
        const url = $('#llmUrl').value.trim();
        const key = $('#llmKey').value.trim();
        const model = $('#llmModel').value;

        if (!provider) {
            showError('请选择LLM提供商');
            return;
        }

        if (!key) {
            showError(CONFIG.ERROR_MESSAGES.API_KEY_MISSING);
            return;
        }

        if (!model) {
            showError('请选择模型');
            return;
        }

        try {
            // 设置当前提供商（包含模型信息）
            this.llmManager.setCurrentProvider(provider, key, model);

            // 保存配置
            const config = {
                provider: provider,
                baseUrl: url,
                model: model,
                apiKey: key
            };

            // 保存到localStorage
            localStorage.setItem('llm_current_provider', provider);
            this.llmManager.saveProviderConfig(provider, config);

            showStatus('llmStatus', 'success', '✓ 已保存');
            showSuccess(CONFIG.SUCCESS_MESSAGES.API_KEY_SAVED);

            // 更新API客户端
            this.initAPIClients();
        } catch (error) {
            showError(`保存配置失败: ${error.message}`);
        }
    }

    // 测试LLM连接
    async testLlmConnection() {
        const provider = $('#llmProvider').value;
        const key = $('#llmKey').value.trim();
        const model = $('#llmModel').value;

        if (!provider || !key) {
            showError('请先选择提供商并输入API密钥');
            return;
        }

        const testBtn = $('#testLlmConnection');
        setLoading(testBtn, true);

        try {
            // 创建临时提供商实例进行测试
            const ProviderClass = window.LLM_PROVIDER_MAP[provider];
            if (!ProviderClass) {
                throw new Error('未知的提供商');
            }

            const tempProvider = new ProviderClass(key, model);
            const result = await tempProvider.testConnection();

            if (result.success) {
                showStatus('llmStatus', 'success', '✓ 连接成功');
                showSuccess('LLM API连接测试成功');
                console.log('API响应:', result.response);
            } else {
                showStatus('llmStatus', 'error', '✗ 连接失败');

                // 显示更详细的错误信息
                let errorMessage = `连接测试失败: ${result.error}`;
                if (result.status) {
                    errorMessage += ` (HTTP ${result.status})`;
                }

                showError(errorMessage);

                // 提供可能的解决方案
                if (result.error.includes('CORS')) {
                    console.warn('CORS错误提示：请使用本地服务器运行应用');
                    alert('检测到CORS错误。请使用本地服务器运行：\n1. 进入项目目录\n2. 运行: python3 -m http.server 8000\n3. 访问: http://localhost:8000');
                } else if (result.error.includes('401') || result.error.includes('invalid')) {
                    console.warn('认证错误：请检查API密钥是否正确');
                    alert('API密钥无效，请检查：\n1. API密钥是否正确\n2. 账户是否有足够余额\n3. API密钥是否已过期');
                }
            }
        } catch (error) {
            showStatus('llmStatus', 'error', '✗ 连接失败');
            showError(`连接测试失败: ${error.message}`);

            if (error.message.includes('Failed to fetch')) {
                console.warn('网络错误提示：可能是CORS问题或网络连接问题');
                alert('网络连接失败。可能的原因：\n1. CORS限制（需使用本地服务器）\n2. 网络连接问题\n3. API地址不正确');
            }
        } finally {
            setLoading(testBtn, false);
        }
    }

    // 切换URL输入状态
    toggleUrlInput() {
        const urlInput = $('#llmUrl');
        const unlockBtn = $('#unlockUrl');

        if (urlInput.readOnly) {
            urlInput.readOnly = false;
            urlInput.style.backgroundColor = '#fff';
            unlockBtn.textContent = '锁定地址';
            unlockBtn.classList.add('btn-warning');
        } else {
            urlInput.readOnly = true;
            urlInput.style.backgroundColor = '#f5f5f5';
            unlockBtn.textContent = '自定义地址';
            unlockBtn.classList.remove('btn-warning');

            // 恢复默认地址
            const provider = $('#llmProvider').value;
            if (provider && CONFIG.LLM_PROVIDERS[provider]) {
                urlInput.value = CONFIG.LLM_PROVIDERS[provider].baseUrl;
            }
        }
    }

    // 处理主题表单提交
    async handleTopicSubmit(e) {
        e.preventDefault();

        const topic = $('#topic').value.trim();
        const title = $('#title').value.trim();

        if (!topic) {
            showError(CONFIG.ERROR_MESSAGES.EMPTY_TOPIC);
            return;
        }

        if (!title) {
            showError(CONFIG.ERROR_MESSAGES.EMPTY_TITLE);
            return;
        }

        // 检查API配置
        if (!this.llmManager.getCurrentProvider()) {
            showError('请先配置词汇生成LLM API');
            return;
        }

        this.currentTopic = topic;
        this.currentTitle = title;

        try {
            // 生成词汇
            await this.generateVocabulary(topic, title);
        } catch (error) {
            showError(`生成词汇失败: ${error.message}`);
        }
    }

    // 生成词汇
    async generateVocabulary(topic, title) {
        showStep('step2');

        const vocabularyList = $('#vocabularyList');
        vocabularyList.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="loading-spinner"></div>
                <p style="margin-top: 16px; color: var(--text-secondary);">正在生成词汇...</p>
            </div>
        `;

        try {
            const vocabulary = await this.llmManager.generateVocabulary(topic, title);
            this.displayVocabulary(vocabulary);
            showSuccess(CONFIG.SUCCESS_MESSAGES.VOCABULARY_GENERATED);
        } catch (error) {
            vocabularyList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--danger-color);">
                    <p>生成失败: ${error.message}</p>
                    <button onclick="app.generateVocabulary('${topic}', '${title}')" class="btn-secondary" style="margin-top: 16px;">重试</button>
                </div>
            `;
            throw error;
        }
    }

    // 显示词汇
    displayVocabulary(vocabulary) {
        this.vocabularyManager.vocabulary = vocabulary;
        this.vocabularyManager.setFilter('all');

        const vocabularyList = $('#vocabularyList');
        vocabularyList.innerHTML = this.vocabularyManager.formatVocabularyHTML(
            this.vocabularyManager.getFilteredVocabulary()
        );

        // 更新统计信息
        this.updateVocabularyStats();
    }

    // 更新词汇统计
    updateVocabularyStats() {
        const stats = this.vocabularyManager.getStatistics();
        console.log('词汇统计:', stats);
    }

    // 过滤词汇
    filterVocabulary(category) {
        // 更新标签状态
        $$('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        // 更新词汇列表
        this.vocabularyManager.setFilter(category);
        const vocabularyList = $('#vocabularyList');
        vocabularyList.innerHTML = this.vocabularyManager.formatVocabularyHTML(
            this.vocabularyManager.getFilteredVocabulary()
        );
    }

    // 重新生成词汇
    async regenerateVocabulary() {
        await this.generateVocabulary(this.currentTopic, this.currentTitle);
    }

    // 确认使用词汇
    confirmVocabulary() {
        if (!this.vocabularyManager.getVocabulary()) {
            showError('请先生成词汇列表');
            return;
        }

        if (!this.nanobananaAPI) {
            showError('请先配置图片生成API');
            return;
        }

        this.generateReport();
    }

    // 生成小报
    async generateReport() {
        showStep('step3');
        $('#cancelBtn').style.display = 'inline-block';

        try {
            // 生成提示词
            const vocabulary = this.vocabularyManager.getVocabulary();
            const prompt = this.promptGenerator.generatePrompt(this.currentTopic, this.currentTitle, vocabulary);

            // 调用API生成图片
            const result = await this.nanobananaAPI.generateImage(prompt, {}, (data, progress) => {
                // 更新进度
                const percentage = Math.min(progress * 100, 95); // 最多显示95%，等待完成
                updateProgress(percentage, this.getProgressText(data.state));
            });

            // 生成成功
            updateProgress(100, '生成成功！');
            setTimeout(() => {
                this.displayResult(result.imageUrls[0]);
            }, 500);

        } catch (error) {
            updateProgress(0, '生成失败');
            showError(`生成失败: ${error.message}`);
            setTimeout(() => {
                showStep('step2');
            }, 2000);
        }
    }

    // 获取进度文本
    getProgressText(state) {
        const stateMap = {
            'waiting': '任务已提交，等待处理...',
            'running': 'AI正在生成图片，请稍候...',
            'success': '生成完成！'
        };
        return stateMap[state] || '处理中...';
    }

    // 取消生成
    cancelGeneration() {
        this.generationTaskId = null;
        showStep('step2');
    }

    // 显示结果
    displayResult(imageUrl) {
        showStep('step4');

        const reportPreview = $('#reportPreview');
        reportPreview.innerHTML = `
            <img src="${imageUrl}" alt="儿童识字小报" />
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

        try {
            // 生成文件名
            const filename = formatFilename(this.currentTitle, this.currentTopic);

            // 显示下载提示
            const downloadBtn = $('#downloadBtn');
            if (downloadBtn) {
                const originalText = downloadBtn.textContent;
                downloadBtn.textContent = '准备下载...';
                downloadBtn.disabled = true;

                // 恢复按钮状态
                setTimeout(() => {
                    downloadBtn.textContent = originalText;
                    downloadBtn.disabled = false;
                }, 3000);
            }

            // 尝试下载
            downloadImage(this.currentImageUrl, filename);

        } catch (error) {
            console.error('下载图片出错:', error);
            showError(`下载失败: ${error.message}`);
        }
    }

    // 创建新的小报
    createNewReport() {
        // 重置状态
        this.vocabularyManager.vocabulary = null;
        this.currentTopic = '';
        this.currentTitle = '';
        this.currentImageUrl = null;

        // 重置表单
        $('#topicForm').reset();

        // 返回第一步
        showStep('step1');
    }
}

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LiteracyReportApp();
});