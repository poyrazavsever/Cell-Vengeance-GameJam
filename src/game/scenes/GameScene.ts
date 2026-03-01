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
import { stopMenuMusic } from "../services/menuMusic";
import { EnemyManager } from "../systems/EnemyManager";
import { DamageSource } from "../types/combat";
import { SpawnPoint } from "../types/enemy";
import { LevelDefinition } from "../types/level";
import { LevelId } from "../types/progression";
import { createMenuButton, createMenuCard, createMenuLabel } from "../ui/menuTheme";

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

interface TiledLayerData {
    type: string;
    name: string;
    width: number;
    height: number;
    visible?: boolean;
    data?: number[];
}

interface TiledMapData {
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    layers: TiledLayerData[];
}

interface MapTileLookupEntry {
    key: string;
    width: number;
    height: number;
}

type MapTileLookup = Record<string, MapTileLookupEntry>;

const PLAYER_ATTACK_DURATION_MS = 160;
const WORLD_HEIGHT = 800;
const CAMERA_ZOOM = 1.45;
const DOOR_BUFFER_MS = 260;
const FALL_DAMAGE_THRESHOLD_Y = 760;
const FALL_DAMAGE_AMOUNT = 1;
const FALL_DAMAGE_LANDING_LOCK_MS = 160;
const GROWTH_FREEZE_MS = 250;
const GROWTH_SLOWMO_MS = 1100;
const DEATH_ANIMATION_MS = 1450;
const DEATH_ANIM_TIME_SCALE = 0.55;
const PICKUP_COLLECT_DELAY_MS = 320;
const PLAYER_SPAWN_Y_OFFSET = 180;
const ENEMY_SPAWN_UP_TILES = 10;
const MAP_LAYER_NAMES = {
    background: ["Arkaplan"],
    backgroundPaint: ["Arkaplan Boya"],
    mid: ["Arkaplan Onu", "Arkaplan Önü", "Arkaplan Objeler", "Üst katman"],
    midPlus: ["Üst+ katman"],
    solid: ["Ana katman", "Ana Katman", "Tile Layer 3"],
    ladder: ["Merdiven"]
} as const;

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
    private currentMapAssetKey: string | null = null;
    private mapCollisionLayer: TiledLayerData | null = null;
    private mapCollisionTileWidth = 32;
    private mapCollisionTileHeight = 32;

    private unsubscribeState: (() => void) | null = null;
    private previousGrowthStage = 0;
    private walkSound: Phaser.Sound.BaseSound | null = null;
    private confirmKey!: Phaser.Input.Keyboard.Key;
    private ladderZones!: Phaser.Physics.Arcade.StaticGroup;
    private playerOnLadder = false;
    private doorProximityUntil = 0;
    private enterBufferedUntil = 0;
    private wasGroundedLastFrame = false;
    private peakFallVelocity = 0;
    private lastFallDamageAt = -Infinity;
    private isGrowthCinematicActive = false;
    private isDeathSequenceActive = false;
    private deathUiObjects: Phaser.GameObjects.GameObject[] = [];
    private bossEnemy: EnemyBase | null = null;
    private bossDoorOpened = false;
    private lastBossHealth = -1;

    constructor() {
        super(SCENE_KEYS.GAME);
    }

    init(data: GameSceneData): void {
        const snapshot = gameState.getSnapshot();
        const requestedLevel = data.levelId ?? snapshot.profile.selectedLevel;
        const levelId = gameState.canPlayLevel(requestedLevel) ? requestedLevel : snapshot.profile.unlockedLevel;
        this.level = getLevelById(levelId);
        this.currentMapAssetKey = this.resolveMapAssetKey(levelId);

        // Scene instance is reused between level transitions, so runtime flags must be reset explicitly.
        this.isCompletingLevel = false;
        this.isGrowthCinematicActive = false;
        this.doorProximityUntil = 0;
        this.enterBufferedUntil = 0;
        this.wasGroundedLastFrame = false;
        this.peakFallVelocity = 0;
        this.lastFallDamageAt = -Infinity;
        this.previousGrowthStage = 0;
        this.isDeathSequenceActive = false;
        this.clearDeathModal();
        this.bossEnemy = null;
        this.bossDoorOpened = false;
        this.lastBossHealth = -1;
    }

    create(): void {
        stopMenuMusic(this);
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
        this.announceBossFightIfNeeded();

        this.doorHintText = this.add.text(512, 188, "Kapıya girmek için Enter bas", {
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
            this.isGrowthCinematicActive = false;
            this.isDeathSequenceActive = false;
            this.clearDeathModal();
            if (this.physics?.world) {
                this.physics.world.resume();
                this.physics.world.timeScale = 1;
            }
            this.anims.globalTimeScale = 1;
            this.walkSound?.destroy();
            this.walkSound = null;
            this.playerAttackHitbox?.destroy();
            this.levelDoor?.destroy();
            this.unsubscribeState?.();
            this.unsubscribeState = null;
        });
    }

    update(time: number, delta: number): void {
        if (this.isDeathSequenceActive) {
            this.updatePlayerAttackHitboxPosition();
            this.stopWalkSfx();
            return;
        }

        if (!this.isGrowthCinematicActive) {
            this.handlePlayerInput();
            this.updateDoorInteraction();
            this.enemyManager.update(this.player, time, delta);
        }

        this.updateBossHealthHud();

        this.updateFallDamageTracking(time);
        this.updatePlayerAttackHitboxPosition();
        this.updateWalkSound();
        this.updateInvulnerabilityVisual(time);
    }

    private handlePlayerInput(): void {
        if (this.isGrowthCinematicActive) {
            return;
        }

        const snapshot = gameState.getSnapshot();
        const stats = snapshot.stats;
        let direction = 0;

        if (this.cursors.left.isDown || this.cursors.leftAlt.isDown) {
            direction = -1;
        } else if (this.cursors.right.isDown || this.cursors.rightAlt.isDown) {
            direction = 1;
        }

        // --- Ladder climbing ---
        const onLadder = this.isPlayerOnLadder();
        const wantsClimbUp = this.cursors.up.isDown || this.cursors.jumpAlt.isDown;
        const wantsClimbDown = this.cursors.down.isDown;

        if (onLadder && (wantsClimbUp || wantsClimbDown)) {
            if (!this.playerOnLadder) {
                this.playerOnLadder = true;
                this.player.setClimbing(true);
            }

            const climbSpeed = 160;
            if (wantsClimbUp) {
                this.player.climbVertical(-1, climbSpeed);
            } else {
                this.player.climbVertical(1, climbSpeed);
            }
            this.player.moveHorizontal(direction, stats.moveBase * 0.3);
            this.player.playAction("climb");
            return;
        }

        if (this.playerOnLadder && !onLadder) {
            this.playerOnLadder = false;
            this.player.setClimbing(false);
        }

        if (this.playerOnLadder && onLadder && !wantsClimbUp && !wantsClimbDown) {
            // Player is on ladder but not pressing up/down — hold position
            this.player.climbVertical(0, 0);
            this.player.moveHorizontal(direction, stats.moveBase * 0.3);
            if (direction !== 0) {
                this.player.playAction("climb");
            } else {
                this.player.showRestFrame();
            }
            return;
        }

        // --- Normal movement ---
        const dashBonus = stats.canDash && this.cursors.dash.isDown && direction !== 0 ? stats.dashBonus : 0;
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
            this.playSfxOnce(ASSET_KEYS.SFX_PLAYER_JUMP, 0.25);
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
        this.ladderZones = this.physics.add.staticGroup();
        this.mapCollisionLayer = null;
        this.playerOnLadder = false;

        const mapData = this.getCurrentLevelMapData();
        if (mapData) {
            this.createLevelFromMapData(mapData);
            return;
        }

        this.level.platformPreset.forEach((platform) => {
            this.platforms.create(platform.x, platform.y, platform.key);
        });
    }

    private getCurrentLevelMapData(): TiledMapData | null {
        if (!this.currentMapAssetKey) {
            return null;
        }

        const raw = this.cache.tilemap.get(this.currentMapAssetKey);
        const mapData = raw?.data as TiledMapData | undefined;
        if (!mapData || !Array.isArray(mapData.layers)) {
            return null;
        }

        return mapData;
    }

    private createLevelFromMapData(mapData: TiledMapData): void {
        const worldWidth = mapData.width * mapData.tilewidth;
        const worldHeight = mapData.height * mapData.tileheight;
        const tileLookup = this.getMapTileLookup();
        this.level.worldWidth = worldWidth;
        this.level.spawn.x = Phaser.Math.Clamp(this.level.spawn.x, mapData.tilewidth * 2, worldWidth - mapData.tilewidth * 2);
        this.level.spawn.y = worldHeight - (8 * mapData.tileheight) - PLAYER_SPAWN_Y_OFFSET;
        this.level.door.x = Math.max(mapData.tilewidth * 2, worldWidth - mapData.tilewidth * 4);

        // Place door 8 tiles above the ground (bottom of map)
        const doorY = worldHeight - (8 * mapData.tileheight) - 59;
        this.level.door.y = doorY;

        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        // Render order (back -> front): background, background paint, mid, mid+, solid, ladders.
        this.drawMapLayer(mapData, MAP_LAYER_NAMES.background, tileLookup, -40, 0x143b55, 0.28);
        this.drawMapLayer(mapData, MAP_LAYER_NAMES.backgroundPaint, tileLookup, -36, 0x204f69, 0.3);
        this.drawMapLayer(mapData, MAP_LAYER_NAMES.mid, tileLookup, -30, 0x2a6288, 0.36);
        this.drawMapLayer(mapData, MAP_LAYER_NAMES.midPlus, tileLookup, -20, 0x4b88a5, 0.44);
        this.drawMapLayer(mapData, MAP_LAYER_NAMES.solid, tileLookup, -8, 0x2d5f7b, 0.7);
        this.drawMapLayer(mapData, MAP_LAYER_NAMES.ladder, tileLookup, 8, 0x8bd3ff, 0.6);

        const collisionLayer = this.getFirstMapLayerByNames(mapData, MAP_LAYER_NAMES.solid);
        if (!collisionLayer || !collisionLayer.data) {
            return;
        }

        this.mapCollisionLayer = collisionLayer;
        this.mapCollisionTileWidth = mapData.tilewidth;
        this.mapCollisionTileHeight = mapData.tileheight;
        this.createCollisionFromLayer(collisionLayer, mapData.tilewidth, mapData.tileheight);

        const ladderLayer = this.getFirstMapLayerByNames(mapData, MAP_LAYER_NAMES.ladder);
        if (ladderLayer?.data) {
            this.createLadderZonesFromLayer(ladderLayer, mapData.tilewidth, mapData.tileheight);
        }
    }

    private getMapTileLookup(): MapTileLookup {
        if (!this.currentMapAssetKey) {
            return {};
        }

        const lookup = this.registry.get(`mapTileLookup:${this.currentMapAssetKey}`) as MapTileLookup | undefined;
        return lookup ?? {};
    }

    private resolveMapAssetKey(levelId: LevelId): string | null {
        switch (levelId) {
            case 1:
                return ASSET_KEYS.MAP_LEVEL_1;
            case 2:
                return ASSET_KEYS.MAP_LEVEL_2;
            case 3:
                return ASSET_KEYS.MAP_LEVEL_3;
            case 4:
                return ASSET_KEYS.MAP_BOSS;
            default:
                return null;
        }
    }

    private drawMapLayer(
        mapData: TiledMapData,
        layerNames: readonly string[],
        tileLookup: MapTileLookup,
        depth: number,
        fallbackColor: number,
        fallbackAlpha: number
    ): void {
        const layer = this.getFirstMapLayerByNames(mapData, layerNames);
        if (!layer) {
            return;
        }

        const drawnWithTextures = this.drawMapLayerTiles(mapData, layer, tileLookup, depth);
        if (drawnWithTextures) {
            return;
        }

        this.drawMapLayerRuns(mapData, layer, fallbackColor, fallbackAlpha, depth);
    }

    private drawMapLayerTiles(
        mapData: TiledMapData,
        layer: TiledLayerData,
        tileLookup: MapTileLookup,
        depth: number
    ): boolean {
        if (!layer.data) {
            return false;
        }

        const tileWidth = mapData.tilewidth;
        const tileHeight = mapData.tileheight;
        const renderTexture = this.add
            .renderTexture(0, 0, layer.width * tileWidth, layer.height * tileHeight)
            .setOrigin(0, 0)
            .setDepth(depth);

        let drawnCount = 0;
        for (let y = 0; y < layer.height; y += 1) {
            for (let x = 0; x < layer.width; x += 1) {
                const gid = layer.data[y * layer.width + x];
                if (gid <= 0) {
                    continue;
                }

                const tileEntry = tileLookup[String(gid)];
                if (!tileEntry || !this.textures.exists(tileEntry.key)) {
                    continue;
                }

                const drawX = x * tileWidth;
                const drawY = y * tileHeight + tileHeight - tileEntry.height;
                renderTexture.draw(tileEntry.key, drawX, drawY);
                drawnCount += 1;
            }
        }

        if (drawnCount > 0) {
            return true;
        }

        renderTexture.destroy();
        return false;
    }

    private drawMapLayerRuns(
        mapData: TiledMapData,
        layer: TiledLayerData,
        color: number,
        alpha: number,
        depth: number
    ): void {
        if (!layer.data) {
            return;
        }

        const graphics = this.add.graphics().setDepth(depth);
        graphics.fillStyle(color, alpha);

        const tileWidth = mapData.tilewidth;
        const tileHeight = mapData.tileheight;
        const layerWidth = layer.width;
        const layerHeight = layer.height;

        for (let y = 0; y < layerHeight; y += 1) {
            let runStart = -1;
            for (let x = 0; x <= layerWidth; x += 1) {
                const index = x < layerWidth ? layer.data[y * layerWidth + x] : 0;
                const hasTile = index > 0;

                if (hasTile && runStart === -1) {
                    runStart = x;
                    continue;
                }

                if (!hasTile && runStart !== -1) {
                    const runLength = x - runStart;
                    graphics.fillRect(runStart * tileWidth, y * tileHeight, runLength * tileWidth, tileHeight);
                    runStart = -1;
                }
            }
        }
    }

    private getFirstMapLayerByNames(mapData: TiledMapData, layerNames: readonly string[]): TiledLayerData | null {
        const normalizedNames = layerNames.map((name) => this.normalizeLayerName(name));
        for (const normalizedLayerName of normalizedNames) {
            const found = mapData.layers.find((candidate) => {
                if (candidate.type !== "tilelayer") {
                    return false;
                }

                return this.normalizeLayerName(candidate.name) === normalizedLayerName;
            });
            if (found?.data) {
                return found;
            }
        }

        return null;
    }

    private normalizeLayerName(name: string): string {
        return name.trim().toLocaleLowerCase("tr-TR");
    }

    private createCollisionFromLayer(layer: TiledLayerData, tileWidth: number, tileHeight: number): void {
        if (!layer.data) {
            return;
        }

        for (let y = 0; y < layer.height; y += 1) {
            let runStart = -1;
            for (let x = 0; x <= layer.width; x += 1) {
                const index = x < layer.width ? layer.data[y * layer.width + x] : 0;
                const hasTile = index > 0;

                if (hasTile && runStart === -1) {
                    runStart = x;
                    continue;
                }

                if (!hasTile && runStart !== -1) {
                    const runLength = x - runStart;
                    const runPixelWidth = runLength * tileWidth;
                    const centerX = runStart * tileWidth + runPixelWidth * 0.5;
                    const centerY = y * tileHeight + tileHeight * 0.5;
                    const collider = this.platforms.create(centerX, centerY, "platform-pixel") as Phaser.Physics.Arcade.Image;
                    collider.setVisible(false);
                    collider.setDisplaySize(runPixelWidth, tileHeight);
                    collider.refreshBody();
                    runStart = -1;
                }
            }
        }
    }

    private createLadderZonesFromLayer(layer: TiledLayerData, tileWidth: number, tileHeight: number): void {
        if (!layer.data) {
            return;
        }

        // Scan columns to create vertically merged ladder zones
        for (let x = 0; x < layer.width; x += 1) {
            let runStartY = -1;
            for (let y = 0; y <= layer.height; y += 1) {
                const index = y < layer.height ? layer.data[y * layer.width + x] : 0;
                const hasTile = index > 0;

                if (hasTile && runStartY === -1) {
                    runStartY = y;
                    continue;
                }

                if (!hasTile && runStartY !== -1) {
                    const runHeight = y - runStartY;
                    const pixelHeight = runHeight * tileHeight;
                    const centerX = x * tileWidth + tileWidth * 0.5;
                    const centerY = runStartY * tileHeight + pixelHeight * 0.5;

                    const zone = this.add.zone(centerX, centerY, tileWidth, pixelHeight);
                    this.physics.add.existing(zone, true);
                    (zone.body as Physics.Arcade.StaticBody).setSize(tileWidth, pixelHeight);
                    this.ladderZones.add(zone);
                    runStartY = -1;
                }
            }
        }
    }

    private isPlayerOnLadder(): boolean {
        const playerBody = this.player.body as Physics.Arcade.Body | null;
        if (!playerBody) {
            return false;
        }

        const px = playerBody.x;
        const py = playerBody.y;
        const pw = playerBody.width;
        const ph = playerBody.height;

        const children = this.ladderZones.getChildren();
        for (let i = 0; i < children.length; i += 1) {
            const zone = children[i] as Phaser.GameObjects.Zone;
            const zoneBody = zone.body as Physics.Arcade.StaticBody;
            if (!zoneBody) {
                continue;
            }

            const zx = zoneBody.x;
            const zy = zoneBody.y;
            const zw = zoneBody.width;
            const zh = zoneBody.height;

            if (px < zx + zw && px + pw > zx && py < zy + zh && py + ph > zy) {
                return true;
            }
        }

        return false;
    }

    private createPlayer(): void {
        this.player = new Player(this, this.level.spawn.x, this.level.spawn.y);
        this.physics.add.collider(this.player, this.platforms);
    }

    private createEnemyManager(): void {
        const spawnPoints = this.mapCollisionLayer
            ? this.resolveEnemySpawnsForMap(this.level.enemySpawns)
            : this.level.enemySpawns;

        this.enemyManager = new EnemyManager(this, this.platforms, spawnPoints, (enemy) => {
            EventBus.emit(EVENT_KEYS.ENEMY_DIED, {
                kind: enemy.kind,
                x: enemy.x,
                y: enemy.y
            });
            this.spawnCellPointBurst(enemy.x, enemy.y, enemy.getDropCellPoints());

            if (enemy.kind === "boss") {
                this.handleBossDefeated();
            }
        });

        this.bossEnemy = this.enemyManager.getBoss();
    }

    private resolveEnemySpawnsForMap(spawnPoints: SpawnPoint[]): SpawnPoint[] {
        const desiredYOffset = this.mapCollisionTileHeight * ENEMY_SPAWN_UP_TILES;

        return spawnPoints.map((spawn) => {
            const resolved = this.findBestSurfaceForSpawn(spawn.x, spawn.y - desiredYOffset);
            if (!resolved) {
                return {
                    ...spawn,
                    y: spawn.y - desiredYOffset
                };
            }

            // Enemies use center-origin; keep a stable gap between their feet and tile top.
            const enemyCenterYOffset = 26;
            return {
                ...spawn,
                x: resolved.centerX,
                y: resolved.topY - enemyCenterYOffset
            };
        });
    }

    private findBestSurfaceForSpawn(
        worldX: number,
        desiredY: number
    ): { centerX: number; topY: number } | null {
        const layer = this.mapCollisionLayer;
        if (!layer?.data) {
            return null;
        }

        const tileWidth = this.mapCollisionTileWidth;
        const tileHeight = this.mapCollisionTileHeight;
        const baseTileX = Phaser.Math.Clamp(Math.floor(worldX / tileWidth), 0, layer.width - 1);
        const searchRadiusTiles = 6;

        let bestCandidate: { centerX: number; topY: number; score: number } | null = null;

        for (
            let tileX = Math.max(0, baseTileX - searchRadiusTiles);
            tileX <= Math.min(layer.width - 1, baseTileX + searchRadiusTiles);
            tileX += 1
        ) {
            const centerX = tileX * tileWidth + tileWidth * 0.5;
            for (let tileY = 0; tileY < layer.height; tileY += 1) {
                const index = tileY * layer.width + tileX;
                const isSolid = layer.data[index] > 0;
                if (!isSolid) {
                    continue;
                }

                const hasSolidAbove = tileY > 0 && layer.data[(tileY - 1) * layer.width + tileX] > 0;
                if (hasSolidAbove) {
                    continue;
                }

                const topY = tileY * tileHeight;
                const score = Math.abs(topY - desiredY) + Math.abs(centerX - worldX) * 0.35;

                if (!bestCandidate || score < bestCandidate.score) {
                    bestCandidate = { centerX, topY, score };
                }
            }
        }

        if (!bestCandidate) {
            return null;
        }

        return {
            centerX: bestCandidate.centerX,
            topY: bestCandidate.topY
        };
    }

    private createDoor(): void {
        this.levelDoor = new LevelDoor(this, this.level.door.x, this.level.door.y);
        const hasBossFight = this.level.id === 4 && Boolean(this.bossEnemy);
        this.levelDoor.setOpen(!hasBossFight);
    }

    private announceBossFightIfNeeded(): void {
        if (!this.bossEnemy) {
            return;
        }

        this.lastBossHealth = this.bossEnemy.getHealth();
        this.time.delayedCall(0, () => {
            if (!this.sys.isActive() || !this.bossEnemy || !this.bossEnemy.active || !this.bossEnemy.isAlive()) {
                return;
            }

            EventBus.emit(EVENT_KEYS.BOSS_FIGHT_STARTED, {
                name: "Dr. Malignant",
                currentHealth: this.bossEnemy.getHealth(),
                maxHealth: this.bossEnemy.getMaxHealth()
            });
        });
    }

    private updateBossHealthHud(): void {
        if (!this.bossEnemy || !this.bossEnemy.active || !this.bossEnemy.isAlive()) {
            return;
        }

        const currentHealth = this.bossEnemy.getHealth();
        if (currentHealth === this.lastBossHealth) {
            return;
        }

        this.lastBossHealth = currentHealth;
        EventBus.emit(EVENT_KEYS.BOSS_HEALTH_UPDATED, {
            currentHealth,
            maxHealth: this.bossEnemy.getMaxHealth()
        });
    }

    private handleBossDefeated(): void {
        if (!this.levelDoor || this.bossDoorOpened) {
            return;
        }

        this.bossDoorOpened = true;
        this.levelDoor.setOpen(true);
        this.doorProximityUntil = 0;
        this.enterBufferedUntil = 0;
        this.bossEnemy = null;

        EventBus.emit(EVENT_KEYS.BOSS_DEFEATED, {
            levelId: this.level.id
        });

        this.doorHintText?.setText("Boss yenildi! Kapı açıldı, Enter ile geç.");
        this.doorHintText?.setVisible(true);
        this.time.delayedCall(2200, () => {
            if (!this.sys.isActive()) {
                return;
            }
            this.doorHintText?.setText("Kapıya girmek için Enter bas");
            this.doorHintText?.setVisible(false);
        });
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

        this.confirmKey = keyboard.addKey(Input.Keyboard.KeyCodes.ENTER);
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

        this.physics.add.collider(this.pickups, this.platforms, (pickup) => {
            const pickupObject = pickup as Phaser.Physics.Arcade.Image;
            pickupObject.setData("groundedOnce", true);
        });
        this.physics.add.overlap(this.player, this.pickups, (_player, pickup) => {
            const pickupObject = pickup as Phaser.Physics.Arcade.Image;
            this.tryCollectPickup(pickupObject);
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
        this.unsubscribeState?.();
        this.unsubscribeState = null;

        this.unsubscribeState = gameState.onChange((snapshot) => {
            if (!this.sys.isActive() || !this.player || !this.player.active) {
                return;
            }

            this.player.setGrowthStage(snapshot.run.growthStage);
            this.attackDamage = snapshot.stats.attackDamage;

            this.registry.set("collectedCells", snapshot.run.collectedCells);
            this.registry.set("residualCells", snapshot.run.residualCells);
            this.registry.set("health", snapshot.run.health);
            this.registry.set("wallet", snapshot.profile.walletPoints);

            EventBus.emit(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, snapshot);
            EventBus.emit(EVENT_KEYS.PROFILE_UPDATED, snapshot.profile);

            if (snapshot.run.growthStage > this.previousGrowthStage) {
                this.startGrowthCinematic();
                EventBus.emit(EVENT_KEYS.PLAYER_GROWTH_STAGE_CHANGED, snapshot);
            }

            this.previousGrowthStage = snapshot.run.growthStage;
        });
    }

    private triggerPlayerAttack(): void {
        this.player.playLockedAction("attack", 380);
        this.playSfxOnce(ASSET_KEYS.SFX_PLAYER_ATTACK, 0.35);

        this.playerAttackActive = true;
        this.hitEnemiesInCurrentSwing.clear();
        this.playerAttackHitboxBody.enable = true;
        this.playerAttackHitbox.setActive(true);
        this.updatePlayerAttackHitboxPosition();

        this.time.delayedCall(PLAYER_ATTACK_DURATION_MS, () => {
            if (!this.sys.isActive() || !this.playerAttackHitbox?.active) {
                return;
            }
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

    private applyDamageToPlayer(
        amount: number,
        source: DamageSource,
        sourceX: number,
        applyKnockback = true
    ): void {
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

        if (applyKnockback) {
            const knockbackDirection = this.player.x < sourceX ? -1 : 1;
            this.player.applyKnockback(knockbackDirection * 220, -260);
        }

        if (damageResult.dead) {
            this.handlePlayerDeath();
        }
    }

    private handlePlayerDeath(): void {
        if (this.isDeathSequenceActive) {
            return;
        }

        EventBus.emit(EVENT_KEYS.PLAYER_DIED);
        this.isDeathSequenceActive = true;
        this.playerAttackActive = false;
        this.playerAttackHitboxBody.enable = false;
        this.playerAttackHitbox.setActive(false);
        this.stopWalkSfx();
        this.doorHintText?.setVisible(false);
        this.player.setVelocity(0, 0);
        this.player.setClimbing(false);
        this.player.playLockedAction("death", DEATH_ANIMATION_MS);
        this.player.setTint(0xff8f8f);

        this.physics.world.pause();
        this.anims.globalTimeScale = DEATH_ANIM_TIME_SCALE;
        this.tweens.add({
            targets: this.player,
            alpha: 0.42,
            duration: 620,
            yoyo: true,
            repeat: 0,
            ease: "Sine.easeInOut"
        });

        this.time.delayedCall(DEATH_ANIMATION_MS, () => {
            if (!this.sys.isActive()) {
                return;
            }

            this.player.clearTint();
            this.player.setAlpha(1);
            this.anims.globalTimeScale = 1;
            this.showDeathModal();
        });
    }

    private showDeathModal(): void {
        if (this.deathUiObjects.length > 0) {
            return;
        }

        const { width, height } = this.scale;
        this.scene.stop(SCENE_KEYS.HUD);

        const backdrop = this.add
            .rectangle(width * 0.5, height * 0.5, width, height, 0x000000, 0.72)
            .setScrollFactor(0)
            .setDepth(220)
            .setInteractive();

        const card = createMenuCard(this, { x: width * 0.5, y: height * 0.5, width: 520, height: 320, alpha: 0.96 });
        card.setScrollFactor(0).setDepth(221);

        const title = createMenuLabel(this, width * 0.5, height * 0.5 - 100, "Öldünüz", 44, "#ffd6d6")
            .setScrollFactor(0)
            .setDepth(222);

        const subtitle = this.add.text(width * 0.5, height * 0.5 - 52, "Tekrar denemek ister misin?", {
            fontFamily: "Verdana",
            fontSize: "20px",
            color: "#c9e6f5",
            stroke: "#05131e",
            strokeThickness: 3
        }).setOrigin(0.5).setScrollFactor(0).setDepth(222);

        const restartButton = createMenuButton(this, {
            x: width * 0.5,
            y: height * 0.5 + 26,
            width: 310,
            height: 58,
            fontSize: 28,
            label: "Tekrar Başla",
            onClick: () => this.restartLevelAfterDeath()
        });
        restartButton.root.setScrollFactor(0).setDepth(222);

        const mainMenuButton = createMenuButton(this, {
            x: width * 0.5,
            y: height * 0.5 + 96,
            width: 310,
            height: 54,
            fontSize: 24,
            label: "Ana Sayfaya Dön",
            onClick: () => this.returnToMainMenuAfterDeath()
        });
        mainMenuButton.root.setScrollFactor(0).setDepth(222);

        this.deathUiObjects = [backdrop, card, title, subtitle, restartButton.root, mainMenuButton.root];
    }

    private clearDeathModal(): void {
        this.deathUiObjects.forEach((object) => object.destroy());
        this.deathUiObjects = [];
    }

    private restartLevelAfterDeath(): void {
        const levelId = this.level.id;
        this.isDeathSequenceActive = false;
        this.clearDeathModal();
        this.player.clearTint();
        this.player.setAlpha(1);
        this.physics.world.resume();
        this.physics.world.timeScale = 1;
        this.anims.globalTimeScale = 1;
        this.scene.restart({ levelId });
    }

    private returnToMainMenuAfterDeath(): void {
        this.isDeathSequenceActive = false;
        this.clearDeathModal();
        this.player.clearTint();
        this.player.setAlpha(1);
        this.physics.world.resume();
        this.physics.world.timeScale = 1;
        this.anims.globalTimeScale = 1;
        this.scene.start(SCENE_KEYS.MAIN_MENU);
    }

    private updateDoorInteraction(): void {
        if (this.isCompletingLevel || !this.levelDoor || !this.player?.active) {
            return;
        }

        if (!this.levelDoor.isOpenDoor()) {
            this.doorHintText.setVisible(false);
            return;
        }

        const now = this.time.now;
        const playerBounds = this.player.getBounds();
        if (this.levelDoor.isPlayerInside(playerBounds)) {
            this.doorProximityUntil = now + DOOR_BUFFER_MS;
        }

        // Keep buffer alive while holding Enter to make door usage reliable across frames.
        if (Input.Keyboard.JustDown(this.confirmKey) || this.confirmKey.isDown) {
            this.enterBufferedUntil = now + DOOR_BUFFER_MS;
        }

        const canEnter = now <= this.doorProximityUntil;
        this.doorHintText.setVisible(canEnter);

        if (canEnter && now <= this.enterBufferedUntil) {
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
                ASSET_KEYS.CELL_POINT
            ) as Phaser.Physics.Arcade.Image;

            pickup.setScale(0.08);
            pickup.setBounce(0.3);
            pickup.setDrag(40, 0);
            pickup.setData("value", 1);
            this.initializePickupData(pickup);
            pickup.setVelocity(Phaser.Math.Between(-120, 120), Phaser.Math.Between(-240, -110));
        }
    }

    private initializePickupData(pickup: Phaser.Physics.Arcade.Image): void {
        pickup.setData("collectibleAt", this.time.now + PICKUP_COLLECT_DELAY_MS);
        pickup.setData("groundedOnce", false);
        pickup.setData("collecting", false);
    }

    private tryCollectPickup(pickup: Phaser.Physics.Arcade.Image): void {
        if (!pickup.active || pickup.getData("collecting")) {
            return;
        }

        const collectibleAt = (pickup.getData("collectibleAt") as number | undefined) ?? 0;
        const groundedOnce = Boolean(pickup.getData("groundedOnce"));
        if (!groundedOnce || this.time.now < collectibleAt) {
            return;
        }

        const value = pickup.getData("value") as number | undefined;
        pickup.setData("collecting", true);
        pickup.body?.stop();
        if (pickup.body instanceof Physics.Arcade.Body) {
            pickup.body.enable = false;
        }
        pickup.setDepth(32);

        this.tweens.add({
            targets: pickup,
            scaleX: pickup.scaleX * 1.18,
            scaleY: pickup.scaleY * 1.18,
            alpha: 0,
            duration: 140,
            ease: "Sine.easeOut",
            onComplete: () => {
                pickup.destroy();
                gameState.addCellPoints(value ?? 1);
            }
        });
    }

    private updateWalkSound(): void {
        if (this.isGrowthCinematicActive) {
            this.stopWalkSfx();
            return;
        }

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

        if (!this.textures.exists("platform-lg")) {
            graphics.fillStyle(0x2b5161, 1);
            graphics.fillRoundedRect(0, 0, 620, 32, 10);
            graphics.generateTexture("platform-lg", 620, 32);
        }
        graphics.clear();

        if (!this.textures.exists("platform-md")) {
            graphics.fillStyle(0x346a7f, 1);
            graphics.fillRoundedRect(0, 0, 320, 28, 10);
            graphics.generateTexture("platform-md", 320, 28);
        }
        graphics.clear();

        if (!this.textures.exists("platform-sm")) {
            graphics.fillStyle(0x3f7f94, 1);
            graphics.fillRoundedRect(0, 0, 200, 24, 10);
            graphics.generateTexture("platform-sm", 200, 24);
        }
        graphics.clear();

        if (!this.textures.exists("platform-pixel")) {
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(0, 0, 1, 1);
            graphics.generateTexture("platform-pixel", 1, 1);
        }
        graphics.clear();

        if (!this.textures.exists("acid-projectile")) {
            graphics.fillStyle(0x87ffb9, 1);
            graphics.fillCircle(8, 8, 8);
            graphics.generateTexture("acid-projectile", 16, 16);
        }
        graphics.destroy();
    }

    private drawBackground(): void {
        this.add
            .rectangle(this.level.worldWidth * 0.5, WORLD_HEIGHT * 0.5, this.level.worldWidth, WORLD_HEIGHT, 0x08131b)
            .setDepth(-100);
        this.add
            .rectangle(this.level.worldWidth * 0.5, 200, this.level.worldWidth, 320, 0x0e2734, 0.55)
            .setDepth(-90);
    }

    private configureCamera(): void {
        this.cameras.main.setZoom(CAMERA_ZOOM);
        // Keep the player centered and avoid camera lag when direction changes quickly.
        this.cameras.main.startFollow(this.player, true, 1, 1);
        this.cameras.main.setDeadzone(0, 0);
        this.cameras.main.setFollowOffset(0, 0);
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
        const pickup = this.pickups.create(spawnX, 20, ASSET_KEYS.CELL_POINT) as Phaser.Physics.Arcade.Image;

        pickup.setScale(0.08);
        pickup.setBounce(0.25);
        pickup.setDrag(20, 0);
        pickup.setData("value", 2);
        this.initializePickupData(pickup);
    }

    private updateFallDamageTracking(time: number): void {
        if (this.isGrowthCinematicActive) {
            this.wasGroundedLastFrame = false;
            this.peakFallVelocity = 0;
            return;
        }

        const body = this.player.body as Physics.Arcade.Body | null;
        if (!body) {
            return;
        }

        if (this.player.isClimbing()) {
            this.wasGroundedLastFrame = false;
            this.peakFallVelocity = 0;
            return;
        }

        const grounded = this.isPlayerGrounded(body);
        if (!grounded) {
            this.peakFallVelocity = Math.max(this.peakFallVelocity, body.velocity.y);
        } else if (!this.wasGroundedLastFrame) {
            if (
                this.peakFallVelocity >= FALL_DAMAGE_THRESHOLD_Y
                && time - this.lastFallDamageAt >= FALL_DAMAGE_LANDING_LOCK_MS
            ) {
                this.lastFallDamageAt = time;
                this.applyDamageToPlayer(FALL_DAMAGE_AMOUNT, "fall", this.player.x, false);
            }
            this.peakFallVelocity = 0;
        } else {
            this.peakFallVelocity = 0;
        }

        this.wasGroundedLastFrame = grounded;
    }

    private isPlayerGrounded(body: Physics.Arcade.Body): boolean {
        return Boolean(body.blocked.down || body.touching.down);
    }

    private startGrowthCinematic(): void {
        if (this.isGrowthCinematicActive || !this.player.active) {
            return;
        }

        this.isGrowthCinematicActive = true;
        this.playerAttackActive = false;
        this.playerAttackHitboxBody.enable = false;
        this.playerAttackHitbox.setActive(false);
        this.stopWalkSfx();
        this.cameras.main.shake(110, 0.0035);

        this.physics.world.pause();
        this.time.delayedCall(GROWTH_FREEZE_MS, () => {
            if (!this.sys.isActive()) {
                return;
            }

            this.physics.world.resume();
            this.physics.world.timeScale = 0.35;
            this.anims.globalTimeScale = 0.45;
            this.player.playGrowthEffect();

            this.time.delayedCall(GROWTH_SLOWMO_MS, () => {
                if (!this.sys.isActive()) {
                    return;
                }

                this.physics.world.timeScale = 1;
                this.anims.globalTimeScale = 1;
                this.isGrowthCinematicActive = false;
            });
        });
    }
}
