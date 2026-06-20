import promptAction from '@ohos.promptAction'
import { appSession, resolveAuthenticatedRoute } from '../common/AppSession'
import { UserRole } from '../common/ApiModels'
import { appRepository } from '../services/AppRepository'

@Entry
@Component
struct Login {
  @State isRegisterMode: boolean = false
  @State name: string = ''
  @State password: string = ''
  @State selectedRole: UserRole = 'elder'
  @State isSubmitting: boolean = false
  @State message: string = '接入现有登录/注册接口后，首跳将按资料完整度依次进入 Onboarding、家庭连接或主页面。'

  private finishAuth(userId: string, name: string, role: UserRole): void {
    appSession.setAuth(userId, name, role)
    appRepository.getUserProfile(userId).then((response) => {
      appSession.setProfile(response.data)
      this.getUIContext().getRouter().replaceUrl({ url: resolveAuthenticatedRoute(response.data) })
    }).catch((error: Error) => {
      promptAction.showToast({ message: error.message })
    }).finally(() => {
      this.isSubmitting = false
    })
  }

  build() {
    Scroll() {
      Column({ space: 18 }) {
        Text('欢迎来到 YouZiYi / 游子衣')
          .fontSize(30)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 30 })

        Text(this.isRegisterMode ? '先建立身份与角色，再进入首次资料采集。' : '登录后会按资料完成度继续进入 Onboarding 或家庭连接。')
          .fontSize(18)
          .lineHeight(28)
          .fontColor('#5B6477')
          .width('100%')

        Column({ space: 12 }) {
          Text('您的称呼')
            .fontSize(20)
            .fontWeight(FontWeight.Medium)
            .width('100%')

          TextInput({ placeholder: '请输入您的称呼', text: this.name })
            .height(56)
            .fontSize(20)
            .backgroundColor('#FFFFFF')
            .onChange((value: string) => {
              this.name = value
            })
        }
        .width('100%')

        Column({ space: 12 }) {
          Text('通行密码')
            .fontSize(20)
            .fontWeight(FontWeight.Medium)
            .width('100%')

          TextInput({ placeholder: '请输入密码', text: this.password })
            .type(InputType.Password)
            .height(56)
            .fontSize(20)
            .backgroundColor('#FFFFFF')
            .onChange((value: string) => {
              this.password = value
            })
        }
        .width('100%')

        if (this.isRegisterMode) {
          Column({ space: 12 }) {
            Text('选择身份')
              .fontSize(20)
              .fontWeight(FontWeight.Medium)
              .width('100%')

            Row({ space: 12 }) {
              Button('我是长辈')
                .layoutWeight(1)
                .height(56)
                .fontSize(18)
                .fontColor(this.selectedRole === 'elder' ? '#FFFFFF' : '#20315F')
                .backgroundColor(this.selectedRole === 'elder' ? '#20315F' : '#FFFFFF')
                .border({ width: 1, color: '#C9D9FF' })
                .onClick(() => {
                  this.selectedRole = 'elder'
                })

              Button('我是子女')
                .layoutWeight(1)
                .height(56)
                .fontSize(18)
                .fontColor(this.selectedRole === 'child' ? '#FFFFFF' : '#20315F')
                .backgroundColor(this.selectedRole === 'child' ? '#20315F' : '#FFFFFF')
                .border({ width: 1, color: '#C9D9FF' })
                .onClick(() => {
                  this.selectedRole = 'child'
                })
            }
            .width('100%')
          }
          .width('100%')
        }

        Column({ space: 8 }) {
          Text(this.isRegisterMode ? '注册后下一步' : '登录后下一步')
            .fontSize(20)
            .fontWeight(FontWeight.Medium)
            .width('100%')

          Text(this.message)
            .fontSize(18)
            .lineHeight(28)
            .fontColor('#5B6477')
            .width('100%')
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#EEF4FF')
        .borderRadius(20)

        Button(this.isSubmitting ? '提交中...' : (this.isRegisterMode ? '注册并继续' : '登录并继续'))
          .width('100%')
          .height(56)
          .fontSize(20)
          .backgroundColor('#20315F')
          .enabled(!this.isSubmitting)
          .onClick(() => {
            const normalizedName = this.name.trim()
            const normalizedPassword = this.password.trim()
            if (!normalizedName || !normalizedPassword) {
              promptAction.showToast({ message: '请先填写完整信息' })
              return
            }

            this.isSubmitting = true
            if (this.isRegisterMode) {
              appRepository.register(normalizedName, normalizedPassword, this.selectedRole).then((response) => {
                promptAction.showToast({ message: response.message })
                this.finishAuth(response.data.userId, response.data.name, response.data.role)
              }).catch((error: Error) => {
                this.isSubmitting = false
                promptAction.showToast({ message: error.message })
              })
              return
            }

            appRepository.login(normalizedName, normalizedPassword).then((response) => {
              promptAction.showToast({ message: response.message })
              this.finishAuth(response.data.userId, response.data.name, response.data.role)
            }).catch((error: Error) => {
              this.isSubmitting = false
              promptAction.showToast({ message: error.message })
            })
          })

        Button(this.isRegisterMode ? '已有账号，去登录' : '初次使用，去注册')
          .width('100%')
          .height(52)
          .fontSize(18)
          .fontColor('#20315F')
          .backgroundColor('#FFFFFF')
          .border({ width: 1, color: '#C9D9FF' })
          .onClick(() => {
            this.isRegisterMode = !this.isRegisterMode
            this.message = this.isRegisterMode
              ? '注册成功后会先进入 Onboarding，完成城市和每日关注指标配置。'
              : '登录成功后会根据是否已完成 Onboarding 和家庭连接自动分流。'
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
