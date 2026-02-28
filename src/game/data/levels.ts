import { LevelDefinition, LevelPlatform } from "../types/level";

const createGround = (worldWidth: number): LevelPlatform[] => {
    const platforms: LevelPlatform[] = [];
    // Add one extra ground segment so the level-end door never hangs over a gap.
    for (let x = 310; x <= worldWidth + 310; x += 620) {
        platforms.push({ key: "platform-lg", x, y: 752 });
    }

    return platforms;
};

const level1Platforms: LevelPlatform[] = [
    ...createGround(2400),
    { key: "platform-md", x: 520, y: 620 },
    { key: "platform-sm", x: 760, y: 500 },
    { key: "platform-md", x: 1040, y: 560 },
    { key: "platform-sm", x: 1280, y: 450 },
    { key: "platform-md", x: 1580, y: 600 },
    { key: "platform-sm", x: 1820, y: 500 },
    { key: "platform-md", x: 2080, y: 560 }
];

const level2Platforms: LevelPlatform[] = [
    ...createGround(3400),
    { key: "platform-md", x: 520, y: 620 },
    { key: "platform-sm", x: 760, y: 500 },
    { key: "platform-md", x: 1060, y: 570 },
    { key: "platform-sm", x: 1300, y: 430 },
    { key: "platform-md", x: 1560, y: 620 },
    { key: "platform-sm", x: 1780, y: 500 },
    { key: "platform-md", x: 2040, y: 560 },
    { key: "platform-sm", x: 2280, y: 430 },
    { key: "platform-md", x: 2540, y: 620 },
    { key: "platform-sm", x: 2780, y: 500 },
    { key: "platform-md", x: 3060, y: 560 }
];

const level3Platforms: LevelPlatform[] = [
    ...createGround(4600),
    { key: "platform-md", x: 520, y: 620 },
    { key: "platform-sm", x: 760, y: 500 },
    { key: "platform-md", x: 1040, y: 560 },
    { key: "platform-sm", x: 1280, y: 430 },
    { key: "platform-md", x: 1540, y: 620 },
    { key: "platform-sm", x: 1760, y: 500 },
    { key: "platform-md", x: 2020, y: 560 },
    { key: "platform-sm", x: 2260, y: 430 },
    { key: "platform-md", x: 2520, y: 620 },
    { key: "platform-sm", x: 2760, y: 500 },
    { key: "platform-md", x: 3020, y: 560 },
    { key: "platform-sm", x: 3260, y: 430 },
    { key: "platform-md", x: 3520, y: 620 },
    { key: "platform-sm", x: 3760, y: 500 },
    { key: "platform-md", x: 4020, y: 560 },
    { key: "platform-sm", x: 4260, y: 430 }
];

export const LEVELS: Record<1 | 2 | 3, LevelDefinition> = {
    1: {
        id: 1,
        name: "Bölüm 1 - Eğitim Lab",
        worldWidth: 4800,
        // Level 1 map was authored 8 tiles higher (8 * 32px).
        spawn: { x: 140, y: 364 },
        door: { x: 4680, y: 676 },
        platformPreset: level1Platforms,
        enemySpawns: [
            { kind: "scout", x: 620, y: 710, patrolMinX: 460, patrolMaxX: 820 },
            { kind: "scout", x: 1420, y: 710, patrolMinX: 1260, patrolMaxX: 1600 },
            { kind: "spitter", x: 2000, y: 560, patrolMinX: 1900, patrolMaxX: 2120 },
            { kind: "scout", x: 2600, y: 710, patrolMinX: 2440, patrolMaxX: 2800 },
            { kind: "spitter", x: 3200, y: 560, patrolMinX: 3100, patrolMaxX: 3340 },
            { kind: "brute", x: 3900, y: 710, patrolMinX: 3720, patrolMaxX: 4100 }
        ]
    },
    2: {
        id: 2,
        name: "Bölüm 2 - Gelişim Koridoru",
        worldWidth: 3400,
        spawn: { x: 140, y: 364 },
        door: { x: 3280, y: 676 },
        platformPreset: level2Platforms,
        enemySpawns: [
            { kind: "scout", x: 460, y: 710, patrolMinX: 340, patrolMaxX: 620 },
            { kind: "scout", x: 760, y: 710, patrolMinX: 620, patrolMaxX: 960 },
            { kind: "spitter", x: 1100, y: 560, patrolMinX: 1000, patrolMaxX: 1200 },
            { kind: "brute", x: 1420, y: 710, patrolMinX: 1260, patrolMaxX: 1580 },
            { kind: "spitter", x: 1560, y: 560, patrolMinX: 1480, patrolMaxX: 1660 },
            { kind: "scout", x: 1900, y: 710, patrolMinX: 1760, patrolMaxX: 2060 },
            { kind: "scout", x: 2360, y: 710, patrolMinX: 2200, patrolMaxX: 2540 },
            { kind: "spitter", x: 2820, y: 560, patrolMinX: 2740, patrolMaxX: 2960 },
            { kind: "brute", x: 3100, y: 710, patrolMinX: 2960, patrolMaxX: 3240 }
        ]
    },
    3: {
        id: 3,
        name: "Bölüm 3 - Final Laboratuvarı",
        worldWidth: 4600,
        spawn: { x: 140, y: 364 },
        door: { x: 4480, y: 676 },
        platformPreset: level3Platforms,
        enemySpawns: [
            { kind: "scout", x: 500, y: 710, patrolMinX: 380, patrolMaxX: 660 },
            { kind: "scout", x: 760, y: 710, patrolMinX: 620, patrolMaxX: 940 },
            { kind: "spitter", x: 1100, y: 560, patrolMinX: 1000, patrolMaxX: 1200 },
            { kind: "brute", x: 1400, y: 710, patrolMinX: 1240, patrolMaxX: 1560 },
            { kind: "spitter", x: 1560, y: 560, patrolMinX: 1480, patrolMaxX: 1660 },
            { kind: "scout", x: 1900, y: 710, patrolMinX: 1760, patrolMaxX: 2060 },
            { kind: "brute", x: 2300, y: 710, patrolMinX: 2140, patrolMaxX: 2480 },
            { kind: "spitter", x: 2700, y: 560, patrolMinX: 2600, patrolMaxX: 2820 },
            { kind: "scout", x: 2960, y: 710, patrolMinX: 2820, patrolMaxX: 3140 },
            { kind: "brute", x: 3300, y: 710, patrolMinX: 3140, patrolMaxX: 3460 },
            { kind: "spitter", x: 3440, y: 560, patrolMinX: 3360, patrolMaxX: 3560 },
            { kind: "brute", x: 4000, y: 710, patrolMinX: 3840, patrolMaxX: 4180 }
        ]
    }
};

export const getLevelById = (id: 1 | 2 | 3): LevelDefinition => {
    return LEVELS[id];
};
