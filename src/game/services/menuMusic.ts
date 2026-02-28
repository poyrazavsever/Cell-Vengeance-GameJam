import { Scene } from "phaser";
import { ASSET_KEYS } from "../constants/assetKeys";

const MENU_MUSIC_VOLUME = 0.45;

const getMenuMusic = (scene: Scene): Phaser.Sound.BaseSound | null => {
    const existing = scene.sound.get(ASSET_KEYS.BGM_MENU);
    return (existing as Phaser.Sound.BaseSound | null) ?? null;
};

export const ensureMenuMusic = (scene: Scene): void => {
    if (!scene.cache.audio.exists(ASSET_KEYS.BGM_MENU)) {
        return;
    }

    const existingMusic = getMenuMusic(scene);
    if (existingMusic) {
        existingMusic.setLoop(true);
        existingMusic.setVolume(MENU_MUSIC_VOLUME);
        if (!existingMusic.isPlaying) {
            existingMusic.play();
        }
        return;
    }

    const music = scene.sound.add(ASSET_KEYS.BGM_MENU, {
        loop: true,
        volume: MENU_MUSIC_VOLUME
    });
    music.play();
};

export const stopMenuMusic = (scene: Scene): void => {
    const existingMusic = getMenuMusic(scene);
    if (existingMusic?.isPlaying) {
        existingMusic.stop();
    }
};
