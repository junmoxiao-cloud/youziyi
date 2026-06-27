import promptAction from '@ohos.promptAction'
import { SectionCard } from '../../components/SectionCard'
import { WeatherCard } from '../../components/WeatherCard'
import {
  CheckInPayload,
  FamilyWeatherEntry,
  HOME_CHECKIN_PAGE_DEFINITION,
  HomeCheckInState,
  TodayCheckInStatusResponse,
  TrackedMetric,
  UserProfileResponse,
  WeatherData,
  getTrackedMetricLabel,
  resolveCityLabel,
  resolveFamilyWeatherList
} from '../../common/ApiModels'
import { appSession } from '../../common/AppSession'
import { appRepository } from '../../services/AppRepository'

interface MoodOption {
  value: string
  label: string
  accentColor: string
  mutedColor: string
}

const MOOD_OPTIONS: MoodOption[] = [
  { value: 'happy', label: '开心', accentColor: '#E66A3D', mutedColor: '#FFF0EA' },
  { value: 'calm', label: '平静', accentColor: '#2F6BFF', mutedColor: '#EAF0FF' },
  { value: 'sad', label: '低落', accentColor: '#5B6477', mutedColor: '#EEF1F5' }
]

@Component
export struct HomeTab {
  onNavigateToInteraction?: () => void

  @State selectedMood: string = ''
  @State stepsInput: string = ''
  @State heartRateInput: string = ''
  @State bloodPressureInput: string = ''
  @State bloodSugarInput: string = ''
  @State sleepInput: string = ''
  @State isSubmitting: boolean = false
  @State submitMessage: string = '将按服务端今日打卡状态口径加载窗口、摘要和可编辑指标。'
  @State lastRecordId: string = ''
  @State profile: UserProfileResponse | null = null
  @State todayStatus: TodayCheckInStatusResponse | null = null
  @State weatherEntries: FamilyWeatherEntry[] = []
  @State weatherDataMap: Map<string, WeatherData> = new Map()

  aboutToAppear(): void {
    this.loadData()
  }

  private loadData(): void {
    const userId = appSession.getUserId()
    if (!userId) {
      this.submitMessage = '当前未读取到登录用户，请先返回登录页。'
      return
    }

    appRepository.getUserProfile(userId).then((response) => {
      if (response.data) {
        this.profile = response.data
        appSession.setProfile(response.data)
        this.loadFamilyWeathers()
      }
      return appRepository.getTodayCheckInStatus(userId)
    }).then((response) => {
      if (response.data) {
        this.todayStatus = response.data
        this.selectedMood = response.data.form.initialValues.mood ?? ''
        this.stepsInput = response.data.form.initialValues.steps ? String(response.data.form.initialValues.steps) : ''
        this.heartRateInput = response.data.form.initialValues.heartRate ? String(response.data.form.initialValues.heartRate) : ''
        this.submitMessage = response.data.window.promptMessage
      }
    }).catch((error: Error) => {
      this.submitMessage = '打卡状态加载失败，请稍后重试。'
      promptAction.showToast({ message: error.message })
    })
  }

  private loadFamilyWeathers(): void {
    this.weatherDataMap = new Map()

    const userId = appSession.getUserId()
    const entries: FamilyWeatherEntry[] = resolveFamilyWeatherList(this.profile, userId)
    this.weatherEntries = entries

    const requests: Promise<void>[] = []

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (!entry.cityCode) {
        continue
      }
      requests.push(
        appRepository.getWeather(entry.cityCode).then((response) => {
          if (response.data) {
            this.weatherDataMap.set(entry.userId, response.data)
          }
        }).catch((error: Error) => {
          console.error(`load weather for ${entry.name} failed`, error)
        })
      )
    }

    if (requests.length > 0) {
      Promise.all(requests).catch((error: Error) => {
        console.error('loadFamilyWeathers failed', error)
      })
    }
  }

  private getStateSnapshot(): HomeCheckInState {
    return {
      selectedMood: this.selectedMood,
      stepsInput: this.stepsInput,
      heartRateInput: this.heartRateInput,
      bloodPressureInput: this.bloodPressureInput,
      bloodSugarInput: this.bloodSugarInput,
      sleepInput: this.sleepInput,
      isSubmitting: this.isSubmitting,
      submitMessage: this.submitMessage,
      lastRecordId: this.lastRecordId
    }
  }

  private sanitizeNumericInput(value: string): string {
    return value.replace(/[^0-9]/g, '')
  }

  private selectMood(option: MoodOption): void {
    this.selectedMood = option.value
    this.submitMessage = `已选择 ${option.label}，继续填写步数后即可提交。`
  }

  private buildPayload(state: HomeCheckInState): CheckInPayload | null {
    const userId = appSession.getUserId()
    if (!userId) {
      this.submitMessage = '当前未读取到登录用户。'
      return null
    }

    if (!state.selectedMood) {
      promptAction.showToast({ message: '请选择心情' })
      this.submitMessage = '缺少必填状态：selectedMood。'
      return null
    }

    if (this.supportsMetric('steps') && !state.stepsInput) {
      promptAction.showToast({ message: '请输入步数' })
      this.submitMessage = '缺少必填状态：stepsInput。'
      return null
    }

    const payload: CheckInPayload = {
      userId: userId,
      mood: state.selectedMood,
      steps: state.stepsInput ? Number(state.stepsInput) : 0,
      timestamp: Date.now()
    }

    if (state.heartRateInput) {
      payload.heartRate = Number(state.heartRateInput)
    }
    if (state.bloodPressureInput) {
      payload.bloodPressure = state.bloodPressureInput
    }
    if (state.bloodSugarInput) {
      payload.bloodSugar = Number(state.bloodSugarInput)
    }
    if (state.sleepInput) {
      payload.sleep = state.sleepInput
    }

    payload.metricsData = {}
    if (this.supportsMetric('mood')) {
      payload.metricsData.mood = state.selectedMood
    }
    if (this.supportsMetric('steps') && state.stepsInput) {
      payload.metricsData.steps = Number(state.stepsInput)
    }
    if (this.supportsMetric('heartRate') && state.heartRateInput) {
      payload.metricsData.heartRate = Number(state.heartRateInput)
    }
    if (this.supportsMetric('bloodPressure') && state.bloodPressureInput) {
      payload.metricsData.bloodPressure = state.bloodPressureInput
    }
    if (this.supportsMetric('bloodSugar') && state.bloodSugarInput) {
      payload.metricsData.bloodSugar = Number(state.bloodSugarInput)
    }
    if (this.supportsMetric('sleep') && state.sleepInput) {
      payload.metricsData.sleep = state.sleepInput
    }

    return payload
  }

  private supportsMetric(metric: TrackedMetric): boolean {
    return this.todayStatus?.form.editableMetrics.indexOf(metric) !== -1
  }

  private formatTime(timestamp?: number | null): string {
    if (!timestamp) {
      return '暂无'
    }

    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  private formatWindow(): string {
    if (!this.todayStatus) {
      return '暂无'
    }

    return `${this.formatTime(this.todayStatus.window.opensAt)} - ${this.formatTime(this.todayStatus.window.closesAt)}`
  }

  private submitCheckIn(): void {
    if (this.isSubmitting) {
      return
    }
    if (this.todayStatus?.hasCheckedInToday) {
      promptAction.showToast({ message: '今日已完成打卡' })
      return
    }
    if (!this.todayStatus?.window.isWithinCheckInWindow) {
      promptAction.showToast({ message: this.todayStatus?.window.promptMessage ?? '当前不在打卡时间内' })
      return
    }

    const stateSnapshot: HomeCheckInState = this.getStateSnapshot()
    const payload: CheckInPayload | null = this.buildPayload(stateSnapshot)
    if (!payload) {
      return
    }

    this.isSubmitting = true
    this.submitMessage = '正在同步今日打卡，请稍候...'

    appRepository.submitCheckIn(payload).then((response) => {
      this.isSubmitting = false
      if (response.data) {
        this.lastRecordId = response.data.recordId
        this.submitMessage = `${response.message}，recordId：${response.data.recordId}`
      }
      promptAction.showToast({ message: response.message })
      this.loadData()
    }).catch((error: Error) => {
      this.isSubmitting = false
      this.submitMessage = '打卡失败，请检查网络或稍后重试。'
      promptAction.showToast({ message: '打卡失败，请稍后重试' })
      console.error('submitCheckIn failed', error)
    })
  }

  @Builder
  private buildInputCard(title: string, placeholder: string, value: string, type: InputType, onChange: (value: string) => void, note?: string) {
    Column({ space: 10 }) {
      Text(title)
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .fontColor('#1F2A44')
        .width('100%')

      TextInput({ placeholder: placeholder, text: value })
        .type(type)
        .height(58)
        .fontSize(22)
        .backgroundColor('#F4F6FA')
        .borderRadius(16)
        .onChange((text: string) => {
          onChange(text)
        })

      if (note) {
        Text(note)
          .fontSize(16)
          .lineHeight(24)
          .fontColor('#5B6477')
          .width('100%')
      }
    }
    .width('100%')
    .padding(18)
    .backgroundColor('#FFFFFF')
    .borderRadius(22)
  }

  build() {
    Scroll() {
      Column({ space: 16 }) {
        if (this.weatherEntries.length > 0) {
          Column({ space: 12 }) {
            Text('同一片天空')
              .fontSize(28)
              .fontWeight(FontWeight.Bold)
              .fontColor('#20315F')
              .width('100%')

            ForEach(this.weatherEntries, (entry: FamilyWeatherEntry) => {
              if (this.weatherDataMap.get(entry.userId)) {
                WeatherCard({
                  layout: 'horizontal',
                  title: entry.relationLabel,
                  subtitle: entry.name,
                  cityName: this.weatherDataMap.get(entry.userId)!.cityName ?? resolveCityLabel(undefined, entry.cityCode),
                  weatherType: this.weatherDataMap.get(entry.userId)!.weatherType,
                  temperature: this.weatherDataMap.get(entry.userId)!.temperature,
                  humidity: this.weatherDataMap.get(entry.userId)!.humidity
                })
              } else {
                SectionCard({
                  title: entry.relationLabel,
                  description: `${entry.name} 的天气暂不可用`,
                  accentColor: '#91B4FF'
                })
              }
            }, (entry: FamilyWeatherEntry) => entry.userId)
          }
          .width('100%')
        } else if (this.profile) {
          SectionCard({
            title: '天气信息',
            description: '天气暂不可用',
            accentColor: '#91B4FF'
          })
        }

        Text('每日打卡')
          .fontSize(30)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 20 })

        Text('以 miniapp 首页为母版，先迁移字段、状态和接口约束，再逐步补足视觉与多模态反馈。')
          .fontSize(18)
          .lineHeight(28)
          .fontColor('#5B6477')
          .width('100%')

        SectionCard({
          title: '首个迁移页定义',
          description: `母版：${HOME_CHECKIN_PAGE_DEFINITION.sourcePage}\n鸿蒙页：${HOME_CHECKIN_PAGE_DEFINITION.targetPage}\n实现入口：${HOME_CHECKIN_PAGE_DEFINITION.entryPoint}`,
          accentColor: '#91B4FF'
        })

        if (this.profile) {
          SectionCard({
            title: '当前资料概览',
            description: `称呼：${this.profile?.name ?? '未命名'}\n城市：${resolveCityLabel(this.profile?.city, this.profile?.cityCode) || '待完善'}\n家庭：${this.profile?.familyInfo?.familyName ?? '未连接家庭'}`,
            accentColor: '#7FD8C3'
          })
        }

        if (this.todayStatus) {
          SectionCard({
            title: '今日打卡状态',
            description: `日期：${this.todayStatus.businessDate}\n窗口：${this.formatWindow()}\n提示：${this.todayStatus.window.promptMessage}\n当前：${this.todayStatus.hasCheckedInToday ? '已完成' : '待打卡'}`,
            accentColor: '#F8B96A'
          })
        }

        Column({ space: 14 }) {
          Text('今天心情怎么样？')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .fontColor('#1F2A44')
            .width('100%')

          Row({ space: 12 }) {
            ForEach(MOOD_OPTIONS, (item: MoodOption) => {
              Button(item.label)
                .layoutWeight(1)
                .height(64)
                .fontSize(24)
                .fontWeight(FontWeight.Bold)
                .fontColor(this.selectedMood === item.value ? '#FFFFFF' : '#1F2A44')
                .backgroundColor(this.selectedMood === item.value ? item.accentColor : item.mutedColor)
                .border({ width: 2, color: item.accentColor })
                .borderRadius(18)
                .onClick(() => {
                  this.selectMood(item)
                })
            }, (item: MoodOption) => item.value)
          }
          .width('100%')
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#FFFFFF')
        .borderRadius(22)

        if (this.supportsMetric('steps')) {
          this.buildInputCard(
            '今日步数',
            '请输入步数',
            this.stepsInput,
            InputType.Number,
            (value: string) => {
              this.stepsInput = this.sanitizeNumericInput(value)
            },
            '提交前会映射为 request.steps:number。'
          )
        }

        if (this.supportsMetric('heartRate')) {
          this.buildInputCard(
            '心率（可选）',
            '如有设备数据可填写',
            this.heartRateInput,
            InputType.Number,
            (value: string) => {
              this.heartRateInput = this.sanitizeNumericInput(value)
            },
            '当前值会复用服务端 heartRate 字段。'
          )
        }

        if (this.supportsMetric('bloodPressure')) {
          this.buildInputCard(
            '血压',
            '例如 120/80',
            this.bloodPressureInput,
            InputType.Normal,
            (value: string) => {
              this.bloodPressureInput = value
            }
          )
        }

        if (this.supportsMetric('bloodSugar')) {
          this.buildInputCard(
            '血糖',
            '请输入血糖值',
            this.bloodSugarInput,
            InputType.Number,
            (value: string) => {
              this.bloodSugarInput = this.sanitizeNumericInput(value)
            }
          )
        }

        if (this.supportsMetric('sleep')) {
          this.buildInputCard(
            '睡眠',
            '例如 安稳、一般、易醒',
            this.sleepInput,
            InputType.Normal,
            (value: string) => {
              this.sleepInput = value
            }
          )
        }

        Button(this.isSubmitting ? '提交中...' : '提交打卡')
          .width('100%')
          .height(60)
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .backgroundColor('#2E7D32')
          .enabled(!this.isSubmitting && !this.todayStatus?.hasCheckedInToday)
          .onClick(() => {
            this.submitCheckIn()
          })

        Button('家庭语音接龙')
          .width('100%')
          .height(56)
          .fontSize(22)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')
          .backgroundColor('#6A1B9A')
          .onClick(() => {
            if (this.onNavigateToInteraction) {
              this.onNavigateToInteraction()
              return
            }
            promptAction.showToast({ message: '互动页入口暂未接通' })
          })

        SectionCard({
          title: '提交反馈',
          description: `${this.submitMessage}${this.lastRecordId ? `\n最近记录：${this.lastRecordId}` : ''}`,
          accentColor: '#7FD8C3'
        })

        if (this.todayStatus) {
          Column({ space: 10 }) {
            Text('已启用指标')
              .fontSize(22)
              .fontWeight(FontWeight.Bold)
              .fontColor('#1F2A44')
              .width('100%')

            Row({ space: 10 }) {
              ForEach(this.todayStatus.form.editableMetrics, (metric: TrackedMetric) => {
                Text(getTrackedMetricLabel(metric))
                  .fontSize(16)
                  .fontColor('#20315F')
                  .padding({ left: 12, right: 12, top: 8, bottom: 8 })
                  .backgroundColor('#EEF4FF')
                  .borderRadius(999)
              }, (metric: TrackedMetric) => metric)
            }
            .width('100%')
          }
          .width('100%')
          .padding(18)
          .backgroundColor('#FFFFFF')
          .borderRadius(22)
        }
      }
      .width('100%')
      .padding(20)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F7F8FC')
  }
}
