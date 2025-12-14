// 工具函数集合

// DOM操作辅助函数
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 本地存储操作
const storage = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Storage set error:', error);
        }
    },

    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Storage remove error:', error);
        }
    },

    clear() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Storage clear error:', error);
        }
    }
};

// 错误处理
class AppError extends Error {
    constructor(message, type = 'general') {
        super(message);
        this.name = 'AppError';
        this.type = type;
    }
}

// 显示错误消息
function showError(message, duration = 5000) {
    const errorModal = $('#errorModal');
    const errorMessage = $('#errorMessage');

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    if (errorModal) {
        errorModal.classList.add('active');

        // 自动关闭
        setTimeout(() => {
            errorModal.classList.remove('active');
        }, duration);
    } else {
        // 如果模态框不存在，使用alert
        alert(message);
    }
}

// 显示成功消息
function showSuccess(message) {
    // 创建成功提示元素
    const successTip = document.createElement('div');
    successTip.className = 'success-tip';
    successTip.innerHTML = `
        <div class="success-content">
            <span class="success-icon">✓</span>
            <span class="success-message">${message}</span>
        </div>
    `;

    // 添加样式
    successTip.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(successTip);

    // 3秒后自动移除
    setTimeout(() => {
        successTip.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(successTip);
        }, 300);
    }, 3000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .success-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .success-icon {
        font-weight: bold;
        font-size: 18px;
    }
`;
document.head.appendChild(style);

// 步骤切换
function switchStep(fromStep, toStep) {
    const fromElement = $(`#${fromStep}`);
    const toElement = $(`#${toStep}`);

    if (fromElement) {
        fromElement.classList.remove('active');
    }

    if (toElement) {
        setTimeout(() => {
            toElement.classList.add('active');
            // 滚动到顶部
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, CONFIG.UI.ANIMATION_DURATION);
    }
}

// 生成随机ID
function generateId(prefix = '', length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = prefix;
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// 下载文件
function downloadFile(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `识字小报_${formatTime(Date.now()).replace(/[^\d]/g, '')}.png`;
    link.target = '_blank';

    // 处理跨域图片
    if (url.startsWith('http')) {
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                link.href = blobUrl;
                link.click();
                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            })
            .catch(error => {
                console.error('Download error:', error);
                showError(CONFIG.ERROR_MESSAGES.DOWNLOAD_ERROR);
            });
    } else {
        link.click();
    }
}

// 验证输入
function validateInput(value, rules = {}) {
    const {
        required = false,
        minLength = 0,
        maxLength = Infinity,
        pattern = null
    } = rules;

    if (required && !value) {
        return { valid: false, message: '此字段为必填项' };
    }

    if (value && value.length < minLength) {
        return { valid: false, message: `最少需要${minLength}个字符` };
    }

    if (value && value.length > maxLength) {
        return { valid: false, message: `最多允许${maxLength}个字符` };
    }

    if (pattern && value && !pattern.test(value)) {
        return { valid: false, message: '格式不正确' };
    }

    return { valid: true };
}

// 获取图片尺寸比例
function getAspectRatio(aspectRatio) {
    const ratios = {
        '1:1': { width: 1, height: 1 },
        '2:3': { width: 2, height: 3 },
        '3:2': { width: 3, height: 2 },
        '3:4': { width: 3, height: 4 },
        '4:3': { width: 4, height: 3 },
        '4:5': { width: 4, height: 5 },
        '5:4': { width: 5, height: 4 },
        '9:16': { width: 9, height: 16 },
        '16:9': { width: 16, height: 9 },
        '21:9': { width: 21, height: 9 }
    };
    return ratios[aspectRatio] || ratios['3:4'];
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 复制到剪贴板
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            showSuccess('已复制到剪贴板');
        } else {
            // 兼容旧浏览器
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showSuccess('已复制到剪贴板');
        }
    } catch (error) {
        console.error('Copy error:', error);
        showError('复制失败');
    }
}

// 创建加载动画
function createLoader(containerId, message = '加载中...') {
    const container = $(`#${containerId}`);
    if (!container) return null;

    const loader = document.createElement('div');
    loader.className = 'custom-loader';
    loader.innerHTML = `
        <div class="loader-spinner"></div>
        <p class="loader-message">${message}</p>
    `;

    // 添加样式
    loader.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--text-secondary);
    `;

    const style = document.createElement('style');
    style.textContent = `
        .loader-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--border-color);
            border-top-color: var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }
        .loader-message {
            margin: 0;
            font-size: 16px;
        }
    `;
    if (!$('style[data-loader]')) {
        style.setAttribute('data-loader', 'true');
        document.head.appendChild(style);
    }

    container.appendChild(loader);
    return loader;
}

// 移除加载动画
function removeLoader(loader) {
    if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
    }
}

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        $,
        $$,
        debounce,
        throttle,
        formatTime,
        storage,
        AppError,
        showError,
        showSuccess,
        switchStep,
        generateId,
        downloadFile,
        validateInput,
        getAspectRatio,
        formatFileSize,
        copyToClipboard,
        createLoader,
        removeLoader
    };
}