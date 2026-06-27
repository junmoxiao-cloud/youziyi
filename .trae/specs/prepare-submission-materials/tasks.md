# Tasks

- [ ] Task 1: 编写完整项目文档 `docs/项目文档.md`
  - [ ] SubTask 1.1: 撰写「项目概述」章节（游子衣定位、目标用户、三端协同价值）
  - [ ] SubTask 1.2: 撰写「需求分析」章节（老年人陪伴痛点、家庭连接需求、预警需求、适老化需求）
  - [ ] SubTask 1.3: 撰写「系统设计」章节（Monorepo 架构、三端+后端关系、数据流向、路由守卫）
  - [ ] SubTask 1.4: 撰写「功能模块说明」章节（登录注册、Onboarding、家庭连接、每日打卡、健康预警、天气、语音接龙、i18n）
  - [ ] SubTask 1.5: 撰写「技术架构」章节（Web React+Vite、Server Node.js、MiniApp、Harmony ArkTS/ArkUI、共享类型层）
  - [ ] SubTask 1.6: 撰写「关键实现细节」章节（路由守卫、共享城市码真源、鸿蒙原生 API 调用、i18n 资源体系、预警状态机）
  - [ ] SubTask 1.7: 撰写「测试结果」章节（Web 端单元测试、类型检查、联调验证现状）
  - [ ] SubTask 1.8: 撰写「总结」章节（已交付能力、未完成边界、后续展望）

- [ ] Task 2: 编写鸿蒙安装部署运行说明 `docs/鸿蒙安装部署运行说明.md`
  - [ ] SubTask 2.1: 「环境要求」（DevEco Studio、HarmonyOS SDK 5.0.0(12)/6.0.2(22)、Node.js、JDK）
  - [ ] SubTask 2.2: 「依赖安装」（oh-package.json5、oh_modules 安装、hvigor 配置）
  - [ ] SubTask 2.3: 「编译步骤」（debug/release 构建模式、hvigor build 命令）
  - [ ] SubTask 2.4: 「部署流程」（签名配置说明、真机/模拟器安装、HAP 安装）
  - [ ] SubTask 2.5: 「运行方法」（启动入口 EntryAbility、首次启动流程、远程/Mock 切换）
  - [ ] SubTask 2.6: 「常见问题解决」（签名失败、SDK 版本不匹配、oh_modules 安装失败、网络/麦克风权限、域名连通）

- [ ] Task 3: 编写分工说明 `docs/分工说明.md`
  - [ ] SubTask 3.1: 以纯文本形式记录四位成员分工（杨云天、刘至晗、乔钰成、赵奕轩）

- [ ] Task 4: 确认未跟踪视频文件处理方式
  - [ ] SubTask 4.1: 询问用户是否将 `assignments/微信视频2026-06-26_131544_128.mp4` 纳入提交

- [ ] Task 5: 提交并推送至 GitHub
  - [ ] SubTask 5.1: 执行 `git status` 确认待提交清单（含新增 3 份文档、鸿蒙源码改动、天气组件、weather spec 目录）
  - [ ] SubTask 5.2: 按逻辑分组暂存文件（文档组 / 鸿蒙源码组 / spec 组），排除环境变量与证书
  - [ ] SubTask 5.3: 使用 Conventional Commits 规范生成提交信息并提交
  - [ ] SubTask 5.4: 推送至 `origin/main`（`https://github.com/junmoxiao-cloud/youziyi.git`）
  - [ ] SubTask 5.5: 验证 `git status` 干净、`git log` 已含新提交、远程分支已同步

# Task Dependencies
- Task 1/2/3 可并行（独立文档撰写）
- Task 4 需在 Task 5 之前完成（决定视频文件是否纳入提交）
- Task 5 依赖 Task 1/2/3 完成（文档需一并提交）且依赖 Task 4 决策
