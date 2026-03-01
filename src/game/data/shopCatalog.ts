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
        label: "Atılma Gücü",
        description: "Atılma (dash) bonus hızını artırır.",
        baseCost: 10,
        costStep: 6,
        maxLevel: 3
    }
};

export const SHOP_ORDER: UpgradeKey[] = [
    "maxHp",
    "attack",
    "moveSpeed",
    "jumpPower",
    "dashBoost"
];
