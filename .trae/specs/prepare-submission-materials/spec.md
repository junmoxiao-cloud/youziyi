# 鸿蒙项目提交材料准备 Spec

## Why
游子衣项目需要提交鸿蒙课程评审材料，需一次性交付四项内容：完整项目文档、GitHub 仓库最新版本上传、鸿蒙端安装部署运行说明、纯文本分工说明。当前仓库存在未提交的鸿蒙源码改动与新增天气组件/spec 目录，需在材料准备过程中同步完成提交与推送，确保 GitHub 上为最新版本。

## What Changes
- 新增 `docs/项目文档.md`：覆盖项目概述、需求分析、系统设计、功能模块说明、技术架构、关键实现细节、测试结果、总结八大章节。
- 新增 `docs/鸿蒙安装部署运行说明.md`：针对鸿蒙系统的环境要求、依赖安装、编译步骤、部署流程、运行方法、常见问题解决。
- 新增 `docs/分工说明.md`：纯文本形式的项目分工说明（四位成员分工）。
- 提交并推送当前未提交改动至 GitHub 远程仓库 `https://github.com/junmoxiao-cloud/youziyi.git` 的 `main` 分支，确保仓库为最新版本。
  - 涉及未提交改动：鸿蒙端 7 个源文件修改、新增 `WeatherCard.ets` 组件、3 个 weather 相关 spec 目录、1 个未跟踪视频文件（需用户确认是否纳入）。
- 不修改任何业务代码逻辑，仅新增文档与执行 git 提交/推送。

## Impact
- 受影响文档：`docs/` 目录新增 3 份文档。
- 受影响仓库：GitHub `junmoxiao-cloud/youziyi` 仓库 main 分支将更新到最新提交。
- 受影响代码：无业务代码变更（仅 git 提交已存在的改动）。
- 受影响 specs：新增本 spec 目录 `.trae/specs/prepare-submission-materials/`。

## ADDED Requirements

### Requirement: 完整项目文档
The system SHALL 提供一份覆盖八大章节的项目文档 `docs/项目文档.md`：

#### Scenario: 文档章节完整性
- **WHEN** 评审人查阅项目文档
- **THEN** 文档需依次包含：项目概述、需求分析、系统设计、功能模块说明、技术架构、关键实现细节、测试结果、总结
- **AND** 每章内容需与游子衣实际项目（三端协同 + 后端）真实对应，不得虚构功能

#### Scenario: 鸿蒙端重点呈现
- **WHEN** 文档描述技术架构与功能模块时
- **THEN** 需明确呈现鸿蒙端（ArkTS/ArkUI）在整体架构中的定位与已交付能力
- **AND** 包含鸿蒙原生能力调用（网络、麦克风权限、i18n 资源体系）的说明

### Requirement: 鸿蒙安装部署运行说明
The system SHALL 提供一份针对鸿蒙系统的部署文档 `docs/鸿蒙安装部署运行说明.md`：

#### Scenario: 部署流程可复现
- **WHEN** 评审人按文档操作
- **THEN** 文档需包含：环境要求（DevEco Studio 版本、HarmonyOS SDK、Node.js）、依赖安装、编译步骤、签名与部署流程、运行方法、常见问题解决
- **AND** 步骤需与实际工程配置（`build-profile.json5`、`oh-package.json5`、`module.json5`）保持一致

#### Scenario: 常见问题覆盖
- **WHEN** 部署过程出现问题时
- **THEN** 文档需提供常见问题排查指引（如签名配置、SDK 版本、oh_modules 安装失败、网络权限、麦克风权限等）

### Requirement: 分工说明
The system SHALL 提供纯文本形式的项目分工说明 `docs/分工说明.md`：

#### Scenario: 分工内容准确
- **WHEN** 查阅分工说明
- **THEN** 内容需准确反映：杨云天、刘至晗、乔钰成负责前期调研和商业规划；乔钰成和赵奕轩负责开发和部署，其中赵奕轩负责鸿蒙前端开发，乔钰成负责总体仓库架构设计和其他部分开发（包括与鸿蒙的对接逻辑）

### Requirement: GitHub 仓库最新版本上传
The system SHALL 将当前 youziyi-oss 仓库最新版本推送至 GitHub：

#### Scenario: 提交并推送未提交改动
- **WHEN** 执行提交材料准备
- **THEN** 需将当前所有未提交改动（鸿蒙源码、新增组件、新增 spec、新增文档）按 Conventional Commits 规范提交
- **AND** 推送至 `origin/main`（`https://github.com/junmoxiao-cloud/youziyi.git`）
- **AND** 推送后通过 `git status` 与 `git log` 验证工作区干净且远程已同步

#### Scenario: 敏感信息保护
- **WHEN** 提交前
- **THEN** 需确认 `.gitignore` 已排除 `.env`、证书文件（`.cer/.p12/.p7b`）、`oh_modules/`、`node_modules/` 等
- **AND** 不主动提交任何本地环境变量文件或私有证书

### Requirement: 待确认决策点
在实施前需与用户确认以下事项：
- 未跟踪的视频文件 `assignments/微信视频2026-06-26_131544_128.mp4` 是否纳入本次提交（大体积二进制文件，可能影响仓库体积）。
