import { EnemyKind } from "../types/combat";
import { EnemyConfig } from "../types/enemy";

export const ENEMY_CONFIGS: Record<EnemyKind, EnemyConfig> = {
    scout: {
        kind: "scout",
        maxHealth: 3,
        patrolSpeed: 90,
        detectRange: 150,
        chaseSpeed: 180,
        telegraphDuration: 380,
        attackDuration: 300,
        recoverDuration: 1000,
        hitDuration: 180,
        contactDamage: 1,
        contactCooldown: 700,
        attackDamage: 1,
        attackDistance: 220,
        attackHitbox: {
            width: 48,
            height: 36,
            offsetX: 34,
            offsetY: 0
        },
        dropCellPoints: 3
    },
    spitter: {
        kind: "spitter",
        maxHealth: 4,
        patrolSpeed: 30,
        detectRange: 450,
        telegraphDuration: 600,
        attackDuration: 900,
        recoverDuration: 2100,
        hitDuration: 220,
        contactDamage: 0,
        contactCooldown: 850,
        attackDamage: 1,
        projectileSpeed: 220,
        projectileLifetime: 2200,
        burstShots: 3,
        burstIntervalMs: 170,
        burstStartDelayMs: 140,
        wobbleSpeed: 0.0032,
        wobbleAmplitude: 12,
        dropCellPoints: 4
    },
    brute: {
        kind: "brute",
        maxHealth: 7,
        patrolSpeed: 55,
        detectRange: 220,
        chaseSpeed: 70,
        telegraphDuration: 720,
        attackDuration: 900,
        recoverDuration: 3000,
        hitDuration: 220,
        contactDamage: 1,
        contactCooldown: 850,
        attackDamage: 2,
        attackDistance: 360,
        attackHitbox: {
            width: 90,
            height: 70,
            offsetX: 58,
            offsetY: 0
        },
        vulnerableOnlyInRecover: true,
        dropCellPoints: 6
    }
};
