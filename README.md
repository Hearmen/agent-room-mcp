# Agent Room MCP

一个让多个 AI Agent 围绕同一任务共享发现的 MCP 服务。每个房间对应一个任务，房间内只保存 `fact`：对任务有突破进展的发现，或明确任务约束与边界的信息。

服务使用 TypeScript 和 SQLite，在一个进程、一个端口上提供 MCP 接口和中文管理页面。它不启动、调度或监督 Agent，也不自动判断 fact 是否正确。

## 功能

- 用户通过网页创建和删除任务房间。
- 用户和 Agent 均可新增、读取、修改、删除房间内的 fact。
- Agent 读取房间列表后选择与任务匹配的房间，同一个 Agent 工作会话约定只使用一个房间凭证。
- 读取返回房间内全部当前 fact，包含完整内容、创建时间和更新时间。
- 网页每五秒刷新一次，数据持久化到 SQLite 文件。

## 环境要求

- Node.js 22 或更新版本，以及 npm。
- `better-sqlite3` 需要本机原生模块；若没有适用的预编译文件，安装时需要 C/C++ 编译工具。

## 快速启动

```bash
git clone https://github.com/Hearmen/agent-room-mcp.git
cd agent-room-mcp
npm install
npm start
```

默认地址：

- 管理页面：<http://127.0.0.1:4100>
- MCP 接口：`http://127.0.0.1:4100/mcp`
- 数据库：当前工作目录下的 `agent-room.db`

也可以编译后运行：

```bash
npm run build
node dist/main.js
```

## 配置

命令行参数优先于环境变量，环境变量优先于默认值。

| 参数 | 环境变量 | 默认值 |
|---|---|---|
| `--host` | `AGENT_ROOM_HOST` | `127.0.0.1` |
| `--port` | `AGENT_ROOM_PORT` | `4100` |
| `--db` | `AGENT_ROOM_DB` | `./agent-room.db` |

```bash
npm start -- --port 4200 --db ./agent-room.db
node dist/main.js --help
```

数据库路径相对于当前工作目录解析，父目录需要提前创建。端口允许设为 `0`，由系统分配空闲端口；实际地址会在启动后输出。

## 连接 Agent

使用支持 **Streamable HTTP** 的 MCP 客户端连接 `/mcp`。以下配置为常见格式，具体字段以客户端要求为准：

```json
{
  "mcpServers": {
    "agent-room": {
      "type": "http",
      "url": "http://127.0.0.1:4100/mcp"
    }
  }
}
```

推荐使用流程：

1. 用户在网页创建房间，填写名称与任务描述。
2. Agent 调用 `list_rooms`，找到与当前任务匹配的房间。
3. 调用 `select_room` 绑定房间，然后调用 `get_facts` 阅读已有发现。
4. 出现突破进展或明确约束时，新增或更新 fact；发现错误、过时或无关的 fact 时修正或删除。
5. 用户可在网页中查看和管理这些发现，任务结束后删除房间。

### MCP 工具

| 工具 | 参数 | 用途 |
|---|---|---|
| `list_rooms` | `{}` | 列出房间及任务描述 |
| `select_room` | `{ "roomId": 1 }` | 获取房间访问凭证 |
| `get_facts` | `{ "roomToken": "凭证" }` | 获取房间内的全部 fact |
| `add_fact` | `{ "roomToken": "凭证", "content": "发现内容" }` | 新增 fact |
| `update_fact` | `{ "roomToken": "凭证", "factId": 1, "content": "完整替换内容" }` | 修改 fact |
| `delete_fact` | `{ "roomToken": "凭证", "factId": 1 }` | 永久删除 fact |

Fact 操作不接收 `roomId`，而是显式接收 `roomToken`，服务端据此确定房间。Agent 可以修改或删除绑定房间内的任意 fact。

### 房间凭证
select_room 返回持久化的 roomToken，所有 fact 操作必须显式传递它。重连或重启后仍有效，房间删除后失效。同一个 Agent 工作会话只使用一个凭证是客户端约定，服务端无法识别对话边界。

### 什么值得写入 fact

适合写入：可复现的关键发现、排除某条路线的证据、影响后续工作的约束与边界。尽量在内容中附上证据、复现方式或相关位置。

不适合写入：无关信息、常识、琐碎观察、日常进度或已有 fact 的重复内容。服务端检查结构和非空内容，相关性与价值由 Agent 和用户判断。

## 使用注意

- 默认只监听本机回环地址。服务没有用户认证，只有在信任所有可访问客户端的网络中才应对外监听。
- 用户与 Agent 的权限区别由接口体现，并非针对直接 HTTP 调用者的身份认证边界。
- 删除房间会永久删除全部 fact；删除操作不可撤销。当前不保存历史版本，也没有恢复功能。
- 并发修改采用最后提交覆盖的方式，更新 fact 时需提交完整内容。

## 开发与设计

```bash
npm run build
npm test
```

测试包含配置校验、事务回滚、房间数据隔离，以及使用 MCP SDK 的 HTTP 集成流程。集成测试需要允许监听本机临时端口。

- [需求说明](docs/requirements.md)
- [架构与模块设计](docs/design/00-overview.md)
- `src/`：服务端实现
- `public/`：管理页面
- `test/`：自动化测试
