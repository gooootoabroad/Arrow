// 深拷贝
export function deepCopy(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // ✅ Map
    if (obj instanceof Map) {
        const result = new Map();
        obj.forEach((value, key) => {
            result.set(deepCopy(key), deepCopy(value));
        });
        return result;
    }

    // ✅ Set
    if (obj instanceof Set) {
        const result = new Set();
        obj.forEach(value => {
            result.add(deepCopy(value));
        });
        return result;
    }

    // ✅ Array
    if (Array.isArray(obj)) {
        return obj.map(item => deepCopy(item));
    }

    // ✅ Date
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    // ✅ 普通对象
    const result: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = deepCopy(obj[key]);
        }
    }

    return result;
}
