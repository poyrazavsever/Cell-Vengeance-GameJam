import { UpgradeKey } from "../types/progression";

export interface ShopItem {
    key: UpgradeKey;
    label: string;
    description: string;
    baseCost: number;
    costStep: number;
    maxLevel: number;
}

export const SHOP_CATALOG: Record<UpgradeKey, ShopItem> = {
    evolution: {
        key: "evolution",
        label: "Evrim Artisi",
        description: "Karakter form seviyeni 1 artirir.",
        baseCost: 12,
        costStep: 8,
        maxLevel: 4
    },
    maxHp: {
        key: "maxHp",
        label: "Maksimum HP",
        description: "Maksimum cani 1 artirir.",
        baseCost: 10,
        costStep: 6,
        maxLevel: 3
    },
    attack: {
        key: "attack",
        label: "Saldiri Gucu",
        description: "Vurus hasarini 1 artirir.",
        baseCost: 9,
        costStep: 6,
        maxLevel: 3
    },
    moveSpeed: {
        key: "moveSpeed",
        label: "Hareket Hizi",
        description: "Temel kosu hizini artirir.",
        baseCost: 8,
        costStep: 5,
        maxLevel: 4
    },
    jumpPower: {
        key: "jumpPower",
        label: "Ziplama",
        description: "Ziplama gucunu artirir.",
        baseCost: 8,
        costStep: 5,
        maxLevel: 4
    },
    dashBoost: {
        key: "dashBoost",
        label: "Dash Boost",
        description: "Dash bonus hizini artirir.",
        baseCost: 10,
        costStep: 6,
        maxLevel: 3
    }
};

export const SHOP_ORDER: UpgradeKey[] = [
    "evolution",
    "maxHp",
    "attack",
    "moveSpeed",
    "jumpPower",
    "dashBoost"
];
