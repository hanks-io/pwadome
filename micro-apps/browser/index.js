export function mount(container) {
    container.innerHTML = `
        <div style="padding: 20px;">
            <div style="margin-bottom: 20px;">
                <input type="text" id="urlInput" 
                    value="https://www.baidu.com"
                    placeholder="请输入网址" 
                    style="width: 80%; padding: 8px; margin-right: 10px;">
                <button onclick="loadUrl()" 
                    style="padding: 8px 16px; background: #4A90E2; color: white; border: none; border-radius: 4px;">
                    访问
                </button>
            </div>
            <div id="browserContent"></div>
        </div>
    `;

    window.loadUrl = () => {
        const url = document.getElementById('urlInput').value;
        if (url) {
            window.location.href = `frame.html?url=${encodeURIComponent(url)}`;
        }
    };

    window.loadUrl();
}

export function unmount() {
    delete window.loadUrl;
} 