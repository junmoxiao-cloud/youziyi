# 鸿蒙课程答辩材料规划 Spec

## Why
用户需要参加鸿蒙课程答辩，需要制作一套完整的答辩材料。材料需以游子衣项目为载体，重点展示鸿蒙生态适配能力（HarmonyOS NEXT / ArkTS / ArkUI），并特别强调国际语言适配（i18n）作为技术亮点。

## What Changes
- 新增鸿蒙答辩材料目录 `.trae/specs/harmony-defense-materials/`
- 制作 `spec.md`、`tasks.md`、`checklist.md` 三件套
- **新增 `Harmony_PPT_Guide.md`：提供幻灯片级别的视觉布局指南**
- **实施自动化修改：通过 Python 脚本直接修改 `游子衣答辩PPT_harmony.pptx`，注入鸿蒙核心内容与 i18n 专章**
- 不修改业务代码，仅通过自动化工具完成答辩材料的物理更新

## Impact
- 影响范围：仅文档规划，零代码变更
- 受影响系统：无

## ADDED Requirements

### Requirement: 鸿蒙生态适配展示
The system SHALL 在答辩材料中突出以下鸿蒙原生特性：

#### Scenario: ArkTS / ArkUI 原生开发
- **WHEN** 展示技术栈时
- **THEN** 明确说明使用 ArkTS 语言、ArkUI 声明式 UI、ArkTS 装饰器（@Entry、@Component、@State）
- **AND** 对比说明与 Web/React 的差异与优势

#### Scenario: HarmonyOS NEXT 系统能力调用
- **WHEN** 展示功能实现时
- **THEN** 重点展示以下系统能力调用：
  - `@ohos.multimedia.media` (AVRecorder / AVPlayer) — 语音录制与播放
  - `@ohos.net.http` — 网络请求
  - `@ohos.file.fs` — 文件系统操作
  - `@ohos.promptAction` — 原生 Toast 提示
  - `ohos.permission.MICROPHONE` — 权限声明

#### Scenario: 原生性能与体验
- **WHEN** 展示用户体验时
- **THEN** 强调鸿蒙原生渲染性能、流畅度、原生组件体验

### Requirement: 国际语言适配（i18n）
The system SHALL 将国际语言适配作为核心技术亮点展示：

#### Scenario: 资源目录结构国际化
- **WHEN** 展示项目结构时
- **THEN** 展示 HarmonyOS 标准 i18n 资源目录：
  ```
  resources/
  ├── base/element/string.json    # 默认（中文）
  ├── zh_CN/element/string.json   # 简体中文
  └── en_US/element/string.json   # 英文
  ```

#### Scenario: 多语言字符串资源
- **WHEN** 展示代码时
- **THEN** 展示 `module.json5` 和 `app.json5` 中使用 `$string:xxx` 引用多语言资源
- **AND** 展示 `string.json` 中中英文对照定义

#### Scenario: 运行时语言切换
- **WHEN** 展示适配能力时
- **THEN** 说明 HarmonyOS 系统级语言切换自动生效机制
- **AND** 展示 App 跟随系统语言自动切换的演示效果

#### Scenario: 适老化与国际化的结合
- **WHEN** 展示产品理念时
- **THEN** 强调"大字号 + 多语言"的双重适老设计
- **AND** 说明这对海外华人家庭/跨国家庭的实际意义

### Requirement: 答辩材料结构
The system SHALL 按以下结构组织答辩材料：

1. **项目背景**（1分钟）
   - 游子衣：亲情的记录和见证之所
   - 鸿蒙端作为适老化落地的原生载体

2. **技术架构**（2分钟）
   - 鸿蒙端在整体架构中的位置
   - 与 Web、小程序、后端的关系
   - Monorepo 工程结构

3. **鸿蒙原生能力展示**（3分钟）
   - ArkTS + ArkUI 声明式开发
   - 系统能力调用（录音、播放、网络、文件）
   - 路由守卫与状态管理

4. **国际语言适配亮点**（2分钟）
   - HarmonyOS i18n 资源体系
   - 中英文资源对照
   - 系统级语言切换
   - 适老化 + 国际化的产品价值

5. **功能演示**（2分钟）
   - 启动页 → 登录 → Onboarding → 家庭连接 → 主页面
   - 每日打卡、语音接龙、健康预警

6. **总结与展望**（1分钟）
