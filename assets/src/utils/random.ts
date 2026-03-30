// 获取指定范围的随机整数，左闭右开，比如传入1,11，最多只返回1,10
export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
}

// 打乱数组顺序算法
export function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 根据权重随机选择
export function getRandomIndexByWeight<T extends { weight: number }>(list: T[]): number {
    if (!list.length) return -1;

    // 计算总权重
    let totalWeight = list.reduce((sum, item) => sum + (item.weight || 0), 0);
    if (totalWeight <= 0) return -1;

    // 生成随机数
    let rand = Math.random() * totalWeight;

    // 遍历累加找到对应的 index
    let sum = 0;
    for (let i = 0; i < list.length; i++) {
        sum += list[i].weight || 0;
        if (rand < sum) {
            return i;
        }
    }

    return list.length - 1; // 兜底
}