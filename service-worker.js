const CACHE_NAME = 'pwa-demo-v1';
const BASE_PATH = '';

const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './icons/icon-192x192.svg',
    './icons/icon-512x512.svg'
];

// 添加消息处理
self.addEventListener('message', async event => {
    // 检查 Clients API 是否可用
    if (!self.clients) {
        console.error('Clients API 不可用');
        return;
    }
    // 获取所有窗口客户端
    const allClients = await self.clients.matchAll({
        type: 'window'
    });

    if (event.data && event.data.type === 'NAVIGATE') {
        console.log('navigate');
        try {


            // 如果有活动窗口,使用navigate
            if (allClients.length > 0) {
                const client = allClients[0];
                await client.navigate(event.data.url);
                await client.focus();
            } else {
                // 否则打开新窗口
                const newClient = await self.clients.openWindow(event.data.url);
                if (newClient) await newClient.focus();
            }
        } catch (err) {
            console.error('导航失败:', err);
        }
    }

    if (event.data && event.data.type === 'new-window') {

        console.log('new-window');
        // 检查 Clients API 是否可用
        if (!self.clients) {
            console.error('Clients API 不可用');
            return;
        }

        // 检查 URL 是否有效
        if (!event.data.url) {
            console.error('URL 无效');
            return;
        }

        try {
            const client = allClients[0];
            const windowClient = await client.openWindow(event.data.url);
            // 检查窗口是否成功打开
            if (windowClient) {
                await windowClient.focus();
            } else {
                console.error('无法打开新窗口');
            }
        } catch (err) {
            console.error('打开新窗口失败:', err);
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
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
}); 