const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = '';

const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './icons/icon-192x192.svg',
    './icons/icon-512x512.svg',
    './frame.html'
];

// 添加消息处理
self.addEventListener('message', async event => {
    try {
        // 找到发送消息的客户端
        const client = event.source;
        if (!client) {
            console.error('无法找到客户端');
            return;
        }

        // 发送消息回客户端
        if (event.data && event.data.type) {
            client.postMessage({
                type: 'HANDLE_NAVIGATION',
                url: event.data.url,
                openType: event.data.type
            });
        }
    } catch (err) {
        console.error('消息处理失败:', err);
    }
});

// 安装事件
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // 逐个缓存文件，而不是使用 addAll
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(err => {
                            console.warn('缓存文件失败:', url, err);
                            return Promise.resolve(); // 继续处理其他文件
                        });
                    })
                );
            })
    );
    // 立即激活
    self.skipWaiting();
});

// 激活事件
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // 清理旧缓存
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // 立即接管客户端
            self.clients.claim()
        ])
    );
});

// 请求拦截
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        // 检查是否是有效的响应
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // 克隆响应
                        const responseToCache = response.clone();

                        // 缓存响应
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(err => {
                                console.warn('缓存响应失败:', err);
                            });

                        return response;
                    })
                    .catch(err => {
                        console.error('fetch 失败:', err);
                        // 返回离线页面或错误页面
                        return caches.match('./index.html');
                    });
            })
    );
}); 