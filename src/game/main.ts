import { Game } from "phaser";
import { gameConfig } from "./config/gameConfig";

const StartGame = (parent: string): Game => {
    return new Game({ ...gameConfig, parent });
};

export default StartGame;
