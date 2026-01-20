export const authEndpoint = "https://accounts.spotify.com/authorize";
// Replace with your Client ID from developer.spotify.com
export const clientId = "8b9b29d919834277b0df91b3337a7751"; // This is a dummy ID for the template, User must replace
export const redirectUri = "http://localhost:5173/music";
export const scopes = [
    "streaming",
    "user-read-email",
    "user-read-private",
    "user-library-read",
    "user-library-modify",
    "user-read-playback-state",
    "user-modify-playback-state"
];

export const getTokenFromUrl = () => {
    return window.location.hash
        .substring(1)
        .split("&")
        .reduce((initial, item) => {
            let parts = item.split("=");
            initial[parts[0]] = decodeURIComponent(parts[1]);
            return initial;
        }, {});
};

export const loginUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
    "%20"
)}&response_type=token&show_dialog=true`;
