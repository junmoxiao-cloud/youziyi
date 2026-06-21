# API 接口规范

本文档定义了《游子衣》项目后端与前端（Web端/小程序端）交互的 API 接口规范。

## 1. 通用响应格式

所有接口必须遵循统一的 JSON 返回结构，采用 RESTful 规范。

```json
{
  "code": 0,
  "data": {},
  "message": "success"
}
```

- `code`: 状态码。`0` 表示成功，非 `0` 表示失败（例如：`400` 参数错误，`401` 未授权，`500` 服务器内部错误）。
- `data`: 核心业务数据对象或数组。若无数据返回，可为 `null` 或 `{}`。
- `message`: 针对状态码的文本描述，供前端提示用户使用。
- 各端请求的接口基地址、端口和代理目标必须通过环境变量或部署配置注入，不得在业务代码中写死云服务器端口；本地联调默认以后端 `3001` 端口为基准。

## 1.1 本地联调约定

- 本地开发时，后端服务默认监听 `3001` 端口，Web 端开发代理、小程序请求基地址和调试环境变量必须与该端口保持一致。
- 若联调阶段临时调整后端端口，必须同步更新环境变量、代理配置、启动脚本与相关文档，禁止仅修改某一端代码后继续联调。
- 涉及认证、家庭连接、Onboarding、每日打卡、预警、天气、语音等接口时，各端请求路径与端口口径必须一致，避免出现单端直连旧端口的情况。

## 1.1.1 公网域名与端侧入口约定

- `https://www.youziyi.com` 为 Web 前端正式访问域名；浏览器访问该域名时，打开的是 Web 前端页面。
- Web 端生产环境默认继续使用相对路径 `/api`，并由 `www.youziyi.com` 所在网关或反向代理将 `/api/*` 转发至后端服务；若后端对外独立暴露为 `https://api.youziyi.com`，也应作为网关的反代目标，而不是要求 Web 页面层直接改写所有请求地址。
- `https://api.youziyi.com` 为统一公网后端 API 域名，供微信小程序、鸿蒙原生端及 Web 反代链路共同访问。
- 微信小程序与鸿蒙端在生产环境中必须使用各自原生前端，并直接请求 `https://api.youziyi.com`；它们不应依赖 `www.youziyi.com` 加载 Web 页面来完成正式业务流程。
- 微信小程序发布前，必须在微信公众平台将 `https://api.youziyi.com` 配置为合法 `request` 域名，并确保 HTTPS 证书、备案与域名校验满足平台要求。
- 若公网域名、网关反代规则或端侧 API 入口发生变化，必须同步更新端侧配置、README、Rules 与相关部署文档，禁止出现 Web、小程序、鸿蒙分别指向不同生产 API 主域名的分叉状态。

## 1.2 角色字段约定

- 项目采用真实多账户体系，合法角色仅允许 `elder` 与 `child` 两种枚举值。
- `role` 属于核心业务字段，认证、用户资料、家庭关系等接口在请求或响应中涉及用户身份时，必须显式传递或返回该字段，禁止前端自行猜测角色。
- 前后端、小程序端以及后续鸿蒙端必须共用同一套角色枚举与字段命名，禁止出现 `parent`、`kid`、`userType` 等分叉定义。
- 未通过服务端返回的真实 `userId` 与 `role` 建立会话前，不得在前端写死测试账户或伪造家庭成员身份。

## 1.3 字段变更联动约定

- 当 API 返回字段、`packages/shared` / `packages/types` 共享结构、前端 `store` 状态字段或组件 Props 字段发生新增、删除、改名、嵌套层级调整时，必须视为一次全仓协议变更处理。
- 发生协议变更后，必须在同一任务内同步检查并更新以下位置：后端接口实现、`docs/API接口规范.md`、共享类型/常量、各端 `store` 映射逻辑、直接消费该字段的组件、mock 数据、默认兜底数据、联调脚本与相关 Rules。
- 禁止仅修改某一层字段后，通过组件内兜底、页面临时映射或写死兼容分支掩盖上下游未同步的问题。
- 若接口响应结构从数组改为对象包装，或从 `data` 直出改为 `data.records`、`data.items` 等嵌套形式，必须在文档中明确声明，并同步更新所有消费端读取路径。
- 任何字段变更合并前，至少应完成一次 repo 范围检索，确认 API、shared、store、component、mock、测试与文档中的旧字段名已被处理。

## 1.4 共享真源与阶段边界

- 城市码与标签映射的单一真源固定为 `packages/types/src/index.ts`；Web 与 Server 直接消费共享定义，Harmony 仅允许消费同步产物 `apps/harmony/entry/src/main/ets/common/synced/SharedCityCatalog.ets`，禁止继续在 `ApiModels.ets`、页面或 mock 中各自维护 `BEIJING`、`SHANGHAI` 等分叉常量。
- 当前已完成的家庭共享能力以 Web/Server 为准：登录后真实路由守卫、家庭连接成功后的稳态展示、家庭对方成员基础资料读取、天气来源说明、最小健康状态来源说明，以及今日打卡状态/按天聚合/时段窗口策略的统一协议。
- 当前未完成的共享边界也属于正式协议内容：Harmony 第一阶段尚未完成“家庭对方成员资料 + 天气来源说明 + 最小健康摘要”的正式远程联调闭环，因此 README、Rules、页面说明和任务清单必须统一标记为未完成边界，禁止以本地兜底或 mock 文案伪装为已共享。
- 若后续补齐上述鸿蒙共享展示或新增共享字段，必须将 API 文档、共享类型/常量、Harmony 同步产物、Web/Harmony 页面说明、README、Rules 与任务清单一并更新。

## 2. 核心业务接口

### 2.1 打卡同步 (Check-in Sync)
用于同步老人每日的心情、步数等健康和状态数据。

- **接口地址**: `POST /api/health/checkin`
- **请求参数**:
  ```json
  {
    "userId": "string",
    "mood": "string",      // 情绪枚举，如 "happy", "calm", "sad"
    "steps": "number",     // 步数
    "heartRate": "number", // 选填，心率
    "timestamp": "number", // 打卡时间戳
    "metricsData": {
      "mood": "string",
      "steps": "number",
      "heartRate": "number",
      "bloodPressure": "string",
      "bloodSugar": "number",
      "sleep": "string"
    }
  }
  ```
- **字段说明**:
  - `metricsData` 为可选扩展指标对象，字段由 `trackedMetrics` 动态决定；未启用的指标不应强行上送空值。
  - Web 长辈打卡页提交成功后，必须继续刷新 `GET /api/health/checkin-status/:userId` 与 `GET /api/health/checkins/daily/:userId`，确保页面展示以服务端聚合结果为准。
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "recordId": "string",
      "createdAt": "number"
    },
    "message": "打卡成功"
  }
  ```

### 2.1.1 今日打卡状态 (Today Check-in Status)
用于 Web / 小程序在进入打卡页时读取“今天是否已打卡、当前时间窗口、表单初始值、今日摘要”。

- **接口地址**: `GET /api/health/checkin-status/:userId`
- **请求参数**: 路径参数 `userId`
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "userId": "string",
      "timezone": "Asia/Shanghai",
      "businessDate": "2026-06-20",
      "hasCheckedInToday": true,
      "lastCheckInAt": 1750406400000,
      "trackedMetrics": ["mood", "steps", "heartRate"],
      "window": {
        "timezone": "Asia/Shanghai",
        "businessDate": "2026-06-20",
        "currentPeriod": "morning | daytime | evening | closed",
        "opensAt": 1750395600000,
        "closesAt": 1750460400000,
        "isWithinCheckInWindow": true,
        "promptState": "before_window | morning_checkin | daytime_checkin | evening_checkin | already_checked_in | missed_window",
        "promptMessage": "string"
      },
      "summary": {
        "mood": "happy",
        "steps": 5231,
        "heartRate": 76
      },
      "today": {
        "date": "2026-06-20",
        "hasCheckedIn": true,
        "recordCount": 1,
        "latestCheckInAt": 1750406400000,
        "summary": {
          "mood": "happy",
          "steps": 5231,
          "heartRate": 76
        },
        "latestRecord": {
          "recordId": "string",
          "mood": "happy",
          "steps": 5231,
          "heartRate": 76,
          "timestamp": 1750406400000,
          "businessDate": "2026-06-20",
          "period": "morning"
        }
      },
      "latestRecord": {
        "recordId": "string",
        "mood": "happy",
        "steps": 5231,
        "heartRate": 76,
        "timestamp": 1750406400000,
        "businessDate": "2026-06-20",
        "period": "morning"
      },
      "form": {
        "editableMetrics": ["mood", "steps", "heartRate"],
        "initialValues": {
          "mood": "happy",
          "steps": 5231,
          "heartRate": 76
        }
      }
    },
    "message": "success"
  }
  ```
- **字段说明**:
  - `window` 为今日打卡时间策略的唯一真源，前端是否允许提交、提示文案展示均必须基于该对象判断。
  - `form.editableMetrics` 为页面动态表单字段来源，优先级高于前端本地默认值。
  - `form.initialValues` 为当前表单的初始值，通常来自最近一次记录；若当天尚未打卡，可用来做最小预填。
  - `summary` 与 `today.summary` 均表示服务端按天聚合后的今日摘要，前端展示不得自行二次拼接旧缓存。
  - Web 长辈打卡页、Web 陪伴页、Web 家庭页在展示“当天健康状态”时，必须共用该接口返回的今日摘要口径；禁止某一页读取 `summary`、另一页读取本地缓存或页面静态 mock。
  - 当子女端需要查看家庭对方当天状态时，必须先通过 `GET /api/user/profile/:userId` 读取 `data.familyInfo.members[].userId`，再以“对方 userId”请求本接口；禁止继续以当前登录人的 `userId` 代替家庭共享对象。

### 2.1.2 健康记录按天聚合 (Daily Health Aggregates)
用于 Web 端展示最近几天的打卡摘要、今日回写结果与时间维度趋势。

- **接口地址**: `GET /api/health/checkins/daily/:userId`
- **请求参数**:
  - 路径参数 `userId`
  - Query `days`：需要返回的天数，范围 `1-30`
  - Query `date`：聚合锚点日期，格式 `YYYY-MM-DD`，默认取当前业务日
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "userId": "string",
      "timezone": "Asia/Shanghai",
      "anchorDate": "2026-06-20",
      "requestedDays": 7,
      "today": {
        "date": "2026-06-20",
        "hasCheckedIn": true,
        "recordCount": 1,
        "latestCheckInAt": 1750406400000,
        "summary": {
          "mood": "happy",
          "steps": 5231,
          "heartRate": 76
        }
      },
      "yesterday": {
        "date": "2026-06-19",
        "hasCheckedIn": false,
        "recordCount": 0,
        "latestCheckInAt": null,
        "summary": {
          "mood": null,
          "steps": null,
          "heartRate": null
        }
      },
      "recentDays": [
        {
          "date": "2026-06-14",
          "hasCheckedIn": true,
          "recordCount": 1,
          "latestCheckInAt": 1750406400000,
          "summary": {
            "mood": "happy",
            "steps": 5231,
            "heartRate": 76
          }
        }
      ]
    },
    "message": "success"
  }
  ```
- **字段说明**:
  - `today`、`yesterday`、`recentDays[]` 的单日对象结构保持一致，便于三端共用聚合渲染逻辑。
  - `recentDays[]` 按业务日升序返回，最后一项即当前 `today`。
  - `summary` 是按天聚合后的最新摘要值；`latestCheckInAt` 为该业务日内最后一次记录时间。

### 2.2 状态预警 (Status Warning)
用于查询用户的互动状态及预警信息。

- **接口地址**: `GET /api/warning/status/:userId`
- **请求参数**: 路径参数 `userId`
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "lastInteractionTime": "number",
      "warningLevel": "number", // 0: 正常, 1: 24小时未互动, 2: 36小时未互动, 3: 48小时未互动
      "isTriggered": "boolean"
    },
    "message": "success"
  }
  ```

### 2.3 天气查询 (Weather Query)
用于城市天气瓶动效，获取双方所在城市的天气信息。

- **接口地址**: `GET /api/weather/current`
- **请求参数** (Query):
  - `cityCode`: 城市编码 (string)
- **字段说明**:
  - Web 端陪伴大屏必须基于真实用户资料读取双方城市：当前用户使用 `GET /api/user/profile/:userId` 返回的 `data.cityCode`，家人使用 `data.familyInfo.members[].cityCode`
  - 禁止在页面、store 或 mock 中继续写死 `BEIJING`、`SHANGHAI`、`上海`、`北京` 作为双方天气来源或城市展示文案
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "cityCode": "string",
      "cityName": "string",
      "weatherType": "string", // "sunny", "rainy", "cloudy", "snowy"
      "temperature": "number",
      "humidity": "number"
    },
    "message": "success"
  }
  ```

### 2.4 语音上传 (Voice Upload)
用于家庭故事语音接龙的音频片段上传。

- **接口地址**: `POST /api/voice/upload`
- **请求头部**: `Content-Type: multipart/form-data`
- **请求参数**:
  - `file`: 音频文件 (Blob/File)
  - `userId`: 用户ID (string)
  - `storyId`: 故事线ID (string)
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "voiceId": "string",
      "url": "string",      // OSS/COS 中的存储链接
      "duration": "number"  // 语音时长（秒）
    },
    "message": "上传成功"
  }
  ```

### 2.5 语音列表 (Voice List)
用于获取指定用户的家庭故事语音记录列表，供时间线、播放列表和语音回顾模块渲染。

- **接口地址**: `GET /api/voice/list/:userId`
- **请求参数**: 路径参数 `userId`
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "records": [
        {
          "id": "string",
          "role": "elder | child",
          "timeLabel": "string",
          "duration": "number",
          "url": "string"
        }
      ]
    },
    "message": "success"
  }
  ```
- **字段说明**:
  - `data.records`: 语音记录数组；即使为空也必须返回 `[]`，不得返回 `null`
  - `records[].id`: 语音记录ID，供列表渲染、播放控制与去重使用
  - `records[].role`: 语音发送方角色，仅允许 `elder` 或 `child`
  - `records[].timeLabel`: 面向界面展示的时间标签字符串，例如 `刚刚`、`昨天 20:00`
  - `records[].duration`: 语音时长，单位为秒
  - `records[].url`: 音频可访问地址
- **兼容要求**:
  - 当前权威响应结构为 `data.records`，各端 `store`、共享类型和组件消费路径必须保持一致，禁止继续按 `data` 直出数组读取。
  - 当前权威列表项字段为 `id`、`role`、`timeLabel`、`duration`、`url`；列表接口不得继续对外暴露旧版 `storyId`、`createdAt` 字段。
  - 语音上传、数据库实体或内部聚合流程中如仍存在 `storyId`、`createdAt` 等原始字段，可在服务端内部使用，但若需要重新暴露给前端，必须同步更新本文档、共享类型、状态映射层与语音列表组件。
  - 若后续新增 `speakerName`、`waveform`、`coverUrl` 等展示字段，必须同步更新本文档、共享类型、状态映射层与语音列表组件。

### 2.6 用户注册 (User Register)
用于创建真实多账户体系下的长辈或子女账号。

- **接口地址**: `POST /api/auth/register`
- **请求参数**:
  ```json
  {
    "name": "string",
    "password": "string",
    "role": "elder | child",
    "cityCode": "string"
  }
  ```
- **字段说明**:
  - `name`: 用户名/称呼，必填
  - `password`: 登录密码，必填
  - `role`: 账户身份，必填，前后端必须保持一致
  - `cityCode`: 城市编码，选填；若首次未完整填写，后续由 Onboarding 补全
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "userId": "string",
      "name": "string",
      "role": "elder"
    },
    "message": "注册成功"
  }
  ```

### 2.7 用户资料 (User Profile)
用于 Onboarding 路由守卫、家庭连接状态回写，以及陪伴大屏中双方真实城市天气的读取。

- **接口地址**: `GET /api/user/profile/:userId`
- **请求参数**: 路径参数 `userId`
- **返回示例**:
  ```json
  {
    "code": 0,
    "data": {
      "userId": "string",
      "name": "string",
      "role": "elder | child",
      "cityCode": "string",
      "city": "string | null",
      "trackedMetrics": ["steps", "heartRate"],
      "familyId": "string | null",
      "familyInfo": {
        "familyId": "string",
        "familyName": "string",
        "inviteCode": "string",
        "members": [
          {
            "userId": "string",
            "name": "string",
            "role": "elder | child",
            "city": "string | null",
            "cityCode": "string | null"
          }
        ]
      }
    },
    "message": "success"
  }
  ```
- **字段说明**:
  - `data.cityCode`: 当前登录用户自己的真实城市编码，供当前角色天气请求、Onboarding 判空与资料页回显使用
  - `data.familyInfo.members[].cityCode`: 家庭成员的真实城市编码，供 Web 陪伴大屏按 `elder` / `child` 角色分别请求双方天气
  - `data.familyInfo.members[].userId`: 家庭成员真实用户 ID，供子女端读取家庭对方的今日打卡状态、家庭页共享状态和后续跨端家庭视图使用
  - `data.familyInfo.members[].role`: 家庭成员身份，仅允许 `elder` 与 `child`
  - `data.familyInfo.members[].city`: 供展示或资料补充使用，不可替代 `cityCode` 作为天气接口查询参数
  - 若某个成员尚未完善 `cityCode`，前端必须保持保守空态，禁止回退为固定北京/上海假数据
  - 家庭创建或加入成功后，前端必须立即重新请求本接口，以服务端最新返回的 `familyId` 与 `familyInfo` 作为“连接成功后稳定展示”的唯一依据；禁止直接用提交前缓存状态假定已连接完成
- 当前 Web 已完成对 `familyInfo.members[]` 的基础资料展示与共享来源说明；Harmony 当前阶段仅允许展示基础家庭成员信息，不得据此宣称“家庭对方资料、天气来源和最小健康摘要”已完成正式共享闭环。

## 3. 本地联调故障排查

### 3.1 `ECONNREFUSED` 排查说明

当 Web 端、小程序端或脚本请求本地接口出现 `ECONNREFUSED` 时，按以下顺序排查：

1. 确认后端服务是否已启动，并实际监听在约定端口 `3001`。
2. 确认 `.env`、Vite 代理、小程序请求基地址和本地启动脚本中的端口配置是否一致。
3. 确认近期是否临时修改过端口但未同步更新文档、代理或调用方配置。
4. 确认代码中不存在硬编码旧端口、旧主机地址或绕过环境变量的直连请求。
5. 确认目标服务没有因为启动失败、端口占用或异常退出而导致进程不存在。

- 若后端实际运行端口不是 `3001`，应优先修正环境变量与代理配置，再重新启动相关服务。
- 若仅某一端出现 `ECONNREFUSED`，优先检查该端是否仍在使用过期的本地缓存配置、旧 `.env` 文件或单独写死的接口地址。
- 提交任何涉及端口、认证、家庭连接或角色字段的接口变更前，必须同步更新本文档与对应 Rules，保证三端联调口径一致。
