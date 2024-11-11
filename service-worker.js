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
    if (!self.clients) {
        console.error('Clients API 不可用');
        return;
    }

    const allClients = await self.clients.matchAll({
        type: 'window'
    });

    if (event.data && (event.data.type === 'NAVIGATE' || event.data.type === 'new-window')) {
        try {
            // 使用 frame.html 来加载外部页面
            const frameUrl = `./frame.html?url=${encodeURIComponent(event.data.url)}`;

            if (event.data.type === 'NAVIGATE' && allClients.length > 0) {
                const client = allClients[0];
                await client.navigate(frameUrl);
                await client.focus();
            } else if (event.data.type === 'new-window') {
                const windowClient = await self.clients.openWindow(frameUrl);
                if (windowClient) {
                    await windowClient.focus();
                }
            }
        } catch (err) {
            console.error('操作失败:', err);
            // 如果导航失败，尝试直接打开
            if (event.data.type === 'new-window') {
                await self.clients.openWindow(event.data.url);
            }
        }
    }
});

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    // 对于跨域请求，使用 no-cors 模式
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match('./index.html'))
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }

                    // 克隆请求，因为请求只能使用一次
                    const fetchRequest = event.request.clone();

                    // 对于跨域请求，添加 no-cors 模式
                    const fetchOptions = {
                        mode: 'no-cors',
                        credentials: 'same-origin'
                    };

                    return fetch(fetchRequest, fetchOptions)
                        .then(response => {
                            // 检查是否是有效的响应
                            if (!response || response.status !== 200) {
                                return response;
                            }

                            // 克隆响应，因为响应体只能使用一次
                            const responseToCache = response.clone();

                            // 将响应添加到缓存
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        });
                })
        );
    }
}); 