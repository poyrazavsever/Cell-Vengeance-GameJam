import { Scene } from "phaser";
import { ASSET_KEYS } from "../constants/assetKeys";
import { EnemyKind } from "../types/combat";

export type EnemyAnimationAction =
    | "patrol"
    | "detect"
    | "attack"
    | "special"
    | "summon"
    | "recover"
    | "hit"
    | "death";

const ENEMY_TEXTURE_BY_KIND: Record<EnemyKind, string> = {
    scout: ASSET_KEYS.ENEMY_SCOUT,
    spitter: ASSET_KEYS.ENEMY_SPITTER,
    brute: ASSET_KEYS.ENEMY_BRUTE,
    boss: ASSET_KEYS.ENEMY_BOSS
};

interface AnimationRange {
    start: number;
    end: number;
    frameRate: number;
    repeat: number;
}

const BOSS_GRID_SIZE = 6;

const DEFAULT_ENEMY_RANGES: Record<EnemyAnimationAction, AnimationRange> = {
    patrol: { start: 0, end: 3, frameRate: 8, repeat: -1 },
    detect: { start: 4, end: 7, frameRate: 9, repeat: 0 },
    attack: { start: 8, end: 11, frameRate: 11, repeat: 0 },
    special: { start: 8, end: 11, frameRate: 10, repeat: 0 },
    summon: { start: 4, end: 7, frameRate: 8, repeat: 0 },
    recover: { start: 12, end: 13, frameRate: 8, repeat: -1 },
    hit: { start: 14, end: 14, frameRate: 1, repeat: 0 },
    death: { start: 15, end: 15, frameRate: 1, repeat: 0 }
};

const BOSS_RANGES: Record<EnemyAnimationAction, AnimationRange> = {
    patrol: { start: 0, end: 5, frameRate: 8, repeat: -1 },
    detect: { start: 6, end: 11, frameRate: 8, repeat: 0 },
    attack: { start: 12, end: 17, frameRate: 10, repeat: 0 },
    recover: { start: 18, end: 23, frameRate: 8, repeat: 0 },
    special: { start: 24, end: 29, frameRate: 4, repeat: 0 },
    summon: { start: 30, end: 35, frameRate: 4, repeat: 0 },
    hit: { start: 23, end: 23, frameRate: 1, repeat: 0 },
    death: { start: 35, end: 35, frameRate: 1, repeat: 0 }
};

const ENEMY_FRAME_RANGES_BY_KIND: Record<EnemyKind, Record<EnemyAnimationAction, AnimationRange>> = {
    scout: DEFAULT_ENEMY_RANGES,
    spitter: DEFAULT_ENEMY_RANGES,
    brute: DEFAULT_ENEMY_RANGES,
    boss: BOSS_RANGES
};

export const getEnemyTextureKey = (kind: EnemyKind): string => {
    return ENEMY_TEXTURE_BY_KIND[kind];
};

export const getEnemyAnimationKey = (kind: EnemyKind, action: EnemyAnimationAction): string => {
    return `enemy-${kind}-${action}`;
};

const ensureBossFrames = (scene: Scene): void => {
    const texture = scene.textures.get(ASSET_KEYS.ENEMY_BOSS);
    if (!texture || texture.has("boss-0")) {
        return;
    }

    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (!source || !source.width || !source.height) {
        return;
    }

    const frameWidth = Math.floor(source.width / BOSS_GRID_SIZE);
    const frameHeight = Math.floor(source.height / BOSS_GRID_SIZE);
    if (frameWidth <= 0 || frameHeight <= 0) {
        return;
    }

    for (let row = 0; row < BOSS_GRID_SIZE; row += 1) {
        for (let col = 0; col < BOSS_GRID_SIZE; col += 1) {
            const index = row * BOSS_GRID_SIZE + col;
            const frameName = `boss-${index}`;
            if (texture.has(frameName)) {
                continue;
            }

            texture.add(frameName, 0, col * frameWidth, row * frameHeight, frameWidth, frameHeight);
        }
    }
};

export const createEnemyAnimations = (scene: Scene): void => {
    (Object.keys(ENEMY_TEXTURE_BY_KIND) as EnemyKind[]).forEach((kind) => {
        if (kind === "boss") {
            ensureBossFrames(scene);
        }

        const ranges = ENEMY_FRAME_RANGES_BY_KIND[kind];
        (Object.keys(ranges) as EnemyAnimationAction[]).forEach((action) => {
            const animationKey = getEnemyAnimationKey(kind, action);
            if (scene.anims.exists(animationKey)) {
                return;
            }

            const range = ranges[action];
            const frames = kind === "boss"
                ? Array.from({ length: range.end - range.start + 1 }, (_, i) => ({
                    key: getEnemyTextureKey(kind),
                    frame: `boss-${range.start + i}`
                }))
                : scene.anims.generateFrameNumbers(getEnemyTextureKey(kind), {
                    start: range.start,
                    end: range.end
                });

            scene.anims.create({
                key: animationKey,
                frames,
                frameRate: range.frameRate,
                repeat: range.repeat
            });
        });
    });
};
