import promptAction from '@ohos.promptAction'
import {
  CITY_OPTIONS,
  DEFAULT_TRACKED_METRICS,
  METRIC_OPTIONS,
  MetricOption,
  TrackedMetric,
  getTrackedMetricLabel
} from '../common/ApiModels'
import { SharedCityOption } from '../common/synced/SharedCityCatalog'
import { appSession } from '../common/AppSession'
import { appRepository } from '../services/AppRepository'

@Entry
@Component
struct Onboarding {
  @State cityCode: string = ''
  @State customCity: string = ''
  @State trackedMetrics: TrackedMetric[] = DEFAULT_TRACKED_METRICS.concat()
  @State isSubmitting: boolean = false

  aboutToAppear(): void {
    const profile = appSession.getProfile()
    if (!profile) {
      return
    }

    this.cityCode = profile.cityCode ?? ''
    this.customCity = profile.city ?? ''
    this.trackedMetrics = profile.trackedMetrics?.length ? profile.trackedMetrics : DEFAULT_TRACKED_METRICS.concat()
  }

  private toggleMetric(metric: TrackedMetric): void {
    if (metric === 'mood') {
      return
    }

    if (this.trackedMetrics.indexOf(metric) >= 0) {
      this.trackedMetrics = this.trackedMetrics.filter((item) => item !== metric)
      return
    }

    this.trackedMetrics = this.trackedMetrics.concat(metric)
  }

  build() {
    Scroll() {
      Column({ space: 18 }) {
        Text('完善首次资料')
          .fontSize(30)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 24 })

        Text('先记录常住城市和每天要关注的指标，后续打卡页会按这份配置动态展示。')
          .fontSize(18)
          .lineHeight(28)
          .fontColor('#5B6477')
          .width('100%')

        Column({ space: 12 }) {
          Text('常住城市')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .width('100%')

          Row({ space: 12 }) {
            ForEach(CITY_OPTIONS, (item: SharedCityOption) => {
              Button(item.name)
                .layoutWeight(1)
                .height(52)
                .fontSize(18)
                .fontColor(this.cityCode === item.code && !this.customCity ? '#FFFFFF' : '#20315F')
                .backgroundColor(this.cityCode === item.code && !this.customCity ? '#20315F' : '#FFFFFF')
                .border({ width: 1, color: '#C9D9FF' })
                .onClick(() => {
                  this.cityCode = item.code
                  this.customCity = ''
                })
            }, (item: SharedCityOption): string => item.code)
          }
          .width('100%')

          TextInput({ placeholder: '或填写其他城市，例如：苏州', text: this.customCity })
            .height(56)
            .fontSize(20)
            .backgroundColor('#FFFFFF')
            .onChange((value: string) => {
              this.customCity = value
              if (value.trim().length > 0) {
                this.cityCode = ''
              }
            })
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#FFFFFF')
        .borderRadius(20)

        Column({ space: 12 }) {
          Text('每日关注指标')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .width('100%')

          Text('默认保留心情和步数，其余按需开启。')
            .fontSize(16)
            .fontColor('#5B6477')
            .width('100%')

          ForEach(METRIC_OPTIONS, (item: MetricOption) => {
            Row({ space: 12 }) {
              Column({ space: 4 }) {
                Text(getTrackedMetricLabel(item.id))
                  .fontSize(20)
                  .fontWeight(FontWeight.Medium)
                  .width('100%')

                Text(item.id === 'mood' ? '心情为必选项，用于家庭每日关怀。' : '开启后会出现在每日打卡页。')
                  .fontSize(16)
                  .fontColor('#5B6477')
                  .width('100%')
              }
              .layoutWeight(1)
              .alignItems(HorizontalAlign.Start)

              Toggle({ type: ToggleType.Switch, isOn: this.trackedMetrics.indexOf(item.id) >= 0 })
                .enabled(item.id !== 'mood')
                .onChange(() => {
                  this.toggleMetric(item.id)
                })
            }
            .width('100%')
            .padding(16)
            .backgroundColor('#F7F8FC')
            .borderRadius(18)
          }, (item: MetricOption): string => item.id)
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#FFFFFF')
        .borderRadius(20)

        Button(this.isSubmitting ? '保存中...' : '保存并继续')
          .width('100%')
          .height(56)
          .fontSize(20)
          .backgroundColor('#20315F')
          .enabled(!this.isSubmitting)
          .onClick(() => {
            const userId = appSession.getUserId()
            const finalCustomCity = this.customCity.trim()
            const finalCityCode = finalCustomCity.length > 0 ? finalCustomCity : this.cityCode.trim()
            if (!userId) {
              promptAction.showToast({ message: '登录状态已失效，请重新登录' })
              return
            }
            if (!finalCityCode) {
              promptAction.showToast({ message: '请先选择或填写常住城市' })
              return
            }

            this.isSubmitting = true
            appRepository.updateUserProfile({
              userId,
              cityCode: finalCityCode,
              city: finalCustomCity.length > 0 ? finalCustomCity : undefined,
              trackedMetrics: this.trackedMetrics
            }).then((response) => {
              appSession.setProfile(response.data)
              promptAction.showToast({ message: response.message })
              this.getUIContext().getRouter().replaceUrl({ url: 'pages/FamilyJoin' })
            }).catch((error: Error) => {
              promptAction.showToast({ message: error.message })
            }).finally(() => {
              this.isSubmitting = false
            })
          })
      }
      .width('100%')
      .padding(24)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F7F8FC')
  }
}
