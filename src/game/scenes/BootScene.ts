import { Scene } from "phaser";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { gameState } from "../state/GameState";

export class BootScene extends Scene {
    constructor() {
        super(SCENE_KEYS.BOOT);
    }

    create(): void {
        gameState.hydrateProfile();
        this.scene.start(SCENE_KEYS.PRELOAD);
    }
}
