import { AUTO, Types } from "phaser";
import {
    BootScene,
    GameScene,
    HudScene,
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
    parent: "game-container",
    backgroundColor: "#08131b",
    physics: {
        default: "arcade",
        arcade: {
            gravity: { x: 0, y: 980 },
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, MainMenuScene, LevelSelectScene, SettingsScene, GameScene, HudScene, LevelCompleteScene]
};
