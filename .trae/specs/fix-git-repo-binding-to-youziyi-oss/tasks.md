# Tasks

- [x] Task 1: 备份与安全确认（非侵入式，仅读取与复制）
  - [x] 确认 youziyi-oss 当前所有正式开发文件已落盘（复核 `apps/web/src/components/Footer.tsx`、`apps/web/src/store/index.ts` leaveFamily、`apps/server/src/index.ts` family/leave、`apps/web/src/pages/Welcome.tsx` showInviteInput 等关键改动存在）
  - [x] 记录父目录仓库当前状态（`git -C c:\Users\dou12\Desktop\youziyi log --oneline -5`、`git -C c:\Users\dou12\Desktop\youziyi status`），确认本 spec 不修改父目录仓库
  - [x] 向用户说明：本 spec 不会删除或修改父目录 `.git`，youziyi-oss 将拥有独立的 `.git`

- [x] Task 2: 在 youziyi-oss 初始化独立 Git 仓库并 fetch 远程
  - [x] 在 `c:\Users\dou12\Desktop\youziyi\youziyi-oss` 执行 `git init`（默认分支名按用户偏好，建议 `main` 对齐远程）
  - [x] `git remote add origin https://github.com/junmoxiao-cloud/youziyi`
  - [x] `git fetch origin`（若网络失败，向用户报告错误并询问是否重试或切到方案 C 本地上传）
  - [x] 记录 `origin/main` 最新提交 SHA 与提交列表（`git log origin/main --oneline -20`）
  - [x] 验证：`git -C youziyi-oss rev-parse --show-toplevel` 返回 youziyi-oss 路径，`git -C youziyi-oss remote -v` 显示正确 origin

- [x] Task 3: 评估远程 main 与 youziyi-oss 当前文件的差异
  - [x] 列出 `origin/main` 的文件树与 youziyi-oss 当前文件的差异（用 `git diff` 或文件比对）
  - [x] 重点关注：远程 main 是否有 youziyi-oss 没有的提交/文件；youziyi-oss 是否有远程 main 没有的改动（如本次 ICP Footer、家庭退出等）
  - [x] 将差异摘要提交用户，并给出推荐历史对接策略：
    - 若远程 main 内容 ⊆ youziyi-oss：推荐 youziyi-oss 作为新基线 force push（覆盖远程历史）
    - 若远程 main 有 youziyi-oss 没有的内容：推荐 merge --allow-unrelated-histories 或其他
  - [x] 等待用户确认策略后方可继续 Task 4

- [x] Task 4: 建立基线提交并按确认的策略对接历史
  - [x] 复核 youziyi-oss `.gitignore` 覆盖 node_modules/dist/.env/证书等（已存在，确认无遗漏）
  - [x] `git add -A` 暂存 youziyi-oss 全部正式开发内容
  - [x] 验证暂存区不含 node_modules/dist/.env/证书：`git status --short` 与 `git ls-files --cached | Select-String node_modules,dist,'\.env'` 检查
  - [x] 使用 `git-commit` skill 生成规范的 conventional commit message，建立基线提交
  - [x] 按用户确认的策略对接远程历史（merge / reset 基线 / 其他），禁止未经确认的 force push

- [x] Task 5: 推送到 GitHub main 分支
  - [x] 推送前向用户最终确认推送命令与目标分支
  - [x] 执行 `git push origin <local>:main`（或经确认的 `git push -f`）
  - [x] 验证推送成功：`git ls-remote origin main` 返回的 SHA 与本地一致
  - [x] 在 GitHub 仓库页面（或 `git log origin/main`）确认远程 main 已更新

- [x] Task 6: 解除 add-icp-footer spec 的 Task 5/6 阻塞并更新文档
  - [x] 更新 `add-icp-footer-optimize-routing-and-family-exit/tasks.md` Task 5 状态为完成
  - [x] 确认 `add-icp-footer-optimize-routing-and-family-exit` 的代码改动已在 youziyi-oss 基线提交中（或作为后续 commit 推送）
  - [x] 同步更新 `docs/云服务器部署指南.md` 中的 git clone/pull 命令指向 youziyi-oss（若文档原指向父目录）

# Task Dependencies
- Task 2 依赖 Task 1（先确认备份安全再 init）
- Task 3 依赖 Task 2（需 fetch 后才能评估差异）
- Task 4 依赖 Task 3（需用户确认策略后才能对接历史）
- Task 5 依赖 Task 4（需基线提交和历史对接完成才能推送）
- Task 6 依赖 Task 5（推送成功后才能解除 add-icp-footer 阻塞）
- 全部任务串行，无并行（涉及不可逆 git 操作，需逐步确认）
