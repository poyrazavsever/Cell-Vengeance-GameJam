export type LevelId = 1 | 2 | 3;

export type UpgradeKey =
    | "evolution"
    | "maxHp"
    | "attack"
    | "moveSpeed"
    | "jumpPower"
    | "dashBoost";

export interface ProfileState {
    unlockedLevel: LevelId;
    selectedLevel: LevelId;
    walletPoints: number;
    upgrades: Record<UpgradeKey, number>;
    finaleSeen: boolean;
}

export interface RunState {
    levelId: LevelId;
    runPoints: number;
    health: number;
    maxHealth: number;
    invulnerableUntil: number;
}

export interface PlayerStats {
    evolutionLevel: number;
    maxHealth: number;
    attackDamage: number;
    moveBase: number;
    jumpPower: number;
    dashBonus: number;
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
    earned: number;
    walletBefore: number;
    walletAfter: number;
    nextLevel?: LevelId;
}
