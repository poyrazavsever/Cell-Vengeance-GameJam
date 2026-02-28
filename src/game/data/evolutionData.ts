export interface EvolutionStage {
    level: number;
    requiredPoints: number;
    label: string;
    description: string;
}

export const EVOLUTION_STAGES: EvolutionStage[] = [
    {
        level: 0,
        requiredPoints: 0,
        label: "Hücre Formu",
        description: "Temel hareketler aktif."
    },
    {
        level: 1,
        requiredPoints: 10,
        label: "Kas Dokusu",
        description: "Yakın mesafe yumruk aktif."
    },
    {
        level: 2,
        requiredPoints: 25,
        label: "Kemik Dokusu",
        description: "Koşu ve tekme aktif."
    },
    {
        level: 3,
        requiredPoints: 50,
        label: "Gelişmiş Doku",
        description: "Havaya yumruk aktif."
    },
    {
        level: 4,
        requiredPoints: 80,
        label: "Tam Form",
        description: "Mini clone desteği aktif."
    }
];
