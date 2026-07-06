# 云服务器部署前端完善 Spec

## Why
当前 Web 端缺少中国法律法规要求的 ICP 备案信息展示；初始界面的"我有牵挂码"路由逻辑强制未登录用户跳转注册流程，体验不友好；家庭管理缺少退出机制，且两个账号同时处于各自新建家庭时无法互相加入。需在云服务器部署前完成上述前端完善。

## What Changes
- 新增全局 ICP 备案信息页脚组件，所有页面底部统一展示备案号及工信部链接
- 重构 Welcome 页"我有牵挂码"交互流程，支持未登录用户先输入牵挂码，再引导登录/注册后自动加入家庭
- 新增"退出家庭"功能：后端新增 `POST /api/family/leave` 接口，前端在家庭管理/设置页添加退出按钮与二次确认弹窗
- 解决两账号各自新建家庭后无法互相加入的问题（通过退出家庭功能实现）
- **BREAKING**: 后端新增 `/api/family/leave` 接口

## Impact
- Affected specs: 家庭连接闭环逻辑、页面路由逻辑、API 接口规范
- Affected code: `apps/web/src/App.tsx`, `apps/web/src/pages/Welcome.tsx`, `apps/web/src/pages/Profile.tsx`, `apps/web/src/pages/FamilyJoin.tsx`, `apps/web/src/layouts/MainLayout.tsx`, `apps/web/src/store/index.ts`, `apps/web/src/routing.ts`, `apps/web/index.html`, `apps/server/src/index.ts`, `docs/API接口规范.md`

## ADDED Requirements

### Requirement: ICP 备案信息页脚
系统 SHALL 在所有前端页面底部统一展示符合中国工信部规定的 ICP 备案信息，包含备案号及可点击链接（链接至 `https://beian.miit.gov.cn`）。

#### Scenario: 所有页面展示备案信息
- **WHEN** 用户访问任意前端页面
- **THEN** 页面底部固定展示 ICP 备案号及链接
- **AND** 备案信息不遮挡页面主要功能区域
- **AND** 备案号格式符合工信部规定（如 `粤ICP备XXXXXXXX号`）

#### Scenario: 未登录/引导页展示备案信息
- **WHEN** 用户访问 Welcome、Login、Register 等公开页面
- **THEN** 页面底部同样展示 ICP 备案信息

### Requirement: 牵挂码免注册流程
系统 SHALL 允许未登录用户在 Welcome 页面点击"我有牵挂码，加入家人"后直接输入牵挂码，无需强制跳转至注册页面；输入牵挂码后再引导用户登录或注册，成功后自动加入对应家庭。

#### Scenario: 未登录用户输入牵挂码后注册
- **WHEN** 用户在 Welcome 页点击"我有牵挂码，加入家人"
- **THEN** 展示牵挂码输入区域（不强制要求登录态）
- **AND** 用户输入有效牵挂码后，引导至登录或注册页面
- **AND** 登录/注册成功后，系统自动使用用户输入的牵挂码完成家庭加入
- **AND** 加入成功后展示连接成功反馈

#### Scenario: 输入无效牵挂码
- **WHEN** 用户输入的牵挂码格式无效或不存在
- **THEN** 在输入区域展示错误提示
- **AND** 不跳转到登录/注册页面

#### Scenario: 已登录用户使用牵挂码
- **WHEN** 已登录用户在 Welcome 页或家庭页输入牵挂码
- **THEN** 直接调用加入家庭接口，无需重复登录

### Requirement: 家庭退出功能
系统 SHALL 提供"退出家庭"功能，允许用户主动退出当前家庭。退出需包含二次确认弹窗防止误操作，退出后清除前端家庭状态。

#### Scenario: 用户主动退出家庭
- **WHEN** 用户在家庭管理/设置页点击"退出家庭"按钮
- **THEN** 弹出二次确认弹窗，说明退出后需重新输入牵挂码才能再次加入
- **AND** 用户确认后，调用后端 `POST /api/family/leave` 接口
- **AND** 退出成功后清除前端 `familyId` 和 `familyInfo` 状态
- **AND** 退出成功后展示反馈提示

#### Scenario: 用户取消退出
- **WHEN** 用户在二次确认弹窗中点击"取消"
- **THEN** 关闭弹窗，不做任何操作

#### Scenario: 退出后重新加入家庭
- **WHEN** 用户退出家庭后，前往家庭加入页
- **THEN** 可以输入新的牵挂码加入其他家庭
- **AND** 解决了两个账号各自新建家庭后无法互相加入的问题

## MODIFIED Requirements

### Requirement: Welcome 页路由逻辑（修改）
原有 Welcome 页"我有牵挂码"按钮直接导航至 `/family/join`（需要登录态），修改为：
- 在 Welcome 页内嵌牵挂码输入区域（点击按钮后展开）
- 未登录用户输入牵挂码后，携带牵挂码参数跳转至 `/login` 或 `/register`
- 登录/注册成功后自动执行加入家庭操作

### Requirement: 家庭创建与加入逻辑（修改）
原有 `POST /api/family/join` 在用户已属于其他家庭时返回错误（`该账号已加入其他家庭`），无法处理用户想更换家庭的情况。修改为：
- 新增 `POST /api/family/leave` 接口，允许用户主动退出当前家庭
- 前端 Profile 页新增"退出家庭"入口，与退出流程联动
