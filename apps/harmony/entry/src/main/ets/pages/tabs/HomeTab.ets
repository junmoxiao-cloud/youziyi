import promptAction from '@ohos.promptAction';
import { SectionCard } from '../../components/SectionCard';
import {
  CheckInMood,
  CheckInPayload,
  FieldBoundary,
  HOME_CHECKIN_PAGE_DEFINITION,
  HomeCheckInState
} from '../../common/ApiModels';
import { appRepository } from '../../services/AppRepository';

interface MoodOption {
  value: CheckInMood
  label: string
  accentColor: string
  mutedColor: string
}

const MOOD_OPTIONS: MoodOption[] = [
  { value: CheckInMood.HAPPY, label: '开心', accentColor: '#E66A3D', mutedColor: '#FFF0EA' },
  { value: CheckInMood.CALM, label: '平静', accentColor: '#2F6BFF', mutedColor: '#EAF0FF' },
  { value: CheckInMood.SAD, label: '低落', accentColor: '#5B6477', mutedColor: '#EEF1F5' }
];

@Component
export struct HomeTab {
  onNavigateToInteraction?: () => void

  @State selectedMood: string = ''
  @State stepsInput: string = ''
  @State heartRateInput: string = ''
  @State isSubmitting: boolean = false
  @State submitMessage: string = '首个迁移页已对齐 miniapp 首页逻辑，先完成心情与步数打卡。'
  @State lastRecordId: string = ''

  private readonly userId: string = 'mock-user-123'

  private getStateSnapshot(): HomeCheckInState {
    return {
      selectedMood: this.selectedMood,
      stepsInput: this.stepsInput,
      heartRateInput: this.heartRateInput,
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
    if (!state.selectedMood) {
      promptAction.showToast({ message: '请选择心情' })
      this.submitMessage = '缺少必填状态：selectedMood。'
      return null
    }

    if (!state.stepsInput) {
      promptAction.showToast({ message: '请输入步数' })
      this.submitMessage = '缺少必填状态：stepsInput。'
      return null
    }

    const payload: CheckInPayload = {
      userId: this.userId,
      mood: state.selectedMood,
      steps: Number(state.stepsInput),
      timestamp: Date.now()
    }

    if (state.heartRateInput) {
      payload.heartRate = Number(state.heartRateInput)
    }

    return payload
  }

  private submitCheckIn(): void {
    if (this.isSubmitting) {
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
      this.selectedMood = ''
      this.stepsInput = ''
      this.heartRateInput = ''
      this.lastRecordId = response.data.recordId
      this.submitMessage = `${response.message}，recordId：${response.data.recordId}`
      promptAction.showToast({ message: response.message })
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

  @Builder
  private buildBoundarySection(title: string, fields: FieldBoundary[], accentColor: string) {
    Column({ space: 12 }) {
      Text(title)
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .fontColor('#1F2A44')
        .width('100%')

      ForEach(fields, (item: FieldBoundary) => {
        Column({ space: 6 }) {
          Text(`${item.field} · ${item.type} · ${item.required ? '必填' : '可选'}`)
            .fontSize(18)
            .fontWeight(FontWeight.Medium)
            .fontColor('#20315F')
            .width('100%')

          Text(item.description)
            .fontSize(16)
            .lineHeight(24)
            .fontColor('#5B6477')
            .width('100%')
        }
        .width('100%')
        .padding(14)
        .backgroundColor('#FFFFFF')
        .borderRadius(18)
      }, (item: FieldBoundary) => item.field)
    }
    .width('100%')
    .padding(18)
    .backgroundColor('#F8FAFF')
    .borderRadius(22)
    .border({ width: 1, color: accentColor })
  }

  build() {
    Scroll() {
      Column({ space: 16 }) {
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

        this.buildInputCard(
          '心率（可选）',
          '如有设备数据可填写',
          this.heartRateInput,
          InputType.Number,
          (value: string) => {
            this.heartRateInput = this.sanitizeNumericInput(value)
          },
          '当前 miniapp 母版未开放该输入，鸿蒙端先作为接口预留字段。'
        )

        Button(this.isSubmitting ? '提交中...' : '提交打卡')
          .width('100%')
          .height(60)
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .backgroundColor('#2E7D32')
          .enabled(!this.isSubmitting)
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

        this.buildBoundarySection('UI 状态边界', HOME_CHECKIN_PAGE_DEFINITION.uiStateFields, '#91B4FF')
        this.buildBoundarySection('请求字段边界', HOME_CHECKIN_PAGE_DEFINITION.requestFields, '#7FD8C3')
        this.buildBoundarySection('响应字段边界', HOME_CHECKIN_PAGE_DEFINITION.responseFields, '#F8B96A')
      }
      .width('100%')
      .padding(20)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F7F8FC')
  }
}
