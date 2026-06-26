export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { PaddleOcrService, V5_THAI_MOBILE_MODEL } from "ppu-paddle-ocr";

// Module-level singleton — model downloads once, reused across requests
let serviceReady: Promise<PaddleOcrService> | null = null;

function getService(): Promise<PaddleOcrService> {
  if (!serviceReady) {
    const svc = new PaddleOcrService({ model: V5_THAI_MOBILE_MODEL });
    serviceReady = svc.initialize().then(() => svc).catch((e) => {
      serviceReady = null;
      throw e;
    });
  }
  return serviceReady;
}

interface ExtractedItem { item: string; amount: number; }

function parseOCRText(text: string): ExtractedItem[] {
  const items: ExtractedItem[] = [];
  const skipWords = ["รวม", "total", "sum", "vat", "ภาษี", "subtotal", "grand", "change", "เงินทอน", "a-5", "a5"];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const lower = line.toLowerCase();
    if (skipWords.some((w) => lower.includes(w))) continue;
    if (/\s[-–]\s*$/.test(line)) continue;

    const match = line.match(/^(.+?)\s+([\d,]+(?:\.\d{1,2})?)\s*$/);
    if (!match) continue;

    const itemName = match[1].trim().replace(/[\s|:.\-–]+$/, "").trim();
    const amount = parseFloat(match[2].replace(/,/g, "").replace(/[Oo]/g, "0"));

    if (!itemName || isNaN(amount) || amount <= 0) continue;
    items.push({ item: itemName, amount });
  }
  return items;
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "imageBase64 and mimeType required" }, { status: 400 });
    }

    const svc = await getService();

    // Convert base64 → Buffer → ArrayBuffer
    const buf = Buffer.from(imageBase64, "base64");
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

    const result = await svc.recognize(arrayBuffer);
    const items = parseOCRText(result.text);

    return NextResponse.json({ items, rawText: result.text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
