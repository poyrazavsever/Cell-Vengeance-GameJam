import { EnemyKind } from "../types/combat";
import { EnemyConfig } from "../types/enemy";

export const ENEMY_CONFIGS: Record<EnemyKind, EnemyConfig> = {
    scout: {
        kind: "scout",
        maxHealth: 2,
        patrolSpeed: 120,
        detectRange: 150,
        chaseSpeed: 220,
        telegraphDuration: 350,
        attackDuration: 220,
        recoverDuration: 1000,
        hitDuration: 180,
        contactDamage: 1,
        contactCooldown: 650,
        attackDamage: 1,
        attackDistance: 280,
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
        patrolSpeed: 40,
        detectRange: 450,
        telegraphDuration: 500,
        attackDuration: 450,
        recoverDuration: 2200,
        hitDuration: 220,
        contactDamage: 0,
        contactCooldown: 700,
        attackDamage: 1,
        projectileSpeed: 280,
        projectileLifetime: 1800,
        wobbleSpeed: 0.0045,
        wobbleAmplitude: 16,
        dropCellPoints: 4
    },
    brute: {
        kind: "brute",
        maxHealth: 5,
        patrolSpeed: 70,
        detectRange: 220,
        chaseSpeed: 90,
        telegraphDuration: 600,
        attackDuration: 650,
        recoverDuration: 3000,
        hitDuration: 220,
        contactDamage: 1,
        contactCooldown: 700,
        attackDamage: 2,
        attackDistance: 420,
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
