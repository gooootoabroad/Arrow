import { _decorator, Color, Component, Graphics, Vec2 } from 'cc';
import { EArrowColor } from '../type/arrow';
import { GameConfig } from '../../global/GameConfig';
import { Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('Hole')
export class Hole extends Component {
    private expectColorType: EArrowColor = EArrowColor.RED;
    private _graphics: Graphics = null;
    private _occupied: boolean = false;

    get occupied(): boolean {
        return this._occupied;
    }

    set occupied(value: boolean) {
        this._occupied = value;
    }

    public init(colorType: EArrowColor) {
        this.expectColorType = colorType;
        this._graphics = this.getComponent(Graphics);
        if (!this._graphics) {
            this._graphics = this.addComponent(Graphics);
        }

        this.draw();
    }

    public checkMatch(arrowColor: EArrowColor): boolean {
        // TODO 当前只能一个洞获得一个箭头，后续根据type来实现是可以多个箭头
        return !this.occupied && this.expectColorType === arrowColor;
    }

    private draw() {
        if (!this._graphics) return;

        let g = this._graphics;
        g.clear();
        g.lineWidth = 4;
        g.strokeColor = new Color().fromHEX(this.expectColorType);
        g.circle(0, 0, GameConfig.UNIT_SIZE * 0.4);
        g.stroke();

        let fillColor = new Color().fromHEX(this.expectColorType);
        fillColor.a = 80;
        g.fillColor = fillColor;
        g.circle(0, 0, GameConfig.UNIT_SIZE * 0.35);
        g.fill();
    }
}
