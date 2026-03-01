import { Physics, Scene } from "phaser";
import { ASSET_KEYS } from "../../constants/assetKeys";
import { getPlayerAnimationKey, PlayerAnimationAction } from "../../animations/playerAnimations";
import { GROWTH_STAGE_SCALES } from "../../data/growthConfig";
import { GrowthStage } from "../../types/progression";

const BODY_WIDTH_RATIO = 0.56;
const BODY_HEIGHT_RATIO = 0.62;
const BODY_BOTTOM_TRIM_RATIO = 0.08;

export class Player extends Physics.Arcade.Sprite {
    private growthStage: GrowthStage = 0;
    private currentAction: PlayerAnimationAction = "walk";
    private actionLocked = false;
    private lockTimer: Phaser.Time.TimerEvent | null = null;
    private climbing = false;
    private growthTween: Phaser.Tweens.Tween | null = null;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, ASSET_KEYS.PLAYER_LEVEL_1);

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

    setClimbing(value: boolean): void {
        if (this.climbing === value) {
            return;
        }

        this.climbing = value;
        const body = this.body as Physics.Arcade.Body | null;
        if (!body) {
            return;
        }

        if (value) {
            body.setAllowGravity(false);
            this.setVelocity(0, 0);
        } else {
            body.setAllowGravity(true);
        }
    }

    isClimbing(): boolean {
        return this.climbing;
    }

    climbVertical(direction: number, speed: number): void {
        this.setVelocityY(direction * speed);
    }

    respawnAt(x: number, y: number): void {
        this.setPosition(x, y);
        this.setVelocity(0, 0);
        this.actionLocked = false;
        this.lockTimer?.remove(false);
        this.lockTimer = null;
        this.clearTint();
        this.setAlpha(1);
        this.growthTween?.stop();
        this.growthTween = null;
        this.setScale(GROWTH_STAGE_SCALES[this.growthStage]);
        this.playAction("walk", true);
    }

    getFacingDirection(): number {
        return this.flipX ? -1 : 1;
    }

    setGrowthStage(stage: GrowthStage): void {
        if (!this.active || !this.scene?.sys?.isActive()) {
            return;
        }

        this.growthStage = stage;
        if (!this.scene.textures.exists(ASSET_KEYS.PLAYER_LEVEL_1)) {
            return;
        }

        this.setTexture(ASSET_KEYS.PLAYER_LEVEL_1, 0);
        this.refreshVisual();
        this.playAction(this.currentAction, true);
    }

    playGrowthEffect(): void {
        const baseScale = GROWTH_STAGE_SCALES[this.growthStage];
        this.growthTween?.stop();
        this.growthTween = this.scene.tweens.add({
            targets: this,
            scaleX: baseScale * 1.08,
            scaleY: baseScale * 1.08,
            duration: 110,
            yoyo: true,
            ease: "Sine.easeOut",
            onStart: () => this.setTint(0xa8ffef),
            onComplete: () => {
                this.clearTint();
                this.setScale(baseScale);
                this.growthTween = null;
            }
        });
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
        this.setScale(GROWTH_STAGE_SCALES[this.growthStage]);
        this.refreshBodySize();
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

    private getCurrentTextureKey(): string {
        return ASSET_KEYS.PLAYER_LEVEL_1;
    }
}
