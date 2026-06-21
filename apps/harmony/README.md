# apps/harmony

鸿蒙 ArkTS 前端骨架，应用名采用 `YouZiYi / 游子衣`，作为当前 Monorepo 中与 `apps/web`、`apps/miniapp`、`apps/server` 并列的前端端。

## 目标
- 复用旧仓库 `YouZiYi` 的工程分层、页面路由和底部标签页结构。
- 保持前端边界：仅包含页面、组件、状态、接口封装与开发期 Mock。
- 去除不尊重的资料采集表达，不在首次资料页强制询问“身体疾病”。

## 第一阶段能力边界
- 第一阶段只承接 Web 已稳定的最小业务母版：登录/注册、Onboarding、家庭连接、每日打卡、家庭基础信息展示。
- 第一阶段不承接复杂陪伴大屏、3D 天气瓶、完整语音接龙、多层预警编排、运营化数据看板等扩展能力。
- 页面与状态判断必须复用已定稿的字段口径，不得在鸿蒙端重新发明城市码、今日打卡状态、按天聚合结构或时段窗口策略。
- 若 Web 母版仍存在字段漂移、共享路径未收敛或家庭闭环未稳定，鸿蒙侧只允许保持占位说明，不得自行补一套兼容逻辑。

## 迁移前置条件
- 城市码共享常量已在共享层定稿，鸿蒙只消费同步产物 `entry/src/main/ets/common/synced/SharedCityCatalog.ets`，该产物必须与 `packages/types/src/index.ts` 保持单向同步，不得回到 `ApiModels.ets` 或页面内自维护。
- `GET /api/health/checkin-status/:userId` 已作为今日打卡状态单一真源，覆盖是否已打卡、最后一次打卡时间、摘要与表单初始化所需字段。
- `GET /api/health/checkins/daily/:userId` 已提供按天聚合结构，鸿蒙页面不得再扫描原始明细自行推导“今天/昨天/最近几天”。
- 早晚时段、打卡窗口、逾时提示和已打卡提示已形成统一策略；鸿蒙只复用该策略，不单独维护另一套时间边界。

## 当前共享能力与未完成边界
- 已完成共享能力：Web/Server 已形成登录后真实首跳、家庭连接稳态展示、家庭对方成员基础资料读取、天气来源说明、最小健康状态来源说明，以及城市码/今日打卡状态/按天聚合/时段窗口策略的统一协议。
- 鸿蒙当前已交付：登录/注册、Onboarding、家庭连接、每日打卡、账号资料与家庭基础成员信息展示，且城市展示已切到共享同步产物，不再在鸿蒙模型层自维护城市常量。
- 鸿蒙尚未完成：家庭对方成员资料、天气来源说明和最小健康摘要的正式远程联调闭环；当前 README 与页面只记录边界，不代表这些共享展示已经正式接通。
- 在上述闭环完成前，鸿蒙不得通过本地常量、页面兜底或 mock 文案假装“已完成家庭共享”，所有未完成项都必须在页面文案与文档中保持一致。

## 第一阶段依赖接口
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/users/:userId/profile`
- `PATCH /api/users/:userId/profile`
- `POST /api/family/create`
- `POST /api/family/join`
- `GET /api/family/:familyId`
- `GET /api/health/checkin-status/:userId`
- `POST /api/health/checkin`
- `GET /api/health/checkins/daily/:userId`

## 交付约束
- 任一共享字段发生新增、删除、改名或嵌套层级变化时，必须同步更新后端实现、接口文档、共享类型/常量、Web、Harmony、Mock 与 README/Rules，禁止只修鸿蒙端读取路径。
- 鸿蒙 README 记录的是已确认交付边界，不代表服务端已全部联调完成；若某接口仍处于占位或 Web 侧待稳定状态，必须在页面与文档中同时标记。
- 当前阶段仅允许静态改造与文档沉淀；实际联调、运行验证和多端回归需在用户明确授权后执行。

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

## 后续待办
- 接入并验证认证、用户资料、家庭连接、今日打卡状态、按天聚合的真实服务端响应，逐步替换当前演示性质的验证码壳与部分 Mock 兜底。
- 在 Web 母版确认家庭共享稳态后，再补齐鸿蒙端对家庭对方成员资料、天气来源说明和最小健康摘要的正式展示与联调闭环。
- 待共享协议稳定后，再评估迁移语音接龙、预警状态与更完整的陪伴页能力，避免提前复制未定稿逻辑。

## 切换方式
- 全量切到 Mock：将 `apiMode` 改为 `ApiMode.MOCK`。
- 仅验证码切到 Mock：保持 `apiMode` 为 `ApiMode.REMOTE`，将 `verification.requestMode` 改为 `ApiMode.MOCK`。
- 切到开发态本地联调：将 `DEFAULT_APP_ENVIRONMENT` 改为 `AppEnvironment.DEVELOPMENT`。
- 关闭万能验证码：将 `verification.enableUniversalCode` 改为 `false`。
- 禁止远程失败后自动回退 Mock：将 `verification.allowMockFallback` 改为 `false`。
