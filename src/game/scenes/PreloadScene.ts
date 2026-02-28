import { Scene } from "phaser";
import { ASSET_KEYS, ENEMY_FRAME_SIZE, PLAYER_FRAME_SIZE } from "../constants/assetKeys";
import { SCENE_KEYS } from "../constants/sceneKeys";

interface TiledLayerData {
    type: string;
    data?: number[];
}

interface TiledTilesetRef {
    firstgid: number;
    source: string;
}

interface TiledMapData {
    layers: TiledLayerData[];
    tilesets: TiledTilesetRef[];
}

interface MapTileLookupEntry {
    key: string;
    width: number;
    height: number;
}

const TSX_CACHE_KEYS: Record<string, string> = {
    "background.tsx": "map1-tsx-background",
    "tiles.tsx": "map1-tsx-tiles",
    "objects.tsx": "map1-tsx-objects"
};

const MAP_ASSET_KEYS = [ASSET_KEYS.MAP_LEVEL_1, ASSET_KEYS.MAP_LEVEL_2, ASSET_KEYS.MAP_LEVEL_3] as const;

export class PreloadScene extends Scene {
    private loadingBar!: Phaser.GameObjects.Graphics;

    constructor() {
        super(SCENE_KEYS.PRELOAD);
    }

    preload(): void {
        const { width, height } = this.scale;

        this.add.text(width * 0.5, height * 0.42, "CELL-VENGEANCE", {
            color: "#e8f5ff",
            fontFamily: "Verdana",
            fontSize: "36px"
        }).setOrigin(0.5);

        this.loadingBar = this.add.graphics();
        this.drawLoadingBar(0);

        this.load.on("progress", (value: number) => {
            this.drawLoadingBar(value);
        });

        this.load.image(ASSET_KEYS.LOGO, "assets/logo.png");
        this.load.image(ASSET_KEYS.MENU_BG, "bg.png");
        this.load.image(ASSET_KEYS.TEXT_LOGO, "textLogo.png");
        this.load.video(ASSET_KEYS.INTRO_VIDEO, { url: "start.mp4", type: "mp4" }, false);
        this.load.tilemapTiledJSON(ASSET_KEYS.MAP_LEVEL_1, "maps/map1.json");
        this.load.tilemapTiledJSON(ASSET_KEYS.MAP_LEVEL_2, "maps/map2.json");
        this.load.tilemapTiledJSON(ASSET_KEYS.MAP_LEVEL_3, "maps/map3.json");
        this.load.text(TSX_CACHE_KEYS["background.tsx"], "maps/background.tsx");
        this.load.text(TSX_CACHE_KEYS["tiles.tsx"], "maps/tiles.tsx");
        this.load.text(TSX_CACHE_KEYS["objects.tsx"], "maps/objects.tsx");
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_1, "assets/characters/1.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_2, "assets/characters/2.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_3, "assets/characters/3.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_4, "assets/characters/4.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.PLAYER_LEVEL_5, "assets/characters/5.png", { frameWidth: PLAYER_FRAME_SIZE, frameHeight: PLAYER_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.ENEMY_SCOUT, "assets/enemy/Scout.png", { frameWidth: ENEMY_FRAME_SIZE, frameHeight: ENEMY_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.ENEMY_SPITTER, "assets/enemy/Spitter.png", { frameWidth: ENEMY_FRAME_SIZE, frameHeight: ENEMY_FRAME_SIZE });
        this.load.spritesheet(ASSET_KEYS.ENEMY_BRUTE, "assets/enemy/Brute.png", { frameWidth: ENEMY_FRAME_SIZE, frameHeight: ENEMY_FRAME_SIZE });
        this.load.audio(ASSET_KEYS.BGM_MENU, "sound/bg.mp3");
        this.load.audio(ASSET_KEYS.SFX_PLAYER_WALK, "sound/mainCharacter/walking.mp3");
        this.load.audio(ASSET_KEYS.SFX_PLAYER_JUMP, "sound/mainCharacter/jump.mp3");
        this.load.audio(ASSET_KEYS.SFX_PLAYER_ATTACK, "sound/mainCharacter/attack.mp3");
        this.load.audio(ASSET_KEYS.SFX_PLAYER_HIT, "sound/mainCharacter/hit.mp3");
        this.load.audio(ASSET_KEYS.SFX_SCOUT_WALK, "sound/scout/walking.mp3");
        this.load.audio(ASSET_KEYS.SFX_SCOUT_JUMP, "sound/scout/jump.mp3");
        this.load.audio(ASSET_KEYS.SFX_SCOUT_ATTACK, "sound/scout/attack.mp3");
        this.load.audio(ASSET_KEYS.SFX_SCOUT_HIT, "sound/scout/hit.mp3");
        this.load.audio(ASSET_KEYS.SFX_SPITTER_WALK, "sound/spitter/walking.mp3");
        this.load.audio(ASSET_KEYS.SFX_SPITTER_JUMP, "sound/spitter/jump.mp3");
        this.load.audio(ASSET_KEYS.SFX_SPITTER_ATTACK, "sound/spitter/attack.mp3");
        this.load.audio(ASSET_KEYS.SFX_SPITTER_HIT, "sound/spitter/hit.mp3");
        this.load.audio(ASSET_KEYS.SFX_BRUTE_WALK, "sound/brute/walking.mp3");
        this.load.audio(ASSET_KEYS.SFX_BRUTE_JUMP, "sound/brute/jump.mp3");
        this.load.audio(ASSET_KEYS.SFX_BRUTE_ATTACK, "sound/brute/attack.mp3");
        this.load.audio(ASSET_KEYS.SFX_BRUTE_HIT, "sound/brute/hit.mp3");
    }

    create(): void {
        const additionalFiles = MAP_ASSET_KEYS.reduce((count, mapAssetKey) => {
            return count + this.prepareMapTilesetImages(mapAssetKey);
        }, 0);

        if (additionalFiles > 0) {
            this.drawLoadingBar(0);
            this.load.once("complete", () => {
                this.loadingBar.destroy();
                this.scene.start(SCENE_KEYS.INTRO);
            });
            this.load.start();
            return;
        }

        this.loadingBar.destroy();
        this.scene.start(SCENE_KEYS.INTRO);
    }

    private drawLoadingBar(progress: number): void {
        const x = this.scale.width * 0.2;
        const y = this.scale.height * 0.52;
        const width = this.scale.width * 0.6;
        const height = 24;

        this.loadingBar.clear();
        this.loadingBar.fillStyle(0x12222d, 1);
        this.loadingBar.fillRoundedRect(x, y, width, height, 8);
        this.loadingBar.fillStyle(0x43d9b6, 1);
        this.loadingBar.fillRoundedRect(x + 4, y + 4, (width - 8) * progress, height - 8, 6);
    }

    private prepareMapTilesetImages(mapAssetKey: string): number {
        const mapRaw = this.cache.tilemap.get(mapAssetKey);
        const mapData = mapRaw?.data as TiledMapData | undefined;
        if (!mapData || !Array.isArray(mapData.layers) || !Array.isArray(mapData.tilesets)) {
            this.registry.set(this.getMapLookupRegistryKey(mapAssetKey), {});
            return 0;
        }

        const usedGids = this.collectUsedGids(mapData);
        const lookup: Record<string, MapTileLookupEntry> = {};
        let queuedFiles = 0;

        mapData.tilesets.forEach((tileset) => {
            const sourceName = tileset.source.split("/").pop() ?? tileset.source;
            const tsxCacheKey = TSX_CACHE_KEYS[sourceName];
            if (!tsxCacheKey || !this.cache.text.exists(tsxCacheKey)) {
                return;
            }

            const tsxContent = this.cache.text.get(tsxCacheKey) as string;
            const tileRegex = /<tile[^>]*id="(\d+)"[^>]*>[\s\S]*?<image[^>]*source="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"[^>]*\/>/g;
            let match: RegExpExecArray | null = tileRegex.exec(tsxContent);

            while (match) {
                const gid = tileset.firstgid + Number(match[1]);
                if (!usedGids.has(gid)) {
                    match = tileRegex.exec(tsxContent);
                    continue;
                }

                const imagePath = this.normalizeTilesetImagePath(match[2]);
                if (!imagePath) {
                    match = tileRegex.exec(tsxContent);
                    continue;
                }

                const textureKey = `${mapAssetKey}-gid-${gid}`;
                if (!this.textures.exists(textureKey)) {
                    this.load.image(textureKey, encodeURI(imagePath));
                    queuedFiles += 1;
                }

                lookup[String(gid)] = {
                    key: textureKey,
                    width: Number(match[3]),
                    height: Number(match[4])
                };

                match = tileRegex.exec(tsxContent);
            }
        });

        this.registry.set(this.getMapLookupRegistryKey(mapAssetKey), lookup);
        return queuedFiles;
    }

    private getMapLookupRegistryKey(mapAssetKey: string): string {
        return `mapTileLookup:${mapAssetKey}`;
    }

    private collectUsedGids(mapData: TiledMapData): Set<number> {
        const usedGids = new Set<number>();
        mapData.layers.forEach((layer) => {
            if (layer.type !== "tilelayer" || !Array.isArray(layer.data)) {
                return;
            }

            layer.data.forEach((gid) => {
                if (gid > 0) {
                    usedGids.add(gid);
                }
            });
        });

        return usedGids;
    }

    private normalizeTilesetImagePath(rawSource: string): string | null {
        const normalized = rawSource.replace(/\\/g, "/");
        const trimmedRelative = normalized.replace(/^(\.\.\/)+/, "");

        const exclusionMatch = normalized.match(/free-exclusion-zone-tileset-pixel-art\/1 Tiles\/Tile_(\d+)\.png$/i);
        if (exclusionMatch) {
            const tileNumber = exclusionMatch[1].padStart(2, "0");
            return `assets/maps/Free Industrial Zone Tileset/1 Tiles/IndustrialTile_${tileNumber}.png`;
        }

        const knownPackMatch = normalized.match(/(Free Industrial Zone Tileset\/.+|Cyberpunk platformer - World starter\/.+)$/);
        if (knownPackMatch) {
            return `assets/maps/${knownPackMatch[1]}`;
        }

        if (trimmedRelative.startsWith("assets/")) {
            return trimmedRelative;
        }

        const downloadsMarker = "/Downloads/";
        const markerIndex = normalized.indexOf(downloadsMarker);
        if (markerIndex >= 0) {
            return `assets/maps/${normalized.slice(markerIndex + downloadsMarker.length)}`;
        }

        if (normalized.startsWith("/assets/")) {
            return normalized.slice(1);
        }

        return null;
    }
}
