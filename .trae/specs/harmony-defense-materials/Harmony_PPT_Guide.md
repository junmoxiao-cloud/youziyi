# 游子衣 - 鸿蒙答辩 PPT 视觉与内容对齐手册

本手册旨在辅助你将最新的鸿蒙答辩脚本同步到 `游子衣答辩PPT_harmony.pptx` 文件中。

---

## P1：封面
- **视觉建议**：
  - 中央展示"游子衣"Logo。
  - 右侧或下方放置 HarmonyOS NEXT 官方徽标（蓝底白字）。
  - 背景使用淡蓝/灰色的科技感底纹。
- **口播核心**：基于 HarmonyOS 原生开发、三端协同、国际语言适配。

## P3：产品架构 (三端协同)
- **视觉建议**：
  - 使用 Monorepo 目录结构截图：`apps/web`, `apps/miniapp`, `apps/harmony`, `apps/server`。
  - 三个设备样机（手机、手机、电脑）并排，分别展示小程序、鸿蒙、Web 界面。
- **关联代码/截图**：
  - 目录树截图：[youziyi-oss](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss)
  - 鸿蒙端界面截图：[Main.ets](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/entry/src/main/ets/pages/Main.ets)

## P8：技术架构 (鸿蒙栈详解)
- **视觉建议**：
  - 列出 5 个关键 API 模块（Media, Http, FS, Prompt, Permission）。
  - 右侧放一段简洁的 ArkTS 装饰器代码。
- **关联代码**：
  - [Main.ets](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/entry/src/main/ets/pages/Main.ets) (展示 @Entry, @Component)
  - [AppRepository.ets](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/entry/src/main/ets/services/AppRepository.ets) (展示 http 请求封装)

## P8.5：🆕 鸿蒙原生能力深度展示 (新增)
- **视觉建议**：
  - **左半部分**：录音功能代码截图（AVRecorder）。
  - **右半部分**：路由守卫逻辑流程图。
- **关联代码**：
  - 录音：[InteractionTab.ets:L76-109](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/entry/src/main/ets/pages/tabs/InteractionTab.ets#L76-109)
  - 播放：[InteractionTab.ets:L170-211](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/entry/src/main/ets/pages/tabs/InteractionTab.ets#L170-211)
  - 路由：[AppSession.ets:L64-74](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/entry/src/main/ets/common/AppSession.ets#L64-74)

## P8.6：🆕 国际语言适配 i18n (新增)
- **视觉建议**：
  - **核心截图**：IDE 中的资源管理器视图，高亮 `base`, `zh_CN`, `en_US` 三个文件夹。
  - **对比代码**：左边展示中文 `string.json`，右边展示英文 `string.json`。
  - **引用代码**：展示 `$string:app_name` 的代码行。
- **关联代码**：
  - 目录：[resources](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/entry/src/main/resources)
  - 中文：[zh_CN/string.json](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/AppScope/resources/zh_CN/element/string.json)
  - 英文：[en_US/string.json](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/AppScope/resources/en_US/element/string.json)
  - 引用：[app.json5](file:///c:/Users/dou12/Desktop/youziyi/youziyi-oss/apps/harmony/AppScope/app.json5)

---

## 快速截图索引清单

| 截图内容 | 文件路径 | 关键行号 |
| :--- | :--- | :--- |
| **三端工程结构** | `youziyi-oss/` 根目录 | - |
| **ArkUI Tabs 组件** | `apps/harmony/.../pages/Main.ets` | L30-55 |
| **AVRecorder 录音配置** | `apps/harmony/.../tabs/InteractionTab.ets` | L83-93 |
| **i18n 资源引用** | `apps/harmony/AppScope/app.json5` | L8 |
| **多语言字符串定义** | `apps/harmony/.../resources/zh_CN/element/string.json` | 全文 |
| **三端共享类型** | `packages/types/src/index.ts` | - |
