export const ASSET_KEYS = {
    LOGO: "logo",
    PLAYER_LEVEL_1: "player-level-1",
    PLAYER_LEVEL_2: "player-level-2",
    PLAYER_LEVEL_3: "player-level-3",
    PLAYER_LEVEL_4: "player-level-4",
    PLAYER_LEVEL_5: "player-level-5"
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
