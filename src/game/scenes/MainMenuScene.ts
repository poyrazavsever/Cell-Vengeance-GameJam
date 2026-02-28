import { Scene } from "phaser";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { getLevelById } from "../data/levels";
import { gameState } from "../state/GameState";
import { LevelId } from "../types/progression";

const LEVEL_IDS: LevelId[] = [1, 2, 3];

export class MainMenuScene extends Scene {
    constructor() {
        super(SCENE_KEYS.MAIN_MENU);
    }

    create(): void {
        const snapshot = gameState.getSnapshot();

        this.add.rectangle(512, 384, 1024, 768, 0x071521);
        this.add.rectangle(512, 110, 760, 120, 0x103247, 0.9).setStrokeStyle(2, 0x63bdd7, 0.9);

        this.add.text(512, 82, "CELL-VENGEANCE", {
            fontFamily: "Verdana",
            fontSize: "44px",
            color: "#dff7ff"
        }).setOrigin(0.5);

        this.add.text(512, 126, "Ana Menu", {
            fontFamily: "Verdana",
            fontSize: "22px",
            color: "#8fd8ff"
        }).setOrigin(0.5);

        this.add.text(512, 178, `Cuzdan: ${snapshot.profile.walletPoints} CP`, {
            fontFamily: "Verdana",
            fontSize: "20px",
            color: "#ffe3a6"
        }).setOrigin(0.5);

        this.createButton(512, 236, "Devam Et", () => {
            const targetLevel = snapshot.profile.selectedLevel <= snapshot.profile.unlockedLevel
                ? snapshot.profile.selectedLevel
                : snapshot.profile.unlockedLevel;
            this.startLevel(targetLevel);
        });

        this.add.text(512, 300, "Bolum Secimi", {
            fontFamily: "Verdana",
            fontSize: "24px",
            color: "#9cdfff"
        }).setOrigin(0.5);

        LEVEL_IDS.forEach((levelId, index) => {
            const level = getLevelById(levelId);
            const isPlayable = gameState.canPlayLevel(levelId);
            const y = 362 + index * 96;
            const label = `B${levelId}: ${level.name}`;

            this.createButton(
                512,
                y,
                label,
                () => this.startLevel(levelId),
                isPlayable
            );
        });

        this.createButton(512, 662, "Tum Ilerlemeyi Sifirla", () => {
            gameState.resetAllProgress();
            this.scene.restart();
        });

        if (snapshot.profile.finaleSeen) {
            this.add.text(512, 608, "Oyunun devami gelecek. Tum bolumler secilebilir.", {
                fontFamily: "Verdana",
                fontSize: "18px",
                color: "#9be6b0"
            }).setOrigin(0.5);
        }
    }

    private startLevel(levelId: LevelId): void {
        if (!gameState.setSelectedLevel(levelId)) {
            return;
        }

        gameState.startLevel(levelId);
        this.scene.start(SCENE_KEYS.GAME, { levelId });
    }

    private createButton(
        x: number,
        y: number,
        text: string,
        onClick: () => void,
        enabled = true
    ): Phaser.GameObjects.Text {
        const button = this.add.text(x, y, text, {
            fontFamily: "Verdana",
            fontSize: "22px",
            color: enabled ? "#f0fbff" : "#5a7482",
            backgroundColor: enabled ? "#1b4f67" : "#1d2830",
            padding: {
                left: 16,
                right: 16,
                top: 8,
                bottom: 8
            }
        }).setOrigin(0.5);

        if (!enabled) {
            return button;
        }

        button
            .setInteractive({ useHandCursor: true })
            .on("pointerover", () => button.setStyle({ color: "#0c1a22", backgroundColor: "#95ebff" }))
            .on("pointerout", () => button.setStyle({ color: "#f0fbff", backgroundColor: "#1b4f67" }))
            .on("pointerdown", onClick);

        return button;
    }
}
