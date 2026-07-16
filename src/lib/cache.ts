import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { getConfig } from "./config";
import type { DatasetName } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".data");

interface CacheFile {
  fetchedAt: string;
  rows: Record<string, string>[];
}

function cachePath(name: DatasetName): string {
  return path.join(CACHE_DIR, `${name}.json`);
}

export async function readCache(
  name: DatasetName,
): Promise<{ rows: Record<string, string>[]; fetchedAt: string; fresh: boolean } | null> {
  try {
    const raw = await readFile(cachePath(name), "utf8");
    const parsed = JSON.parse(raw) as CacheFile;
    if (!Array.isArray(parsed.rows)) return null;
    const age = Date.now() - new Date(parsed.fetchedAt).getTime();
    return { rows: parsed.rows, fetchedAt: parsed.fetchedAt, fresh: age < getConfig().cacheTtlMs };
  } catch {
    return null;
  }
}

export async function writeCache(name: DatasetName, rows: Record<string, string>[]): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });
  const fetchedAt = new Date().toISOString();
  const payload: CacheFile = { fetchedAt, rows };
  const target = cachePath(name);
  const tmp = `${target}.tmp`;
  await writeFile(tmp, JSON.stringify(payload), "utf8");
  await rename(tmp, target);
  return fetchedAt;
}

export async function clearCache(name: DatasetName): Promise<void> {
  try {
    await unlink(cachePath(name));
  } catch {
    // 없는 파일이면 무시
  }
}
