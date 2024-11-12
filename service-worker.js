const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = '';

// 获取内容的函数
async function fetchContent(url, type = 'document') {
    try {
        // 对于文档类型使用 no-cors
        if (type === 'document') {
            return await fetch(url, {
                mode: 'no-cors',
                credentials: 'omit',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
        }
        // 对于资源文件使用普通请求
        return await fetch(url);
    } catch (error) {
        console.error('Fetch failed:', error);
        throw error;
    }
}

// 修改资源路径为绝对路径
function makeUrlsAbsolute(content, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const base = new URL(baseUrl);

    // 处理 CSS 链接
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        if (link.href) {
            link.href = new URL(link.getAttribute('href'), base).href;
        }
    });

    // 处理脚本
    doc.querySelectorAll('script[src]').forEach(script => {
        script.src = new URL(script.getAttribute('src'), base).href;
    });

    // 处理图片
    doc.querySelectorAll('img[src]').forEach(img => {
        img.src = new URL(img.getAttribute('src'), base).href;
    });

    // 处理其他资源
    doc.querySelectorAll('[href]').forEach(el => {
        if (el.href && !el.href.startsWith('#')) {
            el.href = new URL(el.getAttribute('href'), base).href;
        }
    });

    return doc.documentElement.outerHTML;
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
                        
                        if (!response || response.type === 'error' || !response.ok) {
                            throw new Error('Failed to fetch content');
                        }

                        const content = await response.text();
                        // 转换所有资源路径为绝对路径
                        const modifiedContent = makeUrlsAbsolute(content, targetUrl);

                        return new Response(modifiedContent, {
                            headers: {
                                'Content-Type': 'text/html',
                                'X-Content-Type-Options': 'nosniff'
                            }
                        });
                    }

                    return fetch(event.request);
                } catch (error) {
                    console.error('Navigation failed:', error);
                    return new Response(`
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
                                button {
                                    margin: 10px;
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
                                <p>无法加载页面，请稍后重试</p>
                                <button onclick="window.location.href='./'">返回首页</button>
                                <button onclick="window.location.reload()">重试</button>
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
        // 处理其他资源请求
        event.respondWith(
            (async () => {
                try {
                    // 先尝试从缓存获取
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // 如果没有缓存，则获取资源
                    const response = await fetchContent(event.request.url, 'resource');
                    
                    // 缓存响应
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(event.request, response.clone());

                    return response;
                } catch (error) {
                    console.error('Resource fetch failed:', error);
                    return new Response('', { status: 404 });
                }
            })()
        );
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