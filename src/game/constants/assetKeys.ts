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
    SFX_PLAYER_HIT: "sfx-player-hit"
} as const;

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
