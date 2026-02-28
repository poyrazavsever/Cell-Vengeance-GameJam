import { SpawnPoint } from "./enemy";
import { LevelId } from "./progression";

export type PlatformKey = "platform-lg" | "platform-md" | "platform-sm";

export interface LevelPlatform {
    key: PlatformKey;
    x: number;
    y: number;
}

export interface LevelDefinition {
    id: LevelId;
    name: string;
    worldWidth: number;
    spawn: { x: number; y: number };
    door: { x: number; y: number };
    platformPreset: LevelPlatform[];
    enemySpawns: SpawnPoint[];
}
