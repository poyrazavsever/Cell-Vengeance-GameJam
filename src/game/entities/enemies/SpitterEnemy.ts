import { EnemyBase } from "./EnemyBase";
import { Player } from "../player/Player";
import { EnemyState } from "../../types/combat";
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

export class SpitterEnemy extends EnemyBase {
    private burstShotsFired = 0;
    private nextBurstShotAt = 0;
    private readonly baseScaleX: number;
    private readonly baseScaleY: number;
    private readonly shootProjectile: ShootProjectileCallback;

    constructor(
        scene: Phaser.Scene,
        config: EnemyConfig,
        x: number,
        y: number,
        patrolMinX: number,
        patrolMaxX: number,
        onDeath: (enemy: EnemyBase) => void,
        shootProjectile: ShootProjectileCallback
    ) {
        super(scene, "spitter", config, x, y, patrolMinX, patrolMaxX, onDeath);
        this.baseScaleX = this.scaleX;
        this.baseScaleY = this.scaleY;
        this.shootProjectile = shootProjectile;
    }

    handleBehavior(player: Player, time: number, _delta: number): void {
        switch (this.getState()) {
            case "patrol": {
                this.playAnimation("patrol");
                this.faceTowards(player.x);
                const chaseDirection = player.x >= this.x ? 1 : -1;
                this.setVelocityX(chaseDirection * this.config.patrolSpeed);
                this.tryFollowPlayerVertical(player, time, {
                    cooldownMs: 900,
                    jumpPower: 430,
                    minVerticalGap: 16,
                    maxVerticalGap: 520,
                    horizontalSpeed: this.config.patrolSpeed * 1.5
                });
                if (this.isPlayerInDetectRange(player)) {
                    this.setBehaviorState("detect", time);
                }
                break;
            }

            case "detect":
                this.playAnimation("detect");
                this.faceTowards(player.x);
                this.setVelocityX(this.facingDirection * Math.max(16, this.config.patrolSpeed * 0.75));
                this.tryFollowPlayerVertical(player, time, {
                    cooldownMs: 900,
                    jumpPower: 430,
                    minVerticalGap: 16,
                    maxVerticalGap: 520,
                    horizontalSpeed: this.config.patrolSpeed * 1.4
                });
                if (this.getStateElapsed(time) >= 250) {
                    this.setBehaviorState("telegraph", time);
                }
                break;

            case "telegraph":
                this.setVelocityX(0);
                this.faceTowards(player.x);
                if (this.getStateElapsed(time) >= this.config.telegraphDuration) {
                    this.setBehaviorState("attack", time);
                }
                break;

            case "attack":
                this.setVelocityX(0);
                if (
                    this.burstShotsFired < (this.config.burstShots ?? 1)
                    && time >= this.nextBurstShotAt
                ) {
                    this.burstShotsFired += 1;
                    this.shootProjectile(
                        this.x + this.facingDirection * 34,
                        this.y - 6,
                        player.x,
                        player.y,
                        this.config.attackDamage,
                        this.config.projectileSpeed ?? 280,
                        this.config.projectileLifetime ?? 1800
                    );
                    this.nextBurstShotAt = time + (this.config.burstIntervalMs ?? 170);
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
            this.burstShotsFired = 0;
            this.nextBurstShotAt = 0;
        }

        if (nextState === "telegraph") {
            this.playAnimation("detect");
            this.setTint(0xa8ff73);
            this.setScale(this.baseScaleX * 1.12, this.baseScaleY * 1.12);
            return;
        }

        if (nextState === "attack") {
            this.playAnimation("attack");
            this.playEnemySfx("attack", 0.35);
            this.clearTint();
            this.setScale(this.baseScaleX, this.baseScaleY);
            this.burstShotsFired = 0;
            this.nextBurstShotAt = this.scene.time.now + (this.config.burstStartDelayMs ?? 140);
            return;
        }

        if (nextState === "recover") {
            this.playAnimation("recover");
            this.setTint(0x6edfb2);
            this.setScale(this.baseScaleX, this.baseScaleY);
            return;
        }

        if (nextState === "patrol") {
            this.playAnimation("patrol");
            this.clearTint();
            this.setScale(this.baseScaleX, this.baseScaleY);
        }
    }
}
