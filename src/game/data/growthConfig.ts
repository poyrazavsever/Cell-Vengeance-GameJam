import { GrowthStage } from "../types/progression";

export const GROWTH_THRESHOLDS = [24, 60, 110] as const;

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

export interface GrowthStageStatBonus {
    maxHealthBonus: number;
    attackBonus: number;
    moveSpeedBonus: number;
    jumpPowerBonus: number;
}

export const GROWTH_STAGE_BONUSES: Record<GrowthStage, GrowthStageStatBonus> = {
    0: { maxHealthBonus: 0, attackBonus: 0, moveSpeedBonus: 0, jumpPowerBonus: 0 },
    1: { maxHealthBonus: 1, attackBonus: 0, moveSpeedBonus: 8, jumpPowerBonus: 10 },
    2: { maxHealthBonus: 1, attackBonus: 1, moveSpeedBonus: 16, jumpPowerBonus: 20 },
    3: { maxHealthBonus: 2, attackBonus: 1, moveSpeedBonus: 24, jumpPowerBonus: 32 }
};

export const GROWTH_STAGE_INFO: GrowthStageInfo[] = [
    { stage: 0, label: "Temel Hücre", description: "Başlangıç boyutu." },
    { stage: 1, label: "Büyüme I", description: "Daha dayanıklı bir forma geçiş." },
    { stage: 2, label: "Büyüme II", description: "Hasar ve hareket kabiliyeti güçlendi." },
    { stage: 3, label: "Büyüme III", description: "Kalıcı güçlendirmelerin en yüksek formu." }
];
