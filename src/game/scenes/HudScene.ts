import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { EVENT_KEYS } from "../constants/eventKeys";
import { GROWTH_STAGE_INFO } from "../data/growthConfig";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { gameState } from "../state/GameState";
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
    private infoGrowthText!: Phaser.GameObjects.Text;
    private infoGrowthNameText!: Phaser.GameObjects.Text;
    private infoGrowthDescText!: Phaser.GameObjects.Text;
    private infoCollectedText!: Phaser.GameObjects.Text;
    private infoTotalCellsText!: Phaser.GameObjects.Text;
    private infoGrowthSpentText!: Phaser.GameObjects.Text;
    private infoResidualText!: Phaser.GameObjects.Text;
    private infoHpText!: Phaser.GameObjects.Text;
    private infoAtkText!: Phaser.GameObjects.Text;
    private infoSpeedText!: Phaser.GameObjects.Text;
    private infoDashText!: Phaser.GameObjects.Text;
    private escKey!: Phaser.Input.Keyboard.Key;
    private lastSnapshot: GameSnapshot | null = null;
    private bossBarContainer!: Phaser.GameObjects.Container;
    private bossBarFill!: Phaser.GameObjects.Rectangle;
    private bossBarValueText!: Phaser.GameObjects.Text;
    private bossBarVisible = false;

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

        this.createBossBar();

        // --- Info Panel (Pause overlay) ---
        this.createInfoPanel();

        // --- ESC key ---
        if (this.input.keyboard) {
            this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        }

        // --- Show info panel initially ---
        this.showInfoPanel();

        EventBus.on(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, this.handleProgressUpdated, this);
        EventBus.on(EVENT_KEYS.BOSS_FIGHT_STARTED, this.handleBossFightStarted, this);
        EventBus.on(EVENT_KEYS.BOSS_HEALTH_UPDATED, this.handleBossHealthUpdated, this);
        EventBus.on(EVENT_KEYS.BOSS_DEFEATED, this.handleBossDefeated, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, this.handleProgressUpdated, this);
            EventBus.off(EVENT_KEYS.BOSS_FIGHT_STARTED, this.handleBossFightStarted, this);
            EventBus.off(EVENT_KEYS.BOSS_HEALTH_UPDATED, this.handleBossHealthUpdated, this);
            EventBus.off(EVENT_KEYS.BOSS_DEFEATED, this.handleBossDefeated, this);
        });

        // Initialize HUD with current state immediately
        this.handleProgressUpdated(gameState.getSnapshot());
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
        const panelW = 400;
        const panelH = 540;
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

        const lbl1 = this.make.text({ x: leftCol, y: rowY, text: "Büyüme Aşaması:", style: labelStyle, add: false });
        this.infoGrowthText = this.make.text({ x: rightCol, y: rowY, text: "Aşama 0", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl2 = this.make.text({ x: leftCol, y: rowY, text: "Büyüme Formu:", style: labelStyle, add: false });
        this.infoGrowthNameText = this.make.text({ x: rightCol, y: rowY, text: "Temel Hücre", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 24;

        this.infoGrowthDescText = this.make.text({
            x: leftCol, y: rowY, text: "",
            style: { color: "#90d8ff", fontFamily: "Verdana", fontSize: "13px", fontStyle: "italic" },
            add: false
        });
        rowY += 30;

        const lbl3 = this.make.text({ x: leftCol, y: rowY, text: "Toplanan Hücre:", style: labelStyle, add: false });
        this.infoCollectedText = this.make.text({ x: rightCol, y: rowY, text: "0", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl4 = this.make.text({ x: leftCol, y: rowY, text: "Toplam Hücre:", style: labelStyle, add: false });
        this.infoTotalCellsText = this.make.text({ x: rightCol, y: rowY, text: "0", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl5 = this.make.text({ x: leftCol, y: rowY, text: "Büyümeye Harcanan:", style: labelStyle, add: false });
        this.infoGrowthSpentText = this.make.text({ x: rightCol, y: rowY, text: "0", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl6 = this.make.text({ x: leftCol, y: rowY, text: "Artan Hücre:", style: labelStyle, add: false });
        this.infoResidualText = this.make.text({ x: rightCol, y: rowY, text: "0", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl7 = this.make.text({ x: leftCol, y: rowY, text: "Can:", style: labelStyle, add: false });
        this.infoHpText = this.make.text({ x: rightCol, y: rowY, text: "3/3", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl8 = this.make.text({ x: leftCol, y: rowY, text: "Saldırı Gücü:", style: labelStyle, add: false });
        this.infoAtkText = this.make.text({ x: rightCol, y: rowY, text: "1", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl9 = this.make.text({ x: leftCol, y: rowY, text: "Hareket Hızı:", style: labelStyle, add: false });
        this.infoSpeedText = this.make.text({ x: rightCol, y: rowY, text: "210", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 30;

        const lbl10 = this.make.text({ x: leftCol, y: rowY, text: "Atılma (Dash):", style: labelStyle, add: false });
        this.infoDashText = this.make.text({ x: rightCol, y: rowY, text: "Kapalı", style: valueStyle, origin: { x: 1, y: 0 }, add: false });
        rowY += 36;

        // --- Controls section ---
        const sep2 = new Phaser.GameObjects.Graphics(this);
        sep2.lineStyle(1, 0x4ac8ff, 0.4);
        sep2.lineBetween(20, rowY, panelW - 20, rowY);
        rowY += 12;

        const controlStyle: Phaser.Types.GameObjects.Text.TextStyle = {
            color: "#5aa8c8", fontFamily: "Verdana", fontSize: "13px"
        };
        const controlsText = this.make.text({
            x: panelW * 0.5, y: rowY,
            text: "A/D: Hareket  |  J: Saldırı  |  Space/W: Zıpla  |  Shift: Dash",
            style: controlStyle,
            origin: { x: 0.5, y: 0 },
            add: false
        });
        rowY += 30;

        // --- Main menu button ---
        const btnBg = new Phaser.GameObjects.Graphics(this);
        btnBg.fillStyle(0x1a3a50, 1);
        btnBg.fillRoundedRect(panelW * 0.5 - 100, rowY, 200, 36, 8);
        btnBg.lineStyle(1, 0x4ac8ff, 0.6);
        btnBg.strokeRoundedRect(panelW * 0.5 - 100, rowY, 200, 36, 8);

        const btnText = this.make.text({
            x: panelW * 0.5, y: rowY + 18,
            text: "Ana Menüye Dön",
            style: { color: "#ff8888", fontFamily: "Verdana", fontSize: "14px", fontStyle: "bold" },
            origin: { x: 0.5, y: 0.5 },
            add: false
        });

        const btnHitArea = this.add.zone(panelW * 0.5, rowY + 18, 200, 36).setOrigin(0.5).setInteractive();
        btnHitArea.on("pointerdown", (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            this.goToMainMenu();
        });

        const hintText = this.make.text({
            x: panelW * 0.5, y: panelH - 12,
            text: "ESC veya tıklama: Devam",
            style: { color: "#5aa8c8", fontFamily: "Verdana", fontSize: "12px" },
            origin: { x: 0.5, y: 1 },
            add: false
        });

        this.infoPanelContainer = this.add.container(px, py, [
            bg, titleText, sep,
            lbl1, this.infoGrowthText,
            lbl2, this.infoGrowthNameText, this.infoGrowthDescText,
            lbl3, this.infoCollectedText,
            lbl4, this.infoTotalCellsText,
            lbl5, this.infoGrowthSpentText,
            lbl6, this.infoResidualText,
            lbl7, this.infoHpText,
            lbl8, this.infoAtkText,
            lbl9, this.infoSpeedText,
            lbl10, this.infoDashText,
            sep2, controlsText,
            btnBg, btnText, btnHitArea,
            hintText
        ]).setDepth(200).setScrollFactor(0);

        // Click anywhere on panel to close (resume)
        this.infoPanelContainer.setSize(panelW, panelH);
        this.infoPanelContainer.setInteractive();
        this.infoPanelContainer.on("pointerdown", () => {
            this.hideInfoPanel();
        });

        this.infoPanelContainer.setVisible(false);
    }

    private createBossBar(): void {
        const { width } = this.scale;
        const barWidth = 360;
        const barHeight = 18;
        const x = width * 0.5;
        const y = 34;

        const bg = this.add.rectangle(0, 0, barWidth + 10, barHeight + 10, 0x07131d, 0.88)
            .setStrokeStyle(2, 0x7fdcff, 0.75);
        const fillBg = this.add.rectangle(0, 0, barWidth, barHeight, 0x1c2f3d, 0.95).setOrigin(0.5);
        this.bossBarFill = this.add.rectangle(-barWidth * 0.5, 0, barWidth, barHeight, 0xff5574, 1).setOrigin(0, 0.5);
        const title = this.add.text(0, -20, "BOSS", {
            fontFamily: "Verdana",
            fontSize: "14px",
            color: "#ffd1d8",
            fontStyle: "bold",
            stroke: "#041822",
            strokeThickness: 3
        }).setOrigin(0.5);
        this.bossBarValueText = this.add.text(0, 0, "0/0", {
            fontFamily: "Verdana",
            fontSize: "12px",
            color: "#ffeef1",
            fontStyle: "bold",
            stroke: "#041822",
            strokeThickness: 3
        }).setOrigin(0.5);

        this.bossBarContainer = this.add.container(x, y, [bg, fillBg, this.bossBarFill, title, this.bossBarValueText])
            .setScrollFactor(0)
            .setDepth(130)
            .setVisible(false);
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

    private goToMainMenu(): void {
        this.infoPanelVisible = false;
        this.infoPanelContainer.setVisible(false);

        // Stop game and HUD, go to main menu
        this.scene.stop(SCENE_KEYS.GAME);
        this.scene.stop(SCENE_KEYS.HUD);
        this.scene.start(SCENE_KEYS.MAIN_MENU);
    }

    private refreshInfoPanel(snapshot: GameSnapshot): void {
        const growthInfo = GROWTH_STAGE_INFO.find((stage) => stage.stage === snapshot.profile.growthStage);
        this.infoGrowthText.setText(`Aşama ${snapshot.profile.growthStage}`);
        this.infoGrowthNameText.setText(growthInfo?.label ?? "Temel Hücre");
        this.infoGrowthDescText.setText(growthInfo?.description ?? "");
        this.infoCollectedText.setText(`${snapshot.run.collectedCells}`);
        this.infoTotalCellsText.setText(`${snapshot.profile.totalAbsorbedCells}`);
        this.infoGrowthSpentText.setText(`${snapshot.run.growthSpentInLevel}`);
        this.infoResidualText.setText(`${snapshot.run.residualCells}`);
        this.infoHpText.setText(`${snapshot.run.health}/${snapshot.run.maxHealth}`);
        this.infoAtkText.setText(`${snapshot.stats.attackDamage}`);
        this.infoSpeedText.setText(`${snapshot.stats.moveBase}`);
        this.infoDashText.setText(snapshot.stats.canDash ? "Açık" : "Kapalı");
    }

    private handleBossFightStarted(payload: { currentHealth: number; maxHealth: number }): void {
        this.bossBarVisible = true;
        this.bossBarContainer.setVisible(true).setAlpha(1);
        this.applyBossHealth(payload.currentHealth, payload.maxHealth);
    }

    private handleBossHealthUpdated(payload: { currentHealth: number; maxHealth: number }): void {
        if (!this.bossBarVisible) {
            this.bossBarVisible = true;
            this.bossBarContainer.setVisible(true).setAlpha(1);
        }
        this.applyBossHealth(payload.currentHealth, payload.maxHealth);
    }

    private handleBossDefeated(): void {
        if (!this.bossBarVisible) {
            return;
        }

        this.bossBarVisible = false;
        this.tweens.add({
            targets: this.bossBarContainer,
            alpha: 0,
            duration: 250,
            onComplete: () => {
                this.bossBarContainer.setVisible(false);
            }
        });
    }

    private applyBossHealth(currentHealth: number, maxHealth: number): void {
        const barWidth = 360;
        const safeMax = Math.max(1, maxHealth);
        const safeCurrent = Phaser.Math.Clamp(currentHealth, 0, safeMax);
        const ratio = safeCurrent / safeMax;
        this.bossBarFill.width = barWidth * ratio;
        this.bossBarValueText.setText(`${safeCurrent}/${safeMax}`);
    }
}
