# Tasks
- [x] Task 1: 明确部署边界与输入物
  - [x] SubTask 1.1: 确认正式部署仓库为 `youziyi-oss`，代码来源为 GitHub 仓库 `https://github.com/junmoxiao-cloud/youziyi`
  - [x] SubTask 1.2: 确认部署目标仅包含 `apps/web`、`apps/server`、`packages/types`
  - [x] SubTask 1.3: 确认域名映射为 `www.youziyi.com` 与 `api.youziyi.com`
  - [x] SubTask 1.4: 确认证书来源、上传方式与服务器上的目标目录

- [x] Task 2: 设计服务器目录与运行架构
  - [x] SubTask 2.1: 规划代码目录、日志目录、上传目录、SQLite 数据目录、备份目录、证书目录
  - [x] SubTask 2.2: 规划 Web 静态资源发布方式与 Server 进程托管方式
  - [x] SubTask 2.3: 明确 Redis、SQLite 与 Nginx 的单机部署位置

- [x] Task 3: 设计生产环境变量与敏感信息管理
  - [x] SubTask 3.1: 产出后端生产环境变量清单
  - [x] SubTask 3.2: 产出前端生产 API 基地址配置清单
  - [x] SubTask 3.3: 明确哪些信息禁止提交到 GitHub

- [x] Task 4: 制定 Nginx 双域名与证书安装方案
  - [x] SubTask 4.1: 为 `www.youziyi.com` 设计站点配置
  - [x] SubTask 4.2: 为 `api.youziyi.com` 设计反向代理配置
  - [x] SubTask 4.3: 设计 `.pem` 与 `.key` 文件上传、权限设置与替换流程
  - [x] SubTask 4.4: 设计 HTTP 跳转 HTTPS 与站点重载流程

- [x] Task 5: 制定应用发布、初始化与更新流程
  - [x] SubTask 5.1: 设计服务器初始化步骤，包括基础软件安装与安全组要求
  - [x] SubTask 5.2: 设计首次发布步骤，包括拉取代码、安装依赖、构建、迁移和启动服务
  - [x] SubTask 5.3: 设计后续更新步骤，包括 `git pull`、重新构建与平滑重启

- [x] Task 6: 制定单机数据持久化、备份与回滚方案
  - [x] SubTask 6.1: 设计 SQLite 数据文件存放与备份策略
  - [x] SubTask 6.2: 设计上传文件与日志保留策略
  - [x] SubTask 6.3: 设计发布失败后的代码与数据回滚步骤

- [x] Task 7: 输出最终部署手册与执行前检查项
  - [x] SubTask 7.1: 整理一份按顺序执行的上线手册
  - [x] SubTask 7.2: 整理一份执行前检查清单
  - [x] SubTask 7.3: 整理一份上线后验收清单

# Task Dependencies
- `Task 2` depends on `Task 1`
- `Task 3` depends on `Task 1`
- `Task 4` depends on `Task 1`
- `Task 5` depends on `Task 2`, `Task 3`, `Task 4`
- `Task 6` depends on `Task 2`, `Task 5`
- `Task 7` depends on `Task 3`, `Task 4`, `Task 5`, `Task 6`
