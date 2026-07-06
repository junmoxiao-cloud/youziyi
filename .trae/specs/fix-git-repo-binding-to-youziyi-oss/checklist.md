# Checklist

## 仓库根目录绑定
- [ ] `git -C c:\Users\dou12\Desktop\youziyi\youziyi-oss rev-parse --show-toplevel` 返回 youziyi-oss 路径（而非父目录）
- [ ] `c:\Users\dou12\Desktop\youziyi\youziyi-oss\.git` 目录存在
- [ ] `c:\Users\dou12\Desktop\youziyi\.git` 父目录仓库未被修改/删除（`git -C c:\Users\dou12\Desktop\youziyi log --oneline -3` 仍为原 3 个提交）

## 远程关联
- [ ] `git -C youziyi-oss remote -v` 显示 origin 指向 `https://github.com/junmoxiao-cloud/youziyi`
- [ ] 远程地址与 `.trae/rules/技术开发规则.md` 2.1 节"GitHub 远程仓库"条款一致

## 基线提交完整性
- [ ] `git -C youziyi-oss status` 显示 working tree clean
- [ ] `git -C youziyi-oss ls-files` 包含 `apps/web/src/components/Footer.tsx`
- [ ] `git -C youziyi-oss ls-files` 包含 `apps/web/src/store/index.ts`
- [ ] `git -C youziyi-oss ls-files` 包含 `apps/server/src/index.ts`
- [ ] `git -C youziyi-oss ls-files` 包含 `apps/web/src/pages/Welcome.tsx`、`apps/web/src/pages/Profile.tsx`、`apps/web/src/pages/FamilyJoin.tsx`
- [ ] `git -C youziyi-oss ls-files` 不包含任何 `node_modules/` 路径
- [ ] `git -C youziyi-oss ls-files` 不包含任何 `dist/` 路径
- [ ] `git -C youziyi-oss ls-files` 不包含 `.env`（但可含 `.env.example`）
- [ ] `git -C youziyi-oss ls-files` 不包含 `*.pem`、`*.p12`、`*.cer`、`*.key` 等证书/密钥

## 历史对接安全性
- [ ] Task 3 已向用户提交远程 main 与 youziyi-oss 的差异摘要
- [ ] 历史对接策略已经用户明确确认（merge / reset 基线 / force push 等）
- [ ] 若使用 force push，推送前已向用户说明会覆盖远程历史并获得确认
- [ ] 推送命令执行前已向用户最终确认

## 推送结果
- [ ] `git push` 成功完成，无报错
- [ ] `git ls-remote origin main` 返回的 SHA 与本地 main HEAD 一致
- [ ] `git log origin/main --oneline -5` 显示基线提交在远程

## 文档与下游 spec 同步
- [ ] `add-icp-footer-optimize-routing-and-family-exit/tasks.md` Task 5 阻塞状态已更新（解除阻塞或标记完成）
- [ ] `docs/云服务器部署指南.md` 中的 git clone/pull 命令指向 youziyi-oss 正确路径（若原文档指向父目录则已修正）
- [ ] 父目录 `c:\Users\dou12\Desktop\youziyi\.git` 仓库未被本次操作影响
