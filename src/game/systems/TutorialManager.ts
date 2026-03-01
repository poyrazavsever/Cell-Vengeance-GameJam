import { Scene } from "phaser";

export interface TutorialStep {
    id: string;
    trigger: "immediate" | "playerX" | "enemyKill" | "manual";
    triggerValue?: number;
    lines: string[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: "wake",
        trigger: "immediate",
        lines: [
            "Uyanıyorum... Ben küçük bir hücre organizmasıyım.",
            "Bu laboratuvardan çıkmalıyım. Hayatta kalmalıyım!"
        ]
    },
    {
        id: "move",
        trigger: "immediate",
        lines: [
            "A / D tuşları ile sola ve sağa hareket edebilirim.",
            "Hadi, ilerlemeye başlayalım!"
        ]
    },
    {
        id: "jump",
        trigger: "playerX",
        triggerValue: 350,
        lines: [
            "W veya Space tuşu ile zıplayabilirim.",
            "Engelleri aşmak için zıplamam gerekecek."
        ]
    },
    {
        id: "enemy",
        trigger: "playerX",
        triggerValue: 520,
        lines: [
            "Dikkat! Önümde bir düşman var!",
            "J tuşu ile saldırabilirim. Yaklaşıp vurmam lazım."
        ]
    },
    {
        id: "firstKill",
        trigger: "enemyKill",
        triggerValue: 1,
        lines: [
            "Harika! Düşmanı yendim!",
            "Düşmanları yenince hücre puanı kazanıyorum.",
            "Hücreler beni güçlendiriyor. Daha fazla toplamalıyım!"
        ]
    },
    {
        id: "dash",
        trigger: "playerX",
        triggerValue: 1800,
        lines: [
            "Shift tuşu ile daha hızlı koşabilirim!",
            "Tehlikeli bölgelerde hız hayat kurtarır."
        ]
    },
    {
        id: "door",
        trigger: "playerX",
        triggerValue: 4400,
        lines: [
            "Kapıya ulaştım!",
            "Enter tuşuna basarak sonraki bölüme geçebilirim."
        ]
    }
];

export class TutorialManager {
    private scene: Scene;
    private steps: TutorialStep[];
    private currentStepIndex = 0;
    private currentLineIndex = 0;
    private active = false;
    private completed = false;
    private enemyKillCount = 0;
    private awaitingInput = false;

    // UI
    private container!: Phaser.GameObjects.Container;
    private bgGraphics!: Phaser.GameObjects.Graphics;
    private dialogText!: Phaser.GameObjects.Text;
    private nameTag!: Phaser.GameObjects.Text;
    private continueHint!: Phaser.GameObjects.Text;
    private advanceKey!: Phaser.Input.Keyboard.Key;

    private onPause: () => void;
    private onResume: () => void;
    private getPlayerX: () => number;

    constructor(
        scene: Scene,
        callbacks: {
            onPause: () => void;
            onResume: () => void;
            getPlayerX: () => number;
        }
    ) {
        this.scene = scene;
        this.onPause = callbacks.onPause;
        this.onResume = callbacks.onResume;
        this.getPlayerX = callbacks.getPlayerX;
        this.steps = [...TUTORIAL_STEPS];

        this.createUI();

        if (scene.input.keyboard) {
            this.advanceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        }

        // Start first immediate steps after a short delay
        scene.time.delayedCall(600, () => {
            this.tryAdvance();
        });
    }

    private createUI(): void {
        const { width, height } = this.scene.scale;
        const boxW = Math.min(width - 40, 560);
        const boxH = 120;
        const boxX = (width - boxW) * 0.5;
        const boxY = (height - boxH) * 0.5;

        this.bgGraphics = new Phaser.GameObjects.Graphics(this.scene);
        this.bgGraphics.fillStyle(0x08131b, 0.92);
        this.bgGraphics.fillRoundedRect(0, 0, boxW, boxH, 12);
        this.bgGraphics.lineStyle(2, 0x4ac8ff, 0.6);
        this.bgGraphics.strokeRoundedRect(0, 0, boxW, boxH, 12);

        this.nameTag = this.scene.make.text({
            x: 16, y: 10,
            text: "🧬 Hücre",
            style: {
                color: "#8ff2ff",
                fontFamily: "Verdana",
                fontSize: "14px",
                fontStyle: "bold"
            },
            add: false
        });

        this.dialogText = this.scene.make.text({
            x: 16, y: 34,
            text: "",
            style: {
                color: "#e0f4ff",
                fontFamily: "Verdana",
                fontSize: "15px",
                wordWrap: { width: boxW - 32 }
            },
            add: false
        });

        this.continueHint = this.scene.make.text({
            x: boxW * 0.5, y: boxH - 8,
            text: "Enter ile devam",
            style: {
                color: "#5aa8c8",
                fontFamily: "Verdana",
                fontSize: "11px"
            },
            origin: { x: 0.5, y: 1 },
            add: false
        });

        this.container = this.scene.add.container(boxX, boxY, [
            this.bgGraphics,
            this.nameTag,
            this.dialogText,
            this.continueHint
        ]);
        this.container.setDepth(300);
        this.container.setScrollFactor(0);
        this.container.setVisible(false);
    }

    update(): void {
        if (this.completed) {
            return;
        }

        if (this.awaitingInput) {
            if (this.advanceKey && Phaser.Input.Keyboard.JustDown(this.advanceKey)) {
                this.advanceDialog();
            }
            return;
        }

        if (!this.active) {
            this.tryAdvance();
        }
    }

    onEnemyKilled(): void {
        this.enemyKillCount += 1;
        if (!this.active) {
            this.tryAdvance();
        }
    }

    isActive(): boolean {
        return this.active;
    }

    destroy(): void {
        this.container.destroy();
    }

    private tryAdvance(): void {
        if (this.currentStepIndex >= this.steps.length) {
            this.completed = true;
            return;
        }

        const step = this.steps[this.currentStepIndex];
        let shouldTrigger = false;

        switch (step.trigger) {
            case "immediate":
                shouldTrigger = true;
                break;
            case "playerX":
                shouldTrigger = this.getPlayerX() >= (step.triggerValue ?? 0);
                break;
            case "enemyKill":
                shouldTrigger = this.enemyKillCount >= (step.triggerValue ?? 1);
                break;
            case "manual":
                break;
        }

        if (shouldTrigger) {
            this.showStep(step);
        }
    }

    private showStep(step: TutorialStep): void {
        this.active = true;
        this.awaitingInput = true;
        this.currentLineIndex = 0;
        this.showCurrentLine(step);
        this.container.setVisible(true);
        this.onPause();
    }

    private showCurrentLine(step: TutorialStep): void {
        const line = step.lines[this.currentLineIndex];
        this.dialogText.setText(line);

        const isLast = this.currentLineIndex >= step.lines.length - 1;
        this.continueHint.setText(isLast ? "Enter ile kapat" : "Enter ile devam");

        // Fade in text
        this.dialogText.setAlpha(0);
        this.scene.tweens.add({
            targets: this.dialogText,
            alpha: 1,
            duration: 200,
            ease: "Linear"
        });
    }

    private advanceDialog(): void {
        const step = this.steps[this.currentStepIndex];
        this.currentLineIndex += 1;

        if (this.currentLineIndex < step.lines.length) {
            this.showCurrentLine(step);
            return;
        }

        // Step complete
        this.currentStepIndex += 1;
        this.currentLineIndex = 0;
        this.active = false;
        this.awaitingInput = false;
        this.container.setVisible(false);
        this.onResume();

        // Check if next step is also immediate
        if (this.currentStepIndex < this.steps.length) {
            const nextStep = this.steps[this.currentStepIndex];
            if (nextStep.trigger === "immediate") {
                this.scene.time.delayedCall(400, () => {
                    this.tryAdvance();
                });
            }
        }
    }
}
