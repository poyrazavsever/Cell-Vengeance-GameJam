import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { EVENT_KEYS } from "../constants/eventKeys";
import { EVOLUTION_STAGES } from "../data/evolutionData";
import { PlayerProgress } from "../state/GameState";
import { SCENE_KEYS } from "../constants/sceneKeys";

export class HudScene extends Scene {
    private pointsText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private stageText!: Phaser.GameObjects.Text;

    constructor() {
        super(SCENE_KEYS.HUD);
    }

    create(): void {
        this.pointsText = this.add.text(20, 16, "Cell Point: 0", {
            color: "#f0fdff",
            fontFamily: "Verdana",
            fontSize: "20px"
        }).setScrollFactor(0);

        this.levelText = this.add.text(20, 44, "Evrim: Lv0", {
            color: "#c8f2ff",
            fontFamily: "Verdana",
            fontSize: "18px"
        }).setScrollFactor(0);

        this.stageText = this.add.text(20, 70, "Form: Hücre Formu", {
            color: "#90d8ff",
            fontFamily: "Verdana",
            fontSize: "16px"
        }).setScrollFactor(0);

        EventBus.on(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, this.handleProgressUpdated, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, this.handleProgressUpdated, this);
        });
    }

    private handleProgressUpdated(progress: PlayerProgress): void {
        this.pointsText.setText(`Cell Point: ${progress.cellPoints}`);
        this.levelText.setText(`Evrim: Lv${progress.evolutionLevel}`);

        const currentStage = EVOLUTION_STAGES.find((stage) => stage.level === progress.evolutionLevel);
        this.stageText.setText(`Form: ${currentStage?.label ?? "Bilinmiyor"}`);
    }
}
