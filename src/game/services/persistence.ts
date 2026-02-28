export const PROFILE_STORAGE_KEY = "cell-vengeance-profile-v1";

export const loadProfileFromStorage = (): unknown | null => {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const rawValue = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        if (!rawValue) {
            return null;
        }

        return JSON.parse(rawValue);
    } catch {
        return null;
    }
};

export const saveProfileToStorage = (profile: unknown): void => {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
        // Ignore persistence failures in prototype mode.
    }
};
