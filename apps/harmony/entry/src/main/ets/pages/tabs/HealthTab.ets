import { SectionCard } from '../../components/SectionCard';

@Component
export struct HealthTab {
  build() {
    Scroll() {
      Column({ space: 16 }) {
        Text('预警骨架')
          .fontSize(28)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 20 })

        SectionCard({
          title: '互动超时预警',
          description: '预留 24/36/48 小时分级状态展示，后续直接消费 /api/warning/status/:userId。',
          accentColor: '#F28A8A'
        })

        SectionCard({
          title: '提醒偏好承接',
          description: '资料页仅采集提醒偏好与关怀事项，不把疾病名称作为首次必填项。',
          accentColor: '#F8B96A'
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
