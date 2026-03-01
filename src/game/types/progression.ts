export type LevelId = 1 | 2 | 3 | 4;

export type UpgradeKey =
    | "maxHp"
    | "attack"
    | "moveSpeed"
    | "jumpPower"
    | "dashBoost";

export type GrowthStage = 0 | 1 | 2 | 3;

export interface ProfileState {
    unlockedLevel: LevelId;
    selectedLevel: LevelId;
    walletPoints: number;
    totalAbsorbedCells: number;
    growthStage: GrowthStage;
    upgrades: Record<UpgradeKey, number>;
    introSeen: boolean;
    finaleSeen: boolean;
}

export interface RunState {
    levelId: LevelId;
    collectedCells: number;
    growthSpentInLevel: number;
    growthSpentBaseline: number;
    residualCells: number;
    health: number;
    maxHealth: number;
    invulnerableUntil: number;
}

export interface GrowthBonuses {
    maxHealthBonus: number;
    attackBonus: number;
    moveSpeedBonus: number;
    jumpPowerBonus: number;
}

export interface PlayerStats {
    maxHealth: number;
    attackDamage: number;
    moveBase: number;
    jumpPower: number;
    dashBonus: number;
    canDash: boolean;
    growthBonuses: GrowthBonuses;
}

export interface GameSnapshot {
    profile: ProfileState;
    run: RunState;
    stats: PlayerStats;
}

export interface PurchaseResult {
    ok: boolean;
    reason?: "insufficient_funds" | "maxed_out";
    cost?: number;
    newLevel?: number;
}

export interface LevelCompletionResult {
    levelId: LevelId;
    collectedCells: number;
    growthSpentInLevel: number;
    residualCells: number;
    earned: number;
    walletBefore: number;
    walletAfter: number;
    nextLevel?: LevelId;
}
