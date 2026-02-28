export type EnemyKind = "scout" | "spitter" | "brute";

export type EnemyState =
    | "patrol"
    | "detect"
    | "telegraph"
    | "attack"
    | "recover"
    | "hit"
    | "death";

export type DamageSource =
    | "enemy-contact"
    | "enemy-attack"
    | "projectile"
    | "stomp"
    | "player-attack";
