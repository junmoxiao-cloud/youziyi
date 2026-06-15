# apps/harmony

鸿蒙 ArkTS 前端骨架，应用名采用 `YouZiYi / 游子衣`，作为当前 Monorepo 中与 `apps/web`、`apps/miniapp`、`apps/server` 并列的前端端。

## 目标
- 复用旧仓库 `YouZiYi` 的工程分层、页面路由和底部标签页结构。
- 保持前端边界：仅包含页面、组件、状态、接口封装与开发期 Mock。
- 去除不尊重的资料采集表达，不在首次资料页强制询问“身体疾病”。

## 当前骨架
- `AppScope/`：应用级配置与图标资源。
- `entry/src/main/ets/pages/`：`Splash -> Login -> RoleSelect -> CareProfile -> Main` 页面壳。
- `entry/src/main/ets/pages/tabs/`：首页、互动、预警、我的四个标签页占位。
- `entry/src/main/ets/services/`：前端仓储层，后续接入已部署服务端。
- `entry/src/main/ets/mock/`：开发期 Mock 与万能验证码兜底。
- 应用包名固定为 `com.youziyi.app`。

## 远程 / Mock / 万能验证码策略
- 默认配置位于 `entry/src/main/ets/common/AppConfig.ets`。
- 默认环境为 `production`，`apiMode` 默认值为 `remote`，直接绑定云端域名 `https://api.youziyi.com`。
- 前端展示域名记录为 `https://www.youziyi.com`，与后端 API 域名分离。
- 仅当环境切到 `development` 时，接口基址才会切回 `http://localhost:3001`。
- `verification.requestMode` 默认值为 `remote`，登录页会先请求 `/api/health` 确认当前鸿蒙端已连接服务端。
- 当前服务端尚未提供正式短信验证码接口，因此验证码仍保留“演示壳”边界，不在鸿蒙端内实现真实鉴权。
- `verification.enableUniversalCode` 与 `verification.allowMockFallback` 仍保留配置项，但会额外受“仅开发态可用”闸门控制。
- 正式环境下，即使误把上述开关设为 `true`，万能验证码、验证码 Mock 模式与远程失败后的 Mock 回退也不会生效。

## 已接通的远程接口
- `POST /api/health/checkin`
- `GET /api/warning/status/:userId`
- `GET /api/weather/current`
- 登录验证码请求默认绑定 `GET /api/health` 做服务端连通确认。

## 切换方式
- 全量切到 Mock：将 `apiMode` 改为 `ApiMode.MOCK`。
- 仅验证码切到 Mock：保持 `apiMode` 为 `ApiMode.REMOTE`，将 `verification.requestMode` 改为 `ApiMode.MOCK`。
- 切到开发态本地联调：将 `DEFAULT_APP_ENVIRONMENT` 改为 `AppEnvironment.DEVELOPMENT`。
- 关闭万能验证码：将 `verification.enableUniversalCode` 改为 `false`。
- 禁止远程失败后自动回退 Mock：将 `verification.allowMockFallback` 改为 `false`。
