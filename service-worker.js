const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = '';
// 多个代理服务，如果一个失败可以尝试其他的
const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://cors.bridged.cc/'
];

const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './icons/icon-192x192.svg',
    './icons/icon-512x512.svg'
];

// 尝试使用不同的代理获取内容
async function fetchWithProxy(url) {
    const errors = [];
    
    // 首先尝试直接获取（使用 no-cors 模式）
    try {
        const response = await fetch(url, {
            mode: 'no-cors',
            credentials: 'omit',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        if (response.type !== 'opaque') {
            return response;
        }
    } catch (error) {
        errors.push(`Direct fetch failed: ${error.message}`);
    }

    // 依次尝试每个代理
    for (const proxy of CORS_PROXIES) {
        try {
            const proxyUrl = proxy + encodeURIComponent(url);
            const response = await fetch(proxyUrl, {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (response.ok) {
                return response;
            }
        } catch (error) {
            errors.push(`Proxy ${proxy} failed: ${error.message}`);
        }
    }

    // 如果所有尝试都失败，抛出错误
    throw new Error(`All fetch attempts failed: ${errors.join('; ')}`);
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
                        // 使用代理获取内容
                        const response = await fetchWithProxy(targetUrl);
                        const content = await response.text();

                        // 创建新的响应
                        const modifiedContent = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>PWA View</title>
                                <style>
                                    body, html { margin: 0; padding: 0; height: 100vh; }
                                    #content { height: 100%; }
                                    .error { 
                                        position: fixed; 
                                        top: 50%; 
                                        left: 50%; 
                                        transform: translate(-50%, -50%);
                                        padding: 20px;
                                        background: #fff;
                                        border-radius: 8px;
                                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                    }
                                </style>
                            </head>
                            <body>
                                <div id="content">${content}</div>
                                <script>
                                    // 处理链接点击
                                    document.addEventListener('click', (e) => {
                                        if (e.target.tagName === 'A') {
                                            e.preventDefault();
                                            const url = e.target.href;
                                            if (url) {
                                                location.href = '?url=' + encodeURIComponent(url);
                                            }
                                        }
                                    });
                                </script>
                            </body>
                            </html>
                        `;

                        return new Response(modifiedContent, {
                            headers: {
                                'Content-Type': 'text/html',
                                'X-Content-Type-Options': 'nosniff'
                            }
                        });
                    }

                    return fetch(event.request);
                } catch (error) {
                    console.error('Fetch failed:', error);
                    // 返回错误页面
                    return new Response(`
                        <html>
                            <body>
                                <div class="error">
                                    加载失败，请稍后重试...<br>
                                    <button onclick="location.href='./'">返回首页</button>
                                </div>
                            </body>
                        </html>
                    `, {
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

// 安装事件
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

// 添加消息处理
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
                
                // 通知客户端进行导航
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

        default:
            console.log('未知消息类型:', event.data.type);
    }
}); 