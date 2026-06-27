# 鸿蒙端家庭天气共享 Spec

## Why

当前鸿蒙 APP 仅展示**当前登录用户**所在城市的天气。但项目的核心场景是"亲人异地关怀"——老人在家（家乡）、子女在远方。Web 端 CompanionDashboard 已经实现了"同一片天空"双城天气（家乡 + 远方），鸿蒙端也需要补齐这个能力，让老人能看到远方子女所在城市的天气，反之亦然。

## What Changes

1. **新增共享函数** — 在 `ApiModels.ets` 中新增 `resolveFamilyWeatherCityCodes()`，从 `profile.familyInfo.members` 中提取老人(elder)和子女(child)的 `cityCode`
2. **HomeTab 天气加载扩展** — 从单城市天气改为**并行加载双城天气**：`getWeather(elderCityCode)` + `getWeather(childCityCode)`
3. **UI 升级** — 将单张 WeatherCard 替换为 "同一片天空" 标题 + 两张 WeatherCard（家乡/远方），各标注所属家庭成员名字

## 数据流

```
loadData()
  → getUserProfile(userId)
    → profile.familyInfo.members 中有双方 cityCode
    → resolveFamilyWeatherCityCodes(profile, userId)
      → 得到 { elderCityCode, childCityCode }
    → Promise.all([
        getWeather(elderCityCode),
        getWeather(childCityCode)
      ])
      → 渲染双城天气卡片
```

## Impact

- Affected specs: 天气数据层、HomeTab 展示层
- Affected code: `ApiModels.ets`(新增函数), `HomeTab.ets`(扩展加载逻辑 + UI), `WeatherCard.ets`(新增 `title`/`subtitle` 可选 Props)
- **不涉及**后端修改、AppRepository 修改、AppConfig 修改、MockApi 修改

## ADDED Requirements

### Requirement: 家庭天气城市码解析函数

系统 SHALL 在 `ApiModels.ets` 中提供 `resolveFamilyWeatherCityCodes()` 函数，输入 profile 和 userId，输出 `{ elderCityCode, elderName, childCityCode, childName }`。

#### Scenario: 家庭已连接，双方均有城市
- **WHEN** `profile.familyInfo.members` 非空，存在 elder 和 child 角色
- **THEN** 返回双方 `cityCode` 和 `name`，供后续天气请求使用

#### Scenario: 家庭未连接或成员城市不完整
- **WHEN** `profile.familyInfo` 为空，或某方 `cityCode` 缺失
- **THEN** 对应方的 `cityCode` 返回 `null`，UI 对应位置显示"暂不可用"

### Requirement: 双城天气并行加载

系统 SHALL 在 HomeTab 中并行加载双方城市天气。

#### Scenario: 双方 cityCode 都存在
- **WHEN** `resolveFamilyWeatherCityCodes` 返回两个有效 `cityCode`
- **THEN** 使用 `Promise.all` 同时调用 `appRepository.getWeather()` 拉取数据
- **THEN** `elderWeather` 和 `childWeather` 均被正确填充

#### Scenario: 一方 cityCode 缺失
- **WHEN** 某方 `cityCode` 为 null
- **THEN** 只请求有效一方的天气
- **THEN** 无效一方显示为"天气暂不可用"占位卡片

### Requirement: 双城天气 UI

系统 SHALL 在 HomeTab 天气区域展示"同一片天空"标题和两张并排的 WeatherCard。

- 标题："同一片天空"（匹配 Web 端品牌命名）
- 两张卡片并排（`Row` + `layoutWeight(1)`），分别为"家乡"（老人城市）和"远方"（子女城市）
- 每张卡片上方标注家庭成员名字（如"妈妈的天气" / "小雨的天气"）
- 字号 ≥ 20（适老要求）
- 背景渐变保留 WeatherCard 现有逻辑

## MODIFIED Requirements

### Requirement: WeatherCard Props 扩展

WeatherCard 组件新增两个可选 Props：

```typescript
@Component
export struct WeatherCard {
  cityName: string = ''
  weatherType: string = 'sunny'
  temperature: number = 20
  humidity: number = 50
  title?: string = ''       // 新增：卡片上方标注（如"家乡"、"远方"）
  subtitle?: string = ''    // 新增：家庭成员名字（如"妈妈的城市"）
}
```

当 `title` 非空时，卡片顶部显示一行小标题。

## REMOVED Requirements

无。单城市天气卡片功能被升级为双城市，不删除旧代码，仅扩展。