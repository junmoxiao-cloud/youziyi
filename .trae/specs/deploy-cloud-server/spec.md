# 云服务器部署 Spec

## Why
当前仓库已经具备 Web、Server 与共享类型结构，且用户已完成域名公网解析、GitHub 远端推送与 SSL 证书准备。需要先形成一份可执行但暂不落地的部署规范，统一服务器目录、运行方式、证书上传、环境变量、数据库选型与上线回滚策略，避免后续上线过程临时决策导致失误。

## What Changes
- 新增一份面向 `youziyi-oss` 仓库的单机云服务器部署方案。
- 约束部署来源为 GitHub 仓库 `https://github.com/junmoxiao-cloud/youziyi`，服务器直接拉取代码，不从本地手工拷贝业务代码。
- 规划双域名部署：`www.youziyi.com` 承载 Web 静态站点，`api.youziyi.com` 承载后端 API。
- 规划 Nginx 证书上传与安装流程，要求前后端域名使用各自证书。
- 规划单机运行架构：`Nginx + PM2 + Node.js + Redis + SQLite`，并保留后续迁移到 PostgreSQL 的升级路径。
- 规划敏感信息管理方式，禁止把服务器密码、私钥、证书私钥和生产环境变量提交到 GitHub。

## Impact
- Affected specs: 部署与运维、发布流程、证书管理、单机数据持久化
- Affected code: `apps/web`、`apps/server`、`apps/server/prisma`、未来的生产环境变量文件、Nginx 与 PM2 运行配置

## ADDED Requirements
### Requirement: GitHub 作为唯一代码来源
系统 SHALL 以 GitHub 仓库 `https://github.com/junmoxiao-cloud/youziyi` 作为云服务器部署的唯一业务代码来源，服务器从远端仓库拉取 `youziyi-oss` 对应代码，不通过聊天记录、本地 IDE 或证书目录手工拼装业务代码。

#### Scenario: 服务器首次部署
- **WHEN** 运维开始初始化云服务器部署目录
- **THEN** 系统使用 GitHub 仓库拉取完整仓库代码
- **AND** 保持 `apps/web`、`apps/server`、`packages/types` 的目录关系不被拆散

### Requirement: 双域名部署边界
系统 SHALL 将 `www.youziyi.com` 与 `api.youziyi.com` 作为独立站点边界处理，其中前者提供前端静态资源，后者通过 Nginx 反向代理至 Node.js API 服务。

#### Scenario: 用户访问前端
- **WHEN** 用户打开 `https://www.youziyi.com`
- **THEN** Nginx 直接返回 Web 构建产物
- **AND** 前端 API 请求指向 `https://api.youziyi.com`

#### Scenario: 用户访问后端
- **WHEN** 用户请求 `https://api.youziyi.com`
- **THEN** Nginx 使用后端域名证书提供 HTTPS
- **AND** 将请求反向代理到服务器内部运行的后端进程

### Requirement: Nginx 证书上传与隔离
系统 SHALL 为 `www.youziyi.com` 与 `api.youziyi.com` 分别上传并配置独立证书文件，证书存放于服务器受限目录，不与业务代码仓库存放在同一路径。

#### Scenario: 安装前端证书
- **WHEN** 运维配置 `www.youziyi.com` 站点
- **THEN** 使用前端域名对应的 `.pem` 与 `.key` 文件
- **AND** 文件落在仅 root 可读的证书目录

#### Scenario: 安装后端证书
- **WHEN** 运维配置 `api.youziyi.com` 站点
- **THEN** 使用后端域名对应的 `.pem` 与 `.key` 文件
- **AND** 从压缩包中提取证书后再上传到服务器证书目录

### Requirement: 单机运行架构
系统 SHALL 在单台 `2核2G` Linux 云服务器上运行首版正式环境，采用 `Nginx + PM2 + Node.js + Redis + SQLite` 的最小可用架构，以降低部署复杂度并匹配当前 Prisma SQLite 配置。

#### Scenario: 首版正式上线
- **WHEN** 执行首版部署
- **THEN** Web 通过静态文件方式发布
- **AND** Server 通过 PM2 常驻运行
- **AND** Redis 在本机启动
- **AND** SQLite 作为首版生产数据库使用

### Requirement: 数据与环境隔离
系统 SHALL 将业务代码、SQLite 数据文件、上传目录、日志目录、备份目录与证书目录分离管理，并通过环境变量控制运行时配置。

#### Scenario: 初始化服务器目录
- **WHEN** 运维创建部署目录
- **THEN** 至少拆分代码目录、数据目录、上传目录、日志目录、备份目录和证书目录
- **AND** 生产 `.env` 不进入 Git 仓库

### Requirement: 敏感信息不入仓库
系统 SHALL 禁止把服务器口令、SSH 私钥、SSL 私钥、生产数据库连接串及其他生产密钥写入 spec 文档、业务仓库或公开远端仓库。

#### Scenario: 记录部署信息
- **WHEN** 文档描述服务器和证书准备方式
- **THEN** 仅记录凭据类别、存放原则和使用时机
- **AND** 不记录明文密码、私钥或完整敏感值

### Requirement: 发布与回滚流程
系统 SHALL 提供标准化发布步骤与回滚步骤，确保拉取代码、安装依赖、构建、迁移、重启服务与故障回退均可重复执行。

#### Scenario: 常规更新发布
- **WHEN** 需要发布新版本
- **THEN** 按既定顺序执行 `git pull`、依赖安装、构建、数据库迁移、PM2 reload 与 Nginx reload
- **AND** 保留上一版可回滚产物与数据库备份

#### Scenario: 发布失败
- **WHEN** 新版本启动异常或站点不可用
- **THEN** 可以回退到上一版代码与上一份备份数据
- **AND** 不依赖临时手工猜测恢复生产环境
