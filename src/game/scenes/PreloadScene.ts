import { Scene } from "phaser";
import { ASSET_KEYS, PLAYER_FRAME_SIZE } from "../constants/assetKeys";
import { SCENE_KEYS } from "../constants/sceneKeys";

export class PreloadScene extends Scene {
    private loadingBar!: Phaser.GameObjects.Graphics;

    constructor() {
        super(SCENE_KEYS.PRELOAD);
    }

    preload(): void {
        const { width, height } = this.scale;

        this.add.text(width * 0.5, height * 0.42, "CELL-VENGEANCE", {
            color: "#e8f5ff",
            fontFamily: "Verdana",
            fontSize: "36px"
        }).setOrigin(0.5);

        this.loadingBar = this.add.graphics();
        this.drawLoadingBar(0);

        this.load.on("progress", (value: number) => {
            this.drawLoadingBar(value);
        });

        this.load.on("complete", () => {
            this.loadingBar.destroy();
        });

        this.load.image(ASSET_KEYS.LOGO, "assets/logo.png");
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_1, "assets/characters/1.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_2, "assets/characters/2.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_3, "assets/characters/3.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_4, "assets/characters/4.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_5, "assets/characters/5.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
    }

    create(): void {
        this.scene.start(SCENE_KEYS.GAME);
        this.scene.launch(SCENE_KEYS.HUD);
    }

    private drawLoadingBar(progress: number): void {
        const x = this.scale.width * 0.2;
        const y = this.scale.height * 0.52;
        const width = this.scale.width * 0.6;
        const height = 24;

        this.loadingBar.clear();
        this.loadingBar.fillStyle(0x12222d, 1);
        this.loadingBar.fillRoundedRect(x, y, width, height, 8);
        this.loadingBar.fillStyle(0x43d9b6, 1);
        this.loadingBar.fillRoundedRect(x + 4, y + 4, (width - 8) * progress, height - 8, 6);
    }
}
