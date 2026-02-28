import { Scene } from "phaser";
import { ASSET_KEYS } from "../constants/assetKeys";
import { EnemyKind } from "../types/combat";

export type EnemyAnimationAction =
    | "patrol"
    | "detect"
    | "attack"
    | "recover"
    | "hit"
    | "death";

const ENEMY_TEXTURE_BY_KIND: Record<EnemyKind, string> = {
    scout: ASSET_KEYS.ENEMY_SCOUT,
    spitter: ASSET_KEYS.ENEMY_SPITTER,
    brute: ASSET_KEYS.ENEMY_BRUTE
};

const ENEMY_FRAME_RANGES: Record<EnemyAnimationAction, { start: number; end: number; frameRate: number; repeat: number }> = {
    patrol: { start: 0, end: 3, frameRate: 10, repeat: -1 },
    detect: { start: 4, end: 7, frameRate: 11, repeat: 0 },
    attack: { start: 8, end: 11, frameRate: 14, repeat: 0 },
    recover: { start: 12, end: 13, frameRate: 10, repeat: -1 },
    hit: { start: 14, end: 14, frameRate: 1, repeat: 0 },
    death: { start: 15, end: 15, frameRate: 1, repeat: 0 }
};

export const getEnemyTextureKey = (kind: EnemyKind): string => {
    return ENEMY_TEXTURE_BY_KIND[kind];
};

export const getEnemyAnimationKey = (kind: EnemyKind, action: EnemyAnimationAction): string => {
    return `enemy-${kind}-${action}`;
};

export const createEnemyAnimations = (scene: Scene): void => {
    (Object.keys(ENEMY_TEXTURE_BY_KIND) as EnemyKind[]).forEach((kind) => {
        (Object.keys(ENEMY_FRAME_RANGES) as EnemyAnimationAction[]).forEach((action) => {
            const animationKey = getEnemyAnimationKey(kind, action);
            if (scene.anims.exists(animationKey)) {
                return;
            }

            const range = ENEMY_FRAME_RANGES[action];
            scene.anims.create({
                key: animationKey,
                frames: scene.anims.generateFrameNumbers(getEnemyTextureKey(kind), {
                    start: range.start,
                    end: range.end
                }),
                frameRate: range.frameRate,
                repeat: range.repeat
            });
        });
    });
};
