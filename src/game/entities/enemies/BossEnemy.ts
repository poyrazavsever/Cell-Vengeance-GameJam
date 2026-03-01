import { EnemyBase } from "./EnemyBase";
import { Player } from "../player/Player";
import { ASSET_KEYS } from "../../constants/assetKeys";
import { DamageSource, EnemyState } from "../../types/combat";
import { EnemyConfig } from "../../types/enemy";

type ShootProjectileCallback = (
    fromX: number,
    fromY: number,
    targetX: number,
    targetY: number,
    damage: number,
    speed: number,
    lifetime: number
) => void;

type SummonMinionsCallback = (x: number, y: number) => void;
type CanSummonMinionsCallback = () => boolean;

export class BossEnemy extends EnemyBase {
    private hasCommittedMelee = false;
    private specialShotsFired = 0;
    private nextSpecialShotAt = 0;
    private summonTriggered = false;
    private lastSpecialAt = -Infinity;
    private lastSummonAt = -Infinity;
    private lastJumpAt = -Infinity;
    private lastWalkSfxAt = -Infinity;
    private readonly shootProjectile: ShootProjectileCallback;
    private readonly summonMinions: SummonMinionsCallback;
    private readonly canSummonMinions: CanSummonMinionsCallback;
    private chargeTween: Phaser.Tweens.Tween | null = null;

    constructor(
        scene: Phaser.Scene,
        config: EnemyConfig,
        x: number,
        y: number,
        patrolMinX: number,
        patrolMaxX: number,
        onDeath: (enemy: EnemyBase) => void,
        shootProjectile: ShootProjectileCallback,
        summonMinions: SummonMinionsCallback,
        canSummonMinions: CanSummonMinionsCallback
    ) {
        super(scene, "boss", config, x, y, patrolMinX, patrolMaxX, onDeath);
        this.shootProjectile = shootProjectile;
        this.summonMinions = summonMinions;
        this.canSummonMinions = canSummonMinions;
    }

    handleBehavior(player: Player, time: number): void {
        const distance = Math.abs(player.x - this.x);
        switch (this.getState()) {
            case "patrol":
                this.playAnimation("patrol");
                this.faceTowards(player.x);
                if (!this.tryFollowPlayerVertical(player, time, {
                    cooldownMs: this.config.jumpCooldownMs ?? 1100,
                    jumpPower: this.config.jumpPower ?? 520,
                    minVerticalGap: 14,
                    maxVerticalGap: 680,
                    horizontalSpeed: (this.config.chaseSpeed ?? this.config.patrolSpeed) * 1.05
                })) {
                    this.setVelocityX(this.facingDirection * (this.config.chaseSpeed ?? this.config.patrolSpeed));
                }
                this.playWalkLoopSfx(time);

                if (this.shouldUseSummon(time)) {
                    this.setBehaviorState("summon", time);
                    return;
                }

                if (distance <= (this.config.meleeRange ?? 96)) {
                    this.setBehaviorState("telegraph", time);
                    return;
                }

                if (this.shouldUseSpecial(distance, time)) {
                    this.setBehaviorState("special", time);
                    return;
                }

                if (distance > (this.config.meleeRange ?? 96) && this.shouldJumpApproach(time)) {
                    this.setBehaviorState("detect", time);
                }
                break;

            case "detect": {
                this.playAnimation("detect");
                this.faceTowards(player.x);
                this.tryFollowPlayerVertical(player, time, {
                    cooldownMs: 560,
                    jumpPower: (this.config.jumpPower ?? 520) + 30,
                    minVerticalGap: 12,
                    maxVerticalGap: 720,
                    horizontalSpeed: (this.config.chaseSpeed ?? this.config.patrolSpeed) * 1.15
                });
                const body = this.body as Phaser.Physics.Arcade.Body;
                if ((body.blocked.down || body.touching.down) && this.getStateElapsed(time) >= 180) {
                    this.setBehaviorState("patrol", time);
                }
                break;
            }

            case "telegraph":
                this.setVelocityX(0);
                this.faceTowards(player.x);
                if (this.getStateElapsed(time) >= this.config.telegraphDuration) {
                    this.setBehaviorState("attack", time);
                }
                break;

            case "attack":
                if (!this.hasCommittedMelee) {
                    this.hasCommittedMelee = true;
                    this.attackDirection = player.x >= this.x ? 1 : -1;
                    const attackDistance = this.config.attackDistance ?? 210;
                    const attackSpeed = attackDistance / (this.config.attackDuration / 1000);
                    this.setVelocityX(this.attackDirection * attackSpeed);
                    this.setFlipX(this.attackDirection < 0);
                    if (this.config.attackHitbox) {
                        this.enableAttackHitbox(this.config.attackHitbox, this.config.attackDamage, this.attackDirection);
                    }
                }

                if (this.getStateElapsed(time) >= this.config.attackDuration) {
                    this.setBehaviorState("recover", time);
                }
                break;

            case "special":
                this.setVelocityX(0);
                this.faceTowards(player.x);
                if (
                    this.specialShotsFired < (this.config.burstShots ?? 5)
                    && time >= this.nextSpecialShotAt
                ) {
                    this.specialShotsFired += 1;
                    this.playBossCue(ASSET_KEYS.SFX_BOSS_ATTACK, 0.5);
                    this.shootProjectile(
                        this.x + this.facingDirection * 38,
                        this.y - 18,
                        player.x,
                        player.y - 20,
                        this.config.attackDamage,
                        this.config.projectileSpeed ?? 260,
                        this.config.projectileLifetime ?? 2500
                    );
                    this.nextSpecialShotAt = time + (this.config.burstIntervalMs ?? 160);
                }

                if (this.getStateElapsed(time) >= this.config.attackDuration) {
                    this.setBehaviorState("recover", time);
                }
                break;

            case "summon":
                this.setVelocityX(0);
                this.faceTowards(player.x);
                if (!this.summonTriggered && this.getStateElapsed(time) >= 360) {
                    this.summonTriggered = true;
                    this.summonMinions(this.x, this.y);
                }
                if (this.getStateElapsed(time) >= this.config.attackDuration) {
                    this.setBehaviorState("recover", time);
                }
                break;

            case "recover":
                this.playAnimation("recover");
                this.setVelocityX(0);
                if (this.getStateElapsed(time) >= this.config.recoverDuration) {
                    this.setBehaviorState("patrol", time);
                }
                break;

            case "hit":
                this.setVelocityX(0);
                if (this.getStateElapsed(time) >= this.config.hitDuration) {
                    this.setBehaviorState("patrol", time);
                }
                break;

            default:
                break;
        }
    }

    protected onStateChanged(previousState: EnemyState, nextState: EnemyState): void {
        if (previousState === "attack" && nextState !== "attack") {
            this.disableAttackHitbox();
            this.hasCommittedMelee = false;
        }

        if (previousState === "special" && nextState !== "special") {
            this.specialShotsFired = 0;
            this.nextSpecialShotAt = 0;
            this.lastSpecialAt = this.scene.time.now;
        }

        if (previousState === "summon" && nextState !== "summon") {
            this.summonTriggered = false;
            this.lastSummonAt = this.scene.time.now;
        }

        if (nextState === "detect") {
            this.playAnimation("detect");
            this.playEnemySfx("jump", 0.36);
            this.lastJumpAt = this.scene.time.now;
            this.clearChargeEffect();
            this.clearTint();
            this.faceTowards(this.x + this.facingDirection);
            this.setVelocityX(this.facingDirection * ((this.config.chaseSpeed ?? this.config.patrolSpeed) * 1.08));
            this.setVelocityY(-(this.config.jumpPower ?? 520));
            return;
        }

        if (nextState === "telegraph") {
            this.playAnimation("detect");
            this.clearChargeEffect();
            this.setTint(0xffc26e);
            return;
        }

        if (nextState === "attack") {
            this.playAnimation("attack");
            this.playEnemySfx("attack", 0.45);
            this.clearChargeEffect();
            this.clearTint();
            return;
        }

        if (nextState === "special") {
            this.playAnimation("special");
            this.playEnemySfx("attack", 0.42);
            this.startChargeEffect(0x9fffc2, 4, 130, 0.03);
            this.scene.cameras.main.shake(120, 0.0018);
            this.specialShotsFired = 0;
            this.nextSpecialShotAt = this.scene.time.now + (this.config.burstStartDelayMs ?? 260);
            return;
        }

        if (nextState === "summon") {
            this.playAnimation("summon");
            this.playBossCue(ASSET_KEYS.SFX_BOSS_SCREAM, 0.62);
            this.startChargeEffect(0xff8b8b, 5, 150, 0.05);
            this.scene.cameras.main.shake(180, 0.0032);
            this.summonTriggered = false;
            return;
        }

        if (nextState === "recover") {
            this.playAnimation("recover");
            this.clearChargeEffect();
            this.clearTint();
            return;
        }

        if (nextState === "patrol") {
            this.playAnimation("patrol");
            this.clearChargeEffect();
            this.clearTint();
        }
    }

    private shouldUseSpecial(distance: number, time: number): boolean {
        const minRange = this.config.specialMinRange ?? 190;
        const maxRange = this.config.specialMaxRange ?? 560;
        const cooldown = this.config.specialCooldownMs ?? 4200;
        return distance >= minRange && distance <= maxRange && time >= this.lastSpecialAt + cooldown;
    }

    private shouldUseSummon(time: number): boolean {
        const cooldown = this.config.summonCooldownMs ?? 7800;
        return this.canSummonMinions() && time >= this.lastSummonAt + cooldown;
    }

    private shouldJumpApproach(time: number): boolean {
        const body = this.body as Phaser.Physics.Arcade.Body;
        const cooldown = this.config.jumpCooldownMs ?? 1100;
        return (body.blocked.down || body.touching.down) && time >= this.lastJumpAt + cooldown;
    }

    private playWalkLoopSfx(time: number): void {
        const body = this.body as Phaser.Physics.Arcade.Body | null;
        if (!body) {
            return;
        }

        const grounded = Boolean(body.blocked.down || body.touching.down);
        if (!grounded || Math.abs(body.velocity.x) < 28) {
            return;
        }

        if (time < this.lastWalkSfxAt + 420) {
            return;
        }

        this.lastWalkSfxAt = time;
        this.playEnemySfx("walk", 0.22);
    }

    takeDamage(amount: number, source: DamageSource, time: number): boolean {
        const applied = super.takeDamage(amount, source, time);
        if (applied && this.isAlive()) {
            this.playBossCue(ASSET_KEYS.SFX_BOSS_DAMAGE, 0.45);
        }

        return applied;
    }

    private startChargeEffect(color: number, repeat: number, duration: number, scaleBoost: number): void {
        this.clearChargeEffect();
        this.setTint(color);
        const baseScaleX = this.scaleX;
        const baseScaleY = this.scaleY;

        this.chargeTween = this.scene.tweens.add({
            targets: this,
            alpha: 0.72,
            scaleX: baseScaleX * (1 + scaleBoost),
            scaleY: baseScaleY * (1 + scaleBoost),
            duration,
            yoyo: true,
            repeat,
            ease: "Sine.easeInOut",
            onComplete: () => {
                this.setAlpha(1);
                this.setScale(baseScaleX, baseScaleY);
                this.chargeTween = null;
            }
        });
    }

    private clearChargeEffect(): void {
        this.chargeTween?.stop();
        this.chargeTween = null;
        this.setAlpha(1);
    }

    private playBossCue(key: string, volume: number): void {
        if (!this.scene.cache.audio.exists(key)) {
            return;
        }

        this.scene.sound.play(key, { volume });
    }
}
