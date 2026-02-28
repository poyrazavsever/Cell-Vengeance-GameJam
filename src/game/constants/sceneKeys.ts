export const SCENE_KEYS = {
    BOOT: "BootScene",
    PRELOAD: "PreloadScene",
    MAIN_MENU: "MainMenuScene",
    LEVEL_SELECT: "LevelSelectScene",
    SETTINGS: "SettingsScene",
    GAME: "GameScene",
    HUD: "HudScene",
    LEVEL_COMPLETE: "LevelCompleteScene"
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
