import { GrowthStage } from "../types/progression";

export const GROWTH_THRESHOLDS = [12, 28, 52] as const;

export const GROWTH_STAGE_SCALES: Record<GrowthStage, number> = {
    0: 0.48,
    1: 0.54,
    2: 0.6,
    3: 0.66
};

export interface GrowthStageInfo {
    stage: GrowthStage;
    label: string;
    description: string;
}

export const GROWTH_STAGE_INFO: GrowthStageInfo[] = [
    { stage: 0, label: "Temel Hücre", description: "Başlangıç boyutu." },
    { stage: 1, label: "Büyüme I", description: "Hücre hacmi arttı." },
    { stage: 2, label: "Büyüme II", description: "Daha iri ve görünür form." },
    { stage: 3, label: "Büyüme III", description: "Maksimum görsel büyüme." }
];
