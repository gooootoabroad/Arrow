import { Vec3 } from "cc";

export function getDuration(startPos: Vec3, targetPos: Vec3, speed: number): number {
    let distance = Vec3.distance(startPos, targetPos);
    return distance / speed;
}