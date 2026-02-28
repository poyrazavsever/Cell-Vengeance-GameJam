import { Scene } from "phaser";
import { PLAYER_EVOLUTION_TEXTURES } from "../constants/assetKeys";

export type PlayerAnimationAction = "walk" | "jump" | "attack" | "hit" | "climb";

const ACTION_FRAME_RANGES: Record<PlayerAnimationAction, { start: number; end: number; frameRate: number; repeat: number }> = {
    walk: { start: 0, end: 3, frameRate: 10, repeat: -1 },
    jump: { start: 4, end: 7, frameRate: 10, repeat: -1 },
    attack: { start: 8, end: 11, frameRate: 14, repeat: 0 },
    hit: { start: 12, end: 15, frameRate: 12, repeat: 0 },
    climb: { start: 4, end: 7, frameRate: 6, repeat: -1 }
};

export const getPlayerAnimationKey = (textureKey: string, action: PlayerAnimationAction): string => {
    return `${textureKey}-${action}`;
};

export const createPlayerAnimations = (scene: Scene): void => {
    for (const textureKey of PLAYER_EVOLUTION_TEXTURES) {
        for (const action of Object.keys(ACTION_FRAME_RANGES) as PlayerAnimationAction[]) {
            const animationKey = getPlayerAnimationKey(textureKey, action);
            if (scene.anims.exists(animationKey)) {
                continue;
            }

            const range = ACTION_FRAME_RANGES[action];
            scene.anims.create({
                key: animationKey,
                frames: scene.anims.generateFrameNumbers(textureKey, { start: range.start, end: range.end }),
                frameRate: range.frameRate,
                repeat: range.repeat
            });
        }
    }
};
