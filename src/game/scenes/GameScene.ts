import { Input, Physics, Scene } from "phaser";
import { createEnemyAnimations } from "../animations/enemyAnimations";
import { createPlayerAnimations } from "../animations/playerAnimations";
import { ASSET_KEYS } from "../constants/assetKeys";
import { EVENT_KEYS } from "../constants/eventKeys";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { getLevelById } from "../data/levels";
import { LevelDoor } from "../entities/level/LevelDoor";
import { EnemyBase } from "../entities/enemies/EnemyBase";
import { AcidProjectile } from "../entities/projectiles/AcidProjectile";
import { Player } from "../entities/player/Player";
import { EventBus } from "../EventBus";
import { gameState } from "../state/GameState";
import { EnemyManager } from "../systems/EnemyManager";
import { DamageSource } from "../types/combat";
import { LevelDefinition } from "../types/level";
import { LevelId } from "../types/progression";

interface MovementKeys extends Phaser.Types.Input.Keyboard.CursorKeys {
    leftAlt: Phaser.Input.Keyboard.Key;
    rightAlt: Phaser.Input.Keyboard.Key;
    jumpAlt: Phaser.Input.Keyboard.Key;
    dash: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
    debugCollect: Phaser.Input.Keyboard.Key;
}

interface GameSceneData {
    levelId?: LevelId;
}

const PLAYER_ATTACK_DURATION_MS = 140;
const WORLD_HEIGHT = 768;

export class GameScene extends Scene {
    private cursors!: MovementKeys;
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private pickups!: Phaser.Physics.Arcade.Group;
    private enemyManager!: EnemyManager;

    private playerAttackHitbox!: Phaser.GameObjects.Zone;
    private playerAttackHitboxBody!: Physics.Arcade.Body;
    private playerAttackActive = false;
    private hitEnemiesInCurrentSwing = new Set<EnemyBase>();
    private attackDamage = 1;

    private level!: LevelDefinition;
    private levelDoor!: LevelDoor;
    private doorHintText!: Phaser.GameObjects.Text;
    private isCompletingLevel = false;

    private unsubscribeState: (() => void) | null = null;
    private previousEvolution = 0;
    private walkSound: Phaser.Sound.BaseSound | null = null;

    constructor() {
        super(SCENE_KEYS.GAME);
    }

    init(data: GameSceneData): void {
        const snapshot = gameState.getSnapshot();
        const requestedLevel = data.levelId ?? snapshot.profile.selectedLevel;
        const levelId = gameState.canPlayLevel(requestedLevel) ? requestedLevel : snapshot.profile.unlockedLevel;
        this.level = getLevelById(levelId);
    }

    create(): void {
        gameState.startLevel(this.level.id);

        this.physics.world.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);
        this.cameras.main.setBounds(0, 0, this.level.worldWidth, WORLD_HEIGHT);

        this.drawBackground();
        this.createRuntimeTextures();
        createPlayerAnimations(this);
        createEnemyAnimations(this);

        this.createLevel();
        this.createPlayer();
        this.createInput();
        this.createCharacterSfx();
        this.createPickups();
        this.createPlayerAttackHitbox();
        this.createEnemyManager();
        this.createDoor();
        this.bindCombat();
        this.bindProgressState();
        this.configureCamera();
        this.ensureHudScene();

        this.add.text(20, 152, "A/D or Left/Right: Move | J: Attack | Space/W: Jump | Shift: Dash", {
            color: "#d7f6ff",
            fontFamily: "Verdana",
            fontSize: "18px"
        }).setDepth(10).setScrollFactor(0);

        this.doorHintText = this.add.text(512, 188, "Kapiya girmek icin Up bas", {
            color: "#c8f7ff",
            fontFamily: "Verdana",
            fontSize: "19px",
            backgroundColor: "#123546",
            padding: { left: 10, right: 10, top: 6, bottom: 6 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(12).setVisible(false);

        EventBus.emit(EVENT_KEYS.LEVEL_STARTED, { levelId: this.level.id, name: this.level.name });
        EventBus.emit(EVENT_KEYS.CURRENT_SCENE_READY, this);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopWalkSfx();
            this.walkSound?.destroy();
            this.walkSound = null;
            this.playerAttackHitbox.destroy();
            this.levelDoor.destroy();
            this.unsubscribeState?.();
            this.unsubscribeState = null;
        });
    }

    update(time: number, delta: number): void {
        this.handlePlayerInput();
        this.enemyManager.update(this.player, time, delta);
        this.updatePlayerAttackHitboxPosition();
        this.updateWalkSound();
        this.updateInvulnerabilityVisual(time);
        this.updateDoorInteraction();
    }

    private handlePlayerInput(): void {
        const snapshot = gameState.getSnapshot();
        const stats = snapshot.stats;
        let direction = 0;

        if (this.cursors.left.isDown || this.cursors.leftAlt.isDown) {
            direction = -1;
        } else if (this.cursors.right.isDown || this.cursors.rightAlt.isDown) {
            direction = 1;
        }

        const canDash = stats.evolutionLevel >= 2;
        const dashBonus = canDash && this.cursors.dash.isDown && direction !== 0 ? stats.dashBonus : 0;
        this.player.moveHorizontal(direction, stats.moveBase + dashBonus);

        if (Input.Keyboard.JustDown(this.cursors.attack)) {
            this.triggerPlayerAttack();
        }

        const onGround = Boolean(this.player.body?.blocked.down || this.player.body?.touching.down);
        const jumpPressed =
            Input.Keyboard.JustDown(this.cursors.up) ||
            Input.Keyboard.JustDown(this.cursors.space) ||
            Input.Keyboard.JustDown(this.cursors.jumpAlt);

        if (onGround && jumpPressed) {
            this.player.jump(stats.jumpPower);
            this.playSfxOnce(ASSET_KEYS.SFX_PLAYER_JUMP, 0.4);
        }

        if (!this.player.isActionLocked()) {
            if (!onGround) {
                this.player.playAction("jump");
            } else if (Math.abs(this.player.body?.velocity.x ?? 0) > 2) {
                this.player.playAction("walk");
            } else {
                this.player.showRestFrame();
            }
        }

        if (Input.Keyboard.JustDown(this.cursors.debugCollect)) {
            gameState.addCellPoints(5);
        }
    }

    private createLevel(): void {
        this.platforms = this.physics.add.staticGroup();
        this.level.platformPreset.forEach((platform) => {
            this.platforms.create(platform.x, platform.y, platform.key);
        });
    }

    private createPlayer(): void {
        this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
        this.physics.add.collider(this.player, this.platforms);
    }

    private createEnemyManager(): void {
        this.enemyManager = new EnemyManager(this, this.platforms, this.level.enemySpawns, (enemy) => {
            EventBus.emit(EVENT_KEYS.ENEMY_DIED, {
                kind: enemy.kind,
                x: enemy.x,
                y: enemy.y
            });
            this.spawnCellPointBurst(enemy.x, enemy.y, enemy.getDropCellPoints());
        });
    }

    private createDoor(): void {
        this.levelDoor = new LevelDoor(this, this.level.door.x, this.level.door.y);
        this.levelDoor.setOpen(true);
    }

    private createInput(): void {
        const keyboard = this.input.keyboard;
        if (!keyboard) {
            throw new Error("Keyboard input could not be initialized.");
        }

        const cursors = keyboard.createCursorKeys();
        const altKeys = keyboard.addKeys("A,D,W,SHIFT,J,E") as {
            A: Phaser.Input.Keyboard.Key;
            D: Phaser.Input.Keyboard.Key;
            W: Phaser.Input.Keyboard.Key;
            SHIFT: Phaser.Input.Keyboard.Key;
            J: Phaser.Input.Keyboard.Key;
            E: Phaser.Input.Keyboard.Key;
        };

        this.cursors = {
            ...cursors,
            leftAlt: altKeys.A,
            rightAlt: altKeys.D,
            jumpAlt: altKeys.W,
            dash: altKeys.SHIFT,
            attack: altKeys.J,
            debugCollect: altKeys.E
        };
    }

    private createCharacterSfx(): void {
        if (this.cache.audio.exists(ASSET_KEYS.SFX_PLAYER_WALK)) {
            this.walkSound = this.sound.add(ASSET_KEYS.SFX_PLAYER_WALK, {
                volume: 0.25,
                loop: true
            });
        }
    }

    private createPickups(): void {
        this.pickups = this.physics.add.group({
            allowGravity: true,
            collideWorldBounds: true
        });

        this.physics.add.collider(this.pickups, this.platforms);
        this.physics.add.overlap(this.player, this.pickups, (_player, pickup) => {
            const pickupObject = pickup as Phaser.Physics.Arcade.Image;
            const value = pickupObject.getData("value") as number | undefined;
            pickupObject.destroy();
            gameState.addCellPoints(value ?? 1);
        });

        this.time.addEvent({
            delay: 1400,
            loop: true,
            callback: () => this.spawnPickup()
        });
    }

    private createPlayerAttackHitbox(): void {
        this.playerAttackHitbox = this.add.zone(this.player.x, this.player.y, 56, 40);
        this.physics.add.existing(this.playerAttackHitbox);
        this.playerAttackHitboxBody = this.playerAttackHitbox.body as Physics.Arcade.Body;
        this.playerAttackHitboxBody.setAllowGravity(false);
        this.playerAttackHitboxBody.setImmovable(true);
        this.playerAttackHitboxBody.enable = false;
        this.playerAttackHitbox.setActive(false).setVisible(false);
        this.updatePlayerAttackHitboxPosition();
    }

    private bindCombat(): void {
        this.physics.add.overlap(
            this.playerAttackHitbox,
            this.enemyManager.getEnemyGroup(),
            (_hitbox, enemyObject) => {
                if (!this.playerAttackActive) {
                    return;
                }

                const enemy = enemyObject as unknown as EnemyBase;
                if (!enemy?.isAlive() || this.hitEnemiesInCurrentSwing.has(enemy)) {
                    return;
                }

                const applied = enemy.takeDamage(this.attackDamage, "player-attack", this.time.now);
                if (!applied) {
                    return;
                }

                this.hitEnemiesInCurrentSwing.add(enemy);
            }
        );

        this.physics.add.collider(this.player, this.enemyManager.getEnemyGroup(), (_playerObject, enemyObject) => {
            const enemy = enemyObject as unknown as EnemyBase;
            if (!enemy?.isAlive()) {
                return;
            }

            if (this.tryStompEnemy(enemy)) {
                return;
            }

            const now = this.time.now;
            if (!enemy.canDealContactDamage(now)) {
                return;
            }

            enemy.markContactDamageDealt(now);
            this.applyDamageToPlayer(enemy.getContactDamage(), "enemy-contact", enemy.x);
        });

        this.physics.add.overlap(this.player, this.enemyManager.getEnemyAttackHitboxGroup(), (_playerObject, hitboxObject) => {
            const owner = this.enemyManager.resolveHitboxOwner(hitboxObject as unknown as Phaser.GameObjects.GameObject);
            if (!owner || !owner.isAlive() || !owner.isAttackHitboxActive()) {
                return;
            }

            this.applyDamageToPlayer(owner.getAttackDamage(), "enemy-attack", owner.x);
        });

        this.physics.add.overlap(this.player, this.enemyManager.getProjectileGroup(), (_playerObject, projectileObject) => {
            const projectile = projectileObject as AcidProjectile;
            if (!projectile?.active) {
                return;
            }

            const sourceX = projectile.x;
            const damage = projectile.getDamage();
            projectile.destroy();
            this.applyDamageToPlayer(damage, "projectile", sourceX);
        });
    }

    private bindProgressState(): void {
        this.unsubscribeState = gameState.onChange((snapshot) => {
            this.player.setEvolutionLevel(snapshot.stats.evolutionLevel);
            this.attackDamage = snapshot.stats.attackDamage;

            this.registry.set("runPoints", snapshot.run.runPoints);
            this.registry.set("health", snapshot.run.health);
            this.registry.set("wallet", snapshot.profile.walletPoints);

            EventBus.emit(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, snapshot);
            EventBus.emit(EVENT_KEYS.PROFILE_UPDATED, snapshot.profile);

            if (snapshot.stats.evolutionLevel > this.previousEvolution) {
                EventBus.emit(EVENT_KEYS.PLAYER_EVOLVED, snapshot);
            }

            this.previousEvolution = snapshot.stats.evolutionLevel;
        });
    }

    private triggerPlayerAttack(): void {
        this.player.playLockedAction("attack", 320);
        this.playSfxOnce(ASSET_KEYS.SFX_PLAYER_ATTACK, 0.35);

        this.playerAttackActive = true;
        this.hitEnemiesInCurrentSwing.clear();
        this.playerAttackHitboxBody.enable = true;
        this.playerAttackHitbox.setActive(true);
        this.updatePlayerAttackHitboxPosition();

        this.time.delayedCall(PLAYER_ATTACK_DURATION_MS, () => {
            this.playerAttackActive = false;
            this.playerAttackHitboxBody.enable = false;
            this.playerAttackHitbox.setActive(false);
        });
    }

    private updatePlayerAttackHitboxPosition(): void {
        if (!this.playerAttackHitbox) {
            return;
        }

        const direction = this.player.getFacingDirection();
        this.playerAttackHitbox.setPosition(this.player.x + direction * 34, this.player.y - 4);
    }

    private tryStompEnemy(enemy: EnemyBase): boolean {
        const playerBody = this.player.body as Physics.Arcade.Body | null;
        const enemyBody = enemy.body as Physics.Arcade.Body | null;
        if (!playerBody || !enemyBody) {
            return false;
        }

        const isFallingFastEnough = playerBody.velocity.y > 120;
        const isFromAbove = playerBody.bottom <= enemyBody.top + 14;
        if (!isFallingFastEnough || !isFromAbove) {
            return false;
        }

        const applied = enemy.takeDamage(1, "stomp", this.time.now);
        if (!applied) {
            return false;
        }

        this.player.jump(380);
        return true;
    }

    private applyDamageToPlayer(amount: number, source: DamageSource, sourceX: number): void {
        const damageResult = gameState.applyPlayerDamage(amount, this.time.now);
        if (!damageResult.applied) {
            return;
        }

        EventBus.emit(EVENT_KEYS.PLAYER_DAMAGED, {
            amount,
            source,
            snapshot: damageResult.snapshot
        });
        EventBus.emit(EVENT_KEYS.COMBAT_FEEDBACK, { type: "player-hit", source });

        this.player.playLockedAction("hit", 240);
        this.playSfxOnce(ASSET_KEYS.SFX_PLAYER_HIT, 0.4);

        const knockbackDirection = this.player.x < sourceX ? -1 : 1;
        this.player.applyKnockback(knockbackDirection * 220, -260);

        if (damageResult.dead) {
            this.handlePlayerDeath();
        }
    }

    private handlePlayerDeath(): void {
        EventBus.emit(EVENT_KEYS.PLAYER_DIED);
        this.playerAttackActive = false;
        this.playerAttackHitboxBody.enable = false;
        this.playerAttackHitbox.setActive(false);
        this.stopWalkSfx();

        this.time.delayedCall(260, () => {
            this.player.respawnAt(this.level.spawn.x, this.level.spawn.y);
            gameState.restorePlayerVitals();
        });
    }

    private updateDoorInteraction(): void {
        if (this.isCompletingLevel) {
            return;
        }

        const playerBounds = this.player.getBounds();
        const canEnter = this.levelDoor.isPlayerInside(playerBounds);
        this.doorHintText.setVisible(canEnter);

        if (canEnter && Input.Keyboard.JustDown(this.cursors.up)) {
            this.completeCurrentLevel();
        }
    }

    private completeCurrentLevel(): void {
        if (this.isCompletingLevel) {
            return;
        }

        this.isCompletingLevel = true;
        this.stopWalkSfx();
        this.scene.stop(SCENE_KEYS.HUD);

        const completion = gameState.completeLevel();
        EventBus.emit(EVENT_KEYS.LEVEL_COMPLETED, completion);
        this.scene.start(SCENE_KEYS.LEVEL_COMPLETE, completion);
    }

    private spawnCellPointBurst(x: number, y: number, count: number): void {
        for (let i = 0; i < count; i += 1) {
            const pickup = this.pickups.create(
                x + Phaser.Math.Between(-18, 18),
                y - Phaser.Math.Between(4, 18),
                "cell-point"
            ) as Phaser.Physics.Arcade.Image;

            pickup.setBounce(0.3);
            pickup.setDrag(40, 0);
            pickup.setData("value", 1);
            pickup.setVelocity(Phaser.Math.Between(-120, 120), Phaser.Math.Between(-240, -110));
        }
    }

    private updateWalkSound(): void {
        const onGround = Boolean(this.player.body?.blocked.down || this.player.body?.touching.down);
        const isWalkingOnGround = onGround && Math.abs(this.player.body?.velocity.x ?? 0) > 2;
        if (isWalkingOnGround) {
            if (this.walkSound && !this.walkSound.isPlaying) {
                this.walkSound.play();
            }
            return;
        }

        this.stopWalkSfx();
    }

    private updateInvulnerabilityVisual(time: number): void {
        if (gameState.isPlayerInvulnerable(time) && gameState.getSnapshot().run.health > 0) {
            this.player.setAlpha(Math.floor(time / 70) % 2 === 0 ? 0.5 : 1);
            return;
        }

        this.player.setAlpha(1);
    }

    private stopWalkSfx(): void {
        if (this.walkSound?.isPlaying) {
            this.walkSound.stop();
        }
    }

    private playSfxOnce(key: string, volume: number): void {
        if (!this.cache.audio.exists(key)) {
            return;
        }

        this.sound.play(key, { volume });
    }

    private createRuntimeTextures(): void {
        const graphics = this.add.graphics({ x: 0, y: 0 });
        graphics.setVisible(false);

        graphics.fillStyle(0x2b5161, 1);
        graphics.fillRoundedRect(0, 0, 620, 32, 10);
        graphics.generateTexture("platform-lg", 620, 32);
        graphics.clear();

        graphics.fillStyle(0x346a7f, 1);
        graphics.fillRoundedRect(0, 0, 320, 28, 10);
        graphics.generateTexture("platform-md", 320, 28);
        graphics.clear();

        graphics.fillStyle(0x3f7f94, 1);
        graphics.fillRoundedRect(0, 0, 200, 24, 10);
        graphics.generateTexture("platform-sm", 200, 24);
        graphics.clear();

        graphics.fillStyle(0x75fff0, 1);
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture("cell-point", 20, 20);
        graphics.clear();

        graphics.fillStyle(0x87ffb9, 1);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture("acid-projectile", 16, 16);
        graphics.destroy();
    }

    private drawBackground(): void {
        this.add.rectangle(this.level.worldWidth * 0.5, 384, this.level.worldWidth, WORLD_HEIGHT, 0x08131b);
        this.add.rectangle(this.level.worldWidth * 0.5, 200, this.level.worldWidth, 320, 0x0e2734, 0.55);
    }

    private configureCamera(): void {
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(360, 320);
        this.cameras.main.setFollowOffset(-180, 0);
    }

    private ensureHudScene(): void {
        if (this.scene.isActive(SCENE_KEYS.HUD)) {
            this.scene.wake(SCENE_KEYS.HUD);
            return;
        }

        this.scene.launch(SCENE_KEYS.HUD);
    }

    private spawnPickup(): void {
        const minX = Phaser.Math.Clamp(this.player.x + 240, 60, this.level.worldWidth - 80);
        const maxX = Phaser.Math.Clamp(this.player.x + 760, 80, this.level.worldWidth - 60);
        const spawnX = Phaser.Math.Between(Math.min(minX, maxX), Math.max(minX, maxX));
        const pickup = this.pickups.create(spawnX, 20, "cell-point") as Phaser.Physics.Arcade.Image;

        pickup.setBounce(0.25);
        pickup.setDrag(20, 0);
        pickup.setData("value", 2);
    }
}
