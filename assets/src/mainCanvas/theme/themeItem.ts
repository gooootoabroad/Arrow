import { _decorator, Component, Node, Label } from 'cc';
import { UISprite } from '../../components/UISprite';
import { LevelInfo } from '../../game/levels/levelInfo';
import { LoadMgr } from '../../manager/LoadMgr';
import { Bundle } from '../../global/bundle';
const { ccclass, property } = _decorator;

@ccclass('themeItem')
export class themeItem extends Component {
    @property(UISprite)
    private IconSprite: UISprite = null;
    @property(Node)
    private unlockNode: Node = null;
    @property(Node)
    private lockNode: Node = null;
    @property(Label)
    private lockLabel: Label = null;

    public init(info: LevelInfo, currentLevel: number) {
        LoadMgr.loadSprite(Bundle.animals, `${info.image}`, this.IconSprite);
        let unlockLevel = info.id;
        if (currentLevel > unlockLevel) {
            this.lockNode.active = false;
            this.unlockNode.active = true;
        } else {
            this.lockNode.active = true;
            this.unlockNode.active = false;
            this.lockLabel.string = `第${unlockLevel}关解锁`;
        }
    }
}

