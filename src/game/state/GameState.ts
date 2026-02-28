import { SHOP_CATALOG } from "../data/shopCatalog";
import { loadProfileFromStorage, saveProfileToStorage } from "../services/persistence";
import {
    GameSnapshot,
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
    evolution: 0,
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
    upgrades: { ...DEFAULT_UPGRADES },
    finaleSeen: false
};

const clampLevelId = (value: number): LevelId => {
    if (value <= 1) {
        return 1;
    }

    if (value >= 3) {
        return 3;
    }

    return 2;
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
        upgrades: { ...profile.upgrades },
        finaleSeen: profile.finaleSeen
    };
};

export class GameState {
    private profile: ProfileState = cloneProfile(DEFAULT_PROFILE);
    private run: RunState = {
        levelId: 1,
        runPoints: 0,
        health: 3,
        maxHealth: 3,
        invulnerableUntil: 0
    };
    private listeners: Set<SnapshotListener> = new Set();

    constructor() {
        const stats = this.computePlayerStats();
        this.run.maxHealth = stats.maxHealth;
        this.run.health = stats.maxHealth;
    }

    hydrateProfile(): GameSnapshot {
        const loaded = loadProfileFromStorage();
        this.profile = this.normalizeProfile(loaded);
        const stats = this.computePlayerStats();
        this.run = {
            levelId: this.profile.selectedLevel,
            runPoints: 0,
            health: stats.maxHealth,
            maxHealth: stats.maxHealth,
            invulnerableUntil: 0
        };
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
        const stats = this.computePlayerStats();
        this.run = {
            levelId,
            runPoints: 0,
            health: stats.maxHealth,
            maxHealth: stats.maxHealth,
            invulnerableUntil: 0
        };
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

    addCellPoints(points: number): GameSnapshot {
        this.run.runPoints += Math.max(points, 0);
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
        const earned = this.run.runPoints;
        const walletBefore = this.profile.walletPoints;
        this.profile.walletPoints += earned;
        this.run.runPoints = 0;

        const nextLevel = this.unlockNextLevelIfNeeded(levelId);
        if (levelId === 3) {
            this.profile.finaleSeen = true;
        }

        this.persistProfile();
        this.notify();

        return {
            levelId,
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
        return {
            evolutionLevel: Phaser.Math.Clamp(this.profile.upgrades.evolution, 0, 4),
            maxHealth: 3 + this.profile.upgrades.maxHp,
            attackDamage: 1 + this.profile.upgrades.attack,
            moveBase: 210 + this.profile.upgrades.moveSpeed * 20,
            jumpPower: 560 + this.profile.upgrades.jumpPower * 25,
            dashBonus: 120 + this.profile.upgrades.dashBoost * 25
        };
    }

    canPlayLevel(levelId: LevelId): boolean {
        if (this.profile.finaleSeen) {
            return true;
        }

        return levelId <= this.profile.unlockedLevel;
    }

    resetAllProgress(): GameSnapshot {
        this.profile = cloneProfile(DEFAULT_PROFILE);
        const stats = this.computePlayerStats();
        this.run = {
            levelId: 1,
            runPoints: 0,
            health: stats.maxHealth,
            maxHealth: stats.maxHealth,
            invulnerableUntil: 0
        };
        this.persistProfile();
        this.notify();
        return this.getSnapshot();
    }

    private normalizeProfile(rawProfile: unknown): ProfileState {
        if (!rawProfile || typeof rawProfile !== "object") {
            return cloneProfile(DEFAULT_PROFILE);
        }

        const source = rawProfile as Partial<ProfileState>;
        const upgrades = source.upgrades ?? DEFAULT_UPGRADES;
        const unlockedLevel = clampLevelId(Number(source.unlockedLevel ?? 1));
        const selectedLevel = clampLevelId(Number(source.selectedLevel ?? 1));
        const finaleSeen = Boolean(source.finaleSeen);
        const safeSelectedLevel = !finaleSeen && selectedLevel > unlockedLevel ? unlockedLevel : selectedLevel;

        return {
            unlockedLevel,
            selectedLevel: safeSelectedLevel,
            walletPoints: Math.max(0, Number(source.walletPoints ?? 0)),
            upgrades: {
                evolution: clampUpgradeLevel("evolution", Number(upgrades.evolution ?? 0)),
                maxHp: clampUpgradeLevel("maxHp", Number(upgrades.maxHp ?? 0)),
                attack: clampUpgradeLevel("attack", Number(upgrades.attack ?? 0)),
                moveSpeed: clampUpgradeLevel("moveSpeed", Number(upgrades.moveSpeed ?? 0)),
                jumpPower: clampUpgradeLevel("jumpPower", Number(upgrades.jumpPower ?? 0)),
                dashBoost: clampUpgradeLevel("dashBoost", Number(upgrades.dashBoost ?? 0))
            },
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
