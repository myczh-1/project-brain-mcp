# Project Brain

以文件协议驱动的 AI 辅助开发持久化项目记忆。

## `.project-brain/` 目录结构

Project Brain 将持久状态存储在仓库根目录下的 `.project-brain/`：

```text
.project-brain/
  manifest.json
  project-spec.json
  changes/
    <change-id>.json
  decisions.ndjson
  notes.ndjson
  progress.ndjson
  milestones.json
```

核心文件说明：

- `manifest.json`：可选项目标识（名称、摘要、技术栈）。
- `project-spec.json`：稳定的项目事实与架构约束。
- `changes/*.json`：实现任务的结构化记录。
- `decisions.ndjson`：带依据的决策日志。
- `notes.ndjson`：原始观察与后续线索。
- `progress.ndjson`：执行时间线与阻塞跟踪。
- `milestones.json`：高层阶段与里程碑跟踪。

## CLI 最小命令集

- `npx -y @myczh/project-brain setup`：检测仓库上下文并初始化 `.project-brain/`。
- `npx -y @myczh/project-brain init`：创建最小项目身份文件。
- `npx -y @myczh/project-brain doctor`：校验仓库与本地环境是否就绪。

如果已全局安装：

```bash
project-brain setup
project-brain init
project-brain doctor
```

## 典型 Lightweight 工作流

1. **一次性初始化**
   - 运行 `project-brain setup`。
2. **实现前**
   - 读取 `.project-brain/project-spec.json` 与当前 `changes/*.json`。
3. **实现中**
   - 更新 `changes/<change-id>.json`。
   - 追加决策到 `decisions.ndjson`，追加笔记到 `notes.ndjson`。
   - 在 `progress.ndjson` 记录检查点。
4. **实现后**
   - 将变更状态置为 done/dropped，并在必要时把稳定结论同步到 `project-spec.json`。

## 指南

- [入门指南](./docs/guide-getting-started.zh-CN.md)
- [Agent 集成](./docs/guide-agent-integration.zh-CN.md)
- [OpenSpec 集成](./docs/guide-openspec-integration.zh-CN.md)

## 归档

Service/HTTP/UI 的历史说明已迁移至：

- [docs/future/service-http-ui-archive.zh-CN.md](./docs/future/service-http-ui-archive.zh-CN.md)

## 开发

```bash
npm install
npm run build
npm test
```

## 开源协议

MIT

---

[English](./README.md)
