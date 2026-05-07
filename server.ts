import express from "express";
import cors  from "cors";

import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
console.log("Server script starting...");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
app.use(cors());
  // Global logger to catch EVERYTHING
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());
  app.use(cors({
   origin: [
      "http://localhost:3000",
      "https://friendly-cranachan-2fbc8b.netlify.app"
    ],
}));
  // Health check
  app.get("/api/health", (req, res) => {
    console.log("[HEALTH_CHECK] Responding with OK");
    res.json({ status: "ok", env: process.env.NODE_ENV || "development" });
  });

  // API Route for Product Search via SerpAPI
  app.get("/api/search", async (req, res) => {
    const query = req.query.q as string;
    const apiKey = process.env.SERPAPI_KEY;

    console.log(`[API_SEARCH_START] Query: "${query}"`);

    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    if (!apiKey) {
      return res.status(500).json({ error: "SERPAPI_KEY is not configured on the server" });
    }

    const cleanProductLink = (link: string): string => {
      try {
        if (!link) return "";
        const url = new URL(link);
        if (url.hostname.includes("google.com") && url.searchParams.has("url")) {
          return url.searchParams.get("url") || link;
        }
        if (url.hostname.includes("google.com") && url.searchParams.has("adurl")) {
          return url.searchParams.get("adurl") || link;
        }
        return link;
      } catch (e) {
        return link;
      }
    };

    const extractSourceFromUrl = (url: string): string => {
      try {
        const hostname = new URL(url).hostname;
        const s = hostname.toLowerCase();
        if (s.includes("amazon")) return "Amazon";
        if (s.includes("flipkart")) return "Flipkart";
        if (s.includes("meesho")) return "Meesho";
        if (s.includes("ebay")) return "eBay";
        if (s.includes("walmart")) return "Walmart";
        if (s.includes("target")) return "Target";
        if (s.includes("bestbuy")) return "Best Buy";
        if (s.includes("reliance")) return "Reliance Digital";
        if (s.includes("croma")) return "Croma";
        if (s.includes("ajio")) return "Ajio";
        if (s.includes("myntra")) return "Myntra";
        if (s.includes("blinkit")) return "Blinkit";
        if (s.includes("zepto")) return "Zepto";
        if (s.includes("bigbasket")) return "BigBasket";
        if (s.includes("jiomart")) return "JioMart";
        if (s.includes("tatacliq")) return "Tata CLiQ";
        if (s.includes("vijaysales")) return "Vijay Sales";
        
        const parts = hostname.replace("www.", "").split(".");
        const domain = parts[0];
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      } catch (e) {
        return "Store";
      }
    };

    try {
      // Direct query works best for Google Shopping with gl="in"
      const refinedQuery = `${query}`;
      
      const response = await axios.get("https://serpapi.com/search.json", {
        params: {
          engine: "google_shopping",
          q: refinedQuery,
          api_key: apiKey,
          hl: "en",
          gl: "in",
          location: "India",
          google_domain: "google.co.in"
        },
      });

      const shoppingResults = response.data.shopping_results || [];

      if (shoppingResults.length === 0) {
         console.warn("SerpAPI returned 0 results for:", refinedQuery);
      }

      // Normalize results and filter only the most obvious non-sale items
      const normalizedResults = shoppingResults
        .filter((item: any) => {
          const title = (item.title || "").toLowerCase();
          const rentalKeywords = [" rental", " hire ", " per day ", "subscription"];
          return !rentalKeywords.some(kw => title.includes(kw));
        })
        .map((item: any) => {
          const priceStr = item.price || "0";
          const priceNumeric = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
          const rawLink = item.product_link || item.link || "";
          const cleanedLink = cleanProductLink(rawLink);
          const source = item.source || extractSourceFromUrl(cleanedLink);

          return {
            id: `${source}-${item.position || Math.random().toString(36).substr(2, 9)}`,
            title: item.title,
            price: item.price || "Price not available",
            price_numeric: priceNumeric,
            link: cleanedLink,
            source: source,
            thumbnail: item.thumbnail,
            rating: item.rating,
            reviews: item.reviews,
            delivery: item.delivery
          };
        }).sort((a: any, b: any) => a.price_numeric - b.price_numeric);

      res.json({ results: normalizedResults });
    } catch (error: any) {
      const respData = error.response?.data;
      console.error("SerpAPI Error:", respData || error.message);
      
      if (respData?.error?.includes("searches per month limit")) {
        return res.status(429).json({ error: "Search limit reached for this month. Please check your SerpAPI dashboard." });
      }
      
      res.status(500).json({ error: "Failed to fetch product data. Please check your API key and network." });
    }
  });

  // API 404 Handler - fallback for /api routes only
  app.use("/api", (req, res) => {
    console.warn(`[API_404] No route matched for: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: "API route not found", 
      path: req.originalUrl,
      method: req.method 
    });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("FAILED TO START SERVER:", err);
  process.exit(1);
});
