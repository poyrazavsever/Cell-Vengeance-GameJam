import { Physics, Scene } from "phaser";
import { EnemyAnimationAction, getEnemyAnimationKey, getEnemyTextureKey } from "../../animations/enemyAnimations";
import { ENEMY_SFX_KEYS, EnemySfxAction } from "../../constants/assetKeys";
import { DamageSource, EnemyKind, EnemyState } from "../../types/combat";
import { AttackHitboxConfig, EnemyConfig } from "../../types/enemy";
import { Player } from "../player/Player";

type EnemyDeathHandler = (enemy: EnemyBase) => void;

const ENEMY_BASE_SCALE = 0.42;
const ENEMY_BODY_WIDTH_RATIO = 0.56;
const ENEMY_BODY_HEIGHT_RATIO = 0.66;
const ENEMY_BODY_BOTTOM_TRIM_RATIO = 0.07;

export abstract class EnemyBase extends Physics.Arcade.Sprite {
    readonly kind: EnemyKind;
    readonly config: EnemyConfig;

    protected patrolMinX: number;
    protected patrolMaxX: number;
    protected spawnX: number;
    protected spawnY: number;
    protected facingDirection = 1;
    protected behaviorState: EnemyState = "patrol";
    protected stateStartedAt = 0;
    protected health: number;
    protected attackDirection = 1;

    private attackHitbox: Phaser.GameObjects.Zone;
    private attackHitboxBody: Physics.Arcade.Body;
    private attackHitboxOffsetX = 0;
    private attackHitboxOffsetY = 0;
    private attackHitboxDamage = 0;
    private attackHitboxEnabled = false;
    private nextContactDamageAt = 0;
    private deathHandler: EnemyDeathHandler | null;
    private isDead = false;

    constructor(
        scene: Scene,
        kind: EnemyKind,
        config: EnemyConfig,
        x: number,
        y: number,
        patrolMinX: number,
        patrolMaxX: number,
        deathHandler: EnemyDeathHandler
    ) {
        super(scene, x, y, getEnemyTextureKey(kind), 0);

        this.kind = kind;
        this.config = config;
        this.health = config.maxHealth;
        this.patrolMinX = patrolMinX;
        this.patrolMaxX = patrolMaxX;
        this.spawnX = x;
        this.spawnY = y;
        this.deathHandler = deathHandler;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(ENEMY_BASE_SCALE);
        this.setCollideWorldBounds(true);
        this.setBounce(0);
        this.refreshBodySize();
        this.playAnimation("patrol");

        this.attackHitbox = scene.add.zone(x, y, 1, 1);
        scene.physics.add.existing(this.attackHitbox);
        this.attackHitboxBody = this.attackHitbox.body as Physics.Arcade.Body;
        this.attackHitboxBody.setAllowGravity(false);
        this.attackHitboxBody.setImmovable(true);
        this.attackHitboxBody.enable = false;
        this.attackHitbox.setActive(false).setVisible(false);

        this.setBehaviorState("patrol", scene.time.now);
    }

    updateBehavior(player: Player, time: number, delta: number): void {
        if (!this.active || this.isDead) {
            return;
        }

        this.handleBehavior(player, time, delta);
        this.syncAttackHitboxPosition();
    }

    abstract handleBehavior(player: Player, time: number, delta: number): void;

    takeDamage(amount: number, _source: DamageSource, time: number): boolean {
        if (this.isDead || amount <= 0 || !this.canTakeDamage()) {
            return false;
        }

        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.die(time);
            return true;
        }

        this.setBehaviorState("hit", time);
        this.playAnimation("hit");
        this.playEnemySfx("hit", 0.35);
        this.setVelocityX(0);
        this.setTintFill(0xffffff);
        this.scene.time.delayedCall(90, () => {
            if (this.active && !this.isDead) {
                this.clearTint();
            }
        });
        return true;
    }

    canDealContactDamage(now: number): boolean {
        if (this.isDead || this.config.contactDamage <= 0) {
            return false;
        }

        if (!(this.behaviorState === "patrol" || this.behaviorState === "detect")) {
            return false;
        }

        return now >= this.nextContactDamageAt;
    }

    markContactDamageDealt(now: number): void {
        this.nextContactDamageAt = now + this.config.contactCooldown;
    }

    getContactDamage(): number {
        return this.config.contactDamage;
    }

    getAttackDamage(): number {
        return this.attackHitboxDamage;
    }

    getAttackHitbox(): Phaser.GameObjects.Zone {
        return this.attackHitbox;
    }

    isAttackHitboxActive(): boolean {
        return this.attackHitboxEnabled && this.attackHitboxBody.enable && this.attackHitbox.active;
    }

    getDropCellPoints(): number {
        return this.config.dropCellPoints;
    }

    isAlive(): boolean {
        return !this.isDead;
    }

    isInState(state: EnemyState): boolean {
        return this.behaviorState === state;
    }

    getState(): EnemyState {
        return this.behaviorState;
    }

    getStateElapsed(time: number): number {
        return time - this.stateStartedAt;
    }

    protected setBehaviorState(nextState: EnemyState, time: number): void {
        if (this.behaviorState === nextState) {
            return;
        }

        const previousState = this.behaviorState;
        if (previousState === "attack") {
            this.disableAttackHitbox();
        }

        this.behaviorState = nextState;
        this.stateStartedAt = time;
        this.onStateChanged(previousState, nextState, time);
    }

    protected onStateChanged(_previousState: EnemyState, _nextState: EnemyState, _time: number): void {
        // Subclasses can override.
    }

    protected faceTowards(targetX: number): void {
        this.facingDirection = targetX >= this.x ? 1 : -1;
        this.setFlipX(this.facingDirection < 0);
    }

    protected movePatrol(speed: number): void {
        if (this.x <= this.patrolMinX) {
            this.facingDirection = 1;
        } else if (this.x >= this.patrolMaxX) {
            this.facingDirection = -1;
        }

        this.setVelocityX(this.facingDirection * speed);
        this.setFlipX(this.facingDirection < 0);
    }

    protected isPlayerInDetectRange(player: Player): boolean {
        return Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) <= this.config.detectRange;
    }

    protected playEnemySfx(action: EnemySfxAction, volume = 0.3): void {
        const sfxMap = ENEMY_SFX_KEYS[this.kind];
        if (!sfxMap) {
            return;
        }

        const key = sfxMap[action];
        if (key && this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key, { volume });
        }
    }

    protected playAnimation(action: EnemyAnimationAction): void {
        const key = getEnemyAnimationKey(this.kind, action);
        if (this.scene.anims.exists(key)) {
            this.play(key, true);
        }
    }

    protected enableAttackHitbox(config: AttackHitboxConfig, damage: number, direction = this.facingDirection): void {
        this.attackDirection = direction >= 0 ? 1 : -1;
        this.attackHitboxDamage = damage;
        this.attackHitboxOffsetX = Math.abs(config.offsetX) * this.attackDirection;
        this.attackHitboxOffsetY = config.offsetY;
        this.attackHitboxBody.setSize(config.width, config.height);
        this.attackHitbox.setSize(config.width, config.height);
        this.attackHitboxBody.enable = true;
        this.attackHitbox.setActive(true);
        this.attackHitboxEnabled = true;
        this.syncAttackHitboxPosition();
    }

    protected disableAttackHitbox(): void {
        this.attackHitboxEnabled = false;
        this.attackHitboxDamage = 0;
        this.attackHitboxBody.enable = false;
        this.attackHitbox.setActive(false);
    }

    protected canTakeDamage(): boolean {
        if (!this.config.vulnerableOnlyInRecover) {
            return true;
        }

        return this.behaviorState === "recover" || this.behaviorState === "hit";
    }

    private die(time: number): void {
        if (this.isDead) {
            return;
        }

        this.isDead = true;
        this.behaviorState = "death";
        this.stateStartedAt = time;
        this.playAnimation("death");
        this.playEnemySfx("hit", 0.4);
        this.disableAttackHitbox();
        this.setVelocity(0, 0);
        (this.body as Physics.Arcade.Body).enable = false;
        this.clearTint();

        this.spawnDeathBurst();
        this.deathHandler?.(this);
        this.deathHandler = null;

        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scaleX: this.scaleX * 0.72,
            scaleY: this.scaleY * 0.72,
            duration: 320,
            onComplete: () => {
                this.attackHitbox.destroy();
                this.destroy();
            }
        });
    }

    private syncAttackHitboxPosition(): void {
        this.attackHitbox.setPosition(this.x + this.attackHitboxOffsetX, this.y + this.attackHitboxOffsetY);
    }

    private spawnDeathBurst(): void {
        if (!this.scene.textures.exists("cell-point")) {
            return;
        }

        const particles = this.scene.add.particles(this.x, this.y, "cell-point", {
            lifespan: 260,
            speed: { min: 80, max: 180 },
            scale: { start: 0.55, end: 0 },
            quantity: 10,
            emitting: false
        });
        particles.explode(10, this.x, this.y);
        this.scene.time.delayedCall(280, () => particles.destroy());
    }

    private refreshBodySize(): void {
        const body = this.body as Physics.Arcade.Body;
        const frameWidth = this.frame.realWidth;
        const frameHeight = this.frame.realHeight;
        const bodyWidth = frameWidth * ENEMY_BODY_WIDTH_RATIO;
        const bodyHeight = frameHeight * ENEMY_BODY_HEIGHT_RATIO;
        const offsetX = (frameWidth - bodyWidth) * 0.5;
        const offsetY = frameHeight - bodyHeight - frameHeight * ENEMY_BODY_BOTTOM_TRIM_RATIO;

        body.setSize(bodyWidth, bodyHeight);
        body.setOffset(offsetX, offsetY);
    }
}
