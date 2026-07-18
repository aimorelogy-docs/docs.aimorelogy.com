# AIMORELOGY 文档中心

这是深圳市爱谋科技有限公司的产品手册与技术资料站，基于 Docusaurus 构建并部署至 GitHub Pages。

## 本地开发

项目需要 Node.js 20 或更高版本。

```bash
npm install
npm start
```

默认英文站点位于 `/`，简体中文站点位于 `/zh-CN/`。

## 编写文档

- 英文原文放在 `docs/`。
- 中文译文放在 `i18n/zh-CN/docusaurus-plugin-content-docs/current/`。
- 两种语言的文档应使用相同的文件路径和 `id`，以保证语言切换后仍停留在对应页面。
- 图片等静态资源放在 `static/`，文档中使用以 `/` 开头的绝对路径引用。

## 部署

推送到 `main` 分支后，GitHub Actions 会构建全部语言并部署到 GitHub Pages。首次部署前，需要在仓库的 **Settings → Pages → Build and deployment** 中将 Source 设置为 **GitHub Actions**，并为 `docs.aimorelogy.com` 配置相应 DNS 记录。

## 常用命令

```bash
npm start                 # 启动本地开发服务器
npm run build             # 构建全部语言
npm run serve             # 预览构建结果
npm run clear             # 清理 Docusaurus 缓存
npm run write-translations -- --locale zh-CN
```
