import * as auth from '@tidal-music/auth';

// User must replace these with their own from dashboard.tidal.com
export const tidalConfig = {
    clientId: 'YOUR_TIDAL_CLIENT_ID',
    clientSecret: 'YOUR_TIDAL_CLIENT_SECRET',
    scopes: [],
    credentialsStorageKey: 'tidal_credentials' // Helper for local storage
};

export const initTidalAuth = async () => {
    try {
        await auth.init({
            clientId: tidalConfig.clientId,
            clientSecret: tidalConfig.clientSecret,
            credentialsStorageKey: tidalConfig.credentialsStorageKey,
            scopes: tidalConfig.scopes,
        });
        return auth;
    } catch (error) {
        console.error("Tidal Auth Init Failed:", error);
        throw error;
    }
};
