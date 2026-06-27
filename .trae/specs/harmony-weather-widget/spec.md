# 鸿蒙端天气卡片组件 Spec

## Why

鸿蒙 APP 的 `api/weather/current` 接口和 Mock 数据层已就绪，但完全没有任何 UI 展示天气信息。用户（老人）在每日打卡前无法直观看到当前城市的天气状况，缺少"贴心管家"应有的环境感知能力。

## What Changes

1. **在 `WeatherData` 模型中增加 `cityName` 字段** — 后端实际返回了 `cityName`，但当前鸿蒙模型未接收它，导致城市名只能靠本地 catalog 反查
2. **新建 `WeatherCard.ets` 组件** — 独立的天气卡片，展示城市名、天气图标、温度、湿度、天气描述文案
3. **在 `HomeTab.ets` 顶部插入天气卡片** — 打卡表单上方，约 200dp 高的卡片区域，进入页面时自动加载天气
4. **新增 `WeatherTab.ets`（可选独立 Tab）** — 如果用户希望天气有独立页面（Web 端"同一片天空"概念），可挂载到 Main 页 Tab 栏

## 接口对齐

| 字段 | 鸿蒙 WeatherData (当前) | 后端实际返回 (server index.ts:460-465) | 操作 |
|---|---|---|---|
| `cityCode` | `string` | `cityCode` | 保留 |
| `cityName` | 缺失 | `cityName` | **新增** |
| `weatherType` | `string` | `weatherType` | 保留 |
| `temperature` | `number` | `temperature` | 保留 |
| `humidity` | `number` | `humidity` | 保留 |

## Impact

- Affected specs: 天气数据层、HomeTab 展示层
- Affected code: `ApiModels.ets`, `WeatherCard.ets`(新), `HomeTab.ets`, 可选 `WeatherTab.ets`(新), `Main.ets`
- **不涉及**后端修改、AppRepository 修改、AppConfig 修改

## ADDED Requirements

### Requirement: 天气卡片组件

系统 SHALL 提供一个天气卡片组件 `WeatherCard.ets`，在 HomeTab 顶部展示。

#### Scenario: 天气数据加载成功
- **WHEN** 用户进入 HomeTab，`aboutToAppear` 检查到 `profile.cityCode` 存在
- **THEN** 调用 `appRepository.getWeather(cityCode)` 获取天气数据
- **THEN** 卡片显示：城市名、天气图标(`☀️⛅🌧️❄️`)、温度、湿度、天气文案

#### Scenario: 天气数据加载失败 / cityCode 为空
- **WHEN** `profile.cityCode` 为空或 API 返回异常
- **THEN** 卡片显示"天气暂不可用"占位文案，不阻塞打卡表单

### Requirement: 模型字段补齐

系统 SHALL 在 `WeatherData` 接口中新增 `cityName` 字段，对齐后端返回结构。

### Requirement: 用户体验要求

- 字号 ≥ 22（适配"大字"适老要求）
- 卡片背景使用浅色渐变，和 Web 端"同一片天空"视觉风格保持一致
- 点击卡片无交互，纯展示

## MODIFIED Requirements

### Requirement: `WeatherData` 接口 — 新增 `cityName`

```typescript
export interface WeatherData {
  cityCode: string
  cityName?: string  // ← 新增
  weatherType: string
  temperature: number
  humidity: number
}
```

## REMOVED Requirements

无