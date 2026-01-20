# YouTube Data API Integration Guide

This application integrates with the **YouTube Data API v3** to provide reliable, high-quality music search results when adding songs to your library. It is designed to automatically find "Official Audio" versions of tracks to ensure the best listening experience.

## Why use the Official API?

While the application includes a built-in scraper fallback, using the Official API provides:
- **Higher Reliability:** Less likely to break if YouTube changes their internal HTML structure.
- **Better Accuracy:** Targeted search for "Music" category videos (`videoCategoryId=10`).
- **Faster Performance:** Direct API calls are often faster than scraping web pages.

---

## Step 1: Get Your API Key

To enable this integration, you need a free API Key from Google.

1.  **Go to the Google Cloud Console:**
    *   Visit [console.cloud.google.com](https://console.cloud.google.com/).
    *   Log in with your Google account.

2.  **Create a New Project:**
    *   Click the project dropdown at the top left.
    *   Click **"New Project"**.
    *   Name it something like `LifeOS-Music` and click **Create**.

3.  **Enable the YouTube Data API:**
    *   In the sidebar, go to **APIs & Services** > **Library**.
    *   Search for **"YouTube Data API v3"**.
    *   Click on the result and press **Enable**.

4.  **Create Credentials:**
    *   Once enabled, click the **"Create Credentials"** button (or go to **APIs & Services** > **Credentials**).
    *   Click **+ CREATE CREDENTIALS** > **API Key**.
    *   Copy the generated key (it starts with `AIza...`).

---

## Step 2: Configure the Application

1.  Navigate to the `server` directory in your project: `d:\webforme\server`.
2.  Open the `.env` file.
3.  Add the following line to the bottom of the file:

```env
YOUTUBE_API_KEY=PASTE_YOUR_KEY_HERE
```

*Example:*
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
YOUTUBE_API_KEY=AIzaSyB293847598234...
```

4.  **Save the file.**

---

## Step 3: Restart & Verify

1.  **Restart the Backend Server:**
    *   If your terminal running `npm start` is open, press `Ctrl+C` to stop it.
    *   Run `npm start` again to load the new `.env` settings.

2.  **Test the Integration:**
    *   Open your Web App.
    *   Click **Add Music**.
    *   Enter a song title (e.g., "Bohemian Rhapsody") and Artist.
    *   **Leave the URL field empty.**
    *   Click **Save**.

3.  **Check the logs (Optional):**
    *   In your server terminal, you should see a message confirming the API usage:
        > `Using YouTube Data API v3...`
        > `Found via API: https://www.youtube.com/watch?v=...`

## Troubleshooting

- **Quota Exceeded:** The free tier allows about 10,000 requests per day. If you hit this limit, the application will automatically fallback to the built-in scraper, so your app will **never break**.
- **"API Key Invalid":** Double-check you copied the key correctly without spaces.
- **Scraper Fallback:** If you see `Using yt-search scraper...` in the logs, it means either the API Key is missing/invalid or the API request failed. The app is still working using the backup method!
