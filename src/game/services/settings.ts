interface SettingsState {
    masterVolume: number;
    muted: boolean;
}

const SETTINGS_STORAGE_KEY = "cell-vengeance-settings-v1";
const DEFAULT_SETTINGS: SettingsState = {
    masterVolume: 0.5,
    muted: false
};

const clampVolume = (value: number): number => Phaser.Math.Clamp(value, 0, 1);

export const getDefaultSettings = (): SettingsState => ({ ...DEFAULT_SETTINGS });

export const loadSettings = (): SettingsState => {
    if (typeof window === "undefined") {
        return getDefaultSettings();
    }

    try {
        const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) {
            return getDefaultSettings();
        }

        const parsed = JSON.parse(raw) as Partial<SettingsState>;
        return {
            masterVolume: clampVolume(Number(parsed.masterVolume ?? DEFAULT_SETTINGS.masterVolume)),
            muted: Boolean(parsed.muted)
        };
    } catch {
        return getDefaultSettings();
    }
};

export const saveSettings = (settings: SettingsState): void => {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

export const clampSettingsVolume = clampVolume;

export const applySettingsToSoundManager = (sound: Phaser.Sound.BaseSoundManager, settings: SettingsState): void => {
    sound.volume = settings.masterVolume;
    sound.mute = settings.muted;
};

export type { SettingsState };
