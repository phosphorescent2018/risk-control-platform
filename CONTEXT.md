# 项目上下文（给接手 AI 的快速说明）

> 其他 AI / 协作者请先读本文件 + `AGENTS.md`（工作规则）。

## 这是什么

**risk control platform —— DE 模型配置** 页面的高保真原型（Axhub Make 项目）。
还原对象：MTN Uganda DE 测试环境 `model-center/file-config-detail?editable=1`（Add model configuration）。

页面来源数据包：Axhub AI 导出包（domlist + stylePool + screenshot），结构与样式写在
`src/prototypes/risk-control-platform/page.html` 与 `static-style.css`。

## 如何运行

- 根目录执行 `npm run dev`（启动 vite 51720 + Make 管理端 53817）
- 本地预览：`http://localhost:53817/?projectId=risk-control-platform&p=risk-control-platform`
- 演示站：https://phosphorescent2018.github.io/risk-control-platform/ ，每次 push main 自动部署

## 当前范围

| 模块 | 位置 | 说明 |
| --- | --- | --- |
| 模型配置页 | `src/prototypes/risk-control-platform/` | 单页高保真还原 + 本次需求交互 |

## 本次需求相关的交互（叠加在还原页上）

- 模型文件上传允许 `.model / .pkl / .pickle / .pmml`，其余后缀提示格式错误；
- 上传 `.pkl/.pickle` 自动带出「Python 模型（pickle）」，`.pmml` 自动带出「PMML 模型」；
- 模型类型下拉共四项：XGBoost、Linear Regression、Python 模型（pickle）、PMML 模型；
- 单文件超过 100M 提示「上传文件不能大于100M」。

## 已知差异

- 导出包未包含图片资源：logo 取自前端仓库真实 `logofull.svg`，右下角用户头像为占位图；
- 导出包丢失了菜单图标与必填星号，已按前端 iconfont 与 Ant Design 规则补回。
