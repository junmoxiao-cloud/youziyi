import promptAction from '@ohos.promptAction';
import { CareProfileDraft } from '../common/ApiModels';
import { appRepository } from '../services/AppRepository';

@Entry
@Component
struct CareProfile {
  @State role: string = 'elder'
  @State displayName: string = ''
  @State ageRange: string = ''
  @State reminderPreference: string = ''
  @State dailyPreference: string = ''
  @State emergencyContact: string = ''
  @State emergencyPhone: string = ''
  @State careNotes: string = ''
  @State healthNotes: string = ''

  aboutToAppear(): void {
    const params = this.getUIContext().getRouter().getParams() as Record<string, string>
    if (params && params['role']) {
      this.role = params['role']
    }
  }

  private isElderRole(): boolean {
    return this.role === 'elder'
  }

  private getRoleTitle(): string {
    return this.isElderRole() ? '当前为长辈首填' : '当前为家属补充'
  }

  private getRoleDescription(): string {
    if (this.isElderRole()) {
      return '先填写称呼等常用信息即可，提醒偏好、紧急联系人和健康提醒都可以稍后再补。'
    }

    return '请在征得长辈同意后补充照护信息，只记录关怀所需的最少内容，不替长辈表达主观感受。'
  }

  private getSubmitText(): string {
    return this.isElderRole() ? '先保存基础资料' : '保存补充资料'
  }

  @Builder
  private buildField(title: string, placeholder: string, value: string, onChange: (value: string) => void,
    helperText: string = '', optional: boolean = false) {
    Column({ space: 10 }) {
      Row({ space: 8 }) {
        Text(title)
          .fontSize(20)
          .fontWeight(FontWeight.Medium)

        if (optional) {
          Text('选填')
            .fontSize(14)
            .fontColor('#2C6E49')
            .padding({ left: 8, right: 8, top: 4, bottom: 4 })
            .backgroundColor('#E7F5EC')
            .borderRadius(999)
        }
      }
      .width('100%')

      TextInput({ placeholder: placeholder, text: value })
        .height(56)
        .fontSize(20)
        .backgroundColor('#FFFFFF')
        .onChange((text: string) => {
          onChange(text)
        })

      if (helperText.length > 0) {
        Text(helperText)
          .fontSize(16)
          .lineHeight(24)
          .fontColor('#5B6477')
          .width('100%')
      }
    }
    .width('100%')
  }

  build() {
    Scroll() {
      Column({ space: 18 }) {
        Text('整理关怀资料')
          .fontSize(30)
          .fontWeight(FontWeight.Bold)
          .fontColor('#20315F')
          .width('100%')
          .margin({ top: 20 })

        Column({ space: 10 }) {
          Text(this.getRoleTitle())
            .fontSize(20)
            .fontWeight(FontWeight.Bold)
            .fontColor('#20315F')
            .width('100%')

          Text(this.getRoleDescription())
            .fontSize(18)
            .lineHeight(28)
            .fontColor('#5B6477')
            .width('100%')
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#EEF4FF')
        .borderRadius(20)
        .border({ width: 1, color: '#C9D9FF' })

        Text('每一项都可以按实际需要填写，没有把握的内容先留空，后续再补充。')
          .fontSize(16)
          .lineHeight(24)
          .fontColor('#5B6477')
          .width('100%')

        Column({ space: 14 }) {
          Text('基础资料')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .width('100%')
          Text('建议由长辈本人先确认，用习惯称呼和易理解的信息建立资料卡。')
            .fontSize(16)
            .lineHeight(24)
            .fontColor('#5B6477')
            .width('100%')
          this.buildField('称呼', '例如：外婆、李阿姨', this.displayName, (value: string) => {
            this.displayName = value
          }, '后续提醒会优先使用这里的称呼，尽量填写长辈最习惯听到的叫法。')
          this.buildField('年龄段', '例如：60-69 岁', this.ageRange, (value: string) => {
            this.ageRange = value
          }, '只需填写大致年龄段，便于后续界面与提醒节奏适配。', true)
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#FFFFFF')
        .borderRadius(20)

        Column({ space: 14 }) {
          Text('关怀与提醒偏好')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .width('100%')
          Text(this.isElderRole() ? '不确定时可以先跳过，等熟悉后再补充。' : '适合由家属整理成简短提醒，避免写成冗长说明。')
            .fontSize(16)
            .lineHeight(24)
            .fontColor('#5B6477')
            .width('100%')
          this.buildField('提醒偏好', '例如：早晚吃药、午休前提醒喝水', this.reminderPreference, (value: string) => {
            this.reminderPreference = value
          }, '记录需要被提醒的事项即可，不需要展开完整病史。', true)
          this.buildField('日常偏好', '例如：喜欢语音提醒、喜欢女儿来电', this.dailyPreference, (value: string) => {
            this.dailyPreference = value
          }, '可填写作息、沟通方式或更愿意接到谁的关怀来电。', true)
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#FFFFFF')
        .borderRadius(20)

        Column({ space: 14 }) {
          Text('紧急联系人')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .width('100%')
          Text('通常由家属补充；如果长辈暂时不想填，可以先保存基础资料。')
            .fontSize(16)
            .lineHeight(24)
            .fontColor('#5B6477')
            .width('100%')
          this.buildField('联系人姓名', '请输入联系人姓名', this.emergencyContact, (value: string) => {
            this.emergencyContact = value
          }, '建议填写最常参与照护或最便于联系的人。', true)
          this.buildField('联系人电话', '请输入联系电话', this.emergencyPhone, (value: string) => {
            this.emergencyPhone = value
          }, '仅在确有需要时填写，避免采集与照护无关的联系方式。', true)
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#FFFFFF')
        .borderRadius(20)

        Column({ space: 14 }) {
          Text('额外健康提醒')
            .fontSize(22)
            .fontWeight(FontWeight.Bold)
            .width('100%')
          Text('全部为选填项，仅在长辈知情并同意时记录，便于日常关怀时少走弯路。')
            .fontSize(16)
            .lineHeight(24)
            .fontColor('#5B6477')
            .width('100%')
          this.buildField('照护备注', '例如：下雨天记得带伞、散步后提醒休息', this.careNotes, (value: string) => {
            this.careNotes = value
          }, '写具体照护动作即可，例如出门、休息、饮水或作息提醒。', true)
          this.buildField('过敏或用药提醒', '如确有需要再填写，可由家属后续补充', this.healthNotes, (value: string) => {
            this.healthNotes = value
          }, '不需要填写疾病描述；只保留过敏、忌口或固定用药这类实际提醒。', true)
        }
        .width('100%')
        .padding(18)
        .backgroundColor('#FFFFFF')
        .borderRadius(20)

        Text(this.isElderRole() ? '保存后仍可由家属继续补充紧急联系人和提醒信息。' : '补充前请再次确认内容准确，并尊重长辈对信息公开范围的选择。')
          .fontSize(16)
          .lineHeight(24)
          .fontColor('#5B6477')
          .width('100%')

        Button(this.getSubmitText())
          .width('100%')
          .height(56)
          .fontSize(20)
          .backgroundColor('#20315F')
          .onClick(() => {
            const displayName = this.displayName.trim()
            if (displayName.length === 0) {
              promptAction.showToast({ message: '请先填写一个长辈习惯使用的称呼' })
              return
            }

            const profile: CareProfileDraft = {
              role: this.role,
              displayName: displayName,
              ageRange: this.ageRange.trim(),
              reminderPreference: this.reminderPreference.trim(),
              dailyPreference: this.dailyPreference.trim(),
              emergencyContact: this.emergencyContact.trim(),
              emergencyPhone: this.emergencyPhone.trim(),
              careNotes: this.careNotes.trim(),
              healthNotes: this.healthNotes.trim()
            }

            appRepository.saveCareProfile(profile).then((response) => {
              promptAction.showToast({ message: response.message })
              this.getUIContext().getRouter().pushUrl({ url: 'pages/Main' })
            })
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
