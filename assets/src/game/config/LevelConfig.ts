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
    colorTypes: EArrowColor[];
}

export interface PathConfig {
    pathPoints: number[][];
    pathWidth: number;
}

export interface LevelMapConfig {
    levelId: number;
    levelName: string;
    mapWidth: number;
    mapHeight: number;
    path: PathConfig;
    arrows: ArrowSpawnConfig[];
    holes: HoleSpawnConfig[];
}