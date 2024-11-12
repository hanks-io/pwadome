const CACHE_NAME = 'pwa-browser-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/components/web-view.js',
    '/micro-apps/loader.js',
    '/micro-apps/browser/index.js',
    '/micro-apps/home/index.js',
    '/config/routes.js',
    '/manifest.json'
];

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
    event.waitUntil(
        Promise.all([
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});

// 请求拦截
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 处理导航请求
    if (event.request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(event.request));
        return;
    }

    // 处理其他请求
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// 处理导航请求
async function handleNavigationRequest(request) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    // 如果是外部 URL，处理导航
    if (targetUrl) {
        try {
            const response = await fetch(targetUrl, {
                mode: 'no-cors',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml'
                }
            });

            // 创建自定义响应
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>PWA Browser</title>
                    <style>
                        body, html {
                            margin: 0;
                            padding: 0;
                            height: 100vh;
                            overflow: hidden;
                        }
                        .toolbar {
                            display: flex;
                            gap: 10px;
                            padding: 10px;
                            background: #f8f9fa;
                            border-bottom: 1px solid #dee2e6;
                        }
                        .toolbar button {
                            padding: 6px 12px;
                            border: none;
                            border-radius: 4px;
                            background: #4A90E2;
                            color: white;
                            cursor: pointer;
                        }
                        .content {
                            height: calc(100vh - 50px);
                            overflow: auto;
                        }
                    </style>
                </head>
                <body>
                    <div class="toolbar">
                        <button onclick="history.back()">返回</button>
                        <button onclick="location.href='/'">首页</button>
                    </div>
                    <div class="content">
                        <iframe src="${targetUrl}" 
                                style="width: 100%; height: 100%; border: none;"
                                sandbox="allow-same-origin allow-scripts allow-forms">
                        </iframe>
                    </div>
                </body>
                </html>
            `;

            return new Response(html, {
                headers: {
                    'Content-Type': 'text/html',
                    'X-Content-Type-Options': 'nosniff'
                }
            });
        } catch (error) {
            console.error('Navigation failed:', error);
            return caches.match('/index.html');
        }
    }

    // 如果不是外部 URL，返回缓存或网络请求
    return caches.match(request)
        .then(response => response || fetch(request));
}

// 消息处理
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
}); 