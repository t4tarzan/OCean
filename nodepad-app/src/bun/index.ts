import { ApplicationMenu, BrowserView, BrowserWindow } from "electrobun/bun";
import type { MainRPC } from "shared/rpc";

// HMR: use Vite dev server if running, otherwise use bundled views
async function getMainViewUrl(): Promise<string> {
  try {
    const response = await fetch("http://localhost:5173");
    if (response.ok) {
      return "http://localhost:5173";
    }
  } catch {
    // Vite dev server not running, use bundled views
  }
  return "views://mainview/index.html";
}

// ── URL metadata fetching (CORS proxy replacement) ──────────────────────────

function extractMeta(html: string) {
  const tag = (pattern: RegExp) => {
    const m = html.match(pattern);
    return m
      ? m[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&#39;/g, "'")
          .trim()
      : "";
  };

  const title =
    tag(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i) ||
    tag(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i) ||
    tag(/<title[^>]*>([^<]{1,200})<\/title>/i);

  const description =
    tag(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i) ||
    tag(/<meta[^>]+content="([^"]+)"[^>]+property="og:description"/i) ||
    tag(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ||
    tag(/<meta[^>]+content="([^"]+)"[^>]+name="description"/i);

  const excerpt = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);

  return {
    title: title.slice(0, 200),
    description: description.slice(0, 400),
    excerpt,
  };
}

function isBlockedHost(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return true;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;

  const h = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (h === "localhost") return true;
  if (h === "metadata.google.internal") return true;
  if (h === "::1" || h === "0:0:0:0:0:0:0:1") return true;
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd"))
    return true;

  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 203 && b === 0 && Number(ipv4[3]) === 113) return true;
    if (a >= 224) return true;
  }

  return false;
}

async function fetchUrlMeta(
  url: string
): Promise<{
  title: string;
  description: string;
  excerpt: string;
  statusCode: number;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    let res: Response;
    try {
      res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "nodepad/1.0 (+https://nodepad.space)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
    } finally {
      clearTimeout(timer);
    }

    const statusCode = res.status;
    if (!res.ok)
      return { title: "", description: "", excerpt: "", statusCode };

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) {
      const kind = ct.split(";")[0].trim();
      return {
        title: "",
        description: `Non-HTML resource: ${kind}`,
        excerpt: "",
        statusCode,
      };
    }

    const html = await res.text();
    return { ...extractMeta(html), statusCode };
  } catch {
    return null;
  }
}

// ── Application menu ────────────────────────────────────────────────────────

ApplicationMenu.setApplicationMenu([
  {
    submenu: [
      { label: "About Nodepad", role: "about" },
      { type: "separator" },
      { label: "Quit", role: "quit", accelerator: "q" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "resetZoom" },
      { role: "zoomIn" },
      { role: "zoomOut" },
      { type: "separator" },
      { role: "toggleFullScreen" },
    ],
  },
]);

// ── RPC handlers ────────────────────────────────────────────────────────────

const mainRPC = BrowserView.defineRPC<MainRPC>({
  maxRequestTime: 10000,
  handlers: {
    requests: {
      ping: () => "pong",
      fetchUrl: async ({ url }) => {
        const urlStr = String(url ?? "");
        if (!urlStr || !/^https?:\/\//i.test(urlStr)) return null;
        if (isBlockedHost(urlStr)) return null;
        return fetchUrlMeta(urlStr);
      },
    },
    messages: {
      log: ({ msg }) => {
        console.log("[Webview]:", msg);
      },
    },
  },
});

// ── Main window ─────────────────────────────────────────────────────────────

const mainWindow = new BrowserWindow({
  title: "Nodepad",
  url: await getMainViewUrl(),
  frame: {
    width: 1400,
    height: 900,
    x: 100,
    y: 100,
  },
  titleBarStyle: "hiddenInset",
  rpc: mainRPC,
});

mainWindow.on("close", () => {
  console.log("Main window closed");
  process.exit(0);
});

mainWindow.webview.on("dom-ready", () => {
  console.log("Nodepad app started");
});
