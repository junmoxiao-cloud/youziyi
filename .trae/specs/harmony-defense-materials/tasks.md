# Tasks

- [x] Task 1: 修改 PPT指导方案_数据增强版.md → 鸿蒙答辩专版
  - [x] SubTask 1.1: 修改文档标题与说明（标注为鸿蒙答辩专版 + 五大改动方向）
  - [x] SubTask 1.2: 修改 P1 封面（增加 HarmonyOS 徽标、调整口播突出鸿蒙）
  - [x] SubTask 1.3: 修改 P3 产品架构页（双端 → 三端协同、新增鸿蒙端定位）
  - [x] SubTask 1.4: 修改 P8 技术架构页（补充 ArkTS 详解 + 系统 API 列表 + Monorepo 结构）
  - [x] SubTask 1.5: 新增 P8.5 鸿蒙原生能力深度展示页（组件架构 + 语音接龙 + 路由守卫）
  - [x] SubTask 1.6: 新增 P8.6 国际语言适配 i18n 专章（资源目录 + string.json + $string 引用 + 适老化国际化结合）
  - [x] SubTask 1.7: 更新时长汇总表（新增两个页面 + 压缩方案建议）
  - [x] SubTask 1.8: 更新 Part 1/Part 2 占比标注 + P9/P11 结束语

- [x] Task 2: 生成 `Harmony_PPT_Guide.md` 视觉对齐手册
  - [x] SubTask 2.1: 整合最新的 P1-P11 脚本内容
  - [x] SubTask 2.2: 为每一页设计视觉布局建议（图表、代码、截图的摆放位置）
  - [x] SubTask 2.3: 标注每一页对应的代码文件路径，方便用户快速截图
  - [x] SubTask 2.4: 强化 i18n 专章的技术深度描述

- [x] Task 3: 准备代码截图索引
  - [x] SubTask 3.1: 索引 Main.ets Tabs 组件代码（@Entry/@Component/@State 装饰器展示）
  - [x] SubTask 3.2: 索引 InteractionTab.ets AVRecorder/AVPlayer 代码片段
  - [x] SubTask 3.3: 索引 AppRepository.ets 网络请求代码片段
  - [x] SubTask 3.4: 索引 i18n 资源目录结构（base/zh_CN/en_US）
  - [x] SubTask 3.5: 索引 string.json 中英文对照代码
  - [x] SubTask 3.6: 索引 module.json5 中 $string:xxx 引用代码

- [x] Task 4: 实施 PPTX 自动化修改
  - [x] SubTask 4.1: 检查环境并安装 `python-pptx` 库
  - [x] SubTask 4.2: 编写 `modify_ppt.py` 脚本，实现 P1、P3、P8 的文案替换
  - [x] SubTask 4.3: 在脚本中实现 P8.5 和 P8.6 新页面的插入逻辑
  - [x] SubTask 4.4: 运行脚本生成更新后的 PPT 文件
  - [x] SubTask 4.5: 验证文件完整性（11 → 13 页，P1/P3 已修改，P8.5/P8.6 已插入）
  - ⚠️ P8 原文未匹配到，需手动在 PowerPoint 中补充鸿蒙技术栈描述

# Task Dependencies
- Task 2 依赖 Task 1 完成（PPTX 以修改后的 md 文稿为指引）
- Task 3 可与 Task 2 并行
- Task 4 为可选项，不阻塞