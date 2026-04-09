import { _decorator, Component, Node, Prefab } from 'cc';
import { Core } from '../../global/Core';
import { getAllLevelInfos } from '../../game/levels/levelInfo';
import { instantiate } from 'cc';
import { themeItem } from './themeItem';
const { ccclass, property } = _decorator;

@ccclass('themeController')
export class themeController extends Component {
    @property(Node)
    private contentNode: Node = null;
    @property(Prefab)
    private itemPrefab: Prefab = null;

    start() {
        let currentLevel = Core.userInfo.level;
        let levelInfos = getAllLevelInfos();
        levelInfos.forEach((levelInfo) => {
            const node = instantiate(this.itemPrefab);
            this.contentNode.addChild(node);
            node.getComponent(themeItem).init(levelInfo, currentLevel);
        })
    }

    onCloseClick() {
        this.node.active = false;
    }
}

