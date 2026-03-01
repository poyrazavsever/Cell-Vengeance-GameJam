import { GROWTH_STAGE_BONUSES, GROWTH_THRESHOLDS } from "../data/growthConfig";
import { SHOP_CATALOG } from "../data/shopCatalog";
import { loadProfileFromStorage, saveProfileToStorage } from "../services/persistence";
import {
    GameSnapshot,
    GrowthStage,
    LevelCompletionResult,
    LevelId,
    PlayerStats,
    ProfileState,
    PurchaseResult,
    RunState,
    UpgradeKey
} from "../types/progression";

type SnapshotListener = (snapshot: GameSnapshot) => void;

export interface DamageResult {
    applied: boolean;
    dead: boolean;
    snapshot: GameSnapshot;
}

const PLAYER_IFRAME_MS = 700;

const DEFAULT_UPGRADES: Record<UpgradeKey, number> = {
    maxHp: 0,
    attack: 0,
    moveSpeed: 0,
    jumpPower: 0,
    dashBoost: 0
};

const DEFAULT_PROFILE: ProfileState = {
    unlockedLevel: 1,
    selectedLevel: 1,
    walletPoints: 0,
    totalAbsorbedCells: 0,
    growthStage: 0,
    upgrades: { ...DEFAULT_UPGRADES },
    introSeen: false,
    finaleSeen: false
};

const clampLevelId = (value: number): LevelId => {
    if (value <= 1) {
        return 1;
    }

    if (value >= 4) {
        return 4;
    }

    return Math.floor(value) as LevelId;
};

const clampUpgradeLevel = (key: UpgradeKey, value: number): number => {
    const maxLevel = SHOP_CATALOG[key].maxLevel;
    return Phaser.Math.Clamp(Math.floor(value), 0, maxLevel);
};

const cloneProfile = (profile: ProfileState): ProfileState => {
    return {
        unlockedLevel: profile.unlockedLevel,
        selectedLevel: profile.selectedLevel,
        walletPoints: profile.walletPoints,
        totalAbsorbedCells: profile.totalAbsorbedCells,
        growthStage: profile.growthStage,
        upgrades: { ...profile.upgrades },
        introSeen: profile.introSeen,
        finaleSeen: profile.finaleSeen
    };
};

const resolveGrowthStage = (collectedCells: number): GrowthStage => {
    if (collectedCells >= GROWTH_THRESHOLDS[2]) {
        return 3;
    }

    if (collectedCells >= GROWTH_THRESHOLDS[1]) {
        return 2;
    }

    if (collectedCells >= GROWTH_THRESHOLDS[0]) {
        return 1;
    }

    return 0;
};

const resolveSpentForGrowth = (stage: GrowthStage): number => {
    if (stage === 0) {
        return 0;
    }

    return GROWTH_THRESHOLDS[stage - 1];
};

const createRunState = (levelId: LevelId, maxHealth: number, growthSpentBaseline: number): RunState => {
    return {
        levelId,
        collectedCells: 0,
        growthSpentInLevel: 0,
        growthSpentBaseline,
        residualCells: 0,
        health: maxHealth,
        maxHealth,
        invulnerableUntil: 0
    };
};

export class GameState {
    private profile: ProfileState = cloneProfile(DEFAULT_PROFILE);
    private run: RunState = createRunState(1, 3, 0);
    private listeners: Set<SnapshotListener> = new Set();

    constructor() {
        this.profile.growthStage = resolveGrowthStage(this.profile.totalAbsorbedCells);
        const stats = this.computePlayerStats();
        const baseline = resolveSpentForGrowth(this.profile.growthStage);
        this.run = createRunState(1, stats.maxHealth, baseline);
    }

    hydrateProfile(): GameSnapshot {
        const loaded = loadProfileFromStorage();
        this.profile = this.normalizeProfile(loaded);
        this.profile.growthStage = resolveGrowthStage(this.profile.totalAbsorbedCells);
        const stats = this.computePlayerStats();
        const baseline = resolveSpentForGrowth(this.profile.growthStage);
        this.run = createRunState(this.profile.selectedLevel, stats.maxHealth, baseline);
        this.notify();
        return this.getSnapshot();
    }

    persistProfile(): void {
        saveProfileToStorage(this.profile);
    }

    getSnapshot(): GameSnapshot {
        return {
            profile: cloneProfile(this.profile),
            run: { ...this.run },
            stats: this.computePlayerStats()
        };
    }

    onChange(listener: SnapshotListener): () => void {
        this.listeners.add(listener);
        listener(this.getSnapshot());

        return () => {
            this.listeners.delete(listener);
        };
    }

    startLevel(levelId: LevelId): GameSnapshot {
        this.profile.selectedLevel = levelId;
        this.profile.growthStage = resolveGrowthStage(this.profile.totalAbsorbedCells);
        const stats = this.computePlayerStats();
        const growthSpentBaseline = resolveSpentForGrowth(this.profile.growthStage);
        this.run = createRunState(levelId, stats.maxHealth, growthSpentBaseline);
        this.persistProfile();
        this.notify();
        return this.getSnapshot();
    }

    setSelectedLevel(levelId: LevelId): boolean {
        if (!this.canPlayLevel(levelId)) {
            return false;
        }

        this.profile.selectedLevel = levelId;
        this.persistProfile();
        this.notify();
        return true;
    }

    markIntroSeen(): GameSnapshot {
        if (this.profile.introSeen) {
            return this.getSnapshot();
        }

        this.profile.introSeen = true;
        this.persistProfile();
        this.notify();
        return this.getSnapshot();
    }

    addCellPoints(points: number): GameSnapshot {
        const safePoints = Math.max(points, 0);
        if (safePoints === 0) {
            return this.getSnapshot();
        }

        this.run.collectedCells += safePoints;
        this.profile.totalAbsorbedCells += safePoints;
        this.profile.growthStage = resolveGrowthStage(this.profile.totalAbsorbedCells);

        const globalSpentForGrowth = resolveSpentForGrowth(this.profile.growthStage);
        this.run.growthSpentInLevel = Math.max(0, globalSpentForGrowth - this.run.growthSpentBaseline);
        this.run.residualCells = Math.max(0, this.run.collectedCells - this.run.growthSpentInLevel);
        const stats = this.computePlayerStats();
        const previousMaxHealth = this.run.maxHealth;
        this.run.maxHealth = stats.maxHealth;
        if (this.run.maxHealth > previousMaxHealth) {
            this.run.health = Math.min(this.run.maxHealth, this.run.health + (this.run.maxHealth - previousMaxHealth));
        } else {
            this.run.health = Math.min(this.run.maxHealth, this.run.health);
        }

        this.persistProfile();
        this.notify();
        return this.getSnapshot();
    }

    applyPlayerDamage(amount: number, nowMs: number): DamageResult {
        if (amount <= 0 || this.run.health <= 0 || this.isPlayerInvulnerable(nowMs)) {
            return {
                applied: false,
                dead: this.run.health <= 0,
                snapshot: this.getSnapshot()
            };
        }

        this.run.health = Math.max(0, this.run.health - amount);
        this.run.invulnerableUntil = nowMs + PLAYER_IFRAME_MS;
        this.notify();

        return {
            applied: true,
            dead: this.run.health <= 0,
            snapshot: this.getSnapshot()
        };
    }

    healPlayer(amount: number): GameSnapshot {
        if (amount <= 0) {
            return this.getSnapshot();
        }

        this.run.health = Math.min(this.run.maxHealth, this.run.health + amount);
        this.notify();
        return this.getSnapshot();
    }

    restorePlayerVitals(): GameSnapshot {
        const stats = this.computePlayerStats();
        this.run.maxHealth = stats.maxHealth;
        this.run.health = stats.maxHealth;
        this.run.invulnerableUntil = 0;
        this.notify();
        return this.getSnapshot();
    }

    isPlayerInvulnerable(nowMs: number): boolean {
        return nowMs < this.run.invulnerableUntil;
    }

    completeLevel(): LevelCompletionResult {
        const levelId = this.run.levelId;
        const earned = this.run.residualCells;
        const walletBefore = this.profile.walletPoints;
        this.profile.walletPoints += earned;

        const nextLevel = this.unlockNextLevelIfNeeded(levelId);
        if (levelId === 3) {
            this.profile.finaleSeen = true;
        }

        this.profile.growthStage = resolveGrowthStage(this.profile.totalAbsorbedCells);
        const stats = this.computePlayerStats();
        const growthSpentBaseline = resolveSpentForGrowth(this.profile.growthStage);
        const collectedCells = this.run.collectedCells;
        const growthSpentInLevel = this.run.growthSpentInLevel;
        const residualCells = this.run.residualCells;
        this.run = createRunState(levelId, stats.maxHealth, growthSpentBaseline);

        this.persistProfile();
        this.notify();

        return {
            levelId,
            collectedCells,
            growthSpentInLevel,
            residualCells,
            earned,
            walletBefore,
            walletAfter: this.profile.walletPoints,
            nextLevel
        };
    }

    unlockNextLevelIfNeeded(levelId: LevelId): LevelId | undefined {
        if (levelId >= 3) {
            return undefined;
        }

        const nextLevel = (levelId + 1) as LevelId;
        if (this.profile.unlockedLevel < nextLevel) {
            this.profile.unlockedLevel = nextLevel;
        }

        return nextLevel;
    }

    purchaseUpgrade(key: UpgradeKey): PurchaseResult {
        const catalog = SHOP_CATALOG[key];
        const currentLevel = this.profile.upgrades[key];
        if (currentLevel >= catalog.maxLevel) {
            return { ok: false, reason: "maxed_out" };
        }

        const cost = catalog.baseCost + currentLevel * catalog.costStep;
        if (this.profile.walletPoints < cost) {
            return { ok: false, reason: "insufficient_funds" };
        }

        this.profile.walletPoints -= cost;
        this.profile.upgrades[key] = currentLevel + 1;

        const stats = this.computePlayerStats();
        const previousMax = this.run.maxHealth;
        this.run.maxHealth = stats.maxHealth;
        if (this.run.maxHealth > previousMax) {
            this.run.health = Math.min(this.run.maxHealth, this.run.health + (this.run.maxHealth - previousMax));
        } else {
            this.run.health = Math.min(this.run.maxHealth, this.run.health);
        }

        this.persistProfile();
        this.notify();
        return {
            ok: true,
            cost,
            newLevel: this.profile.upgrades[key]
        };
    }

    computePlayerStats(): PlayerStats {
        const growthBonus = GROWTH_STAGE_BONUSES[this.profile.growthStage];
        return {
            maxHealth: 3 + this.profile.upgrades.maxHp + growthBonus.maxHealthBonus,
            attackDamage: 1 + this.profile.upgrades.attack + growthBonus.attackBonus,
            moveBase: 170 + this.profile.upgrades.moveSpeed * 15 + growthBonus.moveSpeedBonus,
            jumpPower: 500 + this.profile.upgrades.jumpPower * 20 + growthBonus.jumpPowerBonus,
            dashBonus: 80 + this.profile.upgrades.dashBoost * 15,
            canDash: this.profile.upgrades.dashBoost > 0,
            growthBonuses: growthBonus
        };
    }

    canPlayLevel(levelId: LevelId): boolean {
        if (levelId === 4) {
            return true;
        }

        if (this.profile.finaleSeen) {
            return true;
        }

        return levelId <= this.profile.unlockedLevel;
    }

    resetAllProgress(): GameSnapshot {
        this.profile = cloneProfile(DEFAULT_PROFILE);
        this.profile.growthStage = resolveGrowthStage(this.profile.totalAbsorbedCells);
        const stats = this.computePlayerStats();
        const baseline = resolveSpentForGrowth(this.profile.growthStage);
        this.run = createRunState(1, stats.maxHealth, baseline);
        this.persistProfile();
        this.notify();
        return this.getSnapshot();
    }

    private normalizeProfile(rawProfile: unknown): ProfileState {
        if (!rawProfile || typeof rawProfile !== "object") {
            return cloneProfile(DEFAULT_PROFILE);
        }

        const source = rawProfile as Partial<ProfileState> & {
            upgrades?: Partial<Record<string, number>>;
            totalAbsorbedCells?: number;
            growthStage?: number;
        };
        const upgrades = source.upgrades ?? DEFAULT_UPGRADES;
        const unlockedLevel = clampLevelId(Number(source.unlockedLevel ?? 1));
        const selectedLevel = clampLevelId(Number(source.selectedLevel ?? 1));
        const finaleSeen = Boolean(source.finaleSeen);
        const introSeen = Boolean((source as { introSeen?: unknown }).introSeen);
        const parsedLegacyGrowthStage = Number(source.growthStage ?? 0);
        const safeLegacyGrowthStageValue = Number.isFinite(parsedLegacyGrowthStage) ? parsedLegacyGrowthStage : 0;
        const legacyGrowthStage = Phaser.Math.Clamp(Math.floor(safeLegacyGrowthStageValue), 0, 3) as GrowthStage;
        const parsedAbsorbedCells = Number(source.totalAbsorbedCells ?? 0);
        const safeAbsorbedCellsValue = Number.isFinite(parsedAbsorbedCells) ? parsedAbsorbedCells : 0;
        const rawAbsorbedCells = Math.max(0, Math.floor(safeAbsorbedCellsValue));
        const parsedWallet = Number(source.walletPoints ?? 0);
        const safeWallet = Number.isFinite(parsedWallet) ? parsedWallet : 0;
        const totalAbsorbedCells = rawAbsorbedCells > 0
            ? rawAbsorbedCells
            : resolveSpentForGrowth(legacyGrowthStage);
        const growthStage = resolveGrowthStage(totalAbsorbedCells);
        const safeSelectedLevel =
            !finaleSeen && selectedLevel > unlockedLevel && selectedLevel !== 4
                ? unlockedLevel
                : selectedLevel;

        return {
            unlockedLevel,
            selectedLevel: safeSelectedLevel,
            walletPoints: Math.max(0, safeWallet),
            totalAbsorbedCells,
            growthStage,
            upgrades: {
                maxHp: clampUpgradeLevel("maxHp", Number(upgrades.maxHp ?? 0)),
                attack: clampUpgradeLevel("attack", Number(upgrades.attack ?? 0)),
                moveSpeed: clampUpgradeLevel("moveSpeed", Number(upgrades.moveSpeed ?? 0)),
                jumpPower: clampUpgradeLevel("jumpPower", Number(upgrades.jumpPower ?? 0)),
                dashBoost: clampUpgradeLevel("dashBoost", Number(upgrades.dashBoost ?? 0))
            },
            introSeen,
            finaleSeen
        };
    }

    private notify(): void {
        const snapshot = this.getSnapshot();
        for (const listener of this.listeners) {
            listener(snapshot);
        }
    }
}

export const gameState = new GameState();
