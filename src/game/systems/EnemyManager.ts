import { Scene } from "phaser";
import { ENEMY_CONFIGS } from "../data/enemyConfigs";
import { SpawnPoint } from "../types/enemy";
import { EnemyBase } from "../entities/enemies/EnemyBase";
import { ScoutEnemy } from "../entities/enemies/ScoutEnemy";
import { SpitterEnemy } from "../entities/enemies/SpitterEnemy";
import { BruteEnemy } from "../entities/enemies/BruteEnemy";
import { Player } from "../entities/player/Player";
import { AcidProjectile } from "../entities/projectiles/AcidProjectile";

type EnemyDeathCallback = (enemy: EnemyBase) => void;

export class EnemyManager {
    private readonly scene: Scene;
    private readonly enemyGroup: Phaser.Physics.Arcade.Group;
    private readonly enemyAttackHitboxGroup: Phaser.Physics.Arcade.Group;
    private readonly projectileGroup: Phaser.Physics.Arcade.Group;
    private readonly enemies: EnemyBase[] = [];
    private readonly attackHitboxOwnerMap = new Map<Phaser.GameObjects.Zone, EnemyBase>();
    private readonly onEnemyDeath: EnemyDeathCallback;

    constructor(
        scene: Scene,
        platforms: Phaser.Physics.Arcade.StaticGroup,
        spawnPoints: SpawnPoint[],
        onEnemyDeath: EnemyDeathCallback
    ) {
        this.scene = scene;
        this.onEnemyDeath = onEnemyDeath;

        this.enemyGroup = scene.physics.add.group({
            allowGravity: true,
            collideWorldBounds: true
        });

        this.enemyAttackHitboxGroup = scene.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        this.projectileGroup = scene.physics.add.group({
            allowGravity: false,
            immovable: false
        });

        scene.physics.add.collider(this.enemyGroup, platforms);
        scene.physics.add.collider(this.projectileGroup, platforms, (_projectile) => {
            _projectile.destroy();
        });

        spawnPoints.forEach((spawn) => this.spawnEnemy(spawn));
    }

    update(player: Player, time: number, delta: number): void {
        for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
            const enemy = this.enemies[i];
            if (!enemy.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            enemy.updateBehavior(player, time, delta);
        }
    }

    getEnemyGroup(): Phaser.Physics.Arcade.Group {
        return this.enemyGroup;
    }

    getEnemyAttackHitboxGroup(): Phaser.Physics.Arcade.Group {
        return this.enemyAttackHitboxGroup;
    }

    getProjectileGroup(): Phaser.Physics.Arcade.Group {
        return this.projectileGroup;
    }

    resolveHitboxOwner(hitbox: Phaser.GameObjects.GameObject): EnemyBase | null {
        return this.attackHitboxOwnerMap.get(hitbox as Phaser.GameObjects.Zone) ?? null;
    }

    private spawnEnemy(spawn: SpawnPoint): void {
        const config = ENEMY_CONFIGS[spawn.kind];
        let enemy: EnemyBase;

        if (spawn.kind === "scout") {
            enemy = new ScoutEnemy(
                this.scene,
                config,
                spawn.x,
                spawn.y,
                spawn.patrolMinX,
                spawn.patrolMaxX,
                this.handleEnemyDeath
            );
        } else if (spawn.kind === "spitter") {
            enemy = new SpitterEnemy(
                this.scene,
                config,
                spawn.x,
                spawn.y,
                spawn.patrolMinX,
                spawn.patrolMaxX,
                this.handleEnemyDeath,
                this.spawnAcidProjectile
            );
        } else {
            enemy = new BruteEnemy(
                this.scene,
                config,
                spawn.x,
                spawn.y,
                spawn.patrolMinX,
                spawn.patrolMaxX,
                this.handleEnemyDeath
            );
        }

        this.enemies.push(enemy);
        this.enemyGroup.add(enemy);

        const hitbox = enemy.getAttackHitbox();
        this.enemyAttackHitboxGroup.add(hitbox);
        this.attackHitboxOwnerMap.set(hitbox, enemy);
    }

    private spawnAcidProjectile = (
        fromX: number,
        fromY: number,
        targetX: number,
        targetY: number,
        damage: number,
        speed: number,
        lifetime: number
    ): void => {
        const projectile = new AcidProjectile(this.scene, fromX, fromY);
        this.projectileGroup.add(projectile);
        projectile.launch(targetX, targetY, speed, damage, lifetime);
    };

    private handleEnemyDeath = (enemy: EnemyBase): void => {
        this.onEnemyDeath(enemy);
        this.attackHitboxOwnerMap.delete(enemy.getAttackHitbox());
    };
}
