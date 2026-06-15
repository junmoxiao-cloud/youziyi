import { HealthTab } from './tabs/HealthTab';
import { HomeTab } from './tabs/HomeTab';
import { InteractionTab } from './tabs/InteractionTab';
import { ProfileTab } from './tabs/ProfileTab';

@Entry
@Component
struct Main {
  @State currentIndex: number = 0
  private tabsController: TabsController = new TabsController()

  @Builder
  TabBuilder(title: string, targetIndex: number) {
    Column({ space: 4 }) {
      Text(title)
        .fontSize(18)
        .fontWeight(this.currentIndex === targetIndex ? FontWeight.Bold : FontWeight.Regular)
        .fontColor(this.currentIndex === targetIndex ? '#20315F' : '#7A8699')
    }
    .width('100%')
    .height(52)
    .justifyContent(FlexAlign.Center)
    .onClick(() => {
      this.currentIndex = targetIndex
      this.tabsController.changeIndex(this.currentIndex)
    })
  }

  build() {
    Tabs({ barPosition: BarPosition.End, controller: this.tabsController }) {
      TabContent() {
        HomeTab({
          onNavigateToInteraction: () => {
            this.currentIndex = 1
            this.tabsController.changeIndex(1)
          }
        })
      }
      .tabBar(this.TabBuilder('首页', 0))

      TabContent() {
        InteractionTab()
      }
      .tabBar(this.TabBuilder('互动', 1))

      TabContent() {
        HealthTab()
      }
      .tabBar(this.TabBuilder('预警', 2))

      TabContent() {
        ProfileTab()
      }
      .tabBar(this.TabBuilder('我的', 3))
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F7F8FC')
    .onChange((index: number) => {
      this.currentIndex = index
    })
  }
}
