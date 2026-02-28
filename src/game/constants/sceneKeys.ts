export const SCENE_KEYS = {
    BOOT: "BootScene",
    PRELOAD: "PreloadScene",
    MAIN_MENU: "MainMenuScene",
    GAME: "GameScene",
    HUD: "HudScene",
    LEVEL_COMPLETE: "LevelCompleteScene"
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
