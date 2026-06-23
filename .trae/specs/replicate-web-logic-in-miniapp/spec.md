# 微信小程序复刻 Web 前端业务逻辑 Spec

## Why

当前 `apps/miniapp` 仅实现了最基础的打卡原型页（`pages/index/index` 与 `pages/voice/voice`），存在硬编码 `userId`、缺少登录注册、Onboarding、家庭连接、路由守卫及角色化面板等核心能力，无法与后端真实多账户体系对接。为了让小程序端达到与 Web 端一致的业务闭环，并满足 MVP 落地与适老化使用要求，必须在小程序中完整复刻 Web 前端的业务逻辑与数据流。

## What Changes

- 在小程序中建立与 Web 端等价的页面结构与路由流转：欢迎页、登录、注册、Onboarding、家庭连接、角色选择、长辈关怀面板、子女陪伴面板、个人设置、家庭语音接龙。
- 复刻 Web 端的认证状态、用户资料、健康打卡、家庭关系、天气、预警、语音等数据模型与后端 API 调用。
- 实现等同于 Web 端 `routing.ts` 的路由守卫逻辑：未登录拦截、未 Onboarding 拦截、未加入家庭拦截、按角色进入对应面板。
- 使用微信小程序全局状态（`App.globalData` + `Storage`）替代 Zustand store，保持与 Web 端一致的状态字段与 API 消费路径。
- 保持并强化适老化 UI：大字号（核心 24px+/48rpx+）、高对比度、大点击热区（≥48×48 dp）、关键操作震动/语音提示反馈。
- 复用并完善 `utils/request.ts` 的离线缓存与错误提示，确保弱网场景下打卡/语音可暂存并重发。
- 将小程序中所有硬编码 `userId`、`mock-user-123`、`story-456` 等测试数据替换为真实登录态。
- **BREAKING**：原 `pages/index/index` 将被改造为长辈关怀面板（Care Dashboard）；若需保留旧入口，需在 `app.json` 中显式移除 `pages/logs/logs` 等未实现页面。

## Impact

- 受影响规格：数据采集与路由规范、API 接口规范、技术开发规则、游子衣宏观指导。
- 受影响代码：
  - `apps/miniapp/miniprogram/app.ts`
  - `apps/miniapp/miniprogram/app.json`
  - `apps/miniapp/miniprogram/app.wxss`
  - `apps/miniapp/miniprogram/pages/**`（新增/重写）
  - `apps/miniapp/miniprogram/utils/request.ts`（可能增强）
  - `apps/miniapp/miniprogram/config.ts`（可能调整）
- 受影响接口：复用 Web 端已有的全部后端接口，无需新增后端接口。

## ADDED Requirements

### Requirement: 认证与注册登录

The system SHALL 提供与 Web 端一致的账号体系入口。

#### Scenario: 注册
- **WHEN** 用户在注册页填写称呼、密码并选择身份（长辈/子女）
- **THEN** 调用 `POST /api/auth/register`，成功后提示“连接已建立”并跳转登录页

#### Scenario: 登录
- **WHEN** 用户在登录页填写称呼、密码
- **THEN** 调用 `POST /api/auth/login`，成功后保存 `userId`、`role`、`name` 到全局状态与 `Storage`，拉取 `GET /api/user/profile/:userId`，并根据路由守卫决定首跳路径

### Requirement: 路由守卫与首跳

The system SHALL 在小程序启动、页面 `onShow` 及登录完成后执行与 Web 端 `routing.ts` 等价的守卫。

#### Scenario: 未登录访问需授权页面
- **WHEN** 用户进入任意需要登录的页面
- **THEN** 若 `globalData.isAuthenticated` 为 false，则重定向到 `/pages/login/login`

#### Scenario: 登录后首次进入
- **WHEN** 登录成功并已拉取 `userProfile`
- **THEN** 按以下顺序决定去向：
  - 若 `trackedMetrics` 为空 → `/pages/onboarding/onboarding`
  - 否则若 `familyId` 为空 → `/pages/family-join/family-join`
  - 否则 → `/pages/role-select/role-select`

### Requirement: Onboarding 首次信息采集

The system SHALL 复刻 Web 端 Onboarding 的城市与健康指标采集。

#### Scenario: 提交 Onboarding
- **WHEN** 用户选择/填写城市并勾选希望追踪的健康指标（心情为必选）
- **THEN** 调用 `POST /api/user/profile/update` 更新 `cityCode` 与 `trackedMetrics`
- **AND THEN** 重新拉取 `userProfile`，成功后跳转 `/pages/family-join/family-join`

### Requirement: 家庭连接

The system SHALL 复刻 Web 端家庭创建/加入逻辑，并在连接成功后刷新用户资料。

#### Scenario: 创建家庭
- **WHEN** 用户点击“创建家庭/生成牵挂码”
- **THEN** 调用 `POST /api/family/create`，成功后立即拉取 `GET /api/user/profile/:userId` 展示家庭信息、牵挂码与成员列表

#### Scenario: 加入家庭
- **WHEN** 用户输入牵挂码并确认
- **THEN** 调用 `POST /api/family/join`，成功后立即拉取 `GET /api/user/profile/:userId` 并展示“连接成功”反馈

#### Scenario: 进入主面板
- **WHEN** 家庭连接成功后点击“进入主页”
- **THEN** 跳转 `/pages/role-select/role-select`

### Requirement: 角色选择与面板分流

The system SHALL 提供角色选择页，并将用户分流到对应面板。

#### Scenario: 选择长辈
- **WHEN** 用户点击“我是长辈”
- **THEN** 保存 `viewMode = 'care'` 并跳转 `/pages/care/care`

#### Scenario: 选择子女
- **WHEN** 用户点击“我是子女”
- **THEN** 保存 `viewMode = 'companion'` 并跳转 `/pages/companion/companion`

### Requirement: 长辈关怀面板（Care Dashboard）

The system SHALL 复刻 Web 端长辈打卡面板，基于 `todayCheckInStatus` 动态渲染表单。

#### Scenario: 进入面板
- **WHEN** 用户进入 `/pages/care/care`
- **THEN** 并行拉取 `GET /api/user/profile/:userId`、`GET /api/health/checkin-status/:userId`、`GET /api/health/checkins/daily/:userId`

#### Scenario: 动态表单
- **WHEN** `todayCheckInStatus.form.editableMetrics` 或 `userProfile.trackedMetrics` 返回后
- **THEN** 仅渲染已启用指标（心情、步数、心率、血压、血糖、睡眠），心情必选且不可取消

#### Scenario: 窗口控制
- **WHEN** 当前时间不在 `window.isWithinCheckInWindow` 范围内或 `hasCheckedInToday` 为 true
- **THEN** 提交按钮禁用并显示对应提示文案

#### Scenario: 提交打卡
- **WHEN** 用户在窗口内提交表单
- **THEN** 调用 `POST /api/health/checkin`，成功后重新拉取 `checkin-status` 与 `daily` 接口，并展示成功提示与震动反馈

#### Scenario: 提醒弹窗
- **WHEN** 用户当天未打卡且处于打卡窗口内
- **THEN** 页面首次加载时展示打卡提醒，当天仅展示一次

### Requirement: 子女陪伴面板（Companion Dashboard）

The system SHALL 复刻 Web 端子女陪伴面板的核心信息展示。

#### Scenario: 进入面板
- **WHEN** 用户进入 `/pages/companion/companion`
- **THEN** 拉取 `profile`、`warning/status`、双方天气、语音列表、家庭共享对象的 `checkin-status` 与 `daily` 聚合

#### Scenario: 亲情温度计
- **WHEN** `warningStatus` 返回后
- **THEN** 展示距离上次互动时长与预警等级（0/1/2/3），等级 >0 时给出关怀提示

#### Scenario: 同一片天空
- **WHEN** 家庭成员 `cityCode` 存在时
- **THEN** 分别请求 `GET /api/weather/current?cityCode=...` 展示长辈与子女所在城市天气

#### Scenario: 今日共享状态
- **WHEN** 获取到家庭共享对象的健康快照
- **THEN** 展示今日是否打卡、心情、步数、心率及最近更新时间

#### Scenario: 家庭故事接龙
- **WHEN** 用户进入陪伴面板
- **THEN** 拉取 `GET /api/voice/list/:userId` 并展示语音列表，支持按住录音上传

### Requirement: 个人设置（Profile）

The system SHALL 复刻 Web 端 Profile 的城市与指标修改能力。

#### Scenario: 保存设置
- **WHEN** 用户修改城市或指标后点击保存
- **THEN** 调用 `POST /api/user/profile/update`，成功后提示并返回上一页

### Requirement: 全局状态与存储

The system SHALL 使用微信小程序 `App.globalData` 与 `wx.getStorageSync`/`wx.setStorageSync` 维护登录态。

#### Scenario: 启动恢复
- **WHEN** 小程序 `onLaunch` 时
- **THEN** 从 `Storage` 读取 `youziyi_auth`、`youziyi_profile`，若存在则恢复登录态，否则保留未登录态

#### Scenario: 登录持久化
- **WHEN** 登录成功
- **THEN** 将 `userId`、`role`、`name`、`isAuthenticated` 写入 `Storage`

#### Scenario: 退出登录
- **WHEN** 用户在设置页退出
- **THEN** 清除全局状态与 `Storage`，跳转登录页

### Requirement: 适老化交互

The system SHALL 满足技术开发规则中的适老化组件规范。

#### Scenario: 视觉要求
- **WHEN** 页面渲染后
- **THEN** 最小字号不低于 18px（36rpx），核心信息字号达到 24px+（48rpx+），前景/背景对比度符合 WCAG AA

#### Scenario: 交互反馈
- **WHEN** 用户完成打卡、录音、加入家庭等关键操作
- **THEN** 同时提供视觉 Toast、震动（`wx.vibrateShort`），并在适当时机触发语音播报

## MODIFIED Requirements

### Requirement: 语音上传与列表

原小程序 `pages/voice/voice` 仅支持录音上传且使用硬编码 `userId` 与 `storyId`。

- 录音上传时须使用当前登录用户的真实 `userId`。
- `storyId` 可复用默认值 `default-story` 或读取全局状态中的家庭 `familyId`。
- 上传成功后刷新语音列表。
- 保留按住录音、松开发送的适老交互，按钮尺寸不小于 120rpx。

## REMOVED Requirements

### Requirement: 旧版首页硬编码打卡

**Reason**：旧版 `pages/index/index` 使用 `userId: 'mock-user-123'` 直接调用 `/api/health/checkin`，无认证、无动态表单、无窗口控制，与真实业务闭环冲突。

**Migration**：
- 将 `pages/index/index` 改造为长辈关怀面板（Care Dashboard）。
- 原简单的心情+步数提交逻辑由 Care Dashboard 的动态表单与窗口策略替代。
- 原“家庭语音接龙”跳转按钮迁移到全局导航或陪伴面板内。
