// 去重功能

import { Vec2 } from "cc";

// 去除Vec2列表重复项
export function deWeightVec2s(list: Vec2[]): Vec2[] {
    let listRes = Array.from(new Set(list.map(item => `${item.x},${item.y}`))).map(coordStr => {
        let [x, y] = coordStr.split(',');
        return new Vec2(parseInt(x), parseInt(y));
    });
    return listRes;
}

// 去除数组重复项，只能处理简单的类型
export function deWeightList(list: any[]): any[] {
    let listRes = list.filter((value, index, self)=>{
        return self.indexOf(value) ===index;
    });

    return listRes;
}
