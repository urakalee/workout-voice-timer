# 动起来｜语音训练计时器

一个可配置、可安装的中文语音训练计时器。应用内置 25 分钟室内徒手训练方案，支持调整动作、时长、休息和轮数，并可拖拽改变动作及环节顺序。

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。浏览器将 `localhost` 视为开发环境中的安全上下文，因此可测试语音、离线缓存和屏幕常亮等功能。

## 构建与测试

```bash
npm run build
npm test
```

GitHub Pages 使用独立的静态构建：

```bash
npm run build:github
```

## GitHub Pages 部署

仓库已包含 `.github/workflows/deploy.yml`。推送到 `main` 后，GitHub Actions 会自动安装依赖、构建并发布站点。

首次启用时：

1. 打开仓库的 **Settings → Pages**。
2. 在 **Build and deployment** 中将 Source 设为 **GitHub Actions**。
3. 打开 **Actions**，等待 “Deploy to GitHub Pages” 任务完成。
4. 访问 `https://urakalee.github.io/workout-voice-timer/`。

以后只需向 `main` 推送代码，线上页面就会自动更新。

如果以后绑定自定义域名，请在仓库 **Settings → Secrets and variables → Actions → Variables** 中增加 `SITE_BASE_PATH`，值设为 `/`，再重新运行部署工作流。

## 主要功能

- 内置严格 25 分钟的默认训练方案
- 动作、时长、休息、重复次数及环节轮数可配置
- 支持鼠标、触摸和键盘拖拽排序
- 中文 TTS、10 秒提醒和最后 3 秒提示音
- 暂停、继续、上一项和下一项控制
- 多方案复制、本地保存及恢复默认内容
- PWA 主屏幕安装、离线缓存和屏幕常亮

训练方案默认只保存在当前设备的浏览器中，不需要账号或后端数据库。
