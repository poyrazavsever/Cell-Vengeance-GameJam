import { Scene } from "phaser";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { ensureMenuMusic } from "../services/menuMusic";
import { gameState } from "../state/GameState";
import { LevelId } from "../types/progression";
import { createMenuButton, createMenuCard, createMenuLabel, drawMenuBackground, drawMenuHeader } from "../ui/menuTheme";

export class MainMenuScene extends Scene {
    constructor() {
        super(SCENE_KEYS.MAIN_MENU);
    }

    create(): void {
        const snapshot = gameState.getSnapshot();
        ensureMenuMusic(this);

        drawMenuBackground(this);
        drawMenuHeader(this, "Ana Menü", "Hücresel savaş yeniden başlıyor");
        this.createWalletBadge(snapshot.profile.walletPoints);

        createMenuCard(this, { x: 512, y: 564, width: 560, height: 248 });
        createMenuButton(this, {
            x: 512,
            y: 500,
            width: 420,
            height: 54,
            fontSize: 25,
            label: "Kaldığın Yerden Devam Et",
            onClick: () => {
                const nextSnapshot = gameState.getSnapshot();
                const targetLevel = gameState.canPlayLevel(nextSnapshot.profile.selectedLevel)
                    ? nextSnapshot.profile.selectedLevel
                    : nextSnapshot.profile.unlockedLevel;
                this.startLevel(targetLevel);
            }
        });
        createMenuButton(this, {
            x: 512,
            y: 572,
            width: 420,
            height: 50,
            fontSize: 22,
            label: "Bölüm Seçimi",
            onClick: () => this.scene.start(SCENE_KEYS.LEVEL_SELECT)
        });
        createMenuButton(this, {
            x: 512,
            y: 636,
            width: 420,
            height: 50,
            fontSize: 22,
            label: "Ayarlar",
            onClick: () => this.scene.start(SCENE_KEYS.SETTINGS)
        });

        createMenuButton(this, {
            x: 512,
            y: 744,
            width: 320,
            height: 40,
            fontSize: 16,
            label: "Tüm İlerlemeyi Sıfırla",
            onClick: () => {
                gameState.resetAllProgress();
                this.scene.restart();
            }
        });

        if (snapshot.profile.finaleSeen) {
            this.add.text(512, 686, "Final açıldı. Bölüm seçiminden istediğin bölümü oynayabilirsin.", {
                fontFamily: "Verdana",
                fontSize: "16px",
                color: "#9be6b0",
                stroke: "#041822",
                strokeThickness: 3
            }).setOrigin(0.5);
        }
    }

    private startLevel(levelId: LevelId): void {
        if (!gameState.setSelectedLevel(levelId)) {
            return;
        }

        const snapshot = gameState.getSnapshot();
        if (snapshot.profile.introSeen) {
            gameState.startLevel(levelId);
            this.scene.start(SCENE_KEYS.GAME, { levelId });
            return;
        }

        this.scene.start(SCENE_KEYS.INTRO, { levelId });
    }

    private createWalletBadge(walletPoints: number): void {
        createMenuCard(this, { x: 874, y: 46, width: 280, height: 74, alpha: 0.94 });
        createMenuLabel(this, 874, 46, `Cüzdan: ${walletPoints} CP`, 24, "#ffe6a8");
    }
}
