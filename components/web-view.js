// 使用命名导出
export class WebView {
    constructor(container) {
        this.container = container;
        this.history = [];
        this.currentUrl = null;
    }

    async loadUrl(url) {
        try {
            this.container.innerHTML = '<div class="loading">加载中...</div>';
            const response = await fetch(`/proxy?url=${encodeURIComponent(url)}`);
            
            if (!response.ok) {
                throw new Error('Failed to load content');
            }

            const content = await response.text();
            this.currentUrl = url;
            this.history.push(url);
            
            this.container.innerHTML = `
                <div class="web-view">
                    <div class="web-toolbar">
                        <button onclick="webView.goBack()">返回</button>
                        <button onclick="webView.goHome()">首页</button>
                        <button onclick="webView.reload()">刷新</button>
                    </div>
                    <div class="web-content">${content}</div>
                </div>
            `;

            // 处理页面内的链接
            this.handleLinks();

        } catch (error) {
            console.error('Loading error:', error);
            this.container.innerHTML = `
                <div class="error">
                    <h3>加载失败</h3>
                    <p>${error.message}</p>
                    <button onclick="webView.reload()">重试</button>
                    <button onclick="webView.goHome()">返回首页</button>
                </div>
            `;
        }
    }

    handleLinks() {
        const links = this.container.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#')) {
                const absoluteUrl = new URL(href, this.currentUrl).href;
                link.onclick = (e) => {
                    e.preventDefault();
                    this.loadUrl(absoluteUrl);
                };
            }
        });
    }

    goBack() {
        if (this.history.length > 1) {
            this.history.pop(); // 移除当前页面
            const previousUrl = this.history[this.history.length - 1];
            this.loadUrl(previousUrl);
        } else {
            this.goHome();
        }
    }

    goHome() {
        window.location.href = '/';
    }

    reload() {
        if (this.currentUrl) {
            this.loadUrl(this.currentUrl);
        }
    }
}
