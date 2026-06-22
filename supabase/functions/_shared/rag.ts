/// <reference lib="deno.ns" />

// Shared RAG helpers for the edge functions: chunking + Google embeddings.

export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Splits course text into overlapping chunks of roughly `maxChars` characters,
 * preferring paragraph then sentence boundaries so chunks stay coherent.
 */
export function chunkText(
  text: string,
  maxChars = 1800,
  overlapChars = 200,
): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  // Split into paragraphs, then greedily pack them into chunks.
  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const units: string[] = [];
  for (const p of paragraphs) {
    if (p.length <= maxChars) {
      units.push(p);
    } else {
      // Paragraph too long: fall back to sentence-ish splitting.
      const sentences = p.split(/(?<=[.!?])\s+/);
      let buf = "";
      for (const s of sentences) {
        if ((buf + " " + s).trim().length > maxChars) {
          if (buf) units.push(buf.trim());
          buf = s;
        } else {
          buf = (buf + " " + s).trim();
        }
      }
      if (buf) units.push(buf.trim());
    }
  }

  const chunks: string[] = [];
  let current = "";
  for (const u of units) {
    if (current && (current + "\n\n" + u).length > maxChars) {
      chunks.push(current.trim());
      // Carry a small overlap (tail of the previous chunk) for context continuity.
      const tail = current.slice(Math.max(0, current.length - overlapChars));
      current = (tail + "\n\n" + u).trim();
    } else {
      current = current ? `${current}\n\n${u}` : u;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

/** Embeds a single text with the Google embeddings API. Returns a 768-dim vector. */
export async function embedText(
  apiKey: string,
  text: string,
): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } })?.error?.message ??
      "EMBEDDING_REQUEST_FAILED";
    throw new Error(msg);
  }

  const values = (json as { embedding?: { values?: unknown } })?.embedding
    ?.values;
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("EMBEDDING_EMPTY_RESPONSE");
  }

  return values as number[];
}
