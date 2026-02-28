import { Physics, Scene } from "phaser";

export class AcidProjectile extends Physics.Arcade.Image {
    private damage = 1;

    constructor(scene: Scene, x: number, y: number) {
        super(scene, x, y, "acid-projectile");

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(1);
        this.setBounce(0);
        this.setCollideWorldBounds(false);

        const body = this.body as Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setCircle(6, 2, 2);
    }

    launch(targetX: number, targetY: number, speed: number, damage: number, lifetime: number): void {
        this.damage = damage;
        const direction = new Phaser.Math.Vector2(targetX - this.x, targetY - this.y).normalize();
        const body = this.body as Physics.Arcade.Body;
        body.setVelocity(direction.x * speed, direction.y * speed);

        this.scene.time.delayedCall(lifetime, () => {
            if (this.active) {
                this.destroy();
            }
        });
    }

    getDamage(): number {
        return this.damage;
    }
}
