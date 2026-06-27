# Tasks

- [x] Task 1: 新增 `resolveFamilyWeatherCityCodes()` 共享函数 — 在 `ApiModels.ets` 中添加，从 `profile.familyInfo.members` 中提取 elder/child 的 cityCode 和 name
- [x] Task 2: WeatherCard 新增 title/subtitle Props — 在卡片顶部渲染标题行（如"家乡 · 妈妈的城市"）
- [x] Task 3: HomeTab 双城天气并行加载 — 将 `loadWeather` 扩展为并行请求双方天气，存储 `elderWeather` 和 `childWeather`
- [x] Task 4: HomeTab 双城天气 UI — 将单 WeatherCard 替换为"同一片天空"标题 + 双卡并排布局，标注"家乡"/"远方"

# Task Dependencies

- Task 2 是 Task 4 的前置
- Task 1 是 Task 3 的前置
- Task 4 依赖 Task 2 和 Task 3