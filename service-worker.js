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
    if (!self.clients) {
        console.error('Clients API 不可用');
        return;
    }

    const allClients = await self.clients.matchAll({
        type: 'window'
    });

    if (event.data && event.data.type === 'NAVIGATE') {
        try {
            // 创建一个 iframe 容器页面的 HTML
            const iframeHTML = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>PWA View</title>
                    <style>
                        body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                        iframe { border: none; width: 100%; height: 100%; position: fixed; top: 0; left: 0; }
                    </style>
                </head>
                <body>
                    <iframe src="${event.data.url}" allow="fullscreen"></iframe>
                </body>
                </html>
            `;

            // 创建 Blob URL
            const blob = new Blob([iframeHTML], { type: 'text/html' });
            const iframeUrl = URL.createObjectURL(blob);

            // 在当前窗口中导航到 iframe 容器页面
            if (allClients.length > 0) {
                const client = allClients[0];
                await client.navigate(iframeUrl);
                await client.focus();
            }
        } catch (err) {
            console.error('导航失败:', err);
        }
    }

    if (event.data && event.data.type === 'new-window') {
        try {
            // 创建新窗口并加载 iframe 容器
            const windowClient = await self.clients.openWindow('about:blank');
            if (windowClient) {
                const iframeHTML = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>PWA View</title>
                        <style>
                            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
                            iframe { border: none; width: 100%; height: 100%; position: fixed; top: 0; left: 0; }
                        </style>
                    </head>
                    <body>
                        <iframe src="${event.data.url}" allow="fullscreen"></iframe>
                    </body>
                    </html>
                `;
                
                const blob = new Blob([iframeHTML], { type: 'text/html' });
                const iframeUrl = URL.createObjectURL(blob);
                
                await windowClient.navigate(iframeUrl);
                await windowClient.focus();
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