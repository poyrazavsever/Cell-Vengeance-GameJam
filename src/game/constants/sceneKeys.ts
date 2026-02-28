export const SCENE_KEYS = {
    BOOT: "BootScene",
    PRELOAD: "PreloadScene",
    GAME: "GameScene",
    HUD: "HudScene"
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
