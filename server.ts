import express from "express";
import cors from "cors"; // <-- Ye nayi line add karo
import { createServer as createViteServer } from "vite";
// ... baki imports
import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { transliterate } from "transliteration";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors()); // <-- Ye nayi line add karo
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // Simple in-memory cache to simulate MongoDB for the demo
  const lyricsCache = new Map<string, { original: string; hinglish: string }>();

  // API Routes
  /**app.get("/api/lyrics", (req, res) => {
    const { song, artist } = req.query;
    const key = `${song}-${artist}`.toLowerCase();
    
    if (lyricsCache.has(key)) {
      return res.json({ status: "success", data: lyricsCache.get(key) });
    }
    
    res.json({ status: "not_found" });
  });**/

  // API Routes 2
  /**app.get("/api/lyrics", async (req, res) => {
    const { song, artist } = req.query;
    if (!song || !artist) {
      return res.json({ status: "not_found" });
    }

    const key = `${song}-${artist}`.toLowerCase();
    
    // 1. Check in-memory cache first[cite: 1]
    if (lyricsCache.has(key)) {
      return res.json({ status: "success", data: lyricsCache.get(key) });
    }
    
    // 2. Try fetching real lyrics from a Public API automatically
    try {
      console.log(`Searching real lyrics for: ${song} by ${artist}`);
      const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist as string)}/${encodeURIComponent(song as string)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.lyrics) {
          // Clean up string (API sometimes adds weird headers)
          let lyricsText = data.lyrics.replace(/Paroles de la chanson .*\r?\n/i, '');
          
          // Transliterate to Hinglish using your existing package[cite: 1]
          const hinglish = transliterate(lyricsText);
          const lyricData = { original: lyricsText, hinglish };
          
          // Save to cache so we don't fetch again[cite: 1]
          lyricsCache.set(key, lyricData);
          console.log("Real lyrics found and cached!");
          
          return res.json({ status: "success", data: lyricData });
        }
      }
    } catch (error) {
      console.error("Public API fetch failed:", error);
    }

    // 3. If real lyrics aren't found in the API, fallback to AI generation
    console.log("Real lyrics not found, falling back to AI prompt.");
    res.json({ status: "not_found" });
  });**/

  // API Routes
  app.get("/api/lyrics", async (req, res) => {
    const { song, artist } = req.query;
    if (!song || !artist) {
      return res.json({ status: "not_found" });
    }

    const key = `${song}-${artist}`.toLowerCase();
    
    // 1. Check in-memory cache first
    if (lyricsCache.has(key)) {
      return res.json({ status: "success", data: lyricsCache.get(key) });
    }
    
    // 2. Try fetching Synced Lyrics from LRCLIB API
    try {
      console.log(`Searching synced lyrics for: ${song} by ${artist}`);
      const response = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(song as string)}&artist_name=${encodeURIComponent(artist as string)}`);
      
      if (response.ok) {
        const data = await response.json();
        // Prefer syncedLyrics, fallback to plainLyrics if sync is unavailable
        const lyricsText = data.syncedLyrics || data.plainLyrics;
        
        if (lyricsText) {
          const isSynced = !!data.syncedLyrics; // Flag to tell frontend if we have timestamps
          
          // Transliterate to Hinglish
          const hinglish = transliterate(lyricsText);
          const lyricData = { original: lyricsText, hinglish, isSynced };
          
          // Save to cache
          lyricsCache.set(key, lyricData);
          console.log(`Lyrics found! Synced: ${isSynced}`);
          
          return res.json({ status: "success", data: lyricData });
        }
      }
    } catch (error) {
      console.error("LRCLIB API fetch failed:", error);
    }

    // 3. Fallback to AI generation if nothing is found
    console.log("Real lyrics not found, falling back to AI prompt.");
    res.json({ status: "not_found" });
  });

  app.post("/api/generate", async (req, res) => {
    const { song, artist } = req.body;
    const key = `${song}-${artist}`.toLowerCase();

    try {
      const prompt = `Provide the full lyrics for the song "${song}" by "${artist}". Strictly provide ONLY the lyrics without any headers, intro, or credits. If the song is in a non-English language (like Hindi), also provide the original native script.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      
      const lyrics = response.text || "";

      // Transliterate to Hinglish/Romanized if needed
      const hinglish = transliterate(lyrics);

      const lyricData = { original: lyrics, hinglish };
      lyricsCache.set(key, lyricData);

      res.json({ status: "success", data: lyricData });
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Failed to generate lyrics" });
    }
  });

  app.post("/api/report", (req, res) => {
    // Mock report logging
    console.log("Report received:", req.body);
    res.json({ status: "success", message: "Report logged." });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  /**app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });**/

  //new changes vercel:
  // Local machine par chalane ke liye
    if (process.env.NODE_ENV !== 'production') {
      const PORT = 3000;
      app.listen(PORT, () => {
        console.log(`Server running locally on http://localhost:${PORT}`);
      });
    }

    // Export for vercel.
    export default app; 
}

startServer();
