import { SectionCard } from '../../components/SectionCard';

@Component
export struct ProfileTab {
  build() {
    Scroll() {
      Column({ space: 16 }) {
        Text('个人中心骨架')
          .fontSize(28)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 20 })

        SectionCard({
          title: '关怀资料回看',
          description: '展示称呼、提醒偏好、紧急联系人与可选健康关注事项，支持后续由家属补充。',
          accentColor: '#91B4FF'
        })

        SectionCard({
          title: '环境切换入口',
          description: '预留 Mock / Remote 切换说明，确保开发万能验证码不会误进入正式环境。',
          accentColor: '#7FD8C3'
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
