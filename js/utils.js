// 工具函数

// DOM选择器快捷方式
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// 显示成功消息
function showSuccess(message) {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `
        <span class="toast-icon">✓</span>
        <span class="toast-message">${message}</span>
    `;

    // 添加到页面
    document.body.appendChild(toast);

    // 显示动画
    setTimeout(() => toast.classList.add('show'), 10);

    // 3秒后移除
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// 显示错误消息
function showError(message, title = '错误') {
    // 更新模态框内容
    $('#errorMessage').textContent = message;
    $('#errorModal').classList.add('active');
}

// 加载配置
function loadConfig(key) {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('加载配置失败:', error);
        return null;
    }
}

// 保存配置
function saveConfig(key, config) {
    try {
        localStorage.setItem(key, JSON.stringify(config));
        return true;
    } catch (error) {
        console.error('保存配置失败:', error);
        return false;
    }
}

// 下载图片
function downloadImage(url, filename) {
    try {
        // 首先尝试直接下载（适用于同源或设置了CORS的图片）
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';

        // 检查是否是有效的URL
        if (!url || typeof url !== 'string') {
            throw new Error('无效的图片URL');
        }

        // 方法1: 尝试直接下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 如果直接下载失败，尝试使用fetch + blob
        setTimeout(() => {
            downloadImageWithFetch(url, filename);
        }, 100);

    } catch (error) {
        console.error('下载失败:', error);
        // 最后的备选方案：在新标签页打开图片
        downloadImageFallback(url);
    }
}

// 使用fetch方式下载图片
function downloadImageWithFetch(url, filename) {
    fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.blob();
    })
    .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 清理blob URL
        setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
        }, 1000);
    })
    .catch(error => {
        console.error('Fetch下载失败:', error);
        // 备选方案
        downloadImageFallback(url);
    });
}

// 下载失败的备选方案
function downloadImageFallback(url) {
    try {
        // 创建一个新的窗口来显示图片，用户可以手动右键保存
        const width = 800;
        const height = 600;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        const newWindow = window.open(
            url,
            '_blank',
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        if (newWindow) {
            // 显示提示信息
            setTimeout(() => {
                showSuccess('图片已在新窗口中打开，请右键点击图片选择"图片另存为"');
            }, 500);
        } else {
            // 如果弹窗被阻止，使用最后的备选方案
            const message = `
                下载提示：
                1. 请点击下方链接在新标签页打开图片
                2. 然后右键图片选择"图片另存为"

                图片链接：${url}
            `;

            // 创建一个模态框显示链接
            showDownloadDialog(url);
        }
    } catch (error) {
        console.error('备选下载方案失败:', error);
        showError('下载失败，请手动复制图片链接进行下载：' + url);
    }
}

// 显示下载对话框
function showDownloadDialog(imageUrl) {
    // 创建模态框HTML
    const modalHtml = `
        <div id="downloadModal" class="modal active" style="display: flex;">
            <div class="modal-content" style="max-width: 600px;">
                <h3>下载图片</h3>
                <p>由于浏览器安全限制，无法直接下载图片。请按以下步骤操作：</p>
                <ol style="text-align: left; margin: 20px 0;">
                    <li>点击下方按钮在新标签页打开图片</li>
                    <li>在新标签页中右键点击图片</li>
                    <li>选择"图片另存为"或"Save image as"</li>
                    <li>选择保存位置并点击保存</li>
                </ol>
                <div style="margin: 20px 0;">
                    <button id="openImageBtn" class="btn-primary">在新标签页打开图片</button>
                    <button id="copyLinkBtn" class="btn-secondary">复制图片链接</button>
                </div>
                <div style="margin: 20px 0;">
                    <input type="text" id="imageUrl" value="${imageUrl}" readonly style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                </div>
                <button id="closeDownloadModal" class="btn-secondary">关闭</button>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 绑定事件
    document.getElementById('openImageBtn').addEventListener('click', () => {
        window.open(imageUrl, '_blank');
    });

    document.getElementById('copyLinkBtn').addEventListener('click', () => {
        const urlInput = document.getElementById('imageUrl');
        urlInput.select();
        document.execCommand('copy');
        showSuccess('图片链接已复制到剪贴板');
    });

    document.getElementById('closeDownloadModal').addEventListener('click', () => {
        const modal = document.getElementById('downloadModal');
        if (modal) {
            modal.remove();
        }
    });

    // 点击背景关闭
    document.getElementById('downloadModal').addEventListener('click', (e) => {
        if (e.target.id === 'downloadModal') {
            e.target.remove();
        }
    });
}

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

// 格式化文件名
function formatFilename(title, topic) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const cleanTitle = title.replace(/[^\w\u4e00-\u9fa5]/g, '_');
    const cleanTopic = topic.replace(/[^\w\u4e00-\u9fa5]/g, '_');
    return `识字小报_${cleanTopic}_${cleanTitle}_${timestamp}.png`;
}

// 更新进度条
function updateProgress(percentage, text) {
    const progressFill = $('#progressFill');
    const progressText = $('#progressText');

    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }

    if (progressText) {
        progressText.textContent = text;
    }
}

// 显示加载状态
function setLoading(buttonElement, loading = true) {
    if (!buttonElement) return;

    if (loading) {
        buttonElement.disabled = true;
        buttonElement.dataset.originalText = buttonElement.textContent;
        buttonElement.innerHTML = `
            <span class="loading-spinner"></span>
            处理中...
        `;
    } else {
        buttonElement.disabled = false;
        buttonElement.textContent = buttonElement.dataset.originalText || '确定';
        delete buttonElement.dataset.originalText;
    }
}

// 显示状态指示器
function showStatus(elementId, status, message) {
    const element = $(`#${elementId}`);
    if (!element) return;

    element.className = `status-indicator ${status}`;
    element.textContent = message;
}

// 切换步骤显示
function showStep(stepId) {
    // 隐藏所有步骤
    $$('.step').forEach(step => {
        step.classList.remove('active');
    });

    // 显示目标步骤
    const targetStep = $(`#${stepId}`);
    if (targetStep) {
        targetStep.classList.add('active');
        // 滚动到顶部
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// 验证URL格式
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 截断文本
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

// 添加Toast样式（如果不存在）
if (!$('#toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background-color: var(--bg-card);
            color: var(--text-primary);
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);
            z-index: 1000;
            transition: all var(--transition-base);
            opacity: 0;
        }

        .toast.show {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }

        .toast-success {
            border-left: 4px solid var(--success-color);
        }

        .toast-error {
            border-left: 4px solid var(--danger-color);
        }

        .toast-icon {
            font-size: var(--font-size-lg);
            font-weight: bold;
        }

        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top-color: currentColor;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            margin-right: var(--spacing-sm);
        }
    `;
    document.head.appendChild(style);
}