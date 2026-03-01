import { EnemyBase } from "./EnemyBase";
import { Player } from "../player/Player";
import { EnemyState } from "../../types/combat";
import { EnemyConfig } from "../../types/enemy";

export class BruteEnemy extends EnemyBase {
    private dashStarted = false;

    constructor(
        scene: Phaser.Scene,
        config: EnemyConfig,
        x: number,
        y: number,
        patrolMinX: number,
        patrolMaxX: number,
        onDeath: (enemy: EnemyBase) => void
    ) {
        super(scene, "brute", config, x, y, patrolMinX, patrolMaxX, onDeath);
    }

    handleBehavior(player: Player, time: number): void {
        switch (this.getState()) {
            case "patrol":
                this.playAnimation("patrol");
                this.movePatrol(this.config.patrolSpeed);
                if (this.isPlayerInDetectRange(player)) {
                    this.setBehaviorState("detect", time);
                }
                break;

            case "detect":
                this.playAnimation("detect");
                this.faceTowards(player.x);
                this.setVelocityX(this.facingDirection * (this.config.chaseSpeed ?? this.config.patrolSpeed));
                this.tryFollowPlayerVertical(player, time, {
                    cooldownMs: 980,
                    jumpPower: 430,
                    minVerticalGap: 18,
                    maxVerticalGap: 560,
                    horizontalSpeed: (this.config.chaseSpeed ?? this.config.patrolSpeed) * 1.2
                });

                const closeEnough = Math.abs(player.x - this.x) <= 110;
                const closeVertical = Math.abs(player.y - this.y) <= 88;
                const body = this.body as Phaser.Physics.Arcade.Body;
                const onGround = Boolean(body.blocked.down || body.touching.down);

                if (onGround && closeEnough && closeVertical) {
                    this.setBehaviorState("telegraph", time);
                    break;
                }

                if (onGround && this.getStateElapsed(time) >= 1150 && closeVertical) {
                    this.setBehaviorState("telegraph", time);
                }
                break;

            case "telegraph":
                this.setVelocityX(0);
                if (this.getStateElapsed(time) >= this.config.telegraphDuration) {
                    this.setBehaviorState("attack", time);
                }
                break;

            case "attack":
                if (!this.dashStarted) {
                    this.dashStarted = true;
                    this.attackDirection = player.x >= this.x ? 1 : -1;
                    const speed = (this.config.attackDistance ?? 420) / (this.config.attackDuration / 1000);
                    this.setVelocityX(this.attackDirection * speed);
                    this.setFlipX(this.attackDirection < 0);
                    if (this.config.attackHitbox) {
                        this.enableAttackHitbox(this.config.attackHitbox, this.config.attackDamage, this.attackDirection);
                    }
                }

                if (this.getStateElapsed(time) >= this.config.attackDuration || this.isDashingIntoWall()) {
                    this.setBehaviorState("recover", time);
                }
                break;

            case "recover":
                this.setVelocityX(0);
                if (this.getStateElapsed(time) >= this.config.recoverDuration) {
                    this.setBehaviorState("patrol", time);
                }
                break;

            case "hit":
                this.setVelocityX(0);
                if (this.getStateElapsed(time) >= this.config.hitDuration) {
                    this.setBehaviorState("recover", time);
                }
                break;

            default:
                break;
        }
    }

    protected onStateChanged(previousState: EnemyState, nextState: EnemyState): void {
        if (previousState === "attack" && nextState !== "attack") {
            this.disableAttackHitbox();
            this.dashStarted = false;
        }

        if (nextState === "telegraph") {
            this.playAnimation("detect");
            this.setTint(0xff5d5d);
            this.scene.cameras.main.shake(120, 0.003);
            return;
        }

        if (nextState === "attack") {
            this.playAnimation("attack");
            this.playEnemySfx("attack", 0.4);
            this.clearTint();
            return;
        }

        if (nextState === "recover") {
            this.playAnimation("recover");
            this.setTint(0x7fc2ff);
            return;
        }

        if (nextState === "patrol") {
            this.playAnimation("patrol");
            this.clearTint();
        }
    }

    private isDashingIntoWall(): boolean {
        const body = this.body as Phaser.Physics.Arcade.Body;
        return body.blocked.left || body.blocked.right;
    }
}
