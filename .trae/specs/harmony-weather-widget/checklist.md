# 验收清单

## Task 1: WeatherData 模型补齐
- [x] `ApiModels.ets` 中 `WeatherData` 接口已包含 `cityName?: string`

## Task 2: WeatherCard 组件
- [x] `components/WeatherCard.ets` 文件已创建，为 `@Component` 结构体
- [x] 组件接收 Props：`cityName: string`, `weatherType: string`, `temperature: number`, `humidity: number`
- [x] 根据 `weatherType` 显示对应的图标（sunny→☀️, cloudy→⛅, rainy→🌧️, snowy→❄️, 其他→🌤️）
- [x] 根据 `weatherType` 显示对应的中文文案（晴/多云/雨/雪/未知）
- [x] 显示温度（如"25°C"）、湿度（如"58%"）、城市名
- [x] 字号 ≥ 22，背景使用渐变

## Task 3: HomeTab 集成
- [x] `HomeTab.ets` 加载 `WeatherData` 类型
- [x] `aboutToAppear` 或 `loadData` 中调用 `appRepository.getWeather()`
- [x] 天气数据存储为 `@State weatherData: WeatherData | null`
- [x] 天气卡片渲染在打卡表单上方，`Scroll` 内第一个子元素
- [x] `cityCode` 为空时显示"天气暂不可用"，不阻塞打卡流程
- [x] 编译通过，无 ERROR

## Task 4: WeatherTab（可选）
- [ ] `pages/tabs/WeatherTab.ets` 已创建
- [ ] `Main.ets` Tab 栏增加 WeatherTab 入口
- [ ] WeatherTab 展示完整天气信息（Web 端"同一片天空"风格）