export const routes = {
    home: {
        path: '/',
        component: 'home',
        title: '首页'
    },
    browser: {
        path: '/browser',
        component: 'browser',
        title: '浏览器'
    }
};

export const appConfigs = {
    home: {
        entry: '/micro-apps/home/index.js',
        name: 'home'
    },
    browser: {
        entry: '/micro-apps/browser/index.js',
        name: 'browser'
    }
}; 