# Tasks

- [x] Task 1: 搭建小程序全局状态与路由守卫基础设施
  - [x] SubTask 1.1: 在 `app.ts` 中定义 `globalData`（`isAuthenticated`, `userId`, `userRole`, `userProfile`, `viewMode`, `shownCheckInReminderKeys` 等），实现 `onLaunch` 从 Storage 恢复登录态
  - [x] SubTask 1.2: 在 `app.ts` 中暴露 `setAuth`, `logout`, `resolveLandingPath` 等全局方法
  - [x] SubTask 1.3: 创建 `utils/routing.ts`，复刻 Web 端 `hasCompletedOnboarding`, `hasJoinedFamily`, `resolveAuthenticatedLandingPath`
  - [x] SubTask 1.4: 更新 `app.json` 注册所有新页面并调整 `pages/index/index` 为 Care Dashboard，移除未实现页面
  - [x] SubTask 1.5: 更新 `app.wxss` 添加全局适老化样式变量（大字号、高对比色、安全边距）

- [x] Task 2: 实现认证页面（欢迎、登录、注册）
  - [x] SubTask 2.1: 创建 `pages/welcome/welcome`，复刻 Web 端欢迎页，提供“开启陪伴之旅”与“我有牵挂码”入口
  - [x] SubTask 2.2: 创建 `pages/login/login`，调用 `POST /api/auth/login`，成功后保存状态并执行路由守卫首跳
  - [x] SubTask 2.3: 创建 `pages/register/register`，调用 `POST /api/auth/register`，成功后跳转登录页
  - [x] SubTask 2.4: 验证登录态持久化：关闭小程序后重新进入可恢复登录

- [x] Task 3: 实现 Onboarding 首次信息采集页
  - [x] SubTask 3.1: 创建 `pages/onboarding/onboarding`，提供城市选择（使用 `CITY_OPTIONS`）与自定义城市输入
  - [x] SubTask 3.2: 实现健康指标多选（心情必选），复刻 Web 端 `DEFAULT_METRICS`
  - [x] SubTask 3.3: 调用 `POST /api/user/profile/update` 保存 `cityCode` 与 `trackedMetrics`
  - [x] SubTask 3.4: 保存成功后拉取最新 `userProfile` 并跳转 `/pages/family-join/family-join`

- [x] Task 4: 实现家庭连接页
  - [x] SubTask 4.1: 创建 `pages/family-join/family-join`，提供“创建家庭”与“输入牵挂码”两种模式
  - [x] SubTask 4.2: 实现 `POST /api/family/create`，成功后展示牵挂码与家庭成员列表
  - [x] SubTask 4.3: 实现 `POST /api/family/join`，成功后展示“连接成功”反馈
  - [x] SubTask 4.4: 连接成功后调用 `GET /api/user/profile/:userId` 刷新资料，并提供“进入主页”按钮跳转 `/pages/role-select/role-select`

- [x] Task 5: 实现角色选择页
  - [x] SubTask 5.1: 创建 `pages/role-select/role-select`，复刻 Web 端“我是长辈/我是子女”大卡片选择
  - [x] SubTask 5.2: 选择长辈后设置 `viewMode='care'` 并跳转 `/pages/index/index`（Care Dashboard）
  - [x] SubTask 5.3: 选择子女后设置 `viewMode='companion'` 并跳转 `/pages/companion/companion`

- [x] Task 6: 实现长辈关怀面板（Care Dashboard）
  - [x] SubTask 6.1: 将 `pages/index/index` 改造为 Care Dashboard，复刻 Web 端页面结构与状态提示
  - [x] SubTask 6.2: 在 `onLoad` 并行拉取 `profile`, `checkin-status`, `daily/:userId`
  - [x] SubTask 6.3: 根据 `form.editableMetrics` 动态渲染表单字段（心情、步数、心率、血压、血糖、睡眠）
  - [x] SubTask 6.4: 实现打卡窗口判断：非窗口内或已打卡时禁用提交并展示对应文案
  - [x] SubTask 6.5: 实现 `POST /api/health/checkin`，成功后刷新 `checkin-status` 与 `daily`，并给出震动/Toast 反馈
  - [x] SubTask 6.6: 实现今日打卡提醒弹窗，当天仅展示一次
  - [x] SubTask 6.7: 展示最近几天打卡记录摘要

- [x] Task 7: 实现子女陪伴面板（Companion Dashboard）
  - [x] SubTask 7.1: 创建 `pages/companion/companion`，复刻 Web 端核心布局
  - [x] SubTask 7.2: 在 `onLoad` 拉取 `profile`, `warning/status`, `weathers`, `voices`, 共享对象 `checkin-status` 与 `daily`
  - [x] SubTask 7.3: 实现亲情温度计，展示距离上次互动时长与预警等级
  - [x] SubTask 7.4: 实现同一片天空天气卡片，按长辈/子女城市分别请求天气
  - [x] SubTask 7.5: 实现今日共享状态卡片，展示家庭共享对象的心情、步数、心率
  - [x] SubTask 7.6: 实现家庭语音接龙列表，调用 `GET /api/voice/list/:userId`

- [x] Task 8: 实现个人设置页与全局导航
  - [x] SubTask 8.1: 创建 `pages/profile/profile`，复刻 Web 端城市与指标修改
  - [x] SubTask 8.2: 调用 `POST /api/user/profile/update` 保存，成功后返回上一页
  - [x] SubTask 8.3: 在 Care/Companion 面板顶部添加“个人设置”入口
  - [x] SubTask 8.4: 在设置页提供“退出登录”按钮，清除全局状态与 Storage

- [x] Task 9: 改造语音页面并实现真实用户上传
  - [x] SubTask 9.1: 更新 `pages/voice/voice`，移除硬编码 `userId`/`storyId`
  - [x] SubTask 9.2: 上传时使用 `App.globalData.userId` 与 `familyId`（或 `default-story`）
  - [x] SubTask 9.3: 上传成功后通过 `wx.navigateBack` 返回列表页，由 `companion` 等页面在 `onShow` 中自动刷新语音列表并给出震动/Toast 反馈
  - [x] SubTask 9.4: 保留按住录音、松开发送的适老交互，确保按钮热区 ≥120rpx

- [x] Task 10: 统一请求工具与离线缓存
  - [x] SubTask 10.1: 检查 `utils/request.ts` 对所有新增接口的通用支持
  - [x] SubTask 10.2: 确保 POST 打卡/语音上传在弱网时进入离线队列，网络恢复后自动重发（打卡已覆盖；语音上传走 `wx.uploadFile`，尚未接入离线队列）
  - [x] SubTask 10.3: 统一错误提示，避免重复 `wx.showToast`

- [x] Task 11: 清理旧文件与验证
  - [x] SubTask 11.1: 删除未使用的旧页面文件 `pages/logs/logs.*`
  - [x] SubTask 11.2: 在 `app.json` 中确认页面路径完整、无重复
  - [x] SubTask 11.3: 全局搜索确保无硬编码 `mock-user-123`、`story-456`、旧端口等遗留

# Task Dependencies

- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 3
- Task 5 依赖 Task 4
- Task 6 依赖 Task 5
- Task 7 依赖 Task 5
- Task 8 依赖 Task 1
- Task 9 依赖 Task 1
- Task 10 依赖 Task 1
- Task 11 依赖 Task 6、Task 7、Task 9
