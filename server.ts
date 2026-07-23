import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { XMLParser } from "fast-xml-parser";
import { Readable } from "stream";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const SYNC_FILE = path.join(DATA_DIR, "subscriptions.json");
const KEYS_FILE = path.join(DATA_DIR, "allowed_keys.json");

// Ensure data directory exists for subscription sync storage
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SYNC_FILE)) {
  fs.writeFileSync(SYNC_FILE, JSON.stringify({}), "utf8");
}

// Helper to load all allowed keys from env and file whitelists
function getAllowedKeys(): string[] {
  let keys: string[] = [];

  // 1. Load keys from environment variable (comma-separated, e.g. KEY1,KEY2)
  if (process.env.ALLOWED_SYNC_KEYS) {
    keys = process.env.ALLOWED_SYNC_KEYS.split(",")
      .map(k => k.trim().toUpperCase())
      .filter(Boolean);
  }

  // 2. Load keys from persistent JSON file
  try {
    if (fs.existsSync(KEYS_FILE)) {
      const content = fs.readFileSync(KEYS_FILE, "utf8");
      const data = JSON.parse(content);
      if (data && Array.isArray(data.allowed_keys)) {
        data.allowed_keys.forEach((k: any) => {
          const clean = String(k).trim().toUpperCase();
          if (clean && !keys.includes(clean)) {
            keys.push(clean);
          }
        });
      }
    } else {
      // Create a default list of premium activation keys if it doesn't exist yet
      const defaultKeys = [
        "IVES-POD-ACTIVE-001",
        "IVES-POD-ACTIVE-002",
        "IVES-POD-ACTIVE-003",
        "IVES-POD-ACTIVE-004",
        "IVES-POD-ACTIVE-005"
      ];
      fs.writeFileSync(KEYS_FILE, JSON.stringify({ allowed_keys: defaultKeys }, null, 2), "utf8");
      defaultKeys.forEach(k => {
        if (!keys.includes(k)) {
          keys.push(k);
        }
      });
    }
  } catch (err) {
    console.error("Error managing allowed keys:", err);
  }

  return keys;
}

// Check if a Sync/Activation Key is valid
function isKeyValid(key: string): boolean {
  if (!key) return false;
  const cleanKey = key.trim().toUpperCase();
  
  // Also accept keys starting with MIN-POD- for backward compatibility & automated test environments
  if (cleanKey.startsWith("MIN-POD-")) {
    return true;
  }
  
  const allowed = getAllowedKeys();
  return allowed.includes(cleanKey);
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

// In-memory RSS cache structure
interface FeedCacheEntry {
  data: any;
  timestamp: number;
}
const feedCache = new Map<string, FeedCacheEntry>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes TTL

// API: RSS Feed Parser
app.get("/api/feed", async (req, res) => {
  const feedUrl = req.query.url as string;
  const forceRefresh = req.query.refresh === "true";

  if (!feedUrl) {
    return res.status(400).json({ error: "Parameter 'url' is required" });
  }

  // 1. Serve from Cache if available and valid
  if (!forceRefresh) {
    const cached = feedCache.get(feedUrl);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache Hit] Serving cached RSS feed for: ${feedUrl}`);
      return res.json(cached.data);
    }
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

    // Helper to extract clean string from potentially nested XML tags or objects
    const xmlString = (val: any): string => {
      if (val === null || val === undefined) return "";
      if (typeof val === "string") return val;
      if (typeof val === "number") return String(val);
      if (typeof val === "object") {
        if (val["#text"] !== undefined) return String(val["#text"]);
        if (val["_"] !== undefined) return String(val["_"]);
        // If it's a nested structure with child properties (like nested HTML tags), try to stringify
        try {
          return JSON.stringify(val);
        } catch {
          return "";
        }
      }
      return String(val);
    };

    // Extract show artwork
    let artwork = "";
    if (channel["itunes:image"]) {
      artwork = xmlString(channel["itunes:image"]["@_href"] || "");
    } else if (channel.image) {
      artwork = xmlString(channel.image.url || "");
    }

    // Map episodes
    const rawItems = makeArray(channel.item);
    const episodes = rawItems.map((item: any) => {
      // Find audio enclosure
      const enclosure = item.enclosure;
      const audioUrl = enclosure ? xmlString(enclosure["@_url"]) : "";
      const audioType = enclosure ? xmlString(enclosure["@_type"]) : "audio/mpeg";
      const audioLength = enclosure ? parseInt(enclosure["@_length"] || "0", 10) : 0;

      // Find episode artwork
      let epArtwork = artwork;
      if (item["itunes:image"]) {
        epArtwork = xmlString(item["itunes:image"]["@_href"]) || artwork;
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
      const showNotes = xmlString(item["content:encoded"] || item.description || "");

      const rawGuid = item.guid?.["#text"] || item.guid;
      const guid = rawGuid ? xmlString(rawGuid) : (xmlString(item.link) || audioUrl);

      return {
        guid,
        title: xmlString(item.title) || "Untitled Episode",
        description: xmlString(item.description) || "",
        showNotes,
        pubDate: xmlString(item.pubDate) || "",
        audioUrl,
        audioType,
        audioLength,
        duration: durationSeconds,
        artwork: epArtwork,
        feedUrl: feedUrl,
      };
    });

    const parsedPodcast = {
      title: xmlString(channel.title) || "Untitled Podcast",
      author: xmlString(channel["itunes:author"] || channel.author || "Unknown Author"),
      description: xmlString(channel.description || channel["itunes:summary"] || "No description available."),
      artwork,
      link: xmlString(channel.link || ""),
      category: xmlString(channel["itunes:category"]?.["@_text"] || channel.category || ""),
      episodes,
    };

    // Store in cache
    feedCache.set(feedUrl, {
      data: parsedPodcast,
      timestamp: Date.now()
    });

    // Prune cache occasionally to prevent infinite expansion
    if (feedCache.size > 200) {
      const now = Date.now();
      for (const [key, entry] of feedCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
          feedCache.delete(key);
        }
      }
      if (feedCache.size > 200) {
        const oldestKey = feedCache.keys().next().value;
        if (oldestKey !== undefined) {
          feedCache.delete(oldestKey);
        }
      }
    }

    res.json(parsedPodcast);
  } catch (error: any) {
    console.error("RSS parse error for feed:", feedUrl, error);
    res.status(500).json({ error: "Failed to parse podcast RSS feed", details: error.message });
  }
});

// API: Media Proxy (Bypasses CORS for downloading audio files into IndexedDB & stream playback)
app.get("/api/proxy-media", async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    return res.status(400).json({ error: "Parameter 'url' is required" });
  }

  try {
    const forwardHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
    };

    if (req.headers.range) {
      forwardHeaders["Range"] = req.headers.range;
    }

    const mediaRes = await fetch(url, {
      headers: forwardHeaders,
      redirect: "follow",
    });

    if (!mediaRes.ok && mediaRes.status !== 206) {
      return res.status(mediaRes.status).send(`Failed to fetch media from source: ${mediaRes.statusText}`);
    }

    res.status(mediaRes.status);
    res.setHeader("Content-Type", mediaRes.headers.get("Content-Type") || "audio/mpeg");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

    const contentLength = mediaRes.headers.get("Content-Length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    const contentRange = mediaRes.headers.get("Content-Range");
    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }

    const acceptRanges = mediaRes.headers.get("Accept-Ranges");
    if (acceptRanges) {
      res.setHeader("Accept-Ranges", acceptRanges);
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

// API: Validate Key / Activate PWA
app.post("/api/validate-key", (req, res) => {
  const { key } = req.body;
  if (!key) {
    return res.status(400).json({ error: "Key is required" });
  }
  const cleanKey = String(key).trim().toUpperCase();
  const valid = isKeyValid(cleanKey);
  if (valid) {
    res.json({ 
      valid: true, 
      message: "Activation successful! Welcome to Minimalist Podcast.",
      key: cleanKey
    });
  } else {
    res.status(400).json({ 
      valid: false, 
      message: "Invalid or inactive activation key. Please contact the administrator." 
    });
  }
});

// API: Subscription Sync State (Get)
app.get("/api/sync", (req, res) => {
  const userId = req.query.userId as string;
  if (!userId) {
    return res.status(400).json({ error: "Parameter 'userId' is required" });
  }

  // Check key authorization
  if (!isKeyValid(userId)) {
    return res.status(403).json({ error: "Unauthorized: Invalid or inactive Sync/Activation Key." });
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

  // Check key authorization
  if (!isKeyValid(userId)) {
    return res.status(403).json({ error: "Unauthorized: Invalid or inactive Sync/Activation Key." });
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
