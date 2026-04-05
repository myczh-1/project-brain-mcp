# Service / HTTP / UI 历史归档

> 为了让主线文档聚焦文件协议 Lightweight 用法，旧版 Service/HTTP/UI 说明迁移至此。

## 旧版服务模式说明

历史主线文档曾描述通过以下命令启动 Service Mode：

```bash
npx -y @myczh/project-brain
```

该模式会暴露本地 HTTP 路由与 MCP-over-HTTP 端点。

## 旧版 HTTP/MCP 端点

历史端点集合包括：

- `GET /health`
- `GET /api`
- `GET /api/dashboard`
- `GET /api/context`
- `GET /api/changes/:changeId/context`
- `POST /mcp`
- `DELETE /mcp`
- `POST /api/init`
- `POST /api/memory/ingest`
- `PUT /api/project-spec`

## 旧版 UI 说明

历史文档中曾包含位于 `/ui` 的 Dashboard UI 原型说明。

## 旧版环境变量

历史服务配置包含：

- `PROJECT_BRAIN_HOST`
- `PROJECT_BRAIN_PORT`
- `PROJECT_BRAIN_ALLOWED_ORIGINS`

## 归档原因

当前文档优先强调基于 `.project-brain/` 直接读写的文件协议核心工作流。Service/HTTP/UI 细节仅在此保留为历史参考。
