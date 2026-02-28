import { EnemyKind } from "./combat";

export interface AttackHitboxConfig {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
}

export interface EnemyConfig {
    kind: EnemyKind;
    maxHealth: number;
    patrolSpeed: number;
    detectRange: number;
    chaseSpeed?: number;
    telegraphDuration: number;
    attackDuration: number;
    recoverDuration: number;
    hitDuration: number;
    contactDamage: number;
    contactCooldown: number;
    attackDamage: number;
    attackDistance?: number;
    attackHitbox?: AttackHitboxConfig;
    projectileSpeed?: number;
    projectileLifetime?: number;
    wobbleSpeed?: number;
    wobbleAmplitude?: number;
    vulnerableOnlyInRecover?: boolean;
    dropCellPoints: number;
}

export interface SpawnPoint {
    x: number;
    y: number;
    kind: EnemyKind;
    patrolMinX: number;
    patrolMaxX: number;
}
