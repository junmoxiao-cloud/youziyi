# youziyi-oss

本仓库是《游子衣》项目的开源代码子集，仅包含可公开的工程源码与规则文档：

- apps/
  - web/：Web 端大屏展示与动效（Vite + React）
  - server/：后端 API（Node.js）
  - miniapp/：微信小程序端
  - harmony/：鸿蒙端工程
- packages/
  - types/：共享 TypeScript 类型定义
- .trae/rules/：项目规则与接口规范（供协作参考）

## 共享真源与当前边界

- 城市码与标签映射的单一真源固定为 `packages/types/src/index.ts`；`apps/web` 与 `apps/server` 直接消费该共享定义，`apps/harmony` 只允许消费同步产物 `apps/harmony/entry/src/main/ets/common/synced/SharedCityCatalog.ets`，禁止在页面或模型文件内再次维护 `BEIJING`、`SHANGHAI` 等分叉常量。
- 当前已完成的家庭共享能力以 Web/Server 为准：登录后的真实路由守卫、家庭连接稳态展示、家庭对方成员基础资料读取、天气来源说明、最小健康状态来源说明，以及今日打卡状态/按天聚合/时段窗口策略的统一口径。
- 当前未完成的共享边界也必须显式记录：鸿蒙第一阶段虽然已承接登录、Onboarding、家庭连接、每日打卡和家庭基础信息展示，但尚未完成“家庭对方成员资料 + 天气来源说明 + 最小健康摘要”的正式远程联调闭环，现阶段只能以边界说明和基础信息展示为准，不得伪装为已完成共享。
- 任一共享字段、共享常量或共享边界发生变更时，必须同步更新 API 文档、Rules、README、共享类型/常量、Web、Harmony 与 Mock，禁止只修单端说明。

## 公网域名约定

- `https://www.youziyi.com` 用于对外提供 Web 前端页面。
- Web 端生产环境继续使用相对路径 `/api`，由 `www.youziyi.com` 所在网关或 Nginx 将 `/api/*` 反代到后端服务。
- `https://api.youziyi.com` 用于对外提供统一后端 API，服务对象包括 Web 反代请求、微信小程序与鸿蒙原生端。
- 微信小程序与鸿蒙使用各自的原生前端，不通过 `www.youziyi.com` 加载页面；它们在生产环境中应直接请求 `https://api.youziyi.com`。
- 若公网域名、反代策略或端侧 API 入口发生变化，必须同步更新 `README.md`、`.trae/rules/API接口规范.md`、`.trae/rules/技术开发规则.md` 以及对应端的配置文件，禁止只改单端说明。

## 快速开始

本仓库未配置根工作区（workspace）聚合依赖；各端工程按各自目录独立安装与启动。

### Web 端

```bash
cd apps/web
npm install
npm run dev
```

### 后端

```bash
cd apps/server
npm install
npm run dev
```

## 安全与敏感信息

- 任何环境变量文件（如 .env、.env.local）与密钥/证书文件禁止提交。
- 若你需要本地运行配置，请复制示例文件并在本机创建私有配置（例如 apps/server/.env.example -> apps/server/.env）。
- 若发现疑似敏感信息误入提交历史，请立即停止传播并进行清理（包括重写历史）。

## 许可

见 [LICENSE](./LICENSE)。
