const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = '';

// 获取内容的函数
async function fetchContent(url) {
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

// 创建包装页面
function createWrappedPage(content, baseUrl) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PWA View</title>
            <style>
                body, html {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100vh;
                    overflow: auto;
                }
                #pwa-toolbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 44px;
                    background: #f8f9fa;
                    display: flex;
                    align-items: center;
                    padding: 0 10px;
                    gap: 10px;
                    z-index: 1000;
                    border-bottom: 1px solid #dee2e6;
                }
                #pwa-toolbar button {
                    padding: 6px 12px;
                    border: none;
                    border-radius: 4px;
                    background: #4A90E2;
                    color: white;
                    cursor: pointer;
                }
                #pwa-content {
                    margin-top: 44px;
                    min-height: calc(100vh - 44px);
                }
                @media (display-mode: standalone) {
                    #pwa-toolbar { padding-top: env(safe-area-inset-top); }
                }
            </style>
            <base href="${baseUrl}">
        </head>
        <body>
            <div id="pwa-toolbar">
                <button onclick="history.back()">返回</button>
                <button onclick="location.href='./'">首页</button>
            </div>
            <div id="pwa-content">
                ${content}
            </div>
            <script>
                // 处理所有链接点击
                document.addEventListener('click', (e) => {
                    if (e.target.tagName === 'A') {
                        e.preventDefault();
                        const url = e.target.href;
                        if (url) {
                            location.href = '?url=' + encodeURIComponent(url);
                        }
                    }
                });

                // 错误处理
                window.onerror = function(msg, url, line, col, error) {
                    console.log('捕获到错误:', msg);
                    return true;
                };
            </script>
        </body>
        </html>
    `;
}

// 请求拦截
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                try {
                    const params = new URLSearchParams(url.search);
                    const targetUrl = params.get('url');

                    if (targetUrl) {
                        const response = await fetchContent(targetUrl);
                        
                        if (!response || response.type === 'error') {
                            throw new Error('Failed to fetch content');
                        }

                        const content = await response.text();
                        const wrappedContent = createWrappedPage(content, targetUrl);

                        return new Response(wrappedContent, {
                            headers: {
                                'Content-Type': 'text/html',
                                'X-Content-Type-Options': 'nosniff'
                            }
                        });
                    }

                    return fetch(event.request);
                } catch (error) {
                    console.error('Navigation failed:', error);
                    return new Response(createWrappedPage(`
                        <div style="text-align: center; padding: 20px;">
                            <h3>加载失败</h3>
                            <p>无法加载页面，请稍后重试</p>
                            <button onclick="location.href='./'">返回首页</button>
                            <button onclick="location.reload()">重试</button>
                        </div>
                    `, ''), {
                        headers: { 'Content-Type': 'text/html' }
                    });
                }
            })()
        );
    } else {
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
                
                // 直接通知客户端进行导航
                client.postMessage({
                    type: 'NAVIGATION_RESULT',
                    success: true
                });

                // 使用 navigate 方法进行导航
                await client.navigate('?url=' + encodeURIComponent(url));
            } catch (error) {
                console.error('导航处理失败:', error);
                client.postMessage({
                    type: 'NAVIGATION_RESULT',
                    success: false,
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