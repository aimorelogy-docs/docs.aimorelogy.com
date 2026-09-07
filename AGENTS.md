# AGENTS.md

## 交流与文档

- 使用中文与用户交流。
- 使用 Markdown 格式编写文档。
- 英文文档位于 `docs/`。
- 中文文档位于 `i18n/zh-CN/docusaurus-plugin-content-docs/current/`。
- 修改任一语言的文档时，必须同步修改另一语言的对应文档。新增、重命名或删除文档时也必须保持双语目录结构一致。
- 中英文对应文档应使用相同的相对路径和 `id`，并确保标题、链接、代码示例及功能说明在语义上保持一致。
- 每次任务结束后，向用户说明本次改动范围。

## 项目约定

- 本项目是基于 Docusaurus 3 的中英文文档站，要求 Node.js 20 或更高版本。
- 静态资源放在 `static/`，文档中使用以 `/` 开头的绝对路径引用。
- 侧边栏配置位于 `sidebars.js`，站点与国际化配置位于 `docusaurus.config.js`。
- 代码和配置修改应遵循现有项目风格，保持实现干净、规范，并避免无关改动。
- 不需要执行编译或构建验证，用户会自行编译。

## 常用命令

```bash
npm start
npm run build
npm run serve
npm run clear
npm run write-translations -- --locale zh-CN
```

除非用户明确要求，否则不要运行编译或构建命令。

## Git 提交

- 提交信息使用英文，并遵循 Conventional Commits 风格。
- 示例：`feat: add device network reset action`
- 示例：`fix: use provisioning mode USB product ID`
