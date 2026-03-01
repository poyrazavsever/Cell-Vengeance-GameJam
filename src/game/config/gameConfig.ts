import { AUTO, Scale, Types } from "phaser";
import {
    BootScene,
    GameScene,
    HudScene,
    IntroScene,
    LevelCompleteScene,
    LevelSelectScene,
    MainMenuScene,
    PreloadScene,
    SettingsScene
} from "../scenes";

export const gameConfig: Types.Core.GameConfig = {
    type: AUTO,
    width: 1024,
    height: 768,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
        width: 1024,
        height: 768,
        fullscreenTarget: "app"
    },
    parent: "game-container",
    backgroundColor: "#08131b",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 980 },
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, IntroScene, MainMenuScene, LevelSelectScene, SettingsScene, GameScene, HudScene, LevelCompleteScene]
};
