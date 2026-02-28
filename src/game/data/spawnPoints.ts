import { SpawnPoint } from "../types/enemy";

export const SPAWN_POINTS: SpawnPoint[] = [
    // Stage A
    { kind: "scout", x: 520, y: 710, patrolMinX: 360, patrolMaxX: 760 },
    { kind: "scout", x: 980, y: 710, patrolMinX: 820, patrolMaxX: 1180 },
    // Stage B
    { kind: "scout", x: 1680, y: 710, patrolMinX: 1520, patrolMaxX: 1880 },
    { kind: "spitter", x: 2500, y: 560, patrolMinX: 2440, patrolMaxX: 2580 },
    { kind: "scout", x: 2860, y: 710, patrolMinX: 2700, patrolMaxX: 3060 },
    // Stage C
    { kind: "brute", x: 3360, y: 710, patrolMinX: 3200, patrolMaxX: 3600 },
    { kind: "scout", x: 3920, y: 710, patrolMinX: 3760, patrolMaxX: 4100 },
    { kind: "spitter", x: 4580, y: 560, patrolMinX: 4520, patrolMaxX: 4660 },
    { kind: "brute", x: 5140, y: 710, patrolMinX: 4980, patrolMaxX: 5360 }
];
