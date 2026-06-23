import promptAction from '@ohos.promptAction'
import { SectionCard } from '../../components/SectionCard'
import { appSession } from '../../common/AppSession'
import { FamilyProfileMember, TrackedMetric, UserProfileResponse, getTrackedMetricLabel, resolveCityLabel } from '../../common/ApiModels'
import { appRepository } from '../../services/AppRepository'

@Component
export struct ProfileTab {
  @State profile: UserProfileResponse | null = null

  aboutToAppear(): void {
    const userId = appSession.getUserId()
    if (!userId) {
      return
    }

    appRepository.getUserProfile(userId).then((response) => {
      this.profile = response.data
      appSession.setProfile(response.data)
    })
  }

  build() {
    Scroll() {
      Column({ space: 16 }) {
        Text('个人与家庭')
          .fontSize(28)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 20 })

        SectionCard({
          title: '当前账号',
          description: `称呼：${(this.profile?.name ?? appSession.getUserName()) || '未登录'}\n身份：${this.profile?.role === 'elder' ? '长辈' : '子女'}\n城市：${resolveCityLabel(this.profile?.city, this.profile?.cityCode) || '待完善'}`,
          accentColor: '#91B4FF'
        })

        SectionCard({
          title: 'Onboarding 配置',
          description: this.profile?.trackedMetrics?.length
            ? `已选择：${this.profile.trackedMetrics.map((metric: TrackedMetric) => getTrackedMetricLabel(metric)).join('、')}`
            : '尚未完成首次资料采集',
          accentColor: '#7FD8C3'
        })

        if (this.profile?.familyInfo) {
          SectionCard({
            title: '家庭基础信息',
            description: `家庭名称：${this.profile.familyInfo.familyName}\n牵挂码：${this.profile.familyInfo.inviteCode}\n成员数：${this.profile.familyInfo.members.length}`,
            accentColor: '#F8B96A'
          })

          Column({ space: 10 }) {
            ForEach(this.profile.familyInfo.members, (member: FamilyProfileMember) => {
              Row({ space: 12 }) {
                Column({ space: 4 }) {
                  Text(member.name)
                    .fontSize(20)
                    .fontWeight(FontWeight.Medium)
                    .width('100%')

                  Text(`${member.role === 'elder' ? '长辈' : '子女'} · ${resolveCityLabel(member.city, member.cityCode) || '待完善城市'}`)
                    .fontSize(16)
                    .fontColor('#5B6477')
                    .width('100%')
                }
                .layoutWeight(1)
                .alignItems(HorizontalAlign.Start)
              }
              .width('100%')
              .padding(16)
              .backgroundColor('#FFFFFF')
              .borderRadius(18)
            }, (member: FamilyProfileMember) => member.userId)
          }
          .width('100%')
        }

        Button('退出登录')
          .width('100%')
          .height(56)
          .fontSize(20)
          .fontColor('#FFFFFF')
          .backgroundColor('#E02020')
          .margin({ top: 20 })
          .onClick(() => {
            appSession.clear()
            promptAction.showToast({ message: '已退出登录' })
            this.getUIContext().getRouter().replaceUrl({ url: 'pages/Login' })
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
