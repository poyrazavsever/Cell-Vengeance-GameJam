import { EnemyBase } from "./EnemyBase";
import { Player } from "../player/Player";
import { EnemyState } from "../../types/combat";
import { EnemyConfig } from "../../types/enemy";

export class ScoutEnemy extends EnemyBase {
    private hasCommittedAttack = false;
    private readonly baseScaleX: number;
    private readonly baseScaleY: number;

    constructor(
        scene: Phaser.Scene,
        config: EnemyConfig,
        x: number,
        y: number,
        patrolMinX: number,
        patrolMaxX: number,
        onDeath: (enemy: EnemyBase) => void
    ) {
        super(scene, "scout", config, x, y, patrolMinX, patrolMaxX, onDeath);
        this.baseScaleX = this.scaleX;
        this.baseScaleY = this.scaleY;
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

            case "detect": {
                this.playAnimation("detect");
                this.faceTowards(player.x);
                const chaseDirection = player.x >= this.x ? 1 : -1;
                this.setVelocityX(chaseDirection * (this.config.chaseSpeed ?? this.config.patrolSpeed));
                const closeEnough = Math.abs(player.x - this.x) <= 70;
                if (closeEnough || this.getStateElapsed(time) >= 360) {
                    this.setBehaviorState("telegraph", time);
                }
                break;
            }

            case "telegraph":
                this.setVelocityX(0);
                if (this.getStateElapsed(time) >= this.config.telegraphDuration) {
                    this.setBehaviorState("attack", time);
                }
                break;

            case "attack":
                if (!this.hasCommittedAttack) {
                    this.hasCommittedAttack = true;
                    this.attackDirection = player.x >= this.x ? 1 : -1;
                    const attackSpeed = (this.config.attackDistance ?? 200) / (this.config.attackDuration / 1000);
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

            case "recover":
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
            this.hasCommittedAttack = false;
        }

        if (nextState === "telegraph") {
            this.playAnimation("detect");
            this.setTint(0xffe066);
            this.setScale(this.baseScaleX * 0.9, this.baseScaleY * 1.05);
            return;
        }

        if (nextState === "attack") {
            this.playAnimation("attack");
            this.playEnemySfx("attack", 0.35);
            this.clearTint();
            this.setScale(this.baseScaleX, this.baseScaleY);
            return;
        }

        if (nextState === "recover") {
            this.playAnimation("recover");
            this.clearTint();
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
