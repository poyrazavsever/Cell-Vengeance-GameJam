import { Input, Scene } from "phaser";
import { createPlayerAnimations } from "../animations/playerAnimations";
import { ASSET_KEYS } from "../constants/assetKeys";
import { EventBus } from "../EventBus";
import { EVENT_KEYS } from "../constants/eventKeys";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { Player } from "../entities/player/Player";
import { gameState } from "../state/GameState";

interface MovementKeys extends Phaser.Types.Input.Keyboard.CursorKeys {
    leftAlt: Phaser.Input.Keyboard.Key;
    rightAlt: Phaser.Input.Keyboard.Key;
    jumpAlt: Phaser.Input.Keyboard.Key;
    dash: Phaser.Input.Keyboard.Key;
    attack: Phaser.Input.Keyboard.Key;
    debugHit: Phaser.Input.Keyboard.Key;
    debugCollect: Phaser.Input.Keyboard.Key;
}

export class GameScene extends Scene {
    private cursors!: MovementKeys;
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private pickups!: Phaser.Physics.Arcade.Group;
    private unsubscribeState: (() => void) | null = null;
    private previousLevel = 0;
    private walkSound: Phaser.Sound.BaseSound | null = null;

    constructor() {
        super(SCENE_KEYS.GAME);
    }

    create(): void {
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        this.drawBackground();
        this.createRuntimeTextures();
        createPlayerAnimations(this);
        this.createLevel();
        this.createPlayer();
        this.createInput();
        this.createCharacterSfx();
        this.createPickups();
        this.bindProgressState();

        this.add.text(20, 112, "J: Attack | H: Hit | E: +5 Cell Point", {
            color: "#d7f6ff",
            fontFamily: "Verdana",
            fontSize: "18px"
        }).setDepth(10);

        EventBus.emit(EVENT_KEYS.CURRENT_SCENE_READY, this);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.stopWalkSfx();
            this.walkSound?.destroy();
            this.walkSound = null;
            this.unsubscribeState?.();
            this.unsubscribeState = null;
        });
    }

    update(): void {
        const snapshot = gameState.getSnapshot();
        let direction = 0;

        if (this.cursors.left.isDown || this.cursors.leftAlt.isDown) {
            direction = -1;
        } else if (this.cursors.right.isDown || this.cursors.rightAlt.isDown) {
            direction = 1;
        }

        const canDash = snapshot.evolutionLevel >= 2;
        const baseSpeed = canDash ? 270 : 210;
        const dashBonus = canDash && this.cursors.dash.isDown ? 120 : 0;
        this.player.moveHorizontal(direction, baseSpeed + dashBonus);

        if (Input.Keyboard.JustDown(this.cursors.attack)) {
            this.player.playLockedAction("attack", 320);
            this.playSfxOnce(ASSET_KEYS.SFX_PLAYER_ATTACK, 0.35);
        }

        if (Input.Keyboard.JustDown(this.cursors.debugHit)) {
            this.player.playLockedAction("hit", 360);
            this.playSfxOnce(ASSET_KEYS.SFX_PLAYER_HIT, 0.38);
        }

        const onGround = Boolean(this.player.body?.blocked.down || this.player.body?.touching.down);
        const jumpPressed =
            Input.Keyboard.JustDown(this.cursors.up) ||
            Input.Keyboard.JustDown(this.cursors.space) ||
            Input.Keyboard.JustDown(this.cursors.jumpAlt);

        if (onGround && jumpPressed) {
            this.player.jump(snapshot.evolutionLevel >= 1 ? 620 : 560);
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

        const isWalkingOnGround = onGround && Math.abs(this.player.body?.velocity.x ?? 0) > 2;
        this.updateWalkSfx(isWalkingOnGround);

        if (Input.Keyboard.JustDown(this.cursors.debugCollect)) {
            gameState.addCellPoints(5);
        }
    }

    private bindProgressState(): void {
        this.unsubscribeState = gameState.onChange((progress) => {
            this.player.updateEvolution(progress.evolutionLevel);
            this.registry.set("cellPoints", progress.cellPoints);
            this.registry.set("evolutionLevel", progress.evolutionLevel);
            EventBus.emit(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, progress);

            if (progress.evolutionLevel > this.previousLevel) {
                EventBus.emit(EVENT_KEYS.PLAYER_EVOLVED, progress);
            }

            this.previousLevel = progress.evolutionLevel;
        });
    }

    private createInput(): void {
        const keyboard = this.input.keyboard;
        if (!keyboard) {
            throw new Error("Keyboard input could not be initialized.");
        }

        const cursors = keyboard.createCursorKeys();
        const altKeys = keyboard.addKeys("A,D,W,SHIFT,J,H,E") as {
            A: Phaser.Input.Keyboard.Key;
            D: Phaser.Input.Keyboard.Key;
            W: Phaser.Input.Keyboard.Key;
            SHIFT: Phaser.Input.Keyboard.Key;
            J: Phaser.Input.Keyboard.Key;
            H: Phaser.Input.Keyboard.Key;
            E: Phaser.Input.Keyboard.Key;
        };

        this.cursors = {
            ...cursors,
            leftAlt: altKeys.A,
            rightAlt: altKeys.D,
            jumpAlt: altKeys.W,
            dash: altKeys.SHIFT,
            attack: altKeys.J,
            debugHit: altKeys.H,
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

    private updateWalkSfx(shouldPlay: boolean): void {
        if (!this.walkSound) {
            return;
        }

        if (shouldPlay) {
            if (!this.walkSound.isPlaying) {
                this.walkSound.play();
            }

            return;
        }

        this.stopWalkSfx();
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

    private createLevel(): void {
        this.platforms = this.physics.add.staticGroup();

        this.platforms.create(512, 752, "platform-lg");
        this.platforms.create(210, 600, "platform-md");
        this.platforms.create(520, 500, "platform-sm");
        this.platforms.create(830, 620, "platform-md");
        this.platforms.create(900, 420, "platform-sm");
    }

    private createPlayer(): void {
        this.player = new Player(this, 120, 620);
        this.physics.add.collider(this.player, this.platforms);
    }

    private createPickups(): void {
        this.pickups = this.physics.add.group({
            allowGravity: true,
            collideWorldBounds: true
        });

        this.physics.add.collider(this.pickups, this.platforms);
        this.physics.add.overlap(this.player, this.pickups, (_player, pickup) => {
            pickup.destroy();
            gameState.addCellPoints(2);
        });

        this.time.addEvent({
            delay: 1500,
            loop: true,
            callback: () => this.spawnPickup()
        });
    }

    private spawnPickup(): void {
        const x = Phaser.Math.Between(60, this.scale.width - 60);
        const pickup = this.pickups.create(x, -20, "cell-point") as Phaser.Physics.Arcade.Image;

        pickup.setBounce(0.25);
        pickup.setDrag(20, 0);
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
        graphics.destroy();
    }

    private drawBackground(): void {
        this.add.rectangle(512, 384, 1024, 768, 0x08131b);
        this.add.rectangle(512, 200, 1024, 320, 0x0e2734, 0.55);
    }
}
