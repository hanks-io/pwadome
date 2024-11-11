# PWADome

一个简单的渐进式 Web 应用（PWA）示例。

## 特性

- 支持离线访问
- 可安装到设备主屏幕
- GitHub Actions 自动部署

## 开发

### 安装依赖

```bash
npm install
```

### 本地运行

```bash
npm start
```

访问 http://localhost:8080 查看应用

## 部署步骤

1. 在 GitHub 上创建新仓库 `pwadome`

2. 在推送代码之前，需要先在 GitHub 上进行以下设置：
   - 进入仓库的 Settings 页面
   - 找到 Pages 部分
   - 在 "Build and deployment" 下：
     - Source: 选择 "GitHub Actions"
     - 点击 Save 保存设置

3. 初始化本地仓库并推送：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/pwadome.git
git push -u origin main
```

4. 检查部署状态：
   - 进入仓库的 Actions 标签页
   - 等待部署工作流完成
   - 部署成功后访问 https://你的用户名.github.io/pwadome

## 故障排除

如果遇到部署问题：
1. 确保已在 Settings > Pages 中启用 GitHub Pages
2. 确保 Actions 权限已正确设置（Settings > Actions > General）
3. 检查 Actions 日志了解具体错误信息

```bash
npm install