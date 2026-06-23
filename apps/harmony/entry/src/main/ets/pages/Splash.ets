import { appSession, resolveAuthenticatedRoute } from '../common/AppSession'

@Entry
@Component
struct Splash {
  aboutToAppear(): void {
    setTimeout(() => {
      const userId = appSession.getUserId()
      if (userId) {
        const profile = appSession.getProfile()
        const target = resolveAuthenticatedRoute(profile)
        this.getUIContext().getRouter().replaceUrl({ url: target })
      } else {
        this.getUIContext().getRouter().replaceUrl({ url: 'pages/Login' })
      }
    }, 1200)
  }

  build() {
    Column({ space: 18 }) {
      Text('游子衣')
        .fontSize(40)
        .fontWeight(FontWeight.Bold)
        .fontColor('#20315F')

      Text('把牵挂做成看得见的日常')
        .fontSize(22)
        .fontColor('#5B6477')

      Text('Harmony ArkTS 前端骨架')
        .fontSize(18)
        .fontColor('#7A8699')
        .margin({ top: 8 })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor('#F7F8FC')
    .padding(24)
  }
}
