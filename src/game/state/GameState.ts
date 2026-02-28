import { EVOLUTION_STAGES } from "../data/evolutionData";

export interface PlayerProgress {
    cellPoints: number;
    evolutionLevel: number;
    health: number;
    maxHealth: number;
    invulnerableUntil: number;
}

type ProgressListener = (progress: PlayerProgress) => void;

export interface DamageResult {
    applied: boolean;
    dead: boolean;
    snapshot: PlayerProgress;
}

const PLAYER_MAX_HEALTH = 3;
const PLAYER_IFRAME_MS = 700;

export class GameState {
    private progress: PlayerProgress = {
        cellPoints: 0,
        evolutionLevel: 0,
        health: PLAYER_MAX_HEALTH,
        maxHealth: PLAYER_MAX_HEALTH,
        invulnerableUntil: 0
    };

    private listeners: Set<ProgressListener> = new Set();

    getSnapshot(): PlayerProgress {
        return { ...this.progress };
    }

    reset(): void {
        this.progress = {
            cellPoints: 0,
            evolutionLevel: 0,
            health: PLAYER_MAX_HEALTH,
            maxHealth: PLAYER_MAX_HEALTH,
            invulnerableUntil: 0
        };

        this.notify();
    }

    addCellPoints(points: number): PlayerProgress {
        this.progress.cellPoints += Math.max(points, 0);

        let nextLevel = this.progress.evolutionLevel;

        for (const stage of EVOLUTION_STAGES) {
            if (this.progress.cellPoints >= stage.requiredPoints) {
                nextLevel = stage.level;
            }
        }

        this.progress.evolutionLevel = nextLevel;
        this.notify();
        return this.getSnapshot();
    }

    applyPlayerDamage(amount: number, nowMs: number): DamageResult {
        if (amount <= 0 || this.progress.health <= 0 || this.isPlayerInvulnerable(nowMs)) {
            return {
                applied: false,
                dead: this.progress.health <= 0,
                snapshot: this.getSnapshot()
            };
        }

        this.progress.health = Math.max(0, this.progress.health - amount);
        this.progress.invulnerableUntil = nowMs + PLAYER_IFRAME_MS;
        this.notify();

        return {
            applied: true,
            dead: this.progress.health <= 0,
            snapshot: this.getSnapshot()
        };
    }

    healPlayer(amount: number): PlayerProgress {
        if (amount <= 0) {
            return this.getSnapshot();
        }

        this.progress.health = Math.min(this.progress.maxHealth, this.progress.health + amount);
        this.notify();
        return this.getSnapshot();
    }

    restorePlayerVitals(): PlayerProgress {
        this.progress.health = this.progress.maxHealth;
        this.progress.invulnerableUntil = 0;
        this.notify();
        return this.getSnapshot();
    }

    isPlayerInvulnerable(nowMs: number): boolean {
        return nowMs < this.progress.invulnerableUntil;
    }

    onChange(listener: ProgressListener): () => void {
        this.listeners.add(listener);
        listener(this.getSnapshot());

        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify(): void {
        for (const listener of this.listeners) {
            listener(this.getSnapshot());
        }
    }
}

export const gameState = new GameState();
