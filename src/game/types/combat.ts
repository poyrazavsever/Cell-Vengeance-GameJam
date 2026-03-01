export type EnemyKind = "scout" | "spitter" | "brute" | "boss";

export type EnemyState =
    | "patrol"
    | "detect"
    | "telegraph"
    | "attack"
    | "calm"
    | "special"
    | "summon"
    | "recover"
    | "hit"
    | "death";

export type DamageSource =
    | "enemy-contact"
    | "enemy-attack"
    | "projectile"
    | "fall"
    | "stomp"
    | "player-attack";
