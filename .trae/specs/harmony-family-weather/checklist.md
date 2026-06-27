# 验收清单

## Task 1: resolveFamilyWeatherCityCodes 函数
- [x] `ApiModels.ets` 中新增 `resolveFamilyWeatherCityCodes()` 导出函数
- [x] 输入 `(profile: UserProfileResponse | null, userId: string)`，输出 `FamilyWeatherCityCodes`
- [x] 函数正确区分当前用户和对方成员角色
- [x] 能处理 `familyInfo` 为空 / `members` 为空 / 角色不全的边缘情况
- [x] 使用 `normalizeCityCode` 处理大小写

## Task 2: WeatherCard Props 扩展
- [x] `WeatherCard.ets` 新增 `title: string = ''` 和 `subtitle: string = ''` Props
- [x] `title` 非空时，卡片顶部渲染一行小字标题（如"家乡"）
- [x] `subtitle` 非空时，在温度行下方渲染小字标注（如"妈妈的城市"）

## Task 3: HomeTab 双城天气加载
- [x] HomeTab 新增 `@State elderWeather: WeatherData | null` 和 `@State childWeather: WeatherData | null`
- [x] `loadData()` 中获取 profile 后调用 `resolveFamilyWeatherCityCodes()` 解析双方城市
- [x] 使用 `Promise.all` 并行请求双方天气
- [x] 一方 cityCode 缺失时，只请求有效方，缺失方保持 null

## Task 4: HomeTab 双城天气 UI
- [x] 天气区域显示"同一片天空"标题（字体 28，加粗）
- [x] 两张 WeatherCard 以 `Row` + `layoutWeight(1)` 并排显示
- [x] 左侧卡片标题为"家乡"，展示 elder 天气数据
- [x] 右侧卡片标题为"远方"，展示 child 天气数据
- [x] 每张卡片上方显示对应的家庭成员城市名字
- [x] 一方无数据时该卡片显示"天气暂不可用"
- [x] 编译通过，无 ERROR