@Component
export struct WeatherCard {
  cityName: string = ''
  weatherType: string = 'sunny'
  temperature: number = 20
  humidity: number = 50
  title: string = ''
  subtitle: string = ''
  layout: string = 'vertical'

  private getWeatherIcon(type: string): string {
    switch (type) {
      case 'sunny':
        return '☀️'
      case 'cloudy':
        return '⛅'
      case 'rainy':
        return '🌧️'
      case 'snowy':
        return '❄️'
      default:
        return '🌤️'
    }
  }

  private getWeatherLabel(type: string): string {
    switch (type) {
      case 'sunny':
        return '晴'
      case 'cloudy':
        return '多云'
      case 'rainy':
        return '雨'
      case 'snowy':
        return '雪'
      default:
        return '未知'
    }
  }

  private getWeatherDesc(type: string): string {
    switch (type) {
      case 'sunny':
        return '阳光正好，适合出门走走'
      case 'cloudy':
        return '云层轻覆，体感舒适'
      case 'rainy':
        return '雨声入梦，记得带伞'
      case 'snowy':
        return '雪意温柔，注意保暖'
      default:
        return '云光交织，岁月静好'
    }
  }

  private getCardGradient(type: string): string {
    switch (type) {
      case 'sunny':
        return 'linear-gradient(180deg, #FFF5E6 0%, #FFE4C4 100%)'
      case 'cloudy':
        return 'linear-gradient(180deg, #F0F4F8 0%, #D9E2EC 100%)'
      case 'rainy':
        return 'linear-gradient(180deg, #E6F0FF 0%, #B8D4FF 100%)'
      case 'snowy':
        return 'linear-gradient(180deg, #F0F8FF 0%, #E0F0FF 100%)'
      default:
        return 'linear-gradient(180deg, #F5F0FF 0%, #E8E0F0 100%)'
    }
  }

  private getAccentColor(type: string): string {
    switch (type) {
      case 'sunny':
        return '#F59E0B'
      case 'cloudy':
        return '#64748B'
      case 'rainy':
        return '#3B82F6'
      case 'snowy':
        return '#60A5FA'
      default:
        return '#8B5CF6'
    }
  }

  build() {
    if (this.layout === 'horizontal') {
      Column({ space: 6 }) {
        if (this.title !== '') {
          Text(this.title)
            .fontSize(16)
            .fontColor('#8F9BB3')
        }

        Row({ space: 14 }) {
          Text(this.getWeatherIcon(this.weatherType))
            .fontSize(40)
            .lineHeight(48)

          Column({ space: 2 }) {
            Text(`${this.cityName || '当前城市'} · ${this.temperature}°C · ${this.humidity}%`)
              .fontSize(22)
              .fontWeight(FontWeight.Bold)
              .fontColor('#1F2A44')

            Text(`${this.getWeatherLabel(this.weatherType)} · ${this.getWeatherDesc(this.weatherType)}`)
              .fontSize(18)
              .fontColor('#5B6477')

            if (this.subtitle !== '') {
              Text(this.subtitle)
                .fontSize(14)
                .fontColor('#8F9BB3')
            }
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)
        }
        .width('100%')
        .alignItems(VerticalAlign.Center)
      }
      .width('100%')
      .padding({ left: 16, right: 16, top: 14, bottom: 14 })
      .borderRadius(22)
      .linearGradient({
        direction: GradientDirection.Bottom,
        colors: [[this.getWeatherTypeGradientStart(this.weatherType), 0.0], [this.getWeatherTypeGradientEnd(this.weatherType), 1.0]]
      })
    } else {
      Column({ space: 8 }) {
        if (this.title !== '') {
          Text(this.title)
            .fontSize(18)
            .fontColor('#8F9BB3')
            .fontWeight(FontWeight.Regular)
        }

        Row({ space: 12 }) {
          Text(this.getWeatherIcon(this.weatherType))
            .fontSize(48)
            .lineHeight(56)

          Column({ space: 4 }) {
            Text(`${this.cityName || '当前城市'} · ${this.temperature}°C · ${this.humidity}%`)
              .fontSize(24)
              .fontWeight(FontWeight.Bold)
              .fontColor('#1F2A44')
              .lineHeight(32)

            Text(`${this.getWeatherLabel(this.weatherType)} · ${this.getWeatherDesc(this.weatherType)}`)
              .fontSize(20)
              .fontColor('#5B6477')
              .lineHeight(28)

            if (this.subtitle !== '') {
              Text(this.subtitle)
                .fontSize(16)
                .fontColor('#8F9BB3')
            }
          }
          .alignItems(HorizontalAlign.Start)
          .layoutWeight(1)
        }
        .width('100%')
        .alignItems(VerticalAlign.Center)
      }
      .width('100%')
      .padding({ left: 20, right: 20, top: 18, bottom: 18 })
      .backgroundColor('#FFFFFF')
      .borderRadius(22)
      .linearGradient({
        direction: GradientDirection.Bottom,
        colors: [[this.getWeatherTypeGradientStart(this.weatherType), 0.0], [this.getWeatherTypeGradientEnd(this.weatherType), 1.0]]
      })
    }
  }

  private getWeatherTypeGradientStart(type: string): string {
    switch (type) {
      case 'sunny':
        return '#FFF5E6'
      case 'cloudy':
        return '#F0F4F8'
      case 'rainy':
        return '#E6F0FF'
      case 'snowy':
        return '#F0F8FF'
      default:
        return '#F5F0FF'
    }
  }

  private getWeatherTypeGradientEnd(type: string): string {
    switch (type) {
      case 'sunny':
        return '#FFE4C4'
      case 'cloudy':
        return '#D9E2EC'
      case 'rainy':
        return '#B8D4FF'
      case 'snowy':
        return '#E0F0FF'
      default:
        return '#E8E0F0'
    }
  }
}