# Tasks

- [x] Task 1: 补齐语音基础设施（类型 + API + Mock）
  - [x] SubTask 1.1: 在 `common/ApiModels.ets` 中追加 `VoiceListItem`、`VoiceListResponse`、`VoiceUploadResult` 类型定义。
  - [x] SubTask 1.2: 在 `services/AppRepository.ets` 中追加 `getVoiceList(userId: string)` 和 `uploadVoice(userId: string, filePath: string)` 方法，支持 Mock/远程双轨。
  - [x] SubTask 1.3: 在 `mock/MockApi.ets` 中追加 `getVoiceList` 和 `uploadVoice` 静态方法；`getVoiceList` 返回 2 条预设语音记录（长辈/子女各一条），`uploadVoice` 返回模拟成功结果。

- [x] Task 2: 实现 InteractionTab（语音接龙）
  - [x] SubTask 2.1: 重写 `pages/tabs/InteractionTab.ets`：`aboutToAppear` 中调用 `appRepository.getVoiceList` 加载语音列表到 `@State voiceList`。
  - [x] SubTask 2.2: 实现语音列表 UI：按时间倒序渲染，每条显示发送者、时间标签、时长；长辈项边框绿色，子女项边框红色。
  - [x] SubTask 2.3: 实现录音按钮：使用 `@ohos.multimedia.media` AVRecorder 录制音频，点击开始录音，再次点击停止；录音中显示红色脉冲/动画状态。
  - [x] SubTask 2.4: 实现上传与刷新：停止录音后调用 `appRepository.uploadVoice`，成功后 Toast 提示并重新加载列表。
  - [x] SubTask 2.5: 实现播放控制：点击播放使用 AVPlayer 播放对应 URL，当前项高亮并显示播放中状态；支持再次点击暂停/停止。

- [x] Task 3: 实现 HealthTab（预警与健康摘要）
  - [x] SubTask 3.1: 重写 `pages/tabs/HealthTab.ets`：`aboutToAppear` 并发请求 `getWarningStatus` 与 `getTodayCheckInStatus`，保存到 `@State`。
  - [x] SubTask 3.2: 实现"亲情温度计"：圆形或卡片式 UI，根据 `warningLevel` 动态变色（0=绿色/温度正好，1=黄色/需要添柴，2+=红色/快去暖暖场），中心显示状态文案，下方显示"距离上次互动"时长。
  - [x] SubTask 3.3: 实现今日健康摘要：展示心情、步数、心率卡片；若 `hasCheckedInToday` 为 false，显示"今日待打卡"提示与前往首页的引导按钮。

- [x] Task 4: 修复 Splash 路由守卫
  - [x] SubTask 4.1: 修改 `pages/Splash.ets`：1200ms 延迟后，若 `appSession.getUserId()` 存在，调用 `resolveAuthenticatedRoute(appSession.getProfile())` 获取目标页面并 `replaceUrl`；否则进入 `pages/Login`。

- [x] Task 5: 为 ProfileTab 添加退出登录
  - [x] SubTask 5.1: 修改 `pages/tabs/ProfileTab.ets`：在页面底部添加"退出登录"按钮，点击后调用 `appSession.clear()` 并 `replaceUrl({ url: 'pages/Login' })`。

- [x] Task 6: 集成验证
  - [x] SubTask 6.1: 确认所有新增/修改文件在 ArkTS 语法上无低级错误（导入路径、类型引用、状态变量初始化）。
  - [ ] SubTask 6.2: 用户侧端到端验证：Splash 守卫、InteractionTab 录音/列表、HealthTab 预警、ProfileTab 退出。

# Task Dependencies
- Task 2 依赖 Task 1（需要 Voice 类型与 API）
- Task 3 不依赖 Task 1（使用已有 API），可与 Task 1/2 并行
- Task 4 不依赖其他任务，可与 Task 1/2/3 并行
- Task 5 不依赖其他任务，可与 Task 1/2/3/4 并行
- Task 6 依赖 Task 1-5（最终验证）
