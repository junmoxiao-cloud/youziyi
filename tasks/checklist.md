# Task5 最小实现 Checklist

更新时间：2026-06-20

## 本次实施范围

- [x] 仅在 `c:\Users\dou12\Desktop\youziyi\youziyi-oss\apps\harmony` 内完成 Task5 最小实现
- [x] 接入登录/注册最小闭环，登录成功后按资料完整度跳转到 Onboarding、家庭连接或主页面
- [x] 接入 Onboarding 页面，复用现有城市常量口径与动态打卡指标配置
- [x] 接入家庭连接页面，支持创建家庭、输入牵挂码加入家庭，并展示家庭基础信息
- [x] 接入每日打卡页面，复用 `GET /api/health/checkin-status/:userId` 与 `POST /api/health/checkin` 的接口字段口径
- [x] 在鸿蒙端展示账户资料、Onboarding 配置与家庭基础成员信息

## 变更说明

- [x] `apps/harmony/entry/src/main/ets/common/ApiModels.ets`：补齐登录/资料/家庭/今日打卡状态相关类型，并同步城市常量与指标标签
- [x] `apps/harmony/entry/src/main/ets/common/AppSession.ets`：新增轻量会话状态与登录后首跳路由判断
- [x] `apps/harmony/entry/src/main/ets/services/AppRepository.ets`：补齐认证、资料、家庭连接、今日打卡状态接口封装
- [x] `apps/harmony/entry/src/main/ets/mock/MockApi.ets`：补齐最小本地数据流，支撑注册、登录、Onboarding、家庭连接与打卡演示
- [x] `apps/harmony/entry/src/main/ets/pages/Login.ets`：改为登录/注册双模式入口
- [x] `apps/harmony/entry/src/main/ets/pages/Onboarding.ets`：新增首次资料采集页
- [x] `apps/harmony/entry/src/main/ets/pages/FamilyJoin.ets`：新增家庭连接页与家庭基础信息展示
- [x] `apps/harmony/entry/src/main/ets/pages/tabs/HomeTab.ets`：切到真实会话用户，展示今日打卡状态并支持按指标提交
- [x] `apps/harmony/entry/src/main/ets/pages/tabs/ProfileTab.ets`：展示账号资料、Onboarding 配置与家庭基础成员信息
- [x] `apps/harmony/entry/src/main/resources/base/profile/main_pages.json`：注册新增页面路由

## 验证边界

- [x] 按要求未修改 `apps/harmony` 之外的业务代码目录
- [x] 按要求未启动服务、未执行运行测试、未做联调验证
- [x] 仅进行静态代码修改与静态诊断

---

# Task2 实现 Checklist

更新时间：2026-06-20

## 本次实施范围

- [x] 仅在 `c:\Users\dou12\Desktop\youziyi\youziyi-oss` 内实施 Task2
- [x] 复用 `packages/types` 中的城市常量与城市解析函数，保持 Web 侧城市来源共享
- [x] 保持服务端 `POST /api/health/checkin`、`GET /api/health/checkin-status/:userId`、`GET /api/health/checkins/daily/:userId` 作为 Task2 数据真源
- [x] 补齐 Web `store` 对今日打卡状态与按天聚合的读取、缓存与提交后回写
- [x] 补齐 Web 长辈关怀页最小打卡闭环：进入页加载状态、按时间策略控制提交、提交后刷新今日摘要与最近几天聚合
- [x] 同步更新接口文档，写明今日状态/按天聚合/时间策略字段

## 变更说明

- [x] `apps/web/src/store/index.ts`：新增今日打卡状态、按天聚合状态和统一提交回写逻辑
- [x] `apps/web/src/pages/CareDashboard.tsx`：新增打卡窗口提示、表单初始值回填、今日状态卡片和最近几天聚合展示
- [x] `.trae/rules/API接口规范.md`：补充 Task2 相关接口字段与说明

## 验证边界

- [x] 按要求未修改其他并行仓库
- [x] 按要求未启动服务、未执行运行测试、未做联调验证
- [x] 仅进行静态代码修改与静态诊断

## Task4 Git 推送前检查

- [x] 仅在 `c:\Users\dou12\Desktop\youziyi\youziyi-oss` 内执行 Git 状态、远程、分支与改动范围检查
- [x] 确认当前分支为 `main`，跟踪远程 `origin/main`
- [x] 确认远程地址为 `https://github.com/junmoxiao-cloud/youziyi.git`
- [x] 确认当前暂无已暂存内容，工作区存在 `16` 个已修改文件与 `20` 个未跟踪文件
- [x] 检查常见敏感文件模式：未发现 `.env` 实体文件、私钥、证书或 keystore 待提交；仅发现 `apps/server/.env.example` 被修改
- [x] 确认改动范围位于仓库内的 `apps/web`、`apps/server`、`apps/miniapp`、`packages/types`、`.trae/rules`、`tasks` 与调试文档，未触碰其他并行仓库
- [x] 准备最小推送步骤：先逐项确认纳入范围，再执行 `git add <确认文件>`、`git commit -m "<conventional-commit>"`、`git push origin main`

## Task4 风险记录

- [x] 当前改动横跨多端代码、规则文档、锁文件与新增页面文件，范围较大，不适合直接执行 `git add .` 后推送
- [x] `apps/server/package-lock.json` 变更量较大，推送前应再次确认是否为预期依赖收敛结果
- [x] Git 输出存在多处 `LF will be replaced by CRLF` 提示，提交前需确认换行符策略，避免引入纯格式噪音
- [x] `tasks/checklist.md` 当前为未跟踪文件，如需随本次提交保留，需显式加入暂存区
