import promptAction from '@ohos.promptAction'
import { SectionCard } from '../../components/SectionCard'
import { WarningStatusData, TodayCheckInStatusResponse, ApiResponse } from '../../common/ApiModels'
import { appSession } from '../../common/AppSession'
import { appRepository } from '../../services/AppRepository'

interface ThermometerStyle {
  bgColor: string
  text: string
}

@Component
export struct HealthTab {
  @State warningStatus: WarningStatusData | null = null
  @State todayStatus: TodayCheckInStatusResponse | null = null

  aboutToAppear(): void {
    const userId = appSession.getUserId()
    if (!userId) {
      return
    }
    Promise.all([
      appRepository.getWarningStatus(userId),
      appRepository.getTodayCheckInStatus(userId)
    ]).then((results: ApiResponse<WarningStatusData | TodayCheckInStatusResponse>[]) => {
      const warningRes = results[0] as ApiResponse<WarningStatusData>
      const todayRes = results[1] as ApiResponse<TodayCheckInStatusResponse>
      this.warningStatus = warningRes.data
      this.todayStatus = todayRes.data
    }).catch((err: Error) => {
      console.error('HealthTab load data error:', err.message)
    })
  }

  private getThermometerStyle(): ThermometerStyle {
    if (!this.warningStatus) {
      const style: ThermometerStyle = { bgColor: '#E7F5EC', text: '加载中...' }
      return style
    }
    const level = this.warningStatus.warningLevel
    if (level === 0) {
      const style: ThermometerStyle = { bgColor: '#E7F5EC', text: '温度正好' }
      return style
    } else if (level === 1) {
      const style: ThermometerStyle = { bgColor: '#FFF8E1', text: '需要添柴' }
      return style
    } else {
      const style: ThermometerStyle = { bgColor: '#FFEBEE', text: '快去暖暖场' }
      return style
    }
  }

  private formatTimeDiff(lastInteractionTime: number): string {
    const diffMs = Date.now() - lastInteractionTime
    if (diffMs < 0) {
      return '刚刚'
    }
    const totalMinutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    if (hours > 0) {
      return `距离上次互动：${hours}小时${minutes}分钟`
    }
    return `距离上次互动：${minutes}分钟`
  }

  private showCheckInToast() {
    promptAction.showToast({ message: '请切换到首页进行打卡', duration: 2000 })
  }

  build() {
    Scroll() {
      Column({ space: 20 }) {
        // 标题
        Text('健康守护')
          .fontSize(28)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 12 })

        // 亲情温度计
        Column({ space: 8 }) {
          if (!this.warningStatus) {
            Text('加载中...')
              .fontSize(18)
              .fontColor('#8F9BB3')
          } else {
            Text(this.getThermometerStyle().text)
              .fontSize(24)
              .fontWeight(FontWeight.Bold)
              .fontColor(this.warningStatus.warningLevel === 0 ? '#27AE60' : (this.warningStatus.warningLevel === 1 ? '#F5A623' : '#E74C3C'))

            Text(this.formatTimeDiff(this.warningStatus.lastInteractionTime))
              .fontSize(14)
              .fontColor('#8F9BB3')
          }
        }
        .width(160)
        .height(160)
        .borderRadius(999)
        .backgroundColor(this.getThermometerStyle().bgColor)
        .justifyContent(FlexAlign.Center)
        .shadow({ radius: 16, color: 'rgba(0,0,0,0.06)', offsetX: 0, offsetY: 4 })
        .margin({ top: 8, bottom: 8 })

        // 今日健康摘要
        Column({ space: 12 }) {
          Text('今日健康摘要')
            .fontSize(18)
            .fontWeight(FontWeight.Bold)
            .fontColor('#20315F')
            .width('100%')

          if (!this.todayStatus) {
            Text('加载中...')
              .fontSize(16)
              .fontColor('#8F9BB3')
              .width('100%')
              .textAlign(TextAlign.Center)
              .padding(20)
          } else if (!this.todayStatus.hasCheckedInToday) {
            Column({ space: 12 }) {
              Text('今日待打卡')
                .fontSize(16)
                .fontColor('#8F9BB3')
                .width('100%')
                .textAlign(TextAlign.Center)

              Button('去首页打卡')
                .fontSize(16)
                .fontColor('#FFFFFF')
                .backgroundColor('#4A90E2')
                .width(160)
                .height(44)
                .borderRadius(22)
                .onClick(() => {
                  this.showCheckInToast()
                })
            }
            .width('100%')
            .padding(20)
            .backgroundColor('#FFFFFF')
            .borderRadius(16)
          } else {
            Row({ space: 12 }) {
              // 心情卡片
              Column({ space: 4 }) {
                Text('心情')
                  .fontSize(14)
                  .fontColor('#8F9BB3')
                Text(this.todayStatus.summary?.mood ?? '--')
                  .fontSize(20)
                  .fontWeight(FontWeight.Bold)
                  .fontColor('#20315F')
              }
              .layoutWeight(1)
              .padding(16)
              .backgroundColor('#FFFFFF')
              .borderRadius(16)
              .alignItems(HorizontalAlign.Center)

              // 步数卡片
              Column({ space: 4 }) {
                Text('步数')
                  .fontSize(14)
                  .fontColor('#8F9BB3')
                Text(this.todayStatus.summary?.steps?.toString() ?? '--')
                  .fontSize(20)
                  .fontWeight(FontWeight.Bold)
                  .fontColor('#20315F')
              }
              .layoutWeight(1)
              .padding(16)
              .backgroundColor('#FFFFFF')
              .borderRadius(16)
              .alignItems(HorizontalAlign.Center)

              // 心率卡片
              Column({ space: 4 }) {
                Text('心率')
                  .fontSize(14)
                  .fontColor('#8F9BB3')
                Text(this.todayStatus.summary?.heartRate?.toString() ?? '--')
                  .fontSize(20)
                  .fontWeight(FontWeight.Bold)
                  .fontColor('#20315F')
              }
              .layoutWeight(1)
              .padding(16)
              .backgroundColor('#FFFFFF')
              .borderRadius(16)
              .alignItems(HorizontalAlign.Center)
            }
            .width('100%')
          }
        }
        .width('100%')

        // 预留预警说明卡片
        SectionCard({
          title: '互动超时预警',
          description: '根据 24/36/48 小时阈值进行分级告警，请及时关注家人互动状态。',
          accentColor: '#F28A8A'
        })
      }
      .width('100%')
      .padding(20)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F7F8FC')
  }
}
