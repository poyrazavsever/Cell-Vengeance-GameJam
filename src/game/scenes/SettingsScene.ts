import { Scene } from "phaser";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { ensureMenuMusic } from "../services/menuMusic";
import { applySettingsToSoundManager, clampSettingsVolume, getDefaultSettings, loadSettings, saveSettings, SettingsState } from "../services/settings";
import { MenuButtonApi, createMenuButton, createMenuCard, createMenuLabel, drawMenuBackground, drawMenuHeader } from "../ui/menuTheme";

type FullscreenCapableElement = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenCapableDocument = Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void> | void;
};

export class SettingsScene extends Scene {
    private settings: SettingsState = getDefaultSettings();
    private volumeText!: Phaser.GameObjects.Text;
    private muteButton!: MenuButtonApi;
    private fullscreenButton!: MenuButtonApi;
    private readonly onBrowserFullscreenChanged = () => {
        this.refreshUi();
    };

    constructor() {
        super(SCENE_KEYS.SETTINGS);
    }

    create(): void {
        this.settings = loadSettings();
        this.applyAudioSettings();
        ensureMenuMusic(this);

        drawMenuBackground(this);
        drawMenuHeader(this, "Ayarlar", "Ses ve ekran seçenekleri");

        createMenuCard(this, { x: 512, y: 556, width: 780, height: 360 });
        createMenuLabel(this, 512, 410, "Genel Ayarlar", 28, "#d0f4ff");

        this.add.text(234, 468, "Ses Seviyesi", {
            fontFamily: "Verdana",
            fontSize: "25px",
            color: "#e7f9ff",
            fontStyle: "bold",
            stroke: "#041822",
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        createMenuButton(this, {
            x: 500,
            y: 468,
            width: 54,
            height: 44,
            fontSize: 28,
            label: "-",
            onClick: () => this.adjustVolume(-0.1)
        });

        this.volumeText = this.add.text(618, 468, "", {
            fontFamily: "Verdana",
            fontSize: "26px",
            color: "#ffe8b8",
            fontStyle: "bold",
            stroke: "#041822",
            strokeThickness: 4
        }).setOrigin(0.5);

        createMenuButton(this, {
            x: 736,
            y: 468,
            width: 54,
            height: 44,
            fontSize: 28,
            label: "+",
            onClick: () => this.adjustVolume(0.1)
        });

        this.add.text(234, 548, "Sessiz Mod", {
            fontFamily: "Verdana",
            fontSize: "25px",
            color: "#e7f9ff",
            fontStyle: "bold",
            stroke: "#041822",
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        this.muteButton = createMenuButton(this, {
            x: 662,
            y: 548,
            width: 206,
            height: 48,
            fontSize: 22,
            label: "",
            onClick: () => {
                this.settings.muted = !this.settings.muted;
                this.persistAndRefresh();
            }
        });

        this.add.text(234, 628, "Tam Ekran", {
            fontFamily: "Verdana",
            fontSize: "25px",
            color: "#e7f9ff",
            fontStyle: "bold",
            stroke: "#041822",
            strokeThickness: 4
        }).setOrigin(0, 0.5);

        this.fullscreenButton = createMenuButton(this, {
            x: 662,
            y: 628,
            width: 206,
            height: 48,
            fontSize: 22,
            label: "",
            onClick: () => {
                void this.toggleFullscreen();
            }
        });

        createMenuButton(this, {
            x: 512,
            y: 728,
            width: 360,
            height: 52,
            fontSize: 22,
            label: "Ana Menüye Dön",
            onClick: () => this.scene.start(SCENE_KEYS.MAIN_MENU)
        });

        this.input.keyboard?.on("keydown-ESC", () => {
            this.scene.start(SCENE_KEYS.MAIN_MENU);
        });

        this.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, this.refreshUi, this);
        this.scale.on(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.refreshUi, this);
        document.addEventListener("fullscreenchange", this.onBrowserFullscreenChanged);
        document.addEventListener("webkitfullscreenchange", this.onBrowserFullscreenChanged as EventListener);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off(Phaser.Scale.Events.ENTER_FULLSCREEN, this.refreshUi, this);
            this.scale.off(Phaser.Scale.Events.LEAVE_FULLSCREEN, this.refreshUi, this);
            document.removeEventListener("fullscreenchange", this.onBrowserFullscreenChanged);
            document.removeEventListener("webkitfullscreenchange", this.onBrowserFullscreenChanged as EventListener);
        });

        this.refreshUi();
    }

    private adjustVolume(delta: number): void {
        this.settings.masterVolume = clampSettingsVolume(this.settings.masterVolume + delta);
        this.persistAndRefresh();
    }

    private persistAndRefresh(): void {
        saveSettings(this.settings);
        this.applyAudioSettings();
        this.refreshUi();
    }

    private applyAudioSettings(): void {
        applySettingsToSoundManager(this.sound, this.settings);
    }

    private refreshUi(): void {
        if (!this.volumeText || !this.muteButton || !this.fullscreenButton) {
            return;
        }

        this.volumeText.setText(`${Math.round(this.settings.masterVolume * 100)}%`);
        this.muteButton.setLabel(this.settings.muted ? "Aç" : "Kapat");
        this.fullscreenButton.setLabel(this.isFullscreenActive() ? "Açık" : "Kapalı");
    }

    private async toggleFullscreen(): Promise<void> {
        const fullscreenTarget = this.getFullscreenTarget();

        if (this.isFullscreenActive()) {
            this.exitFullscreen();
        } else {
            await this.enterFullscreen(fullscreenTarget);
        }

        this.time.delayedCall(0, () => {
            this.scale.refresh();
            this.refreshUi();
        });
    }

    private isFullscreenActive(): boolean {
        const doc = document as FullscreenCapableDocument;
        return this.scale.isFullscreen || Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
    }

    private getFullscreenTarget(): FullscreenCapableElement | null {
        const fromScale = (this.scale.fullscreenTarget ?? null) as FullscreenCapableElement | null;
        if (fromScale) {
            return fromScale;
        }

        return (this.game.canvas?.parentElement as FullscreenCapableElement | null)
            ?? (this.game.canvas as FullscreenCapableElement | null)
            ?? (document.getElementById("app") as FullscreenCapableElement | null)
            ?? document.documentElement as FullscreenCapableElement;
    }

    private async enterFullscreen(target: FullscreenCapableElement | null): Promise<void> {
        if (!target) {
            return;
        }

        try {
            this.scale.startFullscreen();
        } catch {
            // Phaser call failed; native fallback below.
        }

        if (this.isFullscreenActive()) {
            return;
        }

        try {
            if (typeof target.requestFullscreen === "function") {
                await target.requestFullscreen();
                return;
            }

            if (typeof target.webkitRequestFullscreen === "function") {
                await target.webkitRequestFullscreen();
            }
        } catch {
            // Browser can block fullscreen request when gesture is invalid; keep UI stable.
        }
    }

    private exitFullscreen(): void {
        const doc = document as FullscreenCapableDocument;

        try {
            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
            }
        } catch {
            // Phaser exit failed; native fallback below.
        }

        if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
            return;
        }

        if (typeof doc.exitFullscreen === "function") {
            void doc.exitFullscreen();
            return;
        }

        if (typeof doc.webkitExitFullscreen === "function") {
            void doc.webkitExitFullscreen();
        }
    }
}
