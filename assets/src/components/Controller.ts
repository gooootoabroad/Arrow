import { _decorator, Component } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Controller")
export class Controller extends Component {

    unuse(): void {
        this.unscheduleAllCallbacks();
    }

}