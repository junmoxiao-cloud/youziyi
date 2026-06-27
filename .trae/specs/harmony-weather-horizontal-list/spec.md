# 鸿蒙天气卡片横版列表 Spec

## Why

当前鸿蒙 HomeTab 的天气区域用 `Row` 把两张竖版 WeatherCard 并排放置，在虚拟机小屏上每张卡片被压窄、文字拥挤，视觉效果差。同时 `resolveFamilyWeatherCityCodes` 只返回 elder/child 两个固定角色，无法支持家庭成员超过 2 人的场景（如多位子女、父母双方）。

需要改为：每张天气卡片横版铺满宽度、自上而下纵向排列，并支持任意数量的家庭成员天气卡片。

## What Changes

1. **新增 `resolveFamilyWeatherList()` 函数** — 从 `profile.familyInfo.members` 中提取所有成员的 cityCode/name/role，返回 `FamilyWeatherEntry[]` 数组（替代只返回 2 个的 `resolveFamilyWeatherCityCodes`）
2. **WeatherCard 新增横版布局** — 当 `layout: 'horizontal'` 时，卡片内部改为"左侧大图标 + 右侧城市/温度/描述"的横向排列，宽度 100%，高度紧凑
3. **HomeTab 天气状态改为数组** — `@State elderWeather/childWeather` 替换为 `@State weatherList: FamilyWeatherEntry[]`，`loadFamilyWeathers()` 遍历所有成员并行请求
4. **HomeTab 天气 UI 改为纵向列表** — `Row` 并排改为 `Column` 纵向排列，每张卡片宽度 100%、横版布局、自上而下

## Impact

- Affected specs: `harmony-family-weather`（前序 spec，本 spec 为其 UI 升级）
- Affected code:
  - `ApiModels.ets` — 新增 `FamilyWeatherEntry` 接口和 `resolveFamilyWeatherList()` 函数
  - `WeatherCard.ets` — 新增 `layout: 'horizontal'` Props，实现横版布局
  - `HomeTab.ets` — 状态从双变量改为数组，UI 从 Row 改为 Column 纵向列表
- **不涉及**后端修改（`GET /api/weather/current` 已支持按 cityCode 查询）

## ADDED Requirements

### Requirement: 家庭天气列表解析函数

系统 SHALL 提供 `resolveFamilyWeatherList(profile, userId)` 函数，返回 `FamilyWeatherEntry[]`，包含家庭中所有成员的天气查询信息。

```typescript
export interface FamilyWeatherEntry {
  userId: string
  name: string
  role: UserRole
  cityCode: string    // 规范化后的大写 cityCode，无则空字符串
  cityName: string    // 成员所在城市名，无则空字符串
  relationLabel: string  // 如"家乡"/"远方"/"妈妈"/"小雨"
}
```

#### Scenario: 3 人家庭（老人 + 2 个子女）
- **WHEN** `familyInfo.members` 包含 3 个成员
- **THEN** 返回 3 个 `FamilyWeatherEntry`，每个都有 cityCode（若成员有城市）

#### Scenario: 未加入家庭
- **WHEN** `familyInfo` 为 null
- **THEN** 返回仅含当前用户 1 个 entry 的数组（用 profile.cityCode）

#### Scenario: 成员无 cityCode
- **WHEN** 某成员 `cityCode` 为空
- **THEN** 该 entry 的 `cityCode` 为空字符串，UI 对应位置显示"天气暂不可用"

### Requirement: WeatherCard 横版布局

WeatherCard 新增 `layout: string = 'vertical'` Props，当值为 `'horizontal'` 时使用横版布局。

#### Scenario: 横版布局渲染
- **WHEN** `layout = 'horizontal'`
- **THEN** 卡片宽度 100%，内部为 `Row`：左侧大图标（fontSize 40）+ 右侧 Column（城市·温度 / 天气描述）
- **THEN** 卡片高度紧凑（padding 减少为 14），适合纵向列表

#### Scenario: 竖版布局保持兼容
- **WHEN** `layout = 'vertical'` 或未传
- **THEN** 保持现有竖版布局不变

### Requirement: HomeTab 天气纵向列表 UI

系统 SHALL 在天气区域以纵向 `Column` 排列所有家庭成员的横版 WeatherCard。

#### Scenario: 多成员家庭
- **WHEN** `weatherList` 包含 3 个 entry 且都有天气数据
- **THEN** 自上而下渲染 3 张横版 WeatherCard，每张宽度 100%

#### Scenario: 部分成员无天气
- **WHEN** 某成员 cityCode 为空或请求失败
- **THEN** 该位置渲染"XX 的天气暂不可用"占位卡片

## MODIFIED Requirements

### Requirement: HomeTab 天气状态 — 从双变量改为数组

**当前**：
```typescript
@State elderWeather: WeatherData | null = null
@State childWeather: WeatherData | null = null
```

**改为**：
```typescript
@State weatherEntries: FamilyWeatherEntry[] = []
@State weatherDataMap: Map<string, WeatherData> = new Map()  // key = userId
```

### Requirement: HomeTab 天气加载 — 遍历所有成员

**当前**：`loadFamilyWeathers()` 只请求 elder 和 child 两个城市。

**改为**：`loadFamilyWeathers()` 调用 `resolveFamilyWeatherList()` 获取全部成员，对每个有 cityCode 的成员并行请求天气，结果存入 `weatherDataMap`。

## REMOVED Requirements

无。`resolveFamilyWeatherCityCodes` 保留不删（其他地方可能引用），但 HomeTab 改用新的 `resolveFamilyWeatherList`。