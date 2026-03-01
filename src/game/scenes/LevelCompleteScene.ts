import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { EVENT_KEYS } from "../constants/eventKeys";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { SHOP_CATALOG, SHOP_ORDER } from "../data/shopCatalog";
import { ensureMenuMusic } from "../services/menuMusic";
import { gameState } from "../state/GameState";
import { LevelCompletionResult, LevelId, UpgradeKey } from "../types/progression";
import { MenuButtonApi, createMenuButton, createMenuCard, createMenuLabel, drawMenuBackground, drawMenuHeader } from "../ui/menuTheme";

interface LevelCompleteData extends Partial<LevelCompletionResult> {}

interface ShopRow {
    key: UpgradeKey;
    levelText: Phaser.GameObjects.Text;
    costText: Phaser.GameObjects.Text;
    buyButton: MenuButtonApi;
}

export class LevelCompleteScene extends Scene {
    private payload!: LevelCompletionResult;
    private walletText!: Phaser.GameObjects.Text;
    private rows: ShopRow[] = [];

    constructor() {
        super(SCENE_KEYS.LEVEL_COMPLETE);
    }

    init(data: LevelCompleteData): void {
        const snapshot = gameState.getSnapshot();
        const levelId = (data.levelId ?? snapshot.run.levelId) as LevelId;
        this.payload = {
            levelId,
            earned: data.earned ?? 0,
            walletBefore: data.walletBefore ?? snapshot.profile.walletPoints,
            walletAfter: data.walletAfter ?? snapshot.profile.walletPoints,
            nextLevel: data.nextLevel
        };
    }

    create(): void {
        ensureMenuMusic(this);
        drawMenuBackground(this);
        drawMenuHeader(this, `Bölüm ${this.payload.levelId} Tamamlandı`, "Artan hücreleri markette harca");
        createMenuLabel(this, 512, 362, `Bölüm Sonu Artan Hücre: +${this.payload.earned} CP`, 24, "#b2ecff");
        this.walletText = createMenuLabel(this, 512, 392, `Cüzdan: ${gameState.getSnapshot().profile.walletPoints} CP`, 24, "#ffe1a0");
        createMenuCard(this, { x: 512, y: 566, width: 932, height: 372 });
        createMenuLabel(this, 512, 425, "Market - Özellik Güçlendirmeleri", 24, "#9fdfff");

        this.createShopRows();
        this.refreshShopRows();

        createMenuButton(this, {
            x: 270,
            y: 730,
            width: 320,
            height: 52,
            fontSize: 21,
            label: "Ana Menüye Dön",
            onClick: () => {
                this.scene.start(SCENE_KEYS.MAIN_MENU);
            }
        });

        if (this.payload.levelId < 3 && this.payload.nextLevel) {
            createMenuButton(this, {
                x: 754,
                y: 730,
                width: 420,
                height: 52,
                fontSize: 20,
                label: "Sıradaki Bölüm ile Devam Et",
                onClick: () => {
                    const nextLevel = this.payload.nextLevel as LevelId;
                    gameState.setSelectedLevel(nextLevel);
                    gameState.startLevel(nextLevel);
                    this.scene.start(SCENE_KEYS.GAME, { levelId: nextLevel });
                }
            });
        } else {
            createMenuLabel(this, 754, 700, "Oyunun devamı gelecek", 20, "#9de4ae");
            createMenuButton(this, {
                x: 754,
                y: 730,
                width: 340,
                height: 52,
                fontSize: 20,
                label: "Serbest Bölüm Seçimi",
                onClick: () => {
                    this.scene.start(SCENE_KEYS.LEVEL_SELECT);
                }
            });
        }
    }

    private createShopRows(): void {
        this.rows = [];
        SHOP_ORDER.forEach((key, index) => {
            const item = SHOP_CATALOG[key];
            const y = 468 + index * 40;

            this.add.text(82, y - 12, item.label, {
                fontFamily: "Verdana",
                fontSize: "18px",
                color: "#e7f9ff",
                fontStyle: "bold",
                stroke: "#041822",
                strokeThickness: 3
            });

            this.add.text(82, y + 8, item.description, {
                fontFamily: "Verdana",
                fontSize: "13px",
                color: "#81bbcf"
            });

            const levelText = this.add.text(560, y - 2, "Lv 0/0", {
                fontFamily: "Verdana",
                fontSize: "16px",
                color: "#d7f3ff",
                stroke: "#041822",
                strokeThickness: 3
            }).setOrigin(0.5);

            const costText = this.add.text(690, y - 2, "0 CP", {
                fontFamily: "Verdana",
                fontSize: "16px",
                color: "#ffe8b8",
                stroke: "#041822",
                strokeThickness: 3
            }).setOrigin(0.5);

            const buyButton = createMenuButton(this, {
                x: 856,
                y: y - 2,
                width: 145,
                height: 38,
                fontSize: 16,
                label: "Satın Al",
                onClick: () => {
                    const result = gameState.purchaseUpgrade(key);
                    if (!result.ok) {
                        return;
                    }

                    EventBus.emit(EVENT_KEYS.SHOP_PURCHASED, {
                        key,
                        level: result.newLevel,
                        cost: result.cost
                    });
                    EventBus.emit(EVENT_KEYS.PROFILE_UPDATED, gameState.getSnapshot().profile);
                    this.refreshShopRows();
                }
            });

            this.rows.push({ key, levelText, costText, buyButton });
        });
    }

    private refreshShopRows(): void {
        const snapshot = gameState.getSnapshot();
        this.walletText.setText(`Cüzdan: ${snapshot.profile.walletPoints} CP`);

        this.rows.forEach((row) => {
            const item = SHOP_CATALOG[row.key];
            const currentLevel = snapshot.profile.upgrades[row.key];
            const cost = item.baseCost + currentLevel * item.costStep;
            const isMaxed = currentLevel >= item.maxLevel;
            const canBuy = !isMaxed && snapshot.profile.walletPoints >= cost;

            row.levelText.setText(`Lv ${currentLevel}/${item.maxLevel}`);
            row.costText.setText(isMaxed ? "MAX" : `${cost} CP`);

            if (isMaxed) {
                row.buyButton.setEnabled(false);
                row.buyButton.setLabel("MAX");
                return;
            }

            if (!canBuy) {
                row.buyButton.setEnabled(false);
                row.buyButton.setLabel("Yetersiz");
                return;
            }

            row.buyButton.setEnabled(true);
            row.buyButton.setLabel("Satın Al");
        });
    }
}
