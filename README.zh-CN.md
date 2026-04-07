# Project Brain
为 AI 辅助开发提供持久化项目记忆。

## 功能介绍

- 为 AI 辅助开发循环提供持久化项目记忆机制。
- 在 `.project-brain/` 目录下存储项目上下文、变更（changes）、决策（decisions）和进度（progress）。
- 使用基于文件的轻量工作流，AI 工具直接读写 `.project-brain/`。

## 实际体验

| 功能         | 体验                         |
|:-----------|:---------------------------|
| **变更记录**   | AI 变得更有“记性”，不再反复犯同样的架构错误。  |
| **架构索引**   | AI 处理跨文件修改时，不再丢三落四。        |
| **偏好配置**   | AI 会学习你的架构决策和实现选择，风格会更一致¹。 |
| **失败尝试记录** | AI 不会再给你推荐你已经试过并证明无效的方法。   |

## 快速开始

把下面这段话复制给你的 AI 助手，让它完成安装：

```text
Please install Project Brain in this repository by following https://github.com/myczh-1/project-brain/docs/install.md.
Use project-level configuration when possible.
Configure Project Brain through `project-brain stdio`.
Do not edit `.project-brain/` files directly.
Explain which files you plan to modify before editing them.
```

或者你喜欢的话可以按照文档手动安装。



## 集成指南

- [Install](./docs/install.md)
- [入门指南](./docs/guide-getting-started.zh-CN.md)
- [OpenSpec 集成](./docs/guide-openspec-integration.zh-CN.md)


## 想要了解更多

### 安装后如何工作

安装完成后，AI 助手会：

- 通过 `project-brain stdio` 调用 Project Brain 工具接口。
- 在需要项目记忆或任务上下文时读取 Project Brain。
- 通过 stdio 工具更新 Project Brain，而不是直接编辑 `.project-brain/` 文件。

详细工作流说明请参阅 [docs/guide-openspec-integration.zh-CN.md](./docs/guide-openspec-integration.zh-CN.md)。


### 架构

Project Brain 采用分层架构：

- **protocol**: 纯类型定义和 Schema。
- **core**: 领域逻辑、命令、查询和端口。
- **infra-fs**: 存储和 Git 端口的本地文件系统实现。
- **mode-embedded**: 仓库内文件工作流的集成辅助层。
- **app**: Bootstrap CLI 与 stdio 入口。


## 开源协议

MIT

---

[English](./README.md)

<small>
1: 或者这个模型的偏好
</small>
