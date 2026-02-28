import { Scene } from "phaser";
import { EventBus } from "../EventBus";
import { EVENT_KEYS } from "../constants/eventKeys";
import { EVOLUTION_STAGES } from "../data/evolutionData";
import { SCENE_KEYS } from "../constants/sceneKeys";
import { GameSnapshot } from "../types/progression";

export class HudScene extends Scene {
    private healthText!: Phaser.GameObjects.Text;
    private pointsText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private stageText!: Phaser.GameObjects.Text;
    private walletText!: Phaser.GameObjects.Text;

    constructor() {
        super(SCENE_KEYS.HUD);
    }

    create(): void {
        this.healthText = this.add.text(20, 16, "HP: 3/3", {
            color: "#ffd17f",
            fontFamily: "Verdana",
            fontSize: "20px"
        }).setScrollFactor(0);

        this.pointsText = this.add.text(20, 44, "Cell Point: 0", {
            color: "#f0fdff",
            fontFamily: "Verdana",
            fontSize: "20px"
        }).setScrollFactor(0);

        this.levelText = this.add.text(20, 72, "Evrim: Lv0", {
            color: "#c8f2ff",
            fontFamily: "Verdana",
            fontSize: "18px"
        }).setScrollFactor(0);

        this.stageText = this.add.text(20, 98, "Form: Hucre Formu", {
            color: "#90d8ff",
            fontFamily: "Verdana",
            fontSize: "16px"
        }).setScrollFactor(0);

        this.walletText = this.add.text(20, 122, "Cuzdan: 0", {
            color: "#ffe1aa",
            fontFamily: "Verdana",
            fontSize: "16px"
        }).setScrollFactor(0);

        EventBus.on(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, this.handleProgressUpdated, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            EventBus.off(EVENT_KEYS.PLAYER_PROGRESS_UPDATED, this.handleProgressUpdated, this);
        });
    }

    private handleProgressUpdated(snapshot: GameSnapshot): void {
        this.healthText.setText(`HP: ${snapshot.run.health}/${snapshot.run.maxHealth}`);
        this.pointsText.setText(`Run Point: ${snapshot.run.runPoints}`);
        this.levelText.setText(`Evrim: Lv${snapshot.stats.evolutionLevel}`);

        const currentStage = EVOLUTION_STAGES.find((stage) => stage.level === snapshot.stats.evolutionLevel);
        this.stageText.setText(`Form: ${currentStage?.label ?? "Bilinmiyor"}`);
        this.walletText.setText(`Cuzdan: ${snapshot.profile.walletPoints}`);
    }
}
