export function getEnumKeys<T extends object>(e: T): Array<keyof T> {
    return Object.keys(e) as Array<keyof T>;
}