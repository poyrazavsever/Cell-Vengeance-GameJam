import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { EVENT_KEYS } from "../constants/eventKeys";
import { EVOLUTION_STAGES } from "../data/evolutionData";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { GameSnapshot } from "../types/progression";

const HEART_FULL_COLOR = 0xff4466;
const HEART_EMPTY_COLOR = 0x2a3540;
const COIN_COLOR = 0xffd966;

export class HudScene extends Scene {
    private hearts: Phaser.GameObjects.Graphics[] = [];
    private walletIcon!: Phaser.GameObjects.Graphics;
    private walletValueText!: Phaser.GameObjects.Text;

    private infoPanelContainer!: Phaser.GameObjects.Container;
    private infoPanelVisible = false;
    private infoPointsText!: Phaser.GameObjects.Text;
    private infoEvolutionText!: Phaser.GameObjects.Text;
    private infoFormText!: Phaser.GameObjects.Text;
    private infoFormDescText!: Phaser.GameObjects.Text;
    private infoHpText!: Phaser.GameObjects.Text;
    private infoAtkText!: Phaser.GameObjects.Text;
    private infoSpeedText!: Phaser.GameObjects.Text;
    private escKey!: Phaser.Input.Keyboard.Key;
    private lastSnapshot: GameSnapshot | null = null;

    constructor() {
        super(SCENE_KEYS.HUD);
    }

    create(): void {
        // --- Hearts (HP) ---
        this.hearts = [];
        for (let i = 0; i < 6; i += 1) {
            const g = this.add.graphics().setScrollFactor(0).setDepth(100);
            this.drawHeart(g, 24 + i * 30, 22, HEART_EMPTY_COLOR);
            g.setVisible(false);
            this.hearts.push(g);
        }

        // --- Coin icon + wallet value ---
        this.walletIcon = this.add.graphics().setScrollFactor(0).setDepth(100);
        this.drawCoin(this.walletIcon, 24, 52);

        this.walletValueText = this.add.text(42, 44, "0", {
            color: "#ffe8b0",
            fontFamily: "Verdana",
            fontSize: "18px",
            fontStyle: "bold",
            stroke: "#0a1820",
            strokeThickness: 3
        }).setScrollFactor(0).setDepth(100);

        // --- Info Panel (Pause overlay) ---
        this.createInfoPanel();

        // --- ESC key ---
        if (this.input.keyboard) {
            this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        }

        // --- Show info panel initially ---
        this.showInfoPanel();

        EventBus.on(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, this.handleProgressUpdated, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, this.handleProgressUpdated, this);
        });
    }

    update(): void {
        if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
            if (this.infoPanelVisible) {
                this.hideInfoPanel();
            } else {
                this.showInfoPanel();
            }
        }
    }

    private handleProgressUpdated(snapshot: GameSnapshot): void {
        this.lastSnapshot = snapshot;

        // Update hearts
        const maxHp = snapshot.run.maxHealth;
        const hp = snapshot.run.health;
        for (let i = 0; i < this.hearts.length; i += 1) {
            const heartGraphics = this.hearts[i];
            if (i < maxHp) {
                heartGraphics.setVisible(true);
                heartGraphics.clear();
                this.drawHeart(heartGraphics, 24 + i * 30, 22, i < hp ? HEART_FULL_COLOR : HEART_EMPTY_COLOR);
            } else {
                heartGraphics.setVisible(false);
            }
        }

        // Update wallet
        this.walletValueText.setText(`${snapshot.profile.walletPoints}`);

        // Update info panel if visible
        if (this.infoPanelVisible) {
            this.refreshInfoPanel(snapshot);
        }
    }

    private drawHeart(g: Phaser.GameObjects.Graphics, cx: number, cy: number, color: number): void {
        g.fillStyle(color, 1);
        g.fillCircle(cx - 5, cy - 3, 7);
        g.fillCircle(cx + 5, cy - 3, 7);
        g.fillTriangle(cx - 12, cy - 1, cx + 12, cy - 1, cx, cy + 11);
    }

    private drawCoin(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
        g.fillStyle(COIN_COLOR, 1);
        g.fillCircle(cx, cy, 9);
        g.fillStyle(0xc9a825, 1);
        g.fillCircle(cx, cy, 5);
        g.fillStyle(COIN_COLOR, 1);
        g.fillCircle(cx, cy, 3);
    }

    private createInfoPanel(): void {
        const { width, height } = this.scale;
        const panelW = 380;
        const panelH = 280;
        const px = (width - panelW) * 0.5;
        const py = (height - panelH) * 0.5;

        const bg = new Phaser.GameObjects.Graphics(this);
        bg.fillStyle(0x0b1a26, 0.92);
        bg.fillRoundedRect(0, 0, panelW, panelH, 16);
        bg.lineStyle(2, 0x4ac8ff, 0.7);
        bg.strokeRoundedRect(0, 0, panelW, panelH, 16);

        const titleText = this.make.text({
            x: panelW * 0.5, y: 22,
            text: "KARAKTER BİLGİSİ",
            style: { color: "#8ff2ff", fontFamily: "Verdana", fontSize: "18px", fontStyle: "bold" },
            origin: { x: 0.5, y: 0 },
            add: false
        });

        const sep = new Phaser.GameObjects.Graphics(this);
        sep.lineStyle(1, 0x4ac8ff, 0.4);
        sep.lineBetween(20, 50, panelW - 20, 50);

        const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            color: "#7fc8e8", fontFamily: "Verdana", fontSize: "15px"
        };
        const valueStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            color: "#e8faff", fontFamily: "Verdana", fontSize: "15px", fontStyle: "bold"
        };

        const leftCol = 24;
        const rightCol = panelW - 24;
        let rowY = 66;

        const lbl1 = this.make.text({ x: leftCol, y: rowY, text: "Evrim Seviyesi:", style: labelStyle, add: false });
        this.infoEvolutionText = this.make.text({ x: rightCol, y: rowY, text: "Lv0", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl2 = this.make.text({ x: leftCol, y: rowY, text: "Form:", style: labelStyle, add: false });
        this.infoFormText = this.make.text({ x: rightCol, y: rowY, text: "Hücre Formu", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 24;

        this.infoFormDescText = this.make.text({
            x: leftCol, y: rowY, text: "",
            style: { color: "#90d8ff", fontFamily: "Verdana", fontSize: "13px", fontStyle: "italic" },
            add: false
        });
        rowY += 30;

        const lbl3 = this.make.text({ x: leftCol, y: rowY, text: "Bölüm Puanı:", style: labelStyle, add: false });
        this.infoPointsText = this.make.text({ x: rightCol, y: rowY, text: "0", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl4 = this.make.text({ x: leftCol, y: rowY, text: "Can:", style: labelStyle, add: false });
        this.infoHpText = this.make.text({ x: rightCol, y: rowY, text: "3/3", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl5 = this.make.text({ x: leftCol, y: rowY, text: "Saldırı Gücü:", style: labelStyle, add: false });
        this.infoAtkText = this.make.text({ x: rightCol, y: rowY, text: "1", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl6 = this.make.text({ x: leftCol, y: rowY, text: "Hareket Hızı:", style: labelStyle, add: false });
        this.infoSpeedText = this.make.text({ x: rightCol, y: rowY, text: "210", style: valueStyle, origin: { x: 1, y: 0 }, add: false });

        const hintText = this.make.text({
            x: panelW * 0.5, y: panelH - 16,
            text: "ESC ile kapat",
            style: { color: "#5aa8c8", fontFamily: "Verdana", fontSize: "13px" },
            origin: { x: 0.5, y: 1 },
            add: false
        });

        this.infoPanelContainer = this.add.container(px, py, [
            bg, titleText, sep,
            lbl1, this.infoEvolutionText,
            lbl2, this.infoFormText, this.infoFormDescText,
            lbl3, this.infoPointsText,
            lbl4, this.infoHpText,
            lbl5, this.infoAtkText,
            lbl6, this.infoSpeedText,
            hintText
        ]).setDepth(200).setScrollFactor(0);

        this.infoPanelContainer.setVisible(false);
    }

    private showInfoPanel(): void {
        this.infoPanelVisible = true;
        if (this.lastSnapshot) {
            this.refreshInfoPanel(this.lastSnapshot);
        }
        this.infoPanelContainer.setVisible(true);

        // Pause the game scene
        const gameScene = this.scene.get(SCENE_KEYS.GAME);
        if (gameScene && this.scene.isActive(SCENE_KEYS.GAME)) {
            gameScene.scene.pause();
        }
    }

    private hideInfoPanel(): void {
        this.infoPanelVisible = false;
        this.infoPanelContainer.setVisible(false);

        // Resume the game scene
        const gameScene = this.scene.get(SCENE_KEYS.GAME);
        if (gameScene) {
            gameScene.scene.resume();
        }
    }

    private refreshInfoPanel(snapshot: GameSnapshot): void {
        const stage = EVOLUTION_STAGES.find((s) => s.level === snapshot.stats.evolutionLevel);
        this.infoEvolutionText.setText(`Lv${snapshot.stats.evolutionLevel}`);
        this.infoFormText.setText(stage?.label ?? "Bilinmiyor");
        this.infoFormDescText.setText(stage?.description ?? "");
        this.infoPointsText.setText(`${snapshot.run.runPoints}`);
        this.infoHpText.setText(`${snapshot.run.health}/${snapshot.run.maxHealth}`);
        this.infoAtkText.setText(`${snapshot.stats.attackDamage}`);
        this.infoSpeedText.setText(`${snapshot.stats.moveBase}`);
    }
}
