import { Scene } from "phaser";
import { PLAYER_TEXTURE_KEYS } from "../constants/assetKeys";

export type PlayerAnimationAction = "walk" | "jump" | "attack" | "hit" | "climb" | "death";

const ACTION_FRAME_RANGES: Record<PlayerAnimationAction, { start: number; end: number; frameRate: number; repeat: number }> = {
    walk: { start: 0, end: 3, frameRate: 8, repeat: -1 },
    jump: { start: 4, end: 7, frameRate: 8, repeat: -1 },
    attack: { start: 8, end: 11, frameRate: 11, repeat: 0 },
    hit: { start: 12, end: 15, frameRate: 10, repeat: 0 },
    climb: { start: 4, end: 7, frameRate: 5, repeat: -1 },
    death: { start: 12, end: 15, frameRate: 4, repeat: 0 }
};

export const getPlayerAnimationKey = (textureKey: string, action: PlayerAnimationAction): string => {
    return `${textureKey}-${action}`;
};

export const createPlayerAnimations = (scene: Scene): void => {
    for (const textureKey of PLAYER_TEXTURE_KEYS) {
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
