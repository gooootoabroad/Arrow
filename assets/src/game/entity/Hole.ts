// import { _decorator, Color, Component, Graphics, Vec3, Enum } from 'cc';
// import { Arrow } from './Arrow';

// const { ccclass, property } = _decorator;

// const HOLE_COLORS: Record<EArrowColor, Color> = {
//     [EArrowColor.RED]: new Color(255, 68, 68, 255),
//     [EArrowColor.BLUE]: new Color(51, 136, 255, 255),
//     [EArrowColor.GREEN]: new Color(68, 204, 68, 255),
//     [EArrowColor.YELLOW]: new Color(255, 238, 68, 255),
//     [EArrowColor.PURPLE]: new Color(170, 68, 255, 255),
//     [EArrowColor.ORANGE]: new Color(255, 153, 68, 255),
// };

// @ccclass('Hole')
// export class Hole extends Component {
//     @property({ type: Enum(EArrowColor) })
//     expectColorType: EArrowColor = EArrowColor.RED;

//     @property(Number)
//     radius: number = 25;

//     private _occupied: boolean = false;
//     private _graphics: Graphics = null;

//     get occupied(): boolean {
//         return this._occupied;
//     }

//     set occupied(value: boolean) {
//         this._occupied = value;
//     }

//     get displayColor(): Color {
//         return HOLE_COLORS[this.expectColorType] || new Color(200, 200, 200, 255);
//     }

//     protected onLoad(): void {
//         this._graphics = this.getComponent(Graphics);
//         if (!this._graphics) {
//             this._graphics = this.addComponent(Graphics);
//         }
//         this.draw();
//     }

//     draw() {
//         if (!this._graphics) return;
        
//         const g = this._graphics;
//         g.clear();
        
//         // 空心圆圈
//         g.lineWidth = 4;
//         g.strokeColor = this.displayColor;
//         g.circle(0, 0, this.radius);
//         g.stroke();
        
//         // 内部浅色填充
//         g.fillColor = new Color(this.displayColor.r, this.displayColor.g, this.displayColor.b, 80);
//         g.circle(0, 0, this.radius - 2);
//         g.fill();
//     }

//     checkColorMatch(arrowColorType: number): boolean {
//         return arrowColorType === this.expectColorType;
//     }

//     checkNearHole(arrow: Arrow, threshold: number = 40): boolean {
//         if (!arrow) return false;
//         const tailPos = arrow.tailPosition;
//         const holePos = this.node.position.clone();
        
//         const dist = Vec3.distance(tailPos, holePos);
//         return dist < threshold;
//     }
// }