import { Scene } from "phaser";
import { ASSET_KEYS } from "../constants/assetKeys";

export interface MenuButtonApi {
    root: Phaser.GameObjects.Container;
    setEnabled: (enabled: boolean) => void;
    setLabel: (label: string) => void;
    getEnabled: () => boolean;
}

interface MenuButtonOptions {
    x: number;
    y: number;
    label: string;
    onClick: () => void;
    width?: number;
    height?: number;
    fontSize?: number;
    enabled?: boolean;
}

interface MenuCardOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    alpha?: number;
}

export const drawMenuBackground = (scene: Scene): void => {
    const width = scene.scale.width;
    const height = scene.scale.height;

    const bg = scene.add.image(width * 0.5, height * 0.5, ASSET_KEYS.MENU_BG);
    const scale = Math.max(width / bg.width, height / bg.height);
    bg.setScale(scale).setAlpha(0.95);

    scene.add.rectangle(width * 0.5, height * 0.5, width, height, 0x041a28, 0.44);

    const ringGraphics = scene.add.graphics();
    ringGraphics.lineStyle(7, 0x7be7ff, 0.34);
    ringGraphics.strokeCircle(width * 0.5, height * 0.5, 346);
    ringGraphics.lineStyle(3, 0x96f5ff, 0.28);
    ringGraphics.strokeCircle(width * 0.5, height * 0.5, 374);
};

export const createMenuCard = (scene: Scene, options: MenuCardOptions): Phaser.GameObjects.Container => {
    const alpha = options.alpha ?? 0.92;
    const outer = scene.add.rectangle(0, 0, options.width, options.height, 0x063046, alpha)
        .setStrokeStyle(3, 0x83e5ff, 0.68);
    const inner = scene.add.rectangle(0, 0, options.width - 16, options.height - 16, 0x062439, alpha)
        .setStrokeStyle(2, 0xb4f2ff, 0.5);

    return scene.add.container(options.x, options.y, [outer, inner]);
};

export const createMenuLabel = (
    scene: Scene,
    x: number,
    y: number,
    text: string,
    size = 26,
    color = "#e7f9ff"
): Phaser.GameObjects.Text => {
    return scene.add.text(x, y, text, {
        fontFamily: "Verdana",
        fontStyle: "bold",
        fontSize: `${size}px`,
        color,
        stroke: "#05141f",
        strokeThickness: 4
    }).setOrigin(0.5);
};

export const drawMenuHeader = (
    scene: Scene,
    title: string,
    subtitle?: string,
    options?: { logoScale?: number; titleY?: number; cellY?: number }
): void => {
    const width = scene.scale.width;
    const logoScale = options?.logoScale ?? 0.52;
    const titleY = options?.titleY ?? 110;
    const cellY = options?.cellY ?? 288;

    scene.add.image(width * 0.5, titleY, ASSET_KEYS.TEXT_LOGO).setScale(logoScale);
    scene.add.image(width * 0.5, cellY, ASSET_KEYS.LOGO).setScale(0.38);

    createMenuLabel(scene, width * 0.5, cellY + 108, title, 28, "#f8fcff");

    if (!subtitle) {
        return;
    }

    scene.add.text(width * 0.5, cellY + 140, subtitle, {
        fontFamily: "Verdana",
        fontSize: "17px",
        color: "#b9ecff",
        stroke: "#04131f",
        strokeThickness: 3
    }).setOrigin(0.5);
};

export const createMenuButton = (scene: Scene, options: MenuButtonOptions): MenuButtonApi => {
    const width = options.width ?? 420;
    const height = options.height ?? 58;
    const fontSize = options.fontSize ?? 28;
    const enabledAtStart = options.enabled ?? true;

    const outer = scene.add.rectangle(0, 0, width, height, 0x7f3e49, 0.95).setStrokeStyle(5, 0xf9b89f, 0.95);
    const inner = scene.add.rectangle(0, 0, width - 12, height - 12, 0x6b2a4e, 0.96).setStrokeStyle(2, 0xffd6bd, 0.8);
    const label = scene.add.text(0, 0, options.label, {
        fontFamily: "Verdana",
        fontStyle: "bold",
        fontSize: `${fontSize}px`,
        color: "#fff4df",
        stroke: "#3f1024",
        strokeThickness: 5
    }).setOrigin(0.5);

    const container = scene.add.container(options.x, options.y, [outer, inner, label]);

    let enabled = enabledAtStart;
    const applyVisual = () => {
        if (enabled) {
            outer.setFillStyle(0x7f3e49, 0.95);
            inner.setFillStyle(0x6b2a4e, 0.96);
            label.setColor("#fff4df");
            return;
        }

        outer.setFillStyle(0x4a3e43, 0.9);
        inner.setFillStyle(0x353038, 0.92);
        label.setColor("#a7a1a9");
    };

    applyVisual();

    outer.setInteractive({ useHandCursor: true });
    outer.on("pointerover", () => {
        if (!enabled) {
            return;
        }

        container.setScale(1.02);
    });
    outer.on("pointerout", () => {
        container.setScale(1);
    });
    outer.on("pointerdown", () => {
        if (!enabled) {
            return;
        }

        container.setScale(0.985);
    });
    outer.on("pointerup", () => {
        if (!enabled) {
            return;
        }

        container.setScale(1.02);
        options.onClick();
    });

    return {
        root: container,
        setEnabled: (nextEnabled: boolean) => {
            enabled = nextEnabled;
            applyVisual();
            outer.disableInteractive();
            if (enabled) {
                outer.setInteractive({ useHandCursor: true });
            }
        },
        setLabel: (nextLabel: string) => {
            label.setText(nextLabel);
        },
        getEnabled: () => enabled
    };
};
