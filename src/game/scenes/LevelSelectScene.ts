import { Scene } from "phaser";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { getLevelById } from "../data/levels";
import { ensureMenuMusic } from "../services/menuMusic";
import { gameState } from "../state/GameState";
import { LevelId } from "../types/progression";
import { createMenuButton, createMenuCard, createMenuLabel, drawMenuBackground, drawMenuHeader } from "../ui/menuTheme";

const LEVEL_IDS: LevelId[] = [1, 2, 3];

export class LevelSelectScene extends Scene {
    constructor() {
        super(SCENE_KEYS.LEVEL_SELECT);
    }

    create(): void {
        const snapshot = gameState.getSnapshot();
        ensureMenuMusic(this);

        drawMenuBackground(this);
        drawMenuHeader(this, "Bölüm Seçimi", "Bölüm seç ve savaşa başla");

        createMenuCard(this, { x: 874, y: 46, width: 280, height: 74, alpha: 0.94 });
        createMenuLabel(this, 874, 46, `Cüzdan: ${snapshot.profile.walletPoints} CP`, 24, "#ffe6a8");

        createMenuCard(this, { x: 512, y: 566, width: 900, height: 356 });

        LEVEL_IDS.forEach((levelId, index) => {
            const level = getLevelById(levelId);
            const isPlayable = gameState.canPlayLevel(levelId);
            const y = 464 + index * 86;

            createMenuButton(this, {
                x: 512,
                y,
                width: 760,
                height: 64,
                fontSize: 24,
                label: level.name,
                enabled: isPlayable,
                onClick: () => this.startLevel(levelId)
            });

            this.add.text(850, y, isPlayable ? "AÇIK" : "KİLİTLİ", {
                fontFamily: "Verdana",
                fontSize: "16px",
                color: isPlayable ? "#9df0ae" : "#a8afb6",
                fontStyle: "bold",
                stroke: "#041822",
                strokeThickness: 3
            }).setOrigin(0.5);
        });

        if (snapshot.profile.finaleSeen) {
            createMenuLabel(this, 512, 656, "Final açıldı: tüm bölümler serbest.", 19, "#9de4ae");
        } else {
            createMenuLabel(this, 512, 656, `Açık son bölüm: ${snapshot.profile.unlockedLevel}`, 19, "#9cdfff");
        }

        createMenuButton(this, {
            x: 512,
            y: 730,
            width: 320,
            height: 52,
            fontSize: 22,
            label: "Ana Menüye Dön",
            onClick: () => this.scene.start(SCENE_KEYS.MAIN_MENU)
        });
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
}
