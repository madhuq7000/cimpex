import type { Language } from "./translations";

const translationCache = new Map<string, string>();
const MAX_CHUNK = 450;

const htmlToPlainText = (value: string) => {
  if (typeof document === "undefined") {
    return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  const container = document.createElement("div");
  container.innerHTML = value;
  return (container.textContent || container.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
};

const splitChunks = (text: string) => {
  if (text.length <= MAX_CHUNK) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > MAX_CHUNK) {
    let splitAt = remaining.lastIndexOf(" ", MAX_CHUNK);
    if (splitAt < 80) {
      splitAt = MAX_CHUNK;
    }
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
};

const translateChunk = async (text: string, target: Language) => {
  const cacheKey = `${target}::${text}`;
  const cached = translationCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const langpair = target === "hi" ? "en|hi" : "hi|en";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
    text,
  )}&langpair=${langpair}`;

  const response = await fetch(url);
  const data = await response.json();
  const translated = String(data?.responseData?.translatedText || text).trim();

  translationCache.set(cacheKey, translated);
  return translated;
};

export const translateContent = async (
  text: string,
  target: Language,
  options?: { html?: boolean },
) => {
  const source = options?.html ? htmlToPlainText(text) : text.trim();

  if (!source) {
    return "";
  }

  if (target === "en") {
    return options?.html ? text : source;
  }

  const chunks = splitChunks(source);
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    try {
      translatedChunks.push(await translateChunk(chunk, target));
    } catch (error) {
      console.error("Content translation failed:", error);
      translatedChunks.push(chunk);
    }
  }

  return translatedChunks.join(" ");
};

export const htmlToPlainTextExport = htmlToPlainText;
