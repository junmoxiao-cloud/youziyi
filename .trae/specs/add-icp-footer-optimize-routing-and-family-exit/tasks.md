# Tasks

- [x] Task 1: 新增 ICP 备案信息页脚组件
  - [x] 创建 `Footer.tsx` 组件，包含固定 ICP 备案号及 `https://beian.miit.gov.cn` 链接
  - [x] 在 `MainLayout.tsx` 中集成 Footer，确保所有带导航栏页面底部展示备案信息
  - [x] 在 `Welcome.tsx`、`Login.tsx`、`Register.tsx`、`RoleSelect.tsx`、`Onboarding.tsx` 等公开/引导页面底部添加 Footer
  - [x] 确保 Footer 不遮挡页面主要交互区域（为各页面容器预留底部间距）

- [x] Task 2: 重构 Welcome 页"我有牵挂码"交互流程
  - [x] 修改 `Welcome.tsx`：点击"我有牵挂码"按钮时，在同一页面内展开牵挂码输入区域（替代直接跳转 `/family/join`）
  - [x] 用户输入牵挂码后，携带 `inviteCode` 参数跳转至 `/login` 或 `/register`
  - [x] 修改 `Login.tsx`：登录成功后检查 URL 参数 `inviteCode`，若存在则自动调用 `joinFamily` 并展示结果
  - [x] 修改 `Register.tsx`：注册成功后检查 URL 参数 `inviteCode`，若存在则自动调用 `joinFamily` 并展示结果
  - [x] 处理已登录用户在 Welcome 页输入牵挂码的场景（直接调用 joinFamily）

- [x] Task 3: 实现家庭退出功能（后端 + 前端）
  - [x] 后端新增 `POST /api/family/leave` 接口：接收 `userId`，删除 `FamilyMember` 记录，返回成功
  - [x] 在 `store/index.ts` 新增 `leaveFamily` action：调用 `/api/family/leave` 接口，成功后清除 `familyId`/`familyInfo` 并刷新 `userProfile`
  - [x] 在 `Profile.tsx` 添加"退出家庭"按钮（仅 `familyId` 存在时显示），点击弹出二次确认弹窗
  - [x] 二次确认后执行退出，成功后展示反馈提示并跳转至家庭加入页
  - [x] 在 `FamilyJoin.tsx` 已连接家庭视图中也添加"退出家庭"按钮，方便用户管理

- [x] Task 4: 本地验证（按用户选择执行"仅构建验证"）
  - [x] TypeScript 静态诊断（GetDiagnostics）零错误
  - [x] `tsc --noEmit`（web 与 server）通过
  - [x] `vite build` 前端构建成功，产物正常生成
  - [~] 运行时联调测试（牵挂码流程、退出家庭、两账号互相加入等）按用户选择暂缓，留待云服务器部署后验证
  - 注：`tsc -b` 失败为预先存在的 `CompanionDashboard.test.tsx` 测试类型问题（toBeInTheDocument），与本次修改无关

- [x] Task 5: 提交代码并推送到 GitHub
  - [x] 本地构建验证通过（`vite build` exit 0，654 modules transformed，产物正常）—— 证据已实时复核
  - [x] 关键改动 Grep/Read 全部命中：`store/index.ts:522` leaveFamily、`server/index.ts:1003` family/leave、`Welcome.tsx:12` showInviteInput、`Footer.tsx` 完整内容
  - [x] GitHub 远程仓库地址 `https://github.com/junmoxiao-cloud/youziyi` 已写入 `.trae/rules/技术开发规则.md` 2.1 节
  - [x] 在 youziyi-oss 建立独立 git 仓库并关联远程（详见 `fix-git-repo-binding-to-youziyi-oss` spec）
  - [x] 使用 `git-commit` skill 生成规范的 conventional commit message（commit `4f23664`）
  - [x] 确认所有修改文件已暂存并提交（26 files changed, 1091 insertions, 175 deletions）
  - [x] 推送到 GitHub 仓库（`aefa030..4f23664 main -> main`，fast-forward，远程 SHA 与本地一致）

- [ ] Task 6: 云服务器部署更新
  - [ ] 登录云服务器，从 GitHub 拉取最新代码
  - [ ] 重新构建前端项目（`npm run build`）
  - [ ] 重启相关服务（PM2 reload / Nginx reload）
  - [ ] 验证云服务器上的前端应用已成功更新

# Task Dependencies
- Task 3 的前端部分依赖 Task 3 后端接口先完成
- Task 4 依赖 Task 1、2、3 全部完成
- Task 5 依赖 Task 4 测试通过
- Task 6 依赖 Task 5 推送完成
- Task 1 和 Task 2 可以并行开发
- Task 3 后端接口部分可与 Task 1、2 并行开发
