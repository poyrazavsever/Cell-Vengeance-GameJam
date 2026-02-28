import { EVOLUTION_STAGES } from "../data/evolutionData";

export interface PlayerProgress {
    cellPoints: number;
    evolutionLevel: number;
}

type ProgressListener = (progress: PlayerProgress) => void;

export class GameState {
    private progress: PlayerProgress = {
        cellPoints: 0,
        evolutionLevel: 0
    };

    private listeners: Set<ProgressListener> = new Set();

    getSnapshot(): PlayerProgress {
        return { ...this.progress };
    }

    reset(): void {
        this.progress = {
            cellPoints: 0,
            evolutionLevel: 0
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
