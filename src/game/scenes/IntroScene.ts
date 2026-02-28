import { Scene } from "phaser";
import { ASSET_KEYS } from "../constants/assetKeys";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { stopMenuMusic } from "../services/menuMusic";
import { MenuButtonApi, createMenuButton } from "../ui/menuTheme";

const FALLBACK_VIDEO_WIDTH = 1920;
const FALLBACK_VIDEO_HEIGHT = 1080;

export class IntroScene extends Scene {
    private introVideo!: Phaser.GameObjects.Video;
    private backgroundRect!: Phaser.GameObjects.Rectangle;
    private startButton!: MenuButtonApi;
    private skipButton!: MenuButtonApi;
    private videoCompleted = false;
    private introStarted = false;
    private transitioning = false;

    constructor() {
        super(SCENE_KEYS.INTRO);
    }

    create(): void {
        stopMenuMusic(this);

        if (!this.cache.video.exists(ASSET_KEYS.INTRO_VIDEO)) {
            this.scene.start(SCENE_KEYS.MAIN_MENU);
            return;
        }

        const { width, height } = this.scale;
        this.backgroundRect = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x000000, 1);

        this.introVideo = this.add.video(width * 0.5, height * 0.5, ASSET_KEYS.INTRO_VIDEO);
        this.introVideo.setOrigin(0.5);
        this.introVideo.setVisible(false);
        this.configureVideoAudio();
        this.applyVideoLayout();

        this.introVideo.once("complete", () => {
            this.videoCompleted = true;
            this.goToMainMenu();
        });
        this.introVideo.on("metadata", () => {
            this.applyVideoLayout();
            this.configureVideoAudio();
        });

        this.startButton = createMenuButton(this, {
            x: width * 0.5,
            y: height - 90,
            width: 380,
            height: 62,
            fontSize: 30,
            label: "Oyuna Başla",
            onClick: () => this.startIntroPlayback()
        });

        this.skipButton = createMenuButton(this, {
            x: width - 96,
            y: height - 40,
            width: 156,
            height: 44,
            fontSize: 18,
            label: "Videoyu Geç",
            onClick: () => this.goToMainMenu()
        });
        this.skipButton.root.setVisible(false).setDepth(20);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
            this.introVideo.off("metadata");
            this.introVideo.stop();
            this.introVideo.destroy();
        });

        this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
        this.handleResize();
    }

    private handleResize(): void {
        const { width, height } = this.scale;
        this.backgroundRect.setPosition(width * 0.5, height * 0.5);
        this.backgroundRect.setSize(width, height);
        this.startButton.root.setPosition(width * 0.5, height - 90);
        this.skipButton.root.setPosition(width - 96, height - 40);
        this.applyVideoLayout();
    }

    private applyVideoLayout(): void {
        const { width, height } = this.scale;
        const sourceWidth = this.introVideo.video?.videoWidth || FALLBACK_VIDEO_WIDTH;
        const sourceHeight = this.introVideo.video?.videoHeight || FALLBACK_VIDEO_HEIGHT;
        const scale = Math.min(width / sourceWidth, height / sourceHeight);
        this.introVideo.setPosition(width * 0.5, height * 0.5);
        this.introVideo.setDisplaySize(sourceWidth * scale, sourceHeight * scale);
    }

    private startIntroPlayback(): void {
        if (this.introStarted) {
            return;
        }

        this.introStarted = true;
        this.startButton.root.setVisible(false);
        this.skipButton.root.setVisible(true);
        this.introVideo.setVisible(true);
        this.tryPlayIntro();
    }

    private tryPlayIntro(): void {
        this.configureVideoAudio();
        this.introVideo.play(false);

        this.time.delayedCall(80, () => {
            this.configureVideoAudio();
            this.applyVideoLayout();
        });
    }

    private goToMainMenu(): void {
        if (this.transitioning) {
            return;
        }

        this.transitioning = true;
        this.scene.start(SCENE_KEYS.MAIN_MENU);
    }

    private configureVideoAudio(): void {
        this.introVideo.setMute(false);
        this.introVideo.setVolume(1);

        const mediaElement = this.introVideo.video;
        if (!mediaElement) {
            return;
        }

        mediaElement.muted = false;
        mediaElement.defaultMuted = false;
        mediaElement.volume = 1;
    }
}
