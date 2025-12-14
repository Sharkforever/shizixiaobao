// Nano Banana Pro API 封装
class NanoBananaAPI {
    constructor() {
        this.apiKey = null;
        this.baseURL = CONFIG.NANOBANANA_API_BASE_URL;
        this.apiVersion = CONFIG.API_VERSION;
        this.activeTasks = new Map(); // 存储活跃的任务
    }

    // 设置API密钥
    setApiKey(key) {
        this.apiKey = key;
        // 保存到本地存储
        storage.set(CONFIG.STORAGE_KEYS.API_KEY, key);
    }

    // 获取API密钥
    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = storage.get(CONFIG.STORAGE_KEYS.API_KEY);
        }
        return this.apiKey;
    }

    // 创建生成任务
    async createTask(prompt, options = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new AppError(CONFIG.ERROR_MESSAGES.API_KEY_MISSING, 'auth');
        }

        const {
            aspectRatio = CONFIG.DEFAULT_ASPECT_RATIO,
            resolution = CONFIG.DEFAULT_RESOLUTION,
            outputFormat = CONFIG.DEFAULT_FORMAT,
            imageInput = []
        } = options;

        const requestBody = {
            model: 'nano-banana-pro',
            input: {
                prompt: prompt,
                image_input: imageInput,
                aspect_ratio: aspectRatio,
                resolution: resolution,
                output_format: outputFormat
            }
        };

        try {
            const response = await fetch(`${this.baseURL}/api/${this.apiVersion}/jobs/createTask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.msg || `HTTP ${response.status}: ${response.statusText}`;

                if (response.status === 401) {
                    throw new AppError(CONFIG.ERROR_MESSAGES.API_KEY_INVALID, 'auth');
                } else if (response.status === 402) {
                    throw new AppError('账户余额不足', 'payment');
                } else {
                    throw new AppError(errorMessage, 'api');
                }
            }

            const data = await response.json();

            if (data.code !== 200) {
                throw new AppError(data.msg || '创建任务失败', 'api');
            }

            return {
                taskId: data.data.taskId,
                createdAt: Date.now()
            };

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new AppError(CONFIG.ERROR_MESSAGES.NETWORK_ERROR, 'network');
            }
            throw new AppError('创建任务时发生错误', 'general');
        }
    }

    // 查询任务状态
    async queryTaskStatus(taskId) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new AppError(CONFIG.ERROR_MESSAGES.API_KEY_MISSING, 'auth');
        }

        try {
            const url = `${this.baseURL}/api/${this.apiVersion}/jobs/recordInfo?taskId=${taskId}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.code !== 200) {
                throw new Error(data.msg || '查询任务状态失败');
            }

            const taskData = data.data;

            // 解析任务参数
            let params = {};
            try {
                params = JSON.parse(taskData.param || '{}');
            } catch (error) {
                console.error('解析任务参数失败:', error);
            }

            // 解析结果
            let result = null;
            if (taskData.state === 'success' && taskData.resultJson) {
                try {
                    const resultData = JSON.parse(taskData.resultJson);
                    result = {
                        urls: resultData.resultUrls || [],
                        object: resultData.resultObject || null
                    };
                } catch (error) {
                    console.error('解析任务结果失败:', error);
                }
            }

            return {
                taskId: taskData.taskId,
                model: taskData.model,
                state: taskData.state, // waiting, success, fail
                params: params,
                result: result,
                failCode: taskData.failCode,
                failMsg: taskData.failMsg,
                costTime: taskData.costTime,
                completeTime: taskData.completeTime,
                createTime: taskData.createTime
            };

        } catch (error) {
            console.error('查询任务状态失败:', error);
            throw new AppError('查询任务状态失败', 'api');
        }
    }

    // 轮询任务直到完成
    async pollTaskUntilComplete(taskId, options = {}) {
        const {
            interval = CONFIG.POLLING.INTERVAL,
            maxAttempts = CONFIG.POLLING.MAX_ATTEMPTS,
            timeout = CONFIG.POLLING.TIMEOUT,
            onProgress = null
        } = options;

        let attempts = 0;
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const poll = async () => {
                attempts++;

                try {
                    // 检查超时
                    if (Date.now() - startTime > timeout) {
                        reject(new AppError(CONFIG.ERROR_MESSAGES.TASK_TIMEOUT, 'timeout'));
                        return;
                    }

                    // 检查最大尝试次数
                    if (attempts > maxAttempts) {
                        reject(new AppError('任务轮询次数超限', 'timeout'));
                        return;
                    }

                    // 查询状态
                    const status = await this.queryTaskStatus(taskId);

                    // 调用进度回调
                    if (onProgress) {
                        onProgress(status, attempts);
                    }

                    // 检查任务状态
                    if (status.state === 'success') {
                        resolve(status);
                        return;
                    } else if (status.state === 'fail') {
                        const errorMsg = status.failMsg || CONFIG.ERROR_MESSAGES.TASK_FAILED;
                        reject(new AppError(errorMsg, 'task_failed'));
                        return;
                    }

                    // 继续轮询
                    setTimeout(poll, interval);

                } catch (error) {
                    reject(error);
                }
            };

            // 开始轮询
            poll();
        });
    }

    // 生成图片（完整的生成流程）
    async generateImage(prompt, options = {}) {
        const {
            onProgress = null,
            onTaskCreated = null
        } = options;

        try {
            // 1. 创建任务
            const task = await this.createTask(prompt, options);

            if (onTaskCreated) {
                onTaskCreated(task);
            }

            // 2. 轮询直到完成
            const result = await this.pollTaskUntilComplete(task.taskId, {
                onProgress: onProgress
            });

            return {
                taskId: task.taskId,
                success: true,
                result: result.result,
                costTime: result.costTime,
                completeTime: result.completeTime
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                type: error.type || 'general'
            };
        }
    }

    // 取消任务（通过停止轮询实现）
    cancelTask(taskId) {
        // 从活跃任务列表中移除
        if (this.activeTasks.has(taskId)) {
            const timer = this.activeTasks.get(taskId);
            clearTimeout(timer);
            this.activeTasks.delete(taskId);
            return true;
        }
        return false;
    }

    // 批量生成
    async batchGenerate(prompts, options = {}) {
        const {
            concurrency = 3, // 并发数
            onItemProgress = null,
            onBatchProgress = null
        } = options;

        const results = [];
        let completed = 0;

        // 分批处理
        for (let i = 0; i < prompts.length; i += concurrency) {
            const batch = prompts.slice(i, i + concurrency);

            const batchPromises = batch.map(async (prompt, index) => {
                const globalIndex = i + index;

                try {
                    const result = await this.generateImage(prompt, {
                        onProgress: (status, attempts) => {
                            if (onItemProgress) {
                                onItemProgress(globalIndex, status, attempts);
                            }
                        }
                    });

                    completed++;

                    if (onBatchProgress) {
                        onBatchProgress(completed, prompts.length, result);
                    }

                    return { index: globalIndex, ...result };

                } catch (error) {
                    completed++;

                    if (onBatchProgress) {
                        onBatchProgress(completed, prompts.length, {
                            success: false,
                            error: error.message
                        });
                    }

                    return {
                        index: globalIndex,
                        success: false,
                        error: error.message
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        // 按原始顺序排序
        results.sort((a, b) => a.index - b.index);
        return results.map(r => {
            delete r.index;
            return r;
        });
    }

    // 获取任务列表（从本地存储）
    getTaskList() {
        return storage.get('task_list', []);
    }

    // 保存任务到列表
    saveTask(taskInfo) {
        const taskList = this.getTaskList();
        taskList.unshift({
            ...taskInfo,
            savedAt: Date.now()
        });

        // 限制列表长度
        if (taskList.length > 100) {
            taskList.splice(100);
        }

        storage.set('task_list', taskList);
    }

    // 删除任务记录
    deleteTask(taskId) {
        const taskList = this.getTaskList();
        const index = taskList.findIndex(t => t.taskId === taskId);
        if (index !== -1) {
            taskList.splice(index, 1);
            storage.set('task_list', taskList);
            return true;
        }
        return false;
    }

    // 清理任务记录
    clearTaskList() {
        storage.remove('task_list');
    }

    // 检查API密钥有效性
    async validateApiKey() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            return { valid: false, message: '未设置API密钥' };
        }

        try {
            // 尝试创建一个简单的测试任务
            const testResult = await this.createTask('test image', { resolution: '1K' });
            return { valid: true, message: 'API密钥有效' };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }
}

// 创建全局实例
const nanoBananaAPI = new NanoBananaAPI();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NanoBananaAPI, nanoBananaAPI };
} else if (typeof window !== 'undefined') {
    window.NanoBananaAPI = NanoBananaAPI;
    window.nanoBananaAPI = nanoBananaAPI;
}