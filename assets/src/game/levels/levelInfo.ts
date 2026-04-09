import { getRandomInt } from "../../utils/random";

export interface LevelInfo {
    id: number,
    name: string,
    image: string,
}

const levelInfos: LevelInfo[] = [
    {
        id: 1,
        name: "猫头鹰",
        image: "owl"
    },
    {
        id: 2,
        name: "猫头鹰",
        image: "owl"
    }
]

export function getAllLevelInfos(): LevelInfo[] {
    return levelInfos;
}

export function getLevelInfo(id: number): LevelInfo {
    if (id > levelInfos.length) return null;

    return levelInfos[id - 1];
}

export function getLevelJsonFileName(id: number): string {
    // if (id >= levelInfos.length) {
    //     // 随机选择一关
    //     id = getRandomInt(2, levelInfos.length - 1);
    // }

    return `level_${id}`;
}