export const ASSET_KEYS = {
    LOGO: "logo",
    MENU_BG: "menu-bg",
    TEXT_LOGO: "text-logo",
    INTRO_VIDEO: "intro-video",
    MAP_LEVEL_1: "map-level-1",
    PLAYER_LEVEL_1: "player-level-1",
    PLAYER_LEVEL_2: "player-level-2",
    PLAYER_LEVEL_3: "player-level-3",
    PLAYER_LEVEL_4: "player-level-4",
    PLAYER_LEVEL_5: "player-level-5",
    ENEMY_SCOUT: "enemy-scout",
    ENEMY_SPITTER: "enemy-spitter",
    ENEMY_BRUTE: "enemy-brute",
    BGM_MENU: "bgm-menu",
    SFX_PLAYER_WALK: "sfx-player-walk",
    SFX_PLAYER_JUMP: "sfx-player-jump",
    SFX_PLAYER_ATTACK: "sfx-player-attack",
    SFX_PLAYER_HIT: "sfx-player-hit",
    SFX_SCOUT_WALK: "sfx-scout-walk",
    SFX_SCOUT_JUMP: "sfx-scout-jump",
    SFX_SCOUT_ATTACK: "sfx-scout-attack",
    SFX_SCOUT_HIT: "sfx-scout-hit",
    SFX_SPITTER_WALK: "sfx-spitter-walk",
    SFX_SPITTER_JUMP: "sfx-spitter-jump",
    SFX_SPITTER_ATTACK: "sfx-spitter-attack",
    SFX_SPITTER_HIT: "sfx-spitter-hit",
    SFX_BRUTE_WALK: "sfx-brute-walk",
    SFX_BRUTE_JUMP: "sfx-brute-jump",
    SFX_BRUTE_ATTACK: "sfx-brute-attack",
    SFX_BRUTE_HIT: "sfx-brute-hit"
} as const;

export type EnemySfxAction = "walk" | "jump" | "attack" | "hit";

export const ENEMY_SFX_KEYS: Record<string, Record<EnemySfxAction, string>> = {
    scout: {
        walk: ASSET_KEYS.SFX_SCOUT_WALK,
        jump: ASSET_KEYS.SFX_SCOUT_JUMP,
        attack: ASSET_KEYS.SFX_SCOUT_ATTACK,
        hit: ASSET_KEYS.SFX_SCOUT_HIT
    },
    spitter: {
        walk: ASSET_KEYS.SFX_SPITTER_WALK,
        jump: ASSET_KEYS.SFX_SPITTER_JUMP,
        attack: ASSET_KEYS.SFX_SPITTER_ATTACK,
        hit: ASSET_KEYS.SFX_SPITTER_HIT
    },
    brute: {
        walk: ASSET_KEYS.SFX_BRUTE_WALK,
        jump: ASSET_KEYS.SFX_BRUTE_JUMP,
        attack: ASSET_KEYS.SFX_BRUTE_ATTACK,
        hit: ASSET_KEYS.SFX_BRUTE_HIT
    }
};

export const PLAYER_EVOLUTION_TEXTURES = [
    ASSET_KEYS.PLAYER_LEVEL_1,
    ASSET_KEYS.PLAYER_LEVEL_2,
    ASSET_KEYS.PLAYER_LEVEL_3,
    ASSET_KEYS.PLAYER_LEVEL_4,
    ASSET_KEYS.PLAYER_LEVEL_5
] as const;

// Character sheets are 500x500 and split into a 4x4 grid.
export const PLAYER_SPRITESHEET_GRID = 4;
export const PLAYER_SPRITESHEET_SIZE = 500;
export const PLAYER_FRAME_SIZE = PLAYER_SPRITESHEET_SIZE / PLAYER_SPRITESHEET_GRID;

export const ENEMY_SPRITESHEET_GRID = 4;
export const ENEMY_SPRITESHEET_SIZE = 500;
export const ENEMY_FRAME_SIZE = ENEMY_SPRITESHEET_SIZE / ENEMY_SPRITESHEET_GRID;
