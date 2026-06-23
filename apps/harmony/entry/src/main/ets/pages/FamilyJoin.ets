import promptAction from '@ohos.promptAction'
import { appSession } from '../common/AppSession'
import { FamilyProfileMember, resolveCityLabel } from '../common/ApiModels'
import { appRepository } from '../services/AppRepository'

@Entry
@Component
struct FamilyJoin {
  @State mode: string = 'create'
  @State familyName: string = ''
  @State inviteCode: string = ''
  @State isSubmitting: boolean = false
  @State familySummary: string = '创建家庭或输入牵挂码后，将显示家庭名称、邀请码和成员信息。'

  aboutToAppear(): void {
    const userId = appSession.getUserId()
    if (!userId) {
      return
    }

    appRepository.getUserProfile(userId).then((response) => {
      if (response.data) {
        appSession.setProfile(response.data)
        if (response.data.familyInfo) {
          this.familySummary = `已连接 ${response.data.familyInfo.familyName}`
        }
      }
    })
  }

  private getConnectedFamily() {
    return appSession.getProfile()?.familyInfo ?? null
  }

  @Builder
  private buildMemberItem(member: FamilyProfileMember) {
    Row({ space: 12 }) {
      Column({ space: 4 }) {
        Text(member.name)
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
          .width('100%')

        Text(resolveCityLabel(member.city, member.cityCode) || '待完善城市')
          .fontSize(16)
          .fontColor('#5B6477')
          .width('100%')
      }
      .layoutWeight(1)
      .alignItems(HorizontalAlign.Start)

      Text(member.role === 'elder' ? '长辈' : '子女')
        .fontSize(16)
        .fontColor('#20315F')
        .padding({ left: 12, right: 12, top: 6, bottom: 6 })
        .backgroundColor('#EEF4FF')
        .borderRadius(999)
    }
    .width('100%')
    .padding(14)
    .backgroundColor('#FFFFFF')
    .borderRadius(16)
  }

  build() {
    Scroll() {
      Column({ space: 18 }) {
        Text('连接家庭')
          .fontSize(30)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 24 })

        Text('家庭连接完成后，主页面会同步展示基础家庭信息和今日关怀状态。')
          .fontSize(18)
          .lineHeight(28)
          .fontColor('#5B6477')
          .width('100%')

        if (this.getConnectedFamily()) {
          Column({ space: 12 }) {
            Text(this.getConnectedFamily()!.familyName)
              .fontSize(24)
              .fontWeight(FontWeight.Bold)
              .width('100%')

            Text(`牵挂码：${this.getConnectedFamily()!.inviteCode}`)
              .fontSize(18)
              .fontColor('#20315F')
              .width('100%')

            ForEach(this.getConnectedFamily()!.members, (member: FamilyProfileMember) => {
              this.buildMemberItem(member)
            }, (member: FamilyProfileMember): string => member.userId)

            Button('进入主页')
              .width('100%')
              .height(56)
              .fontSize(20)
              .backgroundColor('#20315F')
              .onClick(() => {
                this.getUIContext().getRouter().replaceUrl({ url: 'pages/Main' })
              })
          }
          .width('100%')
          .padding(18)
          .backgroundColor('#FFFFFF')
          .borderRadius(20)
        } else {
          Column({ space: 12 }) {
            Row({ space: 12 }) {
              Button('我来创建')
                .layoutWeight(1)
                .height(50)
                .fontSize(18)
                .fontColor(this.mode === 'create' ? '#FFFFFF' : '#20315F')
                .backgroundColor(this.mode === 'create' ? '#20315F' : '#FFFFFF')
                .border({ width: 1, color: '#C9D9FF' })
                .onClick(() => {
                  this.mode = 'create'
                })

              Button('我有牵挂码')
                .layoutWeight(1)
                .height(50)
                .fontSize(18)
                .fontColor(this.mode === 'join' ? '#FFFFFF' : '#20315F')
                .backgroundColor(this.mode === 'join' ? '#20315F' : '#FFFFFF')
                .border({ width: 1, color: '#C9D9FF' })
                .onClick(() => {
                  this.mode = 'join'
                })
            }
            .width('100%')

            if (this.mode === 'create') {
              Column({ space: 12 }) {
                Text('家庭名称（可选）')
                  .fontSize(20)
                  .fontWeight(FontWeight.Medium)
                  .width('100%')

                TextInput({ placeholder: '例如：李阿姨的家庭', text: this.familyName })
                  .height(56)
                  .fontSize(20)
                  .backgroundColor('#FFFFFF')
                  .onChange((value: string) => {
                    this.familyName = value
                  })

                Button(this.isSubmitting ? '生成中...' : '生成牵挂码')
                  .width('100%')
                  .height(56)
                  .fontSize(20)
                  .backgroundColor('#20315F')
                  .enabled(!this.isSubmitting)
                  .onClick(() => {
                    const userId = appSession.getUserId()
                    if (!userId) {
                      promptAction.showToast({ message: '登录状态已失效，请重新登录' })
                      return
                    }

                    this.isSubmitting = true
                    appRepository.createFamily(userId, this.familyName.trim()).then((response) => {
                      if (response.data) {
                        this.familySummary = `${response.message}，牵挂码 ${response.data.inviteCode}`
                      }
                      return appRepository.getUserProfile(userId)
                    }).then((profileResponse) => {
                      if (profileResponse.data) {
                        appSession.setProfile(profileResponse.data)
                      }
                      promptAction.showToast({ message: '家庭信息已刷新' })
                    }).catch((error: Error) => {
                      promptAction.showToast({ message: error.message })
                    }).finally(() => {
                      this.isSubmitting = false
                    })
                  })
              }
              .width('100%')
            } else {
              Column({ space: 12 }) {
                Text('输入牵挂码')
                  .fontSize(20)
                  .fontWeight(FontWeight.Medium)
                  .width('100%')

                TextInput({ placeholder: '请输入牵挂码', text: this.inviteCode })
                  .height(56)
                  .fontSize(20)
                  .backgroundColor('#FFFFFF')
                  .onChange((value: string) => {
                    this.inviteCode = value.toUpperCase()
                  })

                Button(this.isSubmitting ? '连接中...' : '确认加入')
                  .width('100%')
                  .height(56)
                  .fontSize(20)
                  .backgroundColor('#20315F')
                  .enabled(!this.isSubmitting)
                  .onClick(() => {
                    const userId = appSession.getUserId()
                    if (!userId) {
                      promptAction.showToast({ message: '登录状态已失效，请重新登录' })
                      return
                    }
                    if (!this.inviteCode.trim()) {
                      promptAction.showToast({ message: '请先输入牵挂码' })
                      return
                    }

                    this.isSubmitting = true
                    appRepository.joinFamily(userId, this.inviteCode.trim()).then((response) => {
                      this.familySummary = response.message
                      return appRepository.getUserProfile(userId)
                    }).then((profileResponse) => {
                      appSession.setProfile(profileResponse.data)
                      promptAction.showToast({ message: '已成功加入家庭' })
                    }).catch((error: Error) => {
                      promptAction.showToast({ message: error.message })
                    }).finally(() => {
                      this.isSubmitting = false
                    })
                  })
              }
              .width('100%')
            }
          }
          .width('100%')
          .padding(18)
          .backgroundColor('#FFFFFF')
          .borderRadius(20)
        }

        Text(this.familySummary)
          .fontSize(16)
          .lineHeight(24)
          .fontColor('#5B6477')
          .width('100%')
      }
      .width('100%')
      .padding(24)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F7F8FC')
  }
}
