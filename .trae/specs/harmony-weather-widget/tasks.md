# Tasks

- [ ] Task 1: 补齐 WeatherData 模型 — 在 `ApiModels.ets` 的 `WeatherData` 接口中新增 `cityName?: string` 字段
- [ ] Task 2: 新建 WeatherCard.ets 组件 — 创建天气卡片组件，支持 cityName/weatherType/temperature/humidity 四个 Props，展示天气图标、温度、城市名、湿度、天气文案
- [ ] Task 3: 在 HomeTab 顶部插入天气卡片 — 在 `HomeTab.ets` 的 `aboutToAppear` 中增加 `loadWeather()` 调用，顶部渲染 WeatherCard 组件
- [ ] (可选) Task 4: 新增 WeatherTab.ets — 如果用户后续需要天气独立 Tab，挂载到 Main 页

# Task Dependencies

- Task 3 依赖 Task 1 和 Task 2
- Task 4 依赖 Task 1 和 Task 2