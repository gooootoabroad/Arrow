import { ArrowDirection, EArrowColor } from '../type/arrow';


export interface ArrowSpawnConfig {
    id: number;
    startPos: number[];
    offsetCoords: number[][];
    direction: ArrowDirection;
    colorType: EArrowColor;
}

export interface HoleSpawnConfig {
    id: number;
    positions: number[][];
    totalHoles: number;
}

export interface PathConfig {
    pathPoints: number[][];
}

export interface LevelMapConfig {
    levelId: number;
    levelName: string;
    mapWidth: number;
    mapHeight: number;
    path: PathConfig;
    arrows: ArrowSpawnConfig[];
    holes: HoleSpawnConfig[];
    colorPool: Record<string, number>;
    enableRainbow: boolean;
}