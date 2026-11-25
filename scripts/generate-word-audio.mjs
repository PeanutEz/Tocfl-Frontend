import { mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EdgeTTS } from "node-edge-tts";
import { sha1 } from "js-sha1";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(root, "public", "data");
const outputDirectory = path.join(root, "public", "audio", "words");
const voice = "zh-TW-HsiaoChenNeural";
const concurrency = 4;
const maxAttempts = 3;
const limitIndex = process.argv.indexOf("--limit");
const limit = limitIndex === -1 ? undefined : Number(process.argv[limitIndex + 1]);
const dryRun = process.argv.includes("--dry-run");

if (limitIndex !== -1 && (!Number.isInteger(limit) || limit < 1)) {
  throw new Error("Giới hạn phải là số nguyên dương, ví dụ: --limit 10");
}

function cleanText(text) {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/[【】（）()：:]/g, " ")
    .trim();
}

function idiomText(raw = "") {
  let text = raw.trim();
  if (/^Tục ngữ\s*[:：]/.test(text)) text = text.replace(/^Tục ngữ\s*[:：]\s*/, "");

  const firstLine = text.split(/<br\s*\/?>/i)[0];
  const runs = firstLine.match(/[㐀-鿿豈-﫿]+/g) ?? [];
  if (runs.length > 0) return runs.reduce((longest, run) => (run.length > longest.length ? run : longest), "");

  const cut = text.indexOf(" - ") >= 0 ? text.indexOf(" - ") : text.indexOf("-");
  const zhAndPy = (cut >= 0 ? text.slice(0, cut) : text).trim();
  return zhAndPy.split("(")[0].trim();
}

function addText(texts, value) {
  if (typeof value !== "string") return;
  const text = cleanText(value);
  if (text) texts.add(text);
}

function collectDictionaryTexts(value, texts) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectDictionaryTexts(item, texts));
    return;
  }
  if (!value || typeof value !== "object") return;

  if (typeof value.word === "string") {
    value.word.split("/").forEach((word) => addText(texts, word));
    for (const phrase of value.compounds ?? []) addText(texts, phrase?.tc);
    for (const example of value.examples ?? []) addText(texts, example?.tc);
    if (typeof value.idiom === "string") addText(texts, idiomText(value.idiom));
  }

  Object.values(value).forEach((child) => collectDictionaryTexts(child, texts));
}

async function findJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return findJsonFiles(entryPath);
      return entry.isFile() && entry.name.toLowerCase().endsWith(".json") ? [entryPath] : [];
    }),
  );
  return nested.flat().sort();
}

async function loadTexts() {
  const files = await findJsonFiles(dataDirectory);
  const texts = new Set();

  for (const file of files) {
    const data = JSON.parse(await readFile(file, "utf8"));
    collectDictionaryTexts(data, texts);
  }

  const allTexts = [...texts];
  return limit ? allTexts.slice(0, limit) : allTexts;
}

function audioFilename(text) {
  return `word-${sha1(text)}.mp3`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const texts = await loadTexts();
if (texts.length === 0) throw new Error(`Không tìm thấy nội dung từ điển trong ${dataDirectory}`);

if (dryRun) {
  console.log(`Tìm thấy ${texts.length} nội dung cần tạo${limit ? ` (giới hạn ${limit})` : ""}.`);
  console.log(texts.slice(0, 10).join("\n"));
  process.exit(0);
}

await mkdir(outputDirectory, { recursive: true });

let nextIndex = 0;
let completed = 0;
let generated = 0;
let skipped = 0;
let failed = 0;

function report(status, text) {
  completed += 1;
  console.log(`${completed}/${texts.length} ${status}: ${text}`);
}

async function processText(text, tts) {
  const outputPath = path.join(outputDirectory, audioFilename(text));

  try {
    const existing = await stat(outputPath).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (existing) {
      if (!existing.isFile()) throw new Error(`Đường dẫn đầu ra không phải file: ${outputPath}`);
      skipped += 1;
      report("Bỏ qua", text);
      return;
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await tts.ttsPromise(text, outputPath);
        generated += 1;
        report("Đã tạo", text);
        return;
      } catch (error) {
        await rm(outputPath, { force: true });
        if (attempt === maxAttempts) throw error;

        const delay = 1000 * 2 ** (attempt - 1);
        console.warn(`Lỗi khi tạo âm thanh, thử lại ${attempt}/${maxAttempts - 1} sau ${delay} ms: ${text}`);
        await sleep(delay);
      }
    }
  } catch (error) {
    failed += 1;
    report("Thất bại", text);
    console.error(error);
  }
}

async function worker() {
  const tts = new EdgeTTS({
    voice,
    lang: "zh-TW",
    outputFormat: "audio-24khz-96kbitrate-mono-mp3",
    rate: "-10%",
  });

  while (nextIndex < texts.length) {
    const index = nextIndex;
    nextIndex += 1;
    await processText(texts[index], tts);
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, texts.length) }, worker));
console.log(`Hoàn tất: ${generated} mới, ${skipped} đã có, ${failed} lỗi trên ${texts.length} nội dung.`);

if (failed > 0) process.exitCode = 1;
