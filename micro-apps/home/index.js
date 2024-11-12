export function mount(container) {
    container.innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <h1>PWA Micro Demo</h1>
            <p>这是一个基于微前端架构的 PWA 示例应用</p>
            <div style="margin-top: 20px;">
                <button onclick="window.location.href='/browser'" 
                        style="padding: 10px 20px; background: #4A90E2; color: white; border: none; border-radius: 4px;">
                    打开浏览器
                </button>
            </div>
        </div>
    `;
}

export function unmount() {
    // 清理资源
} 