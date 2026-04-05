# Project Brain 入门指南

本指南聚焦于文件协议驱动的 Lightweight 工作流。

## 前置条件

- Node.js 18+
- 一个 git 仓库
- 一个可读写仓库文件的 AI 助手

## 安装与初始化

在仓库根目录运行：

```bash
npx -y @myczh/project-brain setup
```

或使用全局安装：

```bash
npm install -g @myczh/project-brain
project-brain setup
```

可选检查：

```bash
project-brain doctor
project-brain init
```

## 验证 `.project-brain/`

执行 setup 后，确认存在以下文件：

```text
.project-brain/
  manifest.json
  project-spec.json
  changes/
  decisions.ndjson
  notes.ndjson
  progress.ndjson
  milestones.json
```

## 首次使用

1. 打开 `.project-brain/project-spec.json`，确认项目基线事实。
2. 在 `.project-brain/changes/<change-id>.json` 创建变更记录。
3. 实现过程中持续追加执行轨迹：
   - decisions -> `decisions.ndjson`
   - notes -> `notes.ndjson`
   - progress -> `progress.ndjson`
4. 完成后更新变更状态，并将稳定结论同步回 `project-spec.json`。

## 日常 Lightweight 循环

1. **读取上下文**：project-spec + 活跃 changes。
2. **实施开发**：完成代码改动。
3. **记录记忆**：决策 / 笔记 / 进展。
4. **闭环收尾**：更新 change 状态与下一步。

## 故障排查

- **缺少 `.project-brain/`**：在仓库根目录重新执行 `project-brain setup`。
- **Schema 漂移**：以 `protocol/schemas/` 下的定义作为记录校验基准。
- **上下文噪音过多**：稳定规则放入 `project-spec.json`，临时思路放入 `notes.ndjson`。

## Service/HTTP/UI 历史文档

旧版 Service/HTTP/UI 说明已归档至：
- [docs/future/service-http-ui-archive.zh-CN.md](./future/service-http-ui-archive.zh-CN.md)
