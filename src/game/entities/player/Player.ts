import { Physics, Scene } from "phaser";
import { PLAYER_EVOLUTION_TEXTURES } from "../../constants/assetKeys";
import { getPlayerAnimationKey, PlayerAnimationAction } from "../../animations/playerAnimations";

const BASE_SCALE = 0.32;
const BODY_WIDTH_RATIO = 0.56;
const BODY_HEIGHT_RATIO = 0.62;
const BODY_BOTTOM_TRIM_RATIO = 0.08;

export class Player extends Physics.Arcade.Sprite {
    private evolutionLevel = 0;
    private currentAction: PlayerAnimationAction = "walk";
    private actionLocked = false;
    private lockTimer: Phaser.Time.TimerEvent | null = null;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, PLAYER_EVOLUTION_TEXTURES[0]);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0.05);
        this.refreshVisual();
        this.playAction("walk", true);
    }

    moveHorizontal(direction: number, speed: number): void {
        this.setVelocityX(direction * speed);

        if (direction !== 0) {
            this.setFlipX(direction < 0);
        }
    }

    jump(power: number): void {
        this.setVelocityY(-power);
    }

    applyKnockback(horizontal: number, vertical: number): void {
        this.setVelocity(horizontal, vertical);
    }

    respawnAt(x: number, y: number): void {
        this.setPosition(x, y);
        this.setVelocity(0, 0);
        this.actionLocked = false;
        this.lockTimer?.remove(false);
        this.lockTimer = null;
        this.clearTint();
        this.setAlpha(1);
        this.playAction("walk", true);
    }

    getFacingDirection(): number {
        return this.flipX ? -1 : 1;
    }

    updateEvolution(level: number): void {
        this.evolutionLevel = Phaser.Math.Clamp(level, 0, PLAYER_EVOLUTION_TEXTURES.length - 1);
        this.setTexture(PLAYER_EVOLUTION_TEXTURES[this.evolutionLevel], 0);
        this.refreshVisual();
        this.playAction(this.currentAction, true);
    }

    playAction(action: PlayerAnimationAction, force = false): void {
        if (this.actionLocked && !force) {
            return;
        }

        const key = getPlayerAnimationKey(this.getCurrentTextureKey(), action);
        if (!this.scene.anims.exists(key)) {
            return;
        }

        const isSameAnimation = this.anims.currentAnim?.key === key && this.anims.isPlaying;
        if (isSameAnimation && !force) {
            return;
        }

        this.currentAction = action;
        this.play(key, true);
    }

    playLockedAction(action: PlayerAnimationAction, durationMs: number): void {
        this.actionLocked = true;
        this.playAction(action, true);

        this.lockTimer?.remove(false);
        this.lockTimer = this.scene.time.delayedCall(durationMs, () => {
            this.actionLocked = false;
            this.lockTimer = null;
        });
    }

    showRestFrame(): void {
        if (this.actionLocked) {
            return;
        }

        this.currentAction = "walk";
        this.anims.stop();
        this.setFrame(0);
    }

    isActionLocked(): boolean {
        return this.actionLocked;
    }

    private refreshVisual(): void {
        const scale = BASE_SCALE + this.evolutionLevel * 0.015;
        this.setScale(scale);
        this.refreshBodySize();
    }

    private getCurrentTextureKey(): string {
        return PLAYER_EVOLUTION_TEXTURES[this.evolutionLevel];
    }

    private refreshBodySize(): void {
        const body = this.body as Physics.Arcade.Body | null;
        if (!body) {
            return;
        }

        const frameWidth = this.frame.realWidth;
        const frameHeight = this.frame.realHeight;
        const bodyWidth = frameWidth * BODY_WIDTH_RATIO;
        const bodyHeight = frameHeight * BODY_HEIGHT_RATIO;
        const offsetX = (frameWidth - bodyWidth) * 0.5;
        const offsetY = frameHeight - bodyHeight - frameHeight * BODY_BOTTOM_TRIM_RATIO;

        body.setSize(bodyWidth, bodyHeight);
        body.setOffset(offsetX, offsetY);
    }
}
