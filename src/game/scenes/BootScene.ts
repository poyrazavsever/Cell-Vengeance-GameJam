import { Scene } from "phaser";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { applySettingsToSoundManager, loadSettings } from "../services/settings";
import { gameState } from "../state/GameState";

export class BootScene extends Scene {
    constructor() {
        super(SCENE_KEYS.BOOT);
    }

    create(): void {
        applySettingsToSoundManager(this.sound, loadSettings());
        gameState.hydrateProfile();
        this.scene.start(SCENE_KEYS.PRELOAD);
    }
}
