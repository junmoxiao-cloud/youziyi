# Tasks

- [x] Task 1: 新增 `FamilyWeatherEntry` 接口和 `resolveFamilyWeatherList()` 函数 — 在 `ApiModels.ets` 中添加，遍历 `familyInfo.members` 返回所有成员的天气查询 entry 数组
- [x] Task 2: WeatherCard 新增横版布局 — 新增 `layout: string = 'vertical'` Props，`horizontal` 模式下改为"左图标 + 右文字"的横向紧凑布局
- [x] Task 3: HomeTab 天气状态改为数组 — `elderWeather/childWeather` 替换为 `weatherEntries: FamilyWeatherEntry[]` 和 `weatherDataMap: Map<string, WeatherData>`
- [x] Task 4: HomeTab 天气加载改为遍历全部成员 — `loadFamilyWeathers()` 调用 `resolveFamilyWeatherList()`，对每个有 cityCode 的成员并行请求
- [x] Task 5: HomeTab 天气 UI 改为纵向列表 — `Row` 并排改为 `Column` 纵向排列，每张 WeatherCard 横版、宽度 100%、自上而下
- [x] Task 6: 编译验证 — 零 ERROR，横版列表在模拟器中正常渲染

# Task Dependencies

- Task 3 依赖 Task 1
- Task 4 依赖 Task 1 和 Task 3
- Task 5 依赖 Task 2 和 Task 4
- Task 6 依赖全部前置任务