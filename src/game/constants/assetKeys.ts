export const ASSET_KEYS = {
    LOGO: "logo",
    MENU_BG: "menu-bg",
    TEXT_LOGO: "text-logo",
    INTRO_VIDEO: "intro-video",
    MAP_LEVEL_1: "map-level-1",
    MAP_LEVEL_2: "map-level-2",
    MAP_LEVEL_3: "map-level-3",
    MAP_BOSS: "map-boss",
    CELL_POINT: "cell-point-img",
    PLAYER_LEVEL_1: "player-level-1",
    ENEMY_SCOUT: "enemy-scout",
    ENEMY_SPITTER: "enemy-spitter",
    ENEMY_BRUTE: "enemy-brute",
    ENEMY_BOSS: "enemy-boss",
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
    SFX_BRUTE_HIT: "sfx-brute-hit",
    SFX_BOSS_WALK: "sfx-boss-walk",
    SFX_BOSS_JUMP: "sfx-boss-jump",
    SFX_BOSS_ATTACK: "sfx-boss-attack",
    SFX_BOSS_HIT: "sfx-boss-hit",
    SFX_BOSS_SCREAM: "sfx-boss-scream",
    SFX_BOSS_DAMAGE: "sfx-boss-damage"
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
    },
    boss: {
        walk: ASSET_KEYS.SFX_BOSS_WALK,
        jump: ASSET_KEYS.SFX_BOSS_JUMP,
        attack: ASSET_KEYS.SFX_BOSS_ATTACK,
        hit: ASSET_KEYS.SFX_BOSS_HIT
    }
};

export const PLAYER_TEXTURE_KEYS = [ASSET_KEYS.PLAYER_LEVEL_1] as const;

// Character sheets are 500x500 and split into a 4x4 grid.
export const PLAYER_SPRITESHEET_GRID = 4;
export const PLAYER_SPRITESHEET_SIZE = 500;
export const PLAYER_FRAME_SIZE = PLAYER_SPRITESHEET_SIZE / PLAYER_SPRITESHEET_GRID;

export const ENEMY_SPRITESHEET_GRID = 4;
export const ENEMY_SPRITESHEET_SIZE = 500;
export const ENEMY_FRAME_SIZE = ENEMY_SPRITESHEET_SIZE / ENEMY_SPRITESHEET_GRID;
