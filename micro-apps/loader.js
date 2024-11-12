import { routes } from '../config/routes.js';

class MicroAppLoader {
    constructor() {
        this.currentApp = null;
        this.container = null;
    }

    async init(container) {
        this.container = container;
        window.addEventListener('popstate', () => this.handleRoute());
        await this.handleRoute();
    }

    async handleRoute() {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const targetUrl = params.get('url');

        if (targetUrl) {
            window.location.href = `frame.html?url=${encodeURIComponent(targetUrl)}`;
            return;
        }

        const route = Object.values(routes).find(r => r.path === path) || routes.home;
        await this.loadApp(route.component);
    }

    async loadApp(name) {
        try {
            if (this.currentApp) {
                this.currentApp.unmount();
            }

            const module = await import(`./${name}/index.js`);
            this.currentApp = module;
            await module.mount(this.container);
        } catch (error) {
            console.error('Failed to load app:', error);
            this.container.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3>加载失败</h3>
                    <p>${error.message}</p>
                    <button onclick="window.location.reload()">重试</button>
                </div>
            `;
        }
    }

    navigate(path) {
        window.history.pushState(null, '', path);
        this.handleRoute();
    }
}

export const appLoader = new MicroAppLoader();