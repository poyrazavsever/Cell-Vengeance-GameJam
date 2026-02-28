import { SpawnPoint } from "../types/enemy";

export const SPAWN_POINTS: SpawnPoint[] = [
    // Stage A
    { kind: "scout", x: 210, y: 560, patrolMinX: 90, patrolMaxX: 340 },
    { kind: "scout", x: 520, y: 460, patrolMinX: 430, patrolMaxX: 620 },
    // Stage B
    { kind: "scout", x: 830, y: 580, patrolMinX: 700, patrolMaxX: 980 },
    { kind: "spitter", x: 900, y: 380, patrolMinX: 850, patrolMaxX: 970 },
    { kind: "scout", x: 170, y: 710, patrolMinX: 70, patrolMaxX: 360 },
    // Stage C
    { kind: "brute", x: 560, y: 710, patrolMinX: 420, patrolMaxX: 760 },
    { kind: "scout", x: 940, y: 380, patrolMinX: 820, patrolMaxX: 990 }
];
