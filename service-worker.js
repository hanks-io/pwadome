const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = '';

// 添加本地开发服务器地址
const DEV_SERVERS = [
    'http://192.168.1.18:4000',
    'http://localhost:4000',
    'http://127.0.0.1:4000'
];

// 检查是否是本地开发环境
function isDevEnvironment(url) {
    return DEV_SERVERS.some(server => url.startsWith(server));
}

// 获取内容的函数
async function fetchContent(url) {
    // 如果是本地开发环境，直接获取
    if (isDevEnvironment(url)) {
        return fetch(url, {
            mode: 'cors',
            credentials: 'include'
        });
    }

    // 对外部网站使用 no-cors 模式
    try {
        const response = await fetch(url, {
            mode: 'no-cors',
            credentials: 'omit',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        return response;
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}

// 请求拦截
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // 检查是否是导航请求
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const params = new URLSearchParams(url.search);
                    const targetUrl = params.get('url');

                    if (targetUrl) {
                        const response = await fetchContent(targetUrl);
                        
                        // 创建错误页面的 HTML
                        const errorHTML = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>加载失败</title>
                                <style>
                                    .error-container {
                                        position: fixed;
                                        top: 50%;
                                        left: 50%;
                                        transform: translate(-50%, -50%);
                                        text-align: center;
                                        padding: 20px;
                                        background: white;
                                        border-radius: 8px;
                                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                    }
                                    .error-container button {
                                        margin-top: 10px;
                                        padding: 8px 16px;
                                        background: #4A90E2;
                                        color: white;
                                        border: none;
                                        border-radius: 4px;
                                        cursor: pointer;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="error-container">
                                    <h3>加载失败</h3>
                                    <p>无法加载目标页面，请检查网络连接后重试。</p>
                                    <button onclick="window.location.href='./'">返回首页</button>
                                    <button onclick="window.location.reload()">重试</button>
                                </div>
                            </body>
                            </html>
                        `;

                        // 如果响应不成功，返回错误页面
                        if (!response || response.type === 'error' || !response.ok) {
                            return new Response(errorHTML, {
                                headers: { 'Content-Type': 'text/html' }
                            });
                        }

                        const content = await response.text();
                        return new Response(content, {
                            headers: {
                                'Content-Type': 'text/html',
                                'X-Content-Type-Options': 'nosniff'
                            }
                        });
                    }

                    // 如果没有目标 URL，返回原始请求
                    return fetch(event.request);
                } catch (error) {
                    console.error('Navigation failed:', error);
                    // 返回错误页面
                    return new Response(errorHTML, {
                        headers: { 'Content-Type': 'text/html' }
                    });
                }
            })()
        );
    } else {
        // 处理其他请求
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});

// 消息处理
self.addEventListener('message', async event => {
    console.log('Service Worker 收到消息:', event.data);
    
    if (!event.data || !event.data.type) return;

    const client = event.source;
    if (!client) {
        console.error('无法找到发送消息的客户端');
        return;
    }

    switch (event.data.type) {
        case 'NAVIGATE':
            try {
                const url = event.data.url;
                console.log('准备导航到:', url);
                
                client.postMessage({
                    type: 'HANDLE_NAVIGATION',
                    url: url
                });
            } catch (error) {
                console.error('导航处理失败:', error);
                client.postMessage({
                    type: 'NAVIGATION_ERROR',
                    error: error.message
                });
            }
            break;
    }
});

// 安装事件
self.addEventListener('install', event => {
    self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
}); 