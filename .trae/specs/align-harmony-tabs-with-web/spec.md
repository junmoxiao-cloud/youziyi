# youziyi-oss 鸿蒙前端 Tab 补齐 Spec

## Why
`youziyi-oss/apps/harmony` 的鸿蒙应用框架已具备完整的基础设施（类型、配置、状态管理、API 服务、Mock）、认证流程（Splash/Login/Onboarding/FamilyJoin）、每日打卡（HomeTab）和个人中心（ProfileTab）。但 **InteractionTab** 和 **HealthTab** 仍为纯骨架占位，**Splash** 缺少登录态检查与路由守卫，且语音相关 API 与类型尚未定义。本 Spec 旨在补齐这 3 个短板，使鸿蒙端核心功能与 Web 母版一致。

## What Changes
- 在 `ApiModels.ets` 中新增语音相关类型（VoiceListItem、VoiceListResponse、VoiceUploadResult）。
- 在 `AppRepository.ets` 与 `MockApi.ets` 中补齐 `getVoiceList` 和 `uploadVoice` 方法。
- 重写 `InteractionTab.ets`：语音列表时间线、录音（鸿蒙 AVRecorder）、上传、播放控制。
- 重写 `HealthTab.ets`：亲情温度计（预警等级可视化）、今日健康摘要、打卡提醒。
- 修复 `Splash.ets`：1200ms 延迟后检查 `appSession` 登录态，使用 `resolveAuthenticatedRoute` 自动分流（Onboarding / FamilyJoin / Main / Login）。
- 为 `ProfileTab.ets` 补充"退出登录"按钮，清空 `AppSession` 后返回 Login。

## Impact
- Affected code: `youziyi-oss/apps/harmony/entry/src/main/ets/common/ApiModels.ets`、`services/AppRepository.ets`、`mock/MockApi.ets`、`pages/tabs/InteractionTab.ets`、`pages/tabs/HealthTab.ets`、`pages/Splash.ets`、`pages/tabs/ProfileTab.ets`。
- 逻辑真源：Web 端 `youziyi-oss/apps/web/src/components/VoiceTimeline.tsx` 与 `youziyi-oss/apps/web/src/pages/CompanionDashboard.tsx`（预警部分）。

## ADDED Requirements

### Requirement: 语音基础设施
The system SHALL provide types, API methods, and Mock data for voice relay.

#### Scenario: 类型定义
- **WHEN** 开发者使用语音功能
- **THEN** 必须复用 `ApiModels.ets` 中的 `VoiceListItem`、`VoiceListResponse`、`VoiceUploadResult`

#### Scenario: API 与 Mock
- **WHEN** 页面调用 `appRepository.getVoiceList(userId)` 或 `uploadVoice(userId, filePath)`
- **THEN** `AppRepository` 按 `APP_CONFIG.apiMode` 自动路由到 `MockApi` 或远程服务端；Mock 层返回预设语音列表与模拟上传结果

### Requirement: InteractionTab（语音接龙）
The system SHALL provide a complete voice relay with record, upload, play, and timeline.

#### Scenario: 查看语音列表
- **WHEN** 用户进入 InteractionTab
- **THEN** `aboutToAppear` 请求 `getVoiceList`，按时间倒序渲染列表，区分长辈（绿色边框）与子女（红色边框），显示发送者、时间标签、时长

#### Scenario: 录音与上传
- **WHEN** 用户点击"按住说话"或录音按钮
- **THEN** 调用鸿蒙 `@ohos.multimedia.media` AVRecorder 开始录音，UI 显示录音中状态；停止后获得音频文件路径，调用 `uploadVoice` 上传；上传成功后刷新列表并 Toast 提示

#### Scenario: 播放语音
- **WHEN** 用户点击某条语音的播放按钮
- **THEN** 使用 AVPlayer 或音频能力播放对应 URL；当前播放项高亮，支持暂停/停止；播放完毕后恢复状态

### Requirement: HealthTab（预警与健康摘要）
The system SHALL display warning status and recent health summary.

#### Scenario: 亲情温度计
- **WHEN** 用户进入 HealthTab
- **THEN** 请求 `getWarningStatus` 与 `getTodayCheckInStatus`
- **AND** 展示圆形/卡片式"亲情温度计"：正常（绿色，"温度正好"）、24小时未互动（黄色，"需要添柴"）、36/48小时（红色，"快去暖暖场"）
- **AND** 下方显示"距离上次互动"的时长文字

#### Scenario: 今日健康摘要
- **THEN** 展示今日打卡摘要卡片：心情、步数、心率；若今日未打卡则显示"今日待打卡"并提示前往首页

### Requirement: Splash 路由守卫
The system SHALL check existing auth state before routing.

#### Scenario: 启动分流
- **WHEN** 应用从 Splash 启动（1.2s 延迟后）
- **THEN** 若 `appSession.getUserId()` 存在，调用 `resolveAuthenticatedRoute(appSession.getProfile())` 决定去向（Onboarding / FamilyJoin / Main）
- **THEN** 若无登录态，进入 Login

### Requirement: ProfileTab 退出登录
The system SHALL provide logout.

#### Scenario: 退出
- **WHEN** 用户在 ProfileTab 点击"退出登录"
- **THEN** 调用 `appSession.clear()` 并 `replaceUrl({ url: 'pages/Login' })`

## MODIFIED Requirements
### Requirement: 现有 InteractionTab
- 从纯占位文本替换为完整语音接龙业务实现。

### Requirement: 现有 HealthTab
- 从纯占位文本替换为完整预警状态与健康摘要实现。

### Requirement: 现有 Splash
- 从硬编码 `replaceUrl({ url: 'pages/Login' })` 替换为动态路由守卫分流。

## REMOVED Requirements
- 无移除需求。
