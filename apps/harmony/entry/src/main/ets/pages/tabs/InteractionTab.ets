import promptAction from '@ohos.promptAction'
import media from '@ohos.multimedia.media'
import fs from '@ohos.file.fs'
import { SectionCard } from '../../components/SectionCard'
import { VoiceListItem } from '../../common/ApiModels'
import { appSession } from '../../common/AppSession'
import { appRepository } from '../../services/AppRepository'

@Component
export struct InteractionTab {
  @State voiceList: VoiceListItem[] = []
  @State isRecording: boolean = false
  @State isLoading: boolean = false
  @State playingId: string = ''
  @State isPaused: boolean = false
  @State recordPulse: boolean = false

  private avRecorder?: media.AVRecorder
  private avPlayer?: media.AVPlayer
  private recordFilePath: string = ''
  private recordFileFd: number = -1
  private pulseTimer: number = -1

  aboutToAppear(): void {
    this.loadVoiceList()
  }

  aboutToDisappear(): void {
    this.releaseRecorder()
    this.releasePlayer()
    if (this.pulseTimer !== -1) {
      clearInterval(this.pulseTimer)
      this.pulseTimer = -1
    }
  }

  private loadVoiceList(): void {
    const userId = appSession.getUserId()
    if (!userId) {
      promptAction.showToast({ message: '未获取到用户信息' })
      return
    }

    this.isLoading = true
    appRepository.getVoiceList(userId).then((response) => {
      this.isLoading = false
      if (response.data) {
        this.voiceList = response.data.records.sort((a, b) => b.createdAt - a.createdAt)
      }
    }).catch((error: Error) => {
      this.isLoading = false
      promptAction.showToast({ message: '加载语音列表失败' })
      console.error('getVoiceList failed', error)
    })
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  }

  private getRoleLabel(role: string): string {
    return role === 'elder' ? '长辈' : '子女'
  }

  private getBorderColor(role: string): string {
    return role === 'elder' ? '#4CAF50' : '#E66A3D'
  }

  private getRoleBgColor(role: string): string {
    return role === 'elder' ? '#4CAF50' : '#E66A3D'
  }

  private async startRecord(): Promise<void> {
    try {
      this.recordFilePath = getContext().cacheDir + '/voice_' + Date.now() + '.m4a'
      const file = await fs.open(this.recordFilePath, fs.OpenMode.CREATE | fs.OpenMode.READ_WRITE)
      this.recordFileFd = file.fd

      this.avRecorder = await media.createAVRecorder()
      const avConfig: media.AVRecorderConfig = {
        audioSourceType: media.AudioSourceType.AUDIO_SOURCE_TYPE_MIC,
        profile: {
          audioCodec: media.CodecMimeType.AUDIO_AAC,
          audioBitrate: 48000,
          audioSampleRate: 44100,
          audioChannels: 1,
          fileFormat: media.ContainerFormatType.CFT_MPEG_4A
        },
        url: 'fd://' + this.recordFileFd
      }

      if (!this.avRecorder) {
        return
      }
      await this.avRecorder.prepare(avConfig)
      await this.avRecorder.start()

      this.isRecording = true
      this.startPulse()
    } catch (error) {
      this.isRecording = false
      promptAction.showToast({ message: '录音启动失败，请检查麦克风权限' })
      console.error('startRecord failed', error)
      this.releaseRecorder()
    }
  }

  private async stopRecord(): Promise<void> {
    try {
      if (this.avRecorder) {
        await this.avRecorder.stop()
        await this.avRecorder.release()
        this.avRecorder = undefined
      }

      if (this.recordFileFd !== -1) {
        fs.close(this.recordFileFd)
        this.recordFileFd = -1
      }

      this.isRecording = false
      this.stopPulse()

      const userId = appSession.getUserId()
      if (!userId) {
        promptAction.showToast({ message: '未获取到用户信息' })
        return
      }

      promptAction.showToast({ message: '正在上传...' })
      const response = await appRepository.uploadVoice(userId, this.recordFilePath)
      promptAction.showToast({ message: '上传成功' })
      this.loadVoiceList()
    } catch (error) {
      this.isRecording = false
      this.stopPulse()
      promptAction.showToast({ message: '录音或上传失败' })
      console.error('stopRecord failed', error)
    } finally {
      this.avRecorder = undefined
    }
  }

  private toggleRecord(): void {
    if (this.isRecording) {
      this.stopRecord()
    } else {
      this.startRecord()
    }
  }

  private startPulse(): void {
    this.recordPulse = true
    this.pulseTimer = setInterval(() => {
      this.recordPulse = !this.recordPulse
    }, 600)
  }

  private stopPulse(): void {
    if (this.pulseTimer !== -1) {
      clearInterval(this.pulseTimer)
      this.pulseTimer = -1
    }
    this.recordPulse = false
  }

  private async playVoice(item: VoiceListItem): Promise<void> {
    try {
      if (this.avPlayer && this.playingId !== item.id) {
        await this.releasePlayer()
      }

      if (!this.avPlayer) {
        this.avPlayer = await media.createAVPlayer()
        if (!this.avPlayer) {
          return
        }
        this.avPlayer.on('stateChange', (state) => {
          if (state === 'completed') {
            this.playingId = ''
            this.isPaused = false
            this.releasePlayer()
          } else if (state === 'error') {
            this.playingId = ''
            this.isPaused = false
            this.releasePlayer()
            promptAction.showToast({ message: '播放出错' })
          }
        })
      }

      if (!this.avPlayer) {
        return
      }
      this.avPlayer.url = item.audioUrl
      await this.avPlayer.prepare()
      await this.avPlayer.play()

      this.playingId = item.id
      this.isPaused = false
    } catch (error) {
      promptAction.showToast({ message: '播放失败' })
      console.error('playVoice failed', error)
      this.playingId = ''
      this.isPaused = false
      this.releasePlayer()
    }
  }

  private async pauseVoice(): Promise<void> {
    try {
      if (this.avPlayer) {
        await this.avPlayer.pause()
        this.isPaused = true
      }
    } catch (error) {
      console.error('pauseVoice failed', error)
    }
  }

  private async resumeVoice(): Promise<void> {
    try {
      if (this.avPlayer) {
        await this.avPlayer.play()
        this.isPaused = false
      }
    } catch (error) {
      console.error('resumeVoice failed', error)
    }
  }

  private async releasePlayer(): Promise<void> {
    try {
      if (this.avPlayer) {
        await this.avPlayer.release()
        this.avPlayer = undefined
      }
    } catch (error) {
      console.error('releasePlayer failed', error)
    }
  }

  private async releaseRecorder(): Promise<void> {
    try {
      if (this.avRecorder) {
        await this.avRecorder.release()
        this.avRecorder = undefined
      }
      if (this.recordFileFd !== -1) {
        fs.close(this.recordFileFd)
        this.recordFileFd = -1
      }
    } catch (error) {
      console.error('releaseRecorder failed', error)
    }
  }

  private togglePlay(item: VoiceListItem): void {
    if (this.playingId === item.id) {
      if (this.isPaused) {
        this.resumeVoice()
      } else {
        this.pauseVoice()
      }
    } else {
      this.playVoice(item)
    }
  }

  @Builder
  private VoiceItemBuilder(item: VoiceListItem) {
    Column({ space: 8 }) {
      Row() {
        Text(item.senderName)
          .fontSize(20)
          .fontWeight(FontWeight.Bold)
          .fontColor('#1F2A44')

        Text(this.getRoleLabel(item.senderRole))
          .fontSize(14)
          .fontColor('#FFFFFF')
          .padding({ left: 8, right: 8, top: 4, bottom: 4 })
          .backgroundColor(this.getRoleBgColor(item.senderRole))
          .borderRadius(8)

        Blank()

        Text(this.formatTime(item.createdAt))
          .fontSize(14)
          .fontColor('#8A93A7')
      }
      .width('100%')

      Row() {
        Button(this.playingId === item.id && !this.isPaused ? '暂停' : '播放')
          .fontSize(16)
          .fontColor('#FFFFFF')
          .backgroundColor(this.playingId === item.id && !this.isPaused ? '#F8B96A' : '#3F7BFA')
          .height(40)
          .width(80)
          .onClick(() => {
            this.togglePlay(item)
          })

        Text(`${item.duration}秒`)
          .fontSize(16)
          .fontColor('#5B6477')

        Blank()
      }
      .width('100%')
    }
    .width('100%')
    .padding(16)
    .backgroundColor(this.playingId === item.id ? '#E8EBF3' : '#FFFFFF')
    .borderRadius(16)
    .border({ width: 2, color: this.getBorderColor(item.senderRole) })
    .margin({ bottom: 12 })
  }

  build() {
    Scroll() {
      Column({ space: 16 }) {
        Text('家庭故事语音接龙')
          .fontSize(30)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 20 })

        Text('点击按钮录制语音，家人可随时收听回应。')
          .fontSize(18)
          .lineHeight(28)
          .fontColor('#5B6477')
          .width('100%')

        SectionCard({
          title: '语音接龙说明',
          description: '长辈和子女可以在这里发送语音消息，形成家庭互动的温暖记录。',
          accentColor: '#7FD8C3'
        })

        Button(this.isRecording ? '停止录音' : '开始录音')
          .width('100%')
          .height(64)
          .fontSize(24)
          .fontWeight(FontWeight.Bold)
          .fontColor('#FFFFFF')
          .backgroundColor(this.isRecording ? (this.recordPulse ? '#D32F2F' : '#B71C1C') : '#E66A3D')
          .borderRadius(18)
          .onClick(() => {
            this.toggleRecord()
          })

        if (this.isRecording) {
          Text('录音中...')
            .fontSize(18)
            .fontColor('#D32F2F')
            .fontWeight(FontWeight.Bold)
            .width('100%')
            .textAlign(TextAlign.Center)
        }

        if (this.voiceList.length === 0) {
          Column({ space: 12 }) {
            Text('暂无语音消息')
              .fontSize(22)
              .fontWeight(FontWeight.Bold)
              .fontColor('#8A93A7')
              .width('100%')
              .textAlign(TextAlign.Center)

            Text('点击录制第一条')
              .fontSize(18)
              .fontColor('#5B6477')
              .width('100%')
              .textAlign(TextAlign.Center)
          }
          .width('100%')
          .padding(40)
        } else {
          Column() {
            ForEach(this.voiceList, (item: VoiceListItem) => {
              this.VoiceItemBuilder(item)
            }, (item: VoiceListItem) => item.id)
          }
          .width('100%')
        }
      }
      .width('100%')
      .padding(20)
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F7F8FC')
  }
}
