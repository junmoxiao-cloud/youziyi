# 修复 Git 仓库关联至 youziyi-oss 独立根目录 Spec

## Why

当前 Git 仓库根目录绑定在 `c:\Users\dou12\Desktop\youziyi`（父目录），而 `.trae/rules/技术开发规则.md` 2.1 节明确规定 `c:\Users\dou12\Desktop\youziyi\youziyi-oss` 是"唯一正式开发仓库根目录"。这导致两个严重后果：

1. **正式开发内容未进入版本管理**：`youziyi-oss/` 在父目录 git 中是 untracked（诊断证据：`git check-ignore youziyi-oss` 退出码 1，父目录根无 `.gitignore`，`git status` 将 `youziyi-oss/` 列入 Untracked files）。所有在 youziyi-oss 里做的 ICP Footer、牵挂码免注册、家庭退出功能等改动，根本没有被任何 git 仓库跟踪。
2. **无法推送到 GitHub**：父目录本地 `master` 分支仅 3 个提交（`f6d2981`/`d6b0dc7`/`ea94eef`），与 GitHub 远程 `https://github.com/junmoxiao-cloud/youziyi` 的 `main` 分支历史不同源；`git fetch` 也因 `curl 56 Recv failure: Connection was reset` 失败。在 youziyi-oss 内执行 git 命令实际作用于父目录仓库，push 必被拒（non-fast-forward）。

这阻塞了 `add-icp-footer-optimize-routing-and-family-exit` 的 Task 5（推送到 GitHub）与 Task 6（云服务器 git pull 部署）。

## What Changes

- **在 `youziyi-oss` 目录建立独立 Git 仓库**：执行 `git init`，使 youziyi-oss 成为真正的仓库根目录，与父目录 `.git` 彻底解耦。
- **关联 GitHub 远程仓库**：`git remote add origin https://github.com/junmoxiao-cloud/youziyi`，对齐 Rules 2.1 新增的"GitHub 远程仓库"条款。
- **处理与远程 `main` 分支的历史对接**：先 fetch 远程，评估 `origin/main` 内容与 youziyi-oss 当前文件的差异，再选择安全的对接策略（merge unrelated histories / reset 基线 / 其他），禁止未经确认的 `force push`。
- **建立 youziyi-oss 基线提交**：将 youziyi-oss 当前所有正式开发内容作为基线纳入版本管理（含已有的 `.gitignore`，排除 node_modules/dist/.env/证书等）。
- **推送基线到 GitHub `main` 分支**：完成推送后，`add-icp-footer-optimize-routing-and-family-exit` 的 Task 5 解阻塞。
- **不改父目录仓库**：父目录 `c:\Users\dou12\Desktop\youziyi` 的 `.git` 保持原样，不删除、不修改，避免影响其他并行目录（Rules 2.1 禁止误改并行目录）。

## Impact

- **受阻塞的 spec 解除阻塞**：`add-icp-footer-optimize-routing-and-family-exit` Task 5（推送 GitHub）、Task 6（云服务器 git pull 部署）依赖本 spec 完成。
- **受影响的 spec 流程**：`deploy-cloud-server` 的"GitHub 拉取"部署流程依赖 youziyi-oss 已正确关联 GitHub 远程。
- **受影响的代码/配置**：
  - 新建 `c:\Users\dou12\Desktop\youziyi\youziyi-oss\.git\`（git init 产物）
  - youziyi-oss 内新增/调整 `.gitignore`（已存在，需复核是否覆盖所有应忽略项）
  - 不修改 youziyi-oss 内任何业务代码
- **受影响的 Rules**：`.trae/rules/技术开发规则.md` 2.1 节已新增"GitHub 远程仓库"条款（本 spec 落地后该条款才真正可执行）。

## 方案对比与推荐

### 方案 A（推荐）：在 youziyi-oss 初始化独立 Git 仓库
- **做法**：`git init` → 关联远程 → fetch 评估 → 建立基线 → 推送
- **优点**：符合 Rules 2.1"youziyi-oss 为唯一正式仓库根目录"；youziyi-oss 成为真正仓库根；父目录的并行目录（apps/packages/YouZiYi 旧副本）和无关文件（.py 脚本、证书、pptx）天然隔离在版本管理之外
- **缺点**：需处理与远程 `main` 历史的对接；若选 force push 需用户确认远程无未备份重要内容
- **风险**：历史对接策略选择不当可能丢失远程历史或本地改动 → 通过"先 fetch 评估再决策"缓解

### 方案 B：父目录仓库跟踪 youziyi-oss 并推送
- **做法**：在父目录 `git add youziyi-oss`，提交并推送
- **问题**：父目录 master 与远程 main 历史不同源，push 仍被拒；会把父目录的并行目录和无关文件牵扯进提交，违反 Rules 2.1"禁止误改并行目录"
- **结论**：不推荐

### 方案 C：跳过 GitHub，本地上传部署
- **做法**：vite build 后 scp 上传 dist 到云服务器（Rules 第 8 节"本地上传"流程）
- **问题**：仅解决部署，不解决版本管理；不满足用户"推送到 GitHub"的原始要求
- **结论**：可作为网络持续不可用时的临时补丁，不是本 spec 目标

**推荐方案 A**。历史对接策略在 Task 2 fetch 远程后，根据 `origin/main` 真实内容与 youziyi-oss 的差异由用户确认选择。

## ADDED Requirements

### Requirement: youziyi-oss 作为独立 Git 仓库根目录
系统 SHALL 在 `c:\Users\dou12\Desktop\youziyi\youziyi-oss` 目录内拥有独立的 `.git` 目录，使该目录成为 Git 仓库根目录。在 youziyi-oss 内执行的任何 git 命令 SHALL 作用于 youziyi-oss 自身的 `.git`，不得回退到父目录 `c:\Users\dou12\Desktop\youziyi\.git`。

#### Scenario: 在 youziyi-oss 内执行 git 命令作用于本地仓库
- **WHEN** 在 `c:\Users\dou12\Desktop\youziyi\youziyi-oss` 内执行 `git rev-parse --show-toplevel`
- **THEN** 返回 `C:/Users/dou12/Desktop/youziyi/youziyi-oss`（而非父目录）

#### Scenario: 父目录仓库保持不变
- **WHEN** youziyi-oss 的独立 git 仓库建立完成
- **THEN** 父目录 `c:\Users\dou12\Desktop\youziyi\.git` 仍存在且未被修改/删除

### Requirement: 关联 GitHub 远程仓库
youziyi-oss 的 Git 仓库 SHALL 关联远程 `origin` 指向 `https://github.com/junmoxiao-cloud/youziyi`，与 Rules 2.1"GitHub 远程仓库"条款一致。

#### Scenario: 远程地址正确配置
- **WHEN** 执行 `git -C youziyi-oss remote -v`
- **THEN** `origin` 的 fetch/push URL 均为 `https://github.com/junmoxiao-cloud/youziyi`

### Requirement: 基线提交包含全部正式开发内容
youziyi-oss 的基线提交 SHALL 包含当前所有正式开发文件（含 ICP Footer、牵挂码免注册、家庭退出功能等改动），并 SHALL 通过已有的 `.gitignore` 排除 node_modules、dist、.env、证书等非版本管理内容。

#### Scenario: 基线提交完整
- **WHEN** youziyi-oss 基线提交完成
- **THEN** `git -C youziyi-oss status` 显示 working tree clean
- **AND** `git -C youziyi-oss ls-files` 包含 `apps/web/src/components/Footer.tsx`、`apps/web/src/store/index.ts`、`apps/server/src/index.ts` 等正式开发文件
- **AND** `git -C youziyi-oss ls-files` 不包含任何 `node_modules/`、`dist/`、`.env`、`*.pem`、`*.p12` 路径

### Requirement: 历史对接策略需用户确认
在 fetch 远程 `origin/main` 后，SHALL 评估远程内容与 youziyi-oss 当前文件的差异，并将评估结果与推荐策略提交用户确认后，方可执行推送。禁止未经用户确认的 `git push -f`（force push）。

#### Scenario: 远程 main 内容与 youziyi-oss 一致或为子集
- **WHEN** fetch 后确认 `origin/main` 的内容已全部包含在 youziyi-oss 当前文件中
- **THEN** 推荐 youziyi-oss 基线作为新历史，经用户确认后 `git push -f origin <branch>:main`
- **AND** 推送前向用户说明 force push 会覆盖远程历史

#### Scenario: 远程 main 含 youziyi-oss 没有的提交
- **WHEN** fetch 后确认 `origin/main` 有 youziyi-oss 当前文件未包含的改动
- **THEN** 不直接 force push，先向用户报告差异，由用户决策合并策略（merge --allow-unrelated-histories / cherry-pick / 其他）

## MODIFIED Requirements

### Requirement: 推送代码到 GitHub（来自 add-icp-footer-optimize-routing-and-family-exit Task 5）
原 Task 5"提交代码并推送到 GitHub"的前提条件修改为：**必须先完成 youziyi-oss 独立 Git 仓库建立与远程关联**（即本 spec 全部任务）。在 youziyi-oss 拥有独立 `.git` 且 `origin` 指向正确远程之前，任何在 youziyi-oss 内执行的 git add/commit/push 都会错误作用于父目录仓库，禁止执行。
