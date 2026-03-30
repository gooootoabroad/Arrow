import { deepCopy } from "../utils/copy";

export interface Version {
    major: number;  // 主版本号：大变动
    minor: number;  // 次版本号：新增功能
    patch: number;  // 补丁版本号：修复bug
}

// 当前版本号
const gCurrentVersion = versionFromString("1.0.0");

export function getCurrentVersion(): Version {
    return deepCopy(gCurrentVersion);
}

export function versionToString(version: Version): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

export function versionFromString(version: string): Version {
    const parts = version.split('.').map(Number);
    return {
        major: parts[0],
        minor: parts[1],
        patch: parts[2],
    }
}