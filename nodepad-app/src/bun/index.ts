import { ApplicationMenu, BrowserView, BrowserWindow } from "electrobun/bun";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { exec } from "node:child_process";
import type { MainRPC, EnrichParams, GhostParams } from "shared/rpc";

// ── API key storage ─────────────────────────────────────────────────────────
// Stored in ~/Library/Application Support/space.nodepad.app/config.json
// Falls back to ANTHROPIC_API_KEY env var if no stored key.

const CONFIG_DIR = join(
  homedir(),
  "Library",
  "Application Support",
  "space.nodepad.app"
);
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface AppConfig {
  anthropicApiKey?: string;
}

function readConfig(): AppConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch {
    // Corrupted config, start fresh
  }
  return {};
}

function writeConfig(config: AppConfig): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
      mode: 0o600, // Owner read/write only
    });
  } catch (e) {
    console.error("Failed to write config:", e);
  }
}

function getAnthropicKey(): string | null {
  // 1. Stored key (from in-app entry)
  const config = readConfig();
  if (config.anthropicApiKey) return config.anthropicApiKey;
  // 2. Environment variable fallback
  return process.env.ANTHROPIC_API_KEY || null;
}

function setAnthropicKey(key: string): boolean {
  try {
    const config = readConfig();
    config.anthropicApiKey = key;
    writeConfig(config);
    return true;
  } catch {
    return false;
  }
}

function clearAnthropicKey(): boolean {
  try {
    const config = readConfig();
    delete config.anthropicApiKey;
    writeConfig(config);
    return true;
  } catch {
    return false;
  }
}

function openExternal(url: string): void {
  // macOS: use 'open' command
  exec(`open "${url.replace(/"/g, '\\"')}"`);
}

// ── HMR: use Vite dev server if running, otherwise use bundled views ────────

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
  if (h === "localhost" || h === "metadata.google.internal") return true;
  if (h === "::1" || h === "0:0:0:0:0:0:0:1") return true;
  if (h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd"))
    return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 0 || a === 10 || a === 127) return true;
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

async function fetchUrlMeta(url: string) {
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
    if (!res.ok) return { title: "", description: "", excerpt: "", statusCode };
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html")) {
      return {
        title: "",
        description: `Non-HTML resource: ${ct.split(";")[0].trim()}`,
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

// ── Anthropic Messages API ──────────────────────────────────────────────────

const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250514";

const ENRICH_SYSTEM_PROMPT = `You are a sharp research partner embedded in a thinking tool called nodepad.

## Your Job
Add a concise annotation that augments the note — not a summary. Surface what the user likely doesn't know yet: a counter-argument, a relevant framework, a key tension, an adjacent concept, or a logical implication.

## Annotation Rules
- **2–4 sentences maximum.** Be direct. Cut anything that restates the note.
- **No URLs or hyperlinks ever.** If you reference a source, use its name and author only.
- Use markdown sparingly: **bold** for key terms, *italic* for titles. No bullet lists.

## Classification Priority
Use the most specific type. Avoid 'general' unless nothing else fits. 'thesis' is only valid if forcedType is set.

## Types
claim · question · task · idea · entity · quote · reference · definition · opinion · reflection · narrative · comparison · general · thesis

## Relational Logic
The Global Page Context lists existing notes by index [0], [1], [2]…
Set influencedByIndices to the indices of notes that are meaningfully connected. Be generous: if there is a plausible thematic link, include it.

## Output
Return ONLY valid JSON with this exact schema:
{
  "contentType": "one of the types above",
  "category": "short category label",
  "annotation": "2-4 sentence annotation",
  "confidence": null or 0-100,
  "influencedByIndices": [array of indices],
  "isUnrelated": false,
  "mergeWithIndex": null or index number
}`;

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  temperature = 0.1
): Promise<string> {
  const key = getAnthropicKey();
  if (!key) throw new Error("No ANTHROPIC_API_KEY set");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock?.text) throw new Error("No text in Anthropic response");
  return textBlock.text;
}

async function enrichBlockViaAnthropic(params: EnrichParams) {
  const { text, context, forcedType, category } = params;

  const categoryContext = category
    ? `\nThe user has assigned this note the category "${category}".`
    : "";
  const forcedTypeContext = forcedType
    ? `\nCRITICAL: The user has explicitly identified this note as a "${forcedType}".`
    : "";

  const globalContext =
    context.length > 0
      ? `\n\n## Global Page Context\n${context
          .map(
            (c, i) =>
              `<note index="${i}" category="${(c.category || "general").replace(/"/g, "")}">${c.text.substring(0, 100).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</note>`
          )
          .join("\n")}`
      : "";

  // URL prefetch for references
  let urlContext = "";
  const isUrl = /^https?:\/\//i.test(text.trim());
  if (isUrl) {
    const meta = await fetchUrlMeta(text.trim());
    if (meta === null) {
      urlContext =
        '\n\n<url_fetch_result status="error">Could not reach the URL.</url_fetch_result>';
    } else if (meta.statusCode >= 400) {
      urlContext = `\n\n<url_fetch_result status="${meta.statusCode}">URL returned an error.</url_fetch_result>`;
    } else {
      const parts = [
        meta.title ? `Title: ${meta.title}` : "",
        meta.description ? `Description: ${meta.description}` : "",
        meta.excerpt ? `Content excerpt: ${meta.excerpt}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      urlContext = parts
        ? `\n\n<url_fetch_result status="ok">\n${parts}\n</url_fetch_result>`
        : "";
    }
  }

  const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const userMessage = `<note_to_enrich>${safeText}</note_to_enrich>${urlContext}${categoryContext}${forcedTypeContext}${globalContext}`;

  const content = await callAnthropic(ENRICH_SYSTEM_PROMPT, userMessage);

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Anthropic response");

  try {
    const result = JSON.parse(jsonMatch[0]);
    if (result.confidence != null) {
      result.confidence = Math.min(
        100,
        Math.max(0, Math.round(result.confidence))
      );
    }
    return result;
  } catch {
    throw new Error(`Failed to parse enrichment JSON: ${content.substring(0, 200)}`);
  }
}

async function generateGhostViaAnthropic(params: GhostParams) {
  const { context, previousSyntheses } = params;
  const categories = [
    ...new Set(context.map((c) => c.category).filter(Boolean)),
  ];

  const avoidBlock =
    previousSyntheses.length > 0
      ? `\n\n## AVOID — these have already been generated:\n${previousSyntheses.map((t, i) => `${i + 1}. "${t}"`).join("\n")}`
      : "";

  const prompt = `You are an Emergent Thesis engine for a spatial research tool.

Find the **unspoken bridge** — an insight from the *tension or intersection between different topic areas*.

## Rules
1. Find a CROSS-CATEGORY connection. Notes span: ${categories.join(", ")}.
2. Look for tensions, paradoxes, inversions — not the dominant theme.
3. Be additive: say something the notes imply but do not state.
4. 15–25 words maximum. Sharp and specific.
5. Return a one-word category that names the bridge topic.${avoidBlock}

## Notes
${context
  .map(
    (c) =>
      `<note category="${(c.category || "general").replace(/"/g, "")}">${c.text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</note>`
  )
  .join("\n")}

Return ONLY valid JSON: {"text": "...", "category": "..."}`;

  const content = await callAnthropic(
    "You generate emergent thesis insights. Return only JSON.",
    prompt,
    0.7
  );

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in ghost response");

  try {
    return JSON.parse(jsonMatch[0]) as { text: string; category: string };
  } catch {
    const textMatch = content.match(/"text":\s*"(.*?)"/);
    const catMatch = content.match(/"category":\s*"(.*?)"/);
    if (textMatch) {
      return {
        text: textMatch[1],
        category: catMatch ? catMatch[1] : "thesis",
      };
    }
    throw new Error("Could not parse ghost response");
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
  maxRequestTime: 30000,
  handlers: {
    requests: {
      ping: () => "pong",
      fetchUrl: async ({ url }) => {
        const urlStr = String(url ?? "");
        if (!urlStr || !/^https?:\/\//i.test(urlStr)) return null;
        if (isBlockedHost(urlStr)) return null;
        return fetchUrlMeta(urlStr);
      },
      enrichBlock: async (params) => {
        try {
          return await enrichBlockViaAnthropic(params);
        } catch (e) {
          console.error("Enrichment error:", e);
          return null;
        }
      },
      generateGhost: async (params) => {
        try {
          return await generateGhostViaAnthropic(params);
        } catch (e) {
          console.error("Ghost generation error:", e);
          return null;
        }
      },
      getApiKeyStatus: () => {
        return { hasKey: !!getAnthropicKey() };
      },
      setApiKey: ({ key }) => {
        const trimmed = key.trim();
        if (!trimmed) return { success: false };
        const success = setAnthropicKey(trimmed);
        if (success) console.log("API key saved successfully");
        return { success };
      },
      clearApiKey: () => {
        const success = clearAnthropicKey();
        if (success) console.log("API key cleared");
        return { success };
      },
      openExternalUrl: ({ url }) => {
        try {
          openExternal(url);
          return { success: true };
        } catch {
          return { success: false };
        }
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
  const hasKey = !!getAnthropicKey();
  console.log(
    `Nodepad started. API key: ${hasKey ? "configured" : "not set — user will be prompted in-app"}`
  );
});
