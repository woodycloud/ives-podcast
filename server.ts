import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { XMLParser } from "fast-xml-parser";
import { Readable } from "stream";

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const SYNC_FILE = path.join(DATA_DIR, "subscriptions.json");

// Ensure data directory exists for subscription sync storage
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SYNC_FILE)) {
  fs.writeFileSync(SYNC_FILE, JSON.stringify({}), "utf8");
}

app.use(express.json());

// API: iTunes Search Proxy
app.get("/api/search", async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=35`
    );
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Search proxy error:", error);
    res.status(500).json({ error: "Failed to search podcasts", details: error.message });
  }
});

// API: iTunes Lookup Proxy
app.get("/api/lookup", async (req, res) => {
  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ error: "Parameter 'id' is required" });
  }
  try {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${id}`);
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("Lookup proxy error:", error);
    res.status(500).json({ error: "Failed to lookup podcast details", details: error.message });
  }
});

// API: RSS Feed Parser
app.get("/api/feed", async (req, res) => {
  const feedUrl = req.query.url as string;
  if (!feedUrl) {
    return res.status(400).json({ error: "Parameter 'url' is required" });
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/xml, application/xml, text/html"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed, status: ${response.status}`);
    }

    const xmlText = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      parseAttributeValue: true,
      trimValues: true,
    });

    const jsonObj = parser.parse(xmlText);
    const channel = jsonObj?.rss?.channel;

    if (!channel) {
      return res.status(400).json({ error: "Invalid RSS feed format: <channel> element not found" });
    }

    // Helper to normalize arrays (since XML parsers return single objects or arrays depending on element count)
    const makeArray = (val: any) => {
      if (!val) return [];
      return Array.isArray(val) ? val : [val];
    };

    // Extract show artwork
    let artwork = "";
    if (channel["itunes:image"]) {
      artwork = channel["itunes:image"]["@_href"] || "";
    } else if (channel.image) {
      artwork = channel.image.url || "";
    }

    // Map episodes
    const rawItems = makeArray(channel.item);
    const episodes = rawItems.map((item: any) => {
      // Find audio enclosure
      const enclosure = item.enclosure;
      const audioUrl = enclosure ? enclosure["@_url"] : "";
      const audioType = enclosure ? enclosure["@_type"] : "audio/mpeg";
      const audioLength = enclosure ? parseInt(enclosure["@_length"] || "0", 10) : 0;

      // Find episode artwork
      let epArtwork = artwork;
      if (item["itunes:image"]) {
        epArtwork = item["itunes:image"]["@_href"] || artwork;
      }

      // Duration parsing (could be hh:mm:ss, mm:ss or seconds)
      let durationStr = item["itunes:duration"] || "";
      let durationSeconds = 0;
      if (typeof durationStr === "number") {
        durationSeconds = durationStr;
      } else if (typeof durationStr === "string" && durationStr) {
        const parts = durationStr.split(":").map(Number);
        if (parts.length === 3) {
          durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          durationSeconds = parts[0] * 60 + parts[1];
        } else {
          durationSeconds = parseInt(durationStr, 10) || 0;
        }
      }

      // Content/Show notes
      const showNotes = item["content:encoded"] || item.description || "";

      return {
        guid: item.guid?.["#text"] || item.guid || item.link || audioUrl,
        title: item.title || "Untitled Episode",
        description: item.description || "",
        showNotes,
        pubDate: item.pubDate || "",
        audioUrl,
        audioType,
        audioLength,
        duration: durationSeconds,
        artwork: epArtwork,
      };
    });

    const parsedPodcast = {
      title: channel.title || "Untitled Podcast",
      author: channel["itunes:author"] || channel.author || "Unknown Author",
      description: channel.description || channel["itunes:summary"] || "No description available.",
      artwork,
      link: channel.link || "",
      category: channel["itunes:category"]?.["@_text"] || channel.category || "",
      episodes,
    };

    res.json(parsedPodcast);
  } catch (error: any) {
    console.error("RSS parse error for feed:", feedUrl, error);
    res.status(500).json({ error: "Failed to parse podcast RSS feed", details: error.message });
  }
});

// API: Media Proxy (Bypasses CORS for downloading audio files into IndexedDB)
app.get("/api/proxy-media", async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: "Parameter 'url' is required" });
  }

  try {
    const mediaRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (!mediaRes.ok) {
      return res.status(mediaRes.status).send(`Failed to fetch media from source: ${mediaRes.statusText}`);
    }

    res.setHeader("Content-Type", mediaRes.headers.get("Content-Type") || "audio/mpeg");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range");
    
    const contentLength = mediaRes.headers.get("Content-Length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    if (mediaRes.body) {
      Readable.fromWeb(mediaRes.body as any).pipe(res);
    } else {
      res.status(500).send("No readable media body");
    }
  } catch (error: any) {
    console.error("Media proxy error:", error);
    res.status(500).send(`Media proxy error: ${error.message}`);
  }
});

// API: Subscription Sync State (Get)
app.get("/api/sync", (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "Parameter 'userId' is required" });
  }

  try {
    const fileContent = fs.readFileSync(SYNC_FILE, "utf8");
    const data = JSON.parse(fileContent);
    const userSubscriptions = data[userId] || [];
    res.json({ subscriptions: userSubscriptions });
  } catch (error: any) {
    console.error("Sync get error:", error);
    res.status(500).json({ error: "Failed to read sync state" });
  }
});

// API: Subscription Sync State (Save)
app.post("/api/sync", (req, res) => {
  const { userId, subscriptions } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required in request body" });
  }
  if (!Array.isArray(subscriptions)) {
    return res.status(400).json({ error: "subscriptions must be an array" });
  }

  try {
    const fileContent = fs.readFileSync(SYNC_FILE, "utf8");
    const data = JSON.parse(fileContent);
    data[userId] = subscriptions;
    fs.writeFileSync(SYNC_FILE, JSON.stringify(data, null, 2), "utf8");
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Sync save error:", error);
    res.status(500).json({ error: "Failed to save sync state" });
  }
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1y",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        }
      }
    }));
    app.get("*", (req, res) => {
      const ext = path.extname(req.path);
      if (ext && ext !== ".html") {
        return res.status(404).send("Not found");
      }
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
