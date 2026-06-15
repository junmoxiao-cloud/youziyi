@Component
export struct SectionCard {
  title: string = ''
  description: string = ''
  accentColor: string = '#3F7BFA'

  build() {
    Column({ space: 10 }) {
      Text(this.title)
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .fontColor('#1F2A44')
        .width('100%')

      Text(this.description)
        .fontSize(18)
        .lineHeight(28)
        .fontColor('#5B6477')
        .width('100%')
    }
    .width('100%')
    .padding(18)
    .backgroundColor('#FFFFFF')
    .borderRadius(20)
    .border({ width: 1, color: this.accentColor })
  }
}
