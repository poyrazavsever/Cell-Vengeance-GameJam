import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { EVENT_KEYS } from "../constants/eventKeys";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { SHOP_CATALOG, SHOP_ORDER } from "../data/shopCatalog";
import { gameState } from "../state/GameState";
import { LevelCompletionResult, LevelId, UpgradeKey } from "../types/progression";

interface LevelCompleteData extends Partial<LevelCompletionResult> {}

interface ShopRow {
    key: UpgradeKey;
    levelText: Phaser.GameObjects.Text;
    costText: Phaser.GameObjects.Text;
    buyButton: Phaser.GameObjects.Text;
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
        this.add.rectangle(512, 384, 1024, 768, 0x08171f);
        this.add.rectangle(512, 96, 900, 150, 0x123445, 0.9).setStrokeStyle(2, 0x68c2dd, 0.9);

        this.add.text(512, 56, `Bolum ${this.payload.levelId} Tamamlandi`, {
            fontFamily: "Verdana",
            fontSize: "38px",
            color: "#e8fbff"
        }).setOrigin(0.5);

        this.add.text(512, 94, `Kazanilan: +${this.payload.earned} CP`, {
            fontFamily: "Verdana",
            fontSize: "22px",
            color: "#b2ecff"
        }).setOrigin(0.5);

        this.walletText = this.add.text(512, 124, `Cuzdan: ${gameState.getSnapshot().profile.walletPoints} CP`, {
            fontFamily: "Verdana",
            fontSize: "22px",
            color: "#ffe1a0"
        }).setOrigin(0.5);

        this.add.text(512, 178, "Market - Evrim ve guclendirmeler", {
            fontFamily: "Verdana",
            fontSize: "26px",
            color: "#9fdfff"
        }).setOrigin(0.5);

        this.createShopRows();
        this.refreshShopRows();

        this.createButton(270, 710, "Ana Menuye Don", () => {
            this.scene.start(SCENE_KEYS.MAIN_MENU);
        });

        if (this.payload.levelId < 3 && this.payload.nextLevel) {
            this.createButton(754, 710, "Siradaki Bolum ile Devam Et", () => {
                const nextLevel = this.payload.nextLevel as LevelId;
                gameState.setSelectedLevel(nextLevel);
                gameState.startLevel(nextLevel);
                this.scene.start(SCENE_KEYS.GAME, { levelId: nextLevel });
            });
        } else {
            this.add.text(512, 654, "Oyunun devami gelecek.", {
                fontFamily: "Verdana",
                fontSize: "26px",
                color: "#9de4ae"
            }).setOrigin(0.5);

            this.createButton(754, 710, "Serbest Bolum Secimi", () => {
                this.scene.start(SCENE_KEYS.MAIN_MENU);
            });
        }
    }

    private createShopRows(): void {
        this.rows = [];
        SHOP_ORDER.forEach((key, index) => {
            const item = SHOP_CATALOG[key];
            const y = 230 + index * 62;

            this.add.text(84, y, item.label, {
                fontFamily: "Verdana",
                fontSize: "20px",
                color: "#e7f9ff"
            });

            this.add.text(84, y + 22, item.description, {
                fontFamily: "Verdana",
                fontSize: "14px",
                color: "#81bbcf"
            });

            const levelText = this.add.text(520, y + 8, "Lv 0/0", {
                fontFamily: "Verdana",
                fontSize: "18px",
                color: "#d7f3ff"
            }).setOrigin(0.5);

            const costText = this.add.text(660, y + 8, "0 CP", {
                fontFamily: "Verdana",
                fontSize: "18px",
                color: "#ffe8b8"
            }).setOrigin(0.5);

            const buyButton = this.createButton(870, y + 8, "Satin Al", () => {
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
            });

            this.rows.push({ key, levelText, costText, buyButton });
        });
    }

    private refreshShopRows(): void {
        const snapshot = gameState.getSnapshot();
        this.walletText.setText(`Cuzdan: ${snapshot.profile.walletPoints} CP`);

        this.rows.forEach((row) => {
            const item = SHOP_CATALOG[row.key];
            const currentLevel = snapshot.profile.upgrades[row.key];
            const cost = item.baseCost + currentLevel * item.costStep;
            const isMaxed = currentLevel >= item.maxLevel;
            const canBuy = !isMaxed && snapshot.profile.walletPoints >= cost;

            row.levelText.setText(`Lv ${currentLevel}/${item.maxLevel}`);
            row.costText.setText(isMaxed ? "MAX" : `${cost} CP`);

            if (isMaxed) {
                this.disableButton(row.buyButton, "MAX");
            } else if (!canBuy) {
                this.disableButton(row.buyButton, "Yetersiz");
            } else {
                this.enableButton(row.buyButton, "Satin Al");
            }
        });
    }

    private createButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Text {
        const button = this.add.text(x, y, label, {
            fontFamily: "Verdana",
            fontSize: "18px",
            color: "#effcff",
            backgroundColor: "#1e546a",
            padding: {
                left: 10,
                right: 10,
                top: 6,
                bottom: 6
            }
        }).setOrigin(0.5);

        button.setData("enabled", true);
        button.setInteractive({ useHandCursor: true })
            .on("pointerover", () => {
                if (button.getData("enabled")) {
                    button.setStyle({ color: "#0f1d26", backgroundColor: "#9cecff" });
                }
            })
            .on("pointerout", () => {
                if (button.getData("enabled")) {
                    button.setStyle({ color: "#effcff", backgroundColor: "#1e546a" });
                }
            })
            .on("pointerdown", () => {
                if (button.getData("enabled")) {
                    onClick();
                }
            });

        return button;
    }

    private disableButton(button: Phaser.GameObjects.Text, label: string): void {
        button.setData("enabled", false);
        button.setStyle({
            color: "#586b74",
            backgroundColor: "#1d2a31"
        });
        button.setText(label);
    }

    private enableButton(button: Phaser.GameObjects.Text, label: string): void {
        button.setData("enabled", true);
        button.setStyle({
            color: "#effcff",
            backgroundColor: "#1e546a"
        });
        button.setText(label);
    }
}
