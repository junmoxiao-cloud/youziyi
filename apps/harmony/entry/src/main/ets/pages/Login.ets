import promptAction from '@ohos.promptAction';
import {
  APP_CONFIG,
  getVerificationRequestMode,
  isDevelopmentEnvironment,
  isUniversalCodeEnabled
} from '../common/AppConfig';
import { appRepository } from '../services/AppRepository';

@Entry
@Component
struct Login {
  private readonly universalCode: string = APP_CONFIG.verification.universalCode
  @State phone: string = ''
  @State code: string = ''
  @State countdown: number = 0
  @State helpText: string = '默认绑定正式后端 https://api.youziyi.com；仅开发态切回 localhost，并按配置开放演示兜底。'

  private startCountdown(): void {
    if (this.countdown > 0) {
      return
    }

    this.countdown = 60
    const timerId = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown -= 1
        return
      }
      clearInterval(timerId)
    }, 1000)
  }

  private isUniversalCodeEnabled(): boolean {
    return isUniversalCodeEnabled()
  }

  private getVerificationModeLabel(): string {
    return getVerificationRequestMode() === 'remote' ? '远程优先' : 'Mock'
  }

  private getEnvironmentLabel(): string {
    return isDevelopmentEnvironment() ? '开发态' : '正式环境'
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

        Text('保留登录壳与验证码边界，不在鸿蒙端内落正式鉴权逻辑。')
          .fontSize(18)
          .lineHeight(28)
          .fontColor('#5B6477')
          .width('100%')

        Column({ space: 12 }) {
          Text('手机号')
            .fontSize(20)
            .fontWeight(FontWeight.Medium)
            .width('100%')

          TextInput({ placeholder: '请输入手机号', text: this.phone })
            .type(InputType.PhoneNumber)
            .maxLength(11)
            .height(56)
            .fontSize(20)
            .backgroundColor('#FFFFFF')
            .onChange((value: string) => {
              this.phone = value
            })
        }
        .width('100%')

        Column({ space: 12 }) {
          Text('验证码')
            .fontSize(20)
            .fontWeight(FontWeight.Medium)
            .width('100%')

          Row({ space: 12 }) {
            TextInput({ placeholder: '请输入验证码', text: this.code })
              .type(InputType.Number)
              .maxLength(6)
              .layoutWeight(1)
              .height(56)
              .fontSize(20)
              .backgroundColor('#FFFFFF')
              .onChange((value: string) => {
                this.code = value
              })

            Button(this.countdown > 0 ? `${this.countdown}s` : '获取验证码')
              .width(132)
              .height(56)
              .fontSize(18)
              .backgroundColor('#3F7BFA')
              .enabled(this.countdown === 0)
              .onClick(() => {
                this.startCountdown()
                appRepository.requestVerificationCode(this.phone).then((response) => {
                  this.helpText = response.data.codeHint
                  promptAction.showToast({ message: response.message })
                }).catch((error: Error) => {
                  this.helpText = `验证码请求失败，请检查 ${APP_CONFIG.apiBaseUrl} 是否可访问。`
                  promptAction.showToast({ message: error.message })
                })
              })
          }
          .width('100%')
        }
        .width('100%')

        Column({ space: 8 }) {
          Text('登录策略')
            .fontSize(20)
            .fontWeight(FontWeight.Medium)
            .width('100%')

          Text(`业务接口模式：${APP_CONFIG.apiMode === 'remote' ? '远程服务端' : 'Mock'}`)
            .fontSize(18)
            .fontColor('#20315F')
            .width('100%')

          Text(`运行环境：${this.getEnvironmentLabel()}，当前绑定 ${APP_CONFIG.apiBaseUrl}`)
            .fontSize(18)
            .fontColor('#20315F')
            .width('100%')

          Text(`验证码模式：${this.getVerificationModeLabel()}`)
            .fontSize(18)
            .fontColor('#20315F')
            .width('100%')

          Text(this.helpText)
            .fontSize(18)
            .lineHeight(28)
            .fontColor('#5B6477')
            .width('100%')

          Text(this.isUniversalCodeEnabled()
            ? `当前万能验证码：${this.universalCode}`
            : '当前环境已禁用万能验证码')
            .fontSize(18)
            .fontColor('#3F7BFA')
            .width('100%')
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#EEF4FF')
        .borderRadius(20)

        Button('进入角色选择')
          .width('100%')
          .height(56)
          .fontSize(20)
          .backgroundColor('#20315F')
          .onClick(() => {
            if (!this.phone) {
              promptAction.showToast({ message: '请先填写手机号' })
              return
            }

            if (this.isUniversalCodeEnabled() && this.code === this.universalCode) {
              this.getUIContext().getRouter().pushUrl({ url: 'pages/RoleSelect' })
              return
            }

            if (this.code.length < 4) {
              promptAction.showToast({ message: this.isUniversalCodeEnabled() ? '请填写万能验证码或不少于 4 位的演示验证码' : '请填写不少于 4 位的演示验证码' })
              return
            }

            this.getUIContext().getRouter().pushUrl({ url: 'pages/RoleSelect' })
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
