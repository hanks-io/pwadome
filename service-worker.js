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

    if (event.data && (event.data.type === 'NAVIGATE' || event.data.type === 'new-window')) {
        try {
            // 获取目标页面内容
            const response = await fetch(event.data.url);
            const html = await response.text();

            // 创建新的 HTML 内容
            const newHTML = `
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
                            height: 100vh; 
                            overflow: auto; 
                        }
                        #pwa-content {
                            width: 100%;
                            min-height: 100vh;
                        }
                        /* 隐藏原页面的头部等元素 */
                        header, nav, .header, .nav, .navbar { 
                            display: none !important; 
                        }
                    </style>
                </head>
                <body>
                    <div id="pwa-content">
                        ${html}
                    </div>
                    <script>
                        // 处理页面内的链接点击
                        document.addEventListener('click', (e) => {
                            if (e.target.tagName === 'A') {
                                e.preventDefault();
                                const url = e.target.href;
                                window.parent.postMessage({ type: 'NAVIGATE', url }, '*');
                            }
                        });

                        // 隐藏地址栏
                        if ('standalone' in navigator || window.matchMedia('(display-mode: standalone)').matches) {
                            window.scrollTo(0, 1);
                        }

                        // 移除原页面的一些元素
                        function removeElements() {
                            const elementsToRemove = document.querySelectorAll('header, nav, .header, .nav, .navbar');
                            elementsToRemove.forEach(el => el.remove());
                        }
                        
                        // 页面加载完成后执行清理
                        window.addEventListener('load', removeElements);
                        // 动态内容加载后也执行清理
                        const observer = new MutationObserver(removeElements);
                        observer.observe(document.body, { childList: true, subtree: true });
                    </script>
                </body>
                </html>
            `;

            // 创建 Blob URL
            const blob = new Blob([newHTML], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);

            if (event.data.type === 'NAVIGATE' && allClients.length > 0) {
                // 在当前窗口导航
                const client = allClients[0];
                await client.navigate(blobUrl);
                await client.focus();
            } else if (event.data.type === 'new-window') {
                // 在新窗口打开
                const windowClient = await self.clients.openWindow(blobUrl);
                if (windowClient) {
                    await windowClient.focus();
                }
            }

            // 清理 Blob URL
            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        } catch (err) {
            console.error('操作失败:', err);
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