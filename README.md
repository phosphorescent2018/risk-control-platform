# risk control platform · DE 模型配置原型

DE「Add model configuration」页面的高保真还原，Axhub Make 项目。

**演示站：** https://phosphorescent2018.github.io/risk-control-platform/

## 本地运行

```bash
pnpm install
npm run dev
```

- 原型：`src/prototypes/risk-control-platform/`
- 页面结构：`page.html`（Axhub 导出包重建）
- 样式：`static-style.css`（stylePool 样式 + 本地化 Tailwind 工具类）
- 交互：`interaction.js`（上传校验、模型类型自动带出）

## 部署

push `main` 后由 GitHub Actions 构建并发布到 GitHub Pages（`.github/workflows/deploy-pages.yml`）。
