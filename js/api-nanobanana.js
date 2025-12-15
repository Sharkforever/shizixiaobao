// Nano Banana Pro API集成
class NanoBananaAPI {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // 移除末尾斜杠
        this.apiKey = apiKey;
    }

    /**
     * 创建生成任务
     * @param {string} prompt - 提示词
     * @param {Object} options - 额外参数
     * @returns {Promise<string>} 任务ID
     */
    async createTask(prompt, options = {}) {
        const requestBody = {
            model: CONFIG.NANOBANANA.MODEL,
            input: {
                prompt: prompt,
                image_input: [],
                aspect_ratio: options.aspectRatio || CONFIG.NANOBANANA.DEFAULT_ASPECT_RATIO,
                resolution: options.resolution || CONFIG.NANOBANANA.DEFAULT_RESOLUTION,
                output_format: options.format || CONFIG.NANOBANANA.DEFAULT_FORMAT
            }
        };

        // 添加回调URL（如果提供）
        if (options.callbackUrl) {
            requestBody.callBackUrl = options.callbackUrl;
        }

        console.log('创建Nano Banana Pro任务:', requestBody);

        const response = await fetch(`${this.baseUrl}/api/v1/jobs/createTask`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok || data.code !== 200) {
            throw new Error(data.msg || `API请求失败: ${response.status}`);
        }

        return data.data.taskId;
    }

    /**
     * 查询任务状态
     * @param {string} taskId - 任务ID
     * @returns {Promise<Object>} 任务状态信息
     */
    async queryTask(taskId) {
        const response = await fetch(`${this.baseUrl}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            }
        });

        const data = await response.json();

        if (!response.ok || data.code !== 200) {
            throw new Error(data.msg || `查询任务状态失败: ${response.status}`);
        }

        return data.data;
    }

    /**
     * 轮询任务直到完成
     * @param {string} taskId - 任务ID
     * @param {Function} onProgress - 进度回调函数
     * @returns {Promise<Object>} 结果信息
     */
    async pollTask(taskId, onProgress = null) {
        let attempts = 0;
        const maxAttempts = CONFIG.POLLING.MAX_ATTEMPTS;
        const interval = CONFIG.POLLING.INTERVAL;

        return new Promise((resolve, reject) => {
            const poll = async () => {
                attempts++;

                try {
                    const data = await this.queryTask(taskId);

                    // 更新进度
                    if (onProgress) {
                        onProgress(data, attempts / maxAttempts);
                    }

                    // 检查任务状态
                    if (data.state === 'success') {
                        // 解析结果
                        const resultJson = JSON.parse(data.resultJson);
                        resolve({
                            success: true,
                            imageUrls: resultJson.resultUrls || [],
                            data: data
                        });
                    } else if (data.state === 'fail') {
                        reject(new Error(data.failMsg || '任务失败'));
                    } else {
                        // 继续轮询
                        if (attempts >= maxAttempts) {
                            reject(new Error('任务超时'));
                        } else {
                            setTimeout(poll, interval);
                        }
                    }
                } catch (error) {
                    if (attempts >= maxAttempts) {
                        reject(error);
                    } else {
                        // 出错时重试
                        setTimeout(poll, interval);
                    }
                }
            };

            // 开始轮询
            poll();
        });
    }

    /**
     * 生成图片（创建任务并轮询）
     * @param {string} prompt - 提示词
     * @param {Object} options - 额外参数
     * @param {Function} onProgress - 进度回调函数
     * @returns {Promise<Object>} 结果信息
     */
    async generateImage(prompt, options = {}, onProgress = null) {
        try {
            // 创建任务
            const taskId = await this.createTask(prompt, options);

            // 轮询任务
            return await this.pollTask(taskId, onProgress);
        } catch (error) {
            console.error('生成图片失败:', error);
            throw error;
        }
    }

    /**
     * 测试API连接
     * @returns {Promise<boolean>} 是否连接成功
     */
    async testConnection() {
        try {
            // 使用一个简单的测试提示词
            const testPrompt = 'A simple test image';
            const taskId = await this.createTask(testPrompt);

            // 立即查询一次，不需要等待完成
            await this.queryTask(taskId);

            return true;
        } catch (error) {
            console.error('Nano Banana Pro API连接测试失败:', error);
            return false;
        }
    }
}