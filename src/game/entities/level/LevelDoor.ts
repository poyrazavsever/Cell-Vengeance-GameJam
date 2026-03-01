import { Scene } from "phaser";

export class LevelDoor {
    private readonly frame: Phaser.GameObjects.Rectangle;
    private readonly core: Phaser.GameObjects.Rectangle;
    private readonly glow: Phaser.GameObjects.Rectangle;
    private isOpen = true;

    constructor(scene: Scene, x: number, y: number) {
        this.frame = scene.add.rectangle(x, y, 64, 118, 0x29495d, 1).setStrokeStyle(4, 0x7ed2ff, 1);
        this.core = scene.add.rectangle(x, y + 2, 44, 92, 0x16394c, 1).setStrokeStyle(2, 0x95deff, 0.85);
        this.glow = scene.add.rectangle(x, y - 42, 24, 8, 0x8ff2ff, 0.9);
    }

    setOpen(open: boolean): void {
        this.isOpen = open;
        if (open) {
            this.frame.setFillStyle(0x29495d, 1);
            this.core.setFillStyle(0x16394c, 1);
            this.glow.setVisible(true);
            return;
        }

        this.frame.setFillStyle(0x2a2f35, 1);
        this.core.setFillStyle(0x20242a, 1);
        this.glow.setVisible(false);
    }

    isOpenDoor(): boolean {
        return this.isOpen;
    }

    isPlayerInside(playerBounds: Phaser.Geom.Rectangle): boolean {
        if (!this.isOpen) {
            return false;
        }

        const activationBounds = this.getInteractionBounds();
        return Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, activationBounds);
    }

    getInteractionBounds(): Phaser.Geom.Rectangle {
        const doorBounds = this.core.getBounds();
        return Phaser.Geom.Rectangle.Inflate(doorBounds, 36, 24);
    }

    destroy(): void {
        this.frame.destroy();
        this.core.destroy();
        this.glow.destroy();
    }
}
