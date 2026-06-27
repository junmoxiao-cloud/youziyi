# 验收清单

## Task 1: resolveFamilyWeatherList 函数
- [x] `ApiModels.ets` 中新增 `FamilyWeatherEntry` 接口
- [x] `ApiModels.ets` 中新增 `resolveFamilyWeatherList()` 导出函数
- [x] 3 人家庭返回 3 个 entry
- [x] 未加入家庭时返回当前用户 1 个 entry
- [x] 成员无 cityCode 时 entry.cityCode 为空字符串
- [x] relationLabel 正确生成（如"家乡"/"远方"/成员名字）

## Task 2: WeatherCard 横版布局
- [x] `WeatherCard.ets` 新增 `layout: string = 'vertical'` Props
- [x] `layout = 'horizontal'` 时卡片内部为 Row（左图标 + 右文字）
- [x] 横版模式下宽度 100%、padding 紧凑（14）
- [x] 横版模式下图标 fontSize 40
- [x] `layout = 'vertical'` 时保持原有竖版布局不变

## Task 3: HomeTab 天气状态改造
- [x] `@State weatherEntries: FamilyWeatherEntry[]` 已定义
- [x] `@State weatherDataMap: Map<string, WeatherData>` 已定义
- [x] 旧的 `elderWeather` 和 `childWeather` 已移除

## Task 4: HomeTab 天气加载遍历全部成员
- [x] `loadFamilyWeathers()` 调用 `resolveFamilyWeatherList()`
- [x] 对每个有 cityCode 的成员并行请求天气
- [x] 结果存入 `weatherDataMap`（key = userId）
- [x] 无 cityCode 的成员跳过请求

## Task 5: HomeTab 天气纵向列表 UI
- [x] 天气区域使用 `Column` 纵向排列（非 Row 并排）
- [x] 每张 WeatherCard 使用 `layout: 'horizontal'` 横版布局
- [x] 每张卡片宽度 100%
- [x] "同一片天空"标题保留
- [x] 无天气数据的成员显示"XX 的天气暂不可用"占位
- [x] 家庭未连接时降级为当前用户单卡片

## Task 6: 编译验证
- [x] 编译 0 ERROR
- [x] 模拟器运行时横版天气列表正常渲染