import { EnemyKind } from "../types/combat";
import { EnemyConfig } from "../types/enemy";

export const ENEMY_CONFIGS: Record<EnemyKind, EnemyConfig> = {
    scout: {
        kind: "scout",
        maxHealth: 2,
        patrolSpeed: 90,
        detectRange: 150,
        chaseSpeed: 160,
        telegraphDuration: 450,
        attackDuration: 320,
        recoverDuration: 1200,
        hitDuration: 180,
        contactDamage: 1,
        contactCooldown: 800,
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
        maxHealth: 3,
        patrolSpeed: 30,
        detectRange: 450,
        telegraphDuration: 650,
        attackDuration: 560,
        recoverDuration: 2500,
        hitDuration: 220,
        contactDamage: 0,
        contactCooldown: 850,
        attackDamage: 1,
        projectileSpeed: 200,
        projectileLifetime: 2200,
        wobbleSpeed: 0.0032,
        wobbleAmplitude: 12,
        dropCellPoints: 4
    },
    brute: {
        kind: "brute",
        maxHealth: 5,
        patrolSpeed: 55,
        detectRange: 220,
        chaseSpeed: 70,
        telegraphDuration: 760,
        attackDuration: 900,
        recoverDuration: 3400,
        hitDuration: 220,
        contactDamage: 1,
        contactCooldown: 900,
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
