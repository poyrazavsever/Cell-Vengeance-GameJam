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
        label: "Evrim Artışı",
        description: "Karakter form seviyeni 1 artırır.",
        baseCost: 12,
        costStep: 8,
        maxLevel: 4
    },
    maxHp: {
        key: "maxHp",
        label: "Maksimum HP",
        description: "Maksimum canı 1 artırır.",
        baseCost: 10,
        costStep: 6,
        maxLevel: 3
    },
    attack: {
        key: "attack",
        label: "Saldırı Gücü",
        description: "Vuruş hasarını 1 artırır.",
        baseCost: 9,
        costStep: 6,
        maxLevel: 3
    },
    moveSpeed: {
        key: "moveSpeed",
        label: "Hareket Hızı",
        description: "Temel koşu hızını artırır.",
        baseCost: 8,
        costStep: 5,
        maxLevel: 4
    },
    jumpPower: {
        key: "jumpPower",
        label: "Zıplama",
        description: "Zıplama gücünü artırır.",
        baseCost: 8,
        costStep: 5,
        maxLevel: 4
    },
    dashBoost: {
        key: "dashBoost",
        label: "Dash Boost",
        description: "Dash bonus hızını artırır.",
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
