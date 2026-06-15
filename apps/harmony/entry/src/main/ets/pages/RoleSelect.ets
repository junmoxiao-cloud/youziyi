@Entry
@Component
struct RoleSelect {
  build() {
    Column({ space: 18 }) {
      Text('请选择当前使用身份')
        .fontSize(30)
        .fontWeight(FontWeight.Bold)
        .fontColor('#20315F')
        .width('100%')
        .margin({ top: 30 })

      Text('沿用旧仓库的角色分流结构，但只保留前端路由与表单骨架。')
        .fontSize(18)
        .lineHeight(28)
        .fontColor('#5B6477')
        .width('100%')

      Column({ space: 14 }) {
        Text('我是长辈')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
        Text('先完成最少量的关怀信息，核心操作保持大字高对比。')
          .fontSize(18)
          .lineHeight(28)
          .fontColor('#5B6477')
      }
      .width('100%')
      .padding(22)
      .backgroundColor('#FFFFFF')
      .borderRadius(20)
      .border({ width: 1, color: '#91B4FF' })
      .onClick(() => {
        this.getUIContext().getRouter().pushUrl({ url: 'pages/CareProfile', params: { role: 'elder' } })
      })

      Column({ space: 14 }) {
        Text('我是家属')
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
        Text('后续可补充照护细节与提醒偏好，不把老人第一次使用变成复杂问卷。')
          .fontSize(18)
          .lineHeight(28)
          .fontColor('#5B6477')
      }
      .width('100%')
      .padding(22)
      .backgroundColor('#FFFFFF')
      .borderRadius(20)
      .border({ width: 1, color: '#7FD8C3' })
      .onClick(() => {
        this.getUIContext().getRouter().pushUrl({ url: 'pages/CareProfile', params: { role: 'youth' } })
      })
    }
    .width('100%')
    .height('100%')
    .padding(24)
    .backgroundColor('#F7F8FC')
  }
}
