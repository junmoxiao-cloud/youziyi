import { SectionCard } from '../../components/SectionCard';

@Component
export struct InteractionTab {
  build() {
    Scroll() {
      Column({ space: 16 }) {
        Text('互动骨架')
          .fontSize(28)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 20 })

        SectionCard({
          title: '家庭故事语音接龙',
          description: '保留上传与播放入口的前端骨架，正式音频上传、存储和鉴权仍由服务端处理。',
          accentColor: '#7FD8C3'
        })

        SectionCard({
          title: '消息回响区',
          description: '后续承接子女留言、长辈回应、最近互动时间线，不在客户端内重复实现业务编排。',
          accentColor: '#91B4FF'
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
