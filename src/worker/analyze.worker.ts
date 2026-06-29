/// <reference lib="webworker" />
import { readExportFile } from "../lib/load";
import { parseConversations } from "../lib/parse";
import { computeStats, type Stats } from "../lib/stats";

export type WorkerResult =
  | { ok: true; stats: Stats; warnings: string[]; empty: boolean }
  | { ok: false; error: string };

self.onmessage = async (e: MessageEvent<File>) => {
  try {
    const json = await readExportFile(e.data);
    const parsed = parseConversations(json);
    const stats = computeStats(parsed); // local timezone — "your" hours
    const result: WorkerResult = {
      ok: true,
      stats,
      warnings: parsed.warnings,
      empty: parsed.messages.length === 0,
    };
    (self as DedicatedWorkerGlobalScope).postMessage(result);
  } catch (err) {
    const result: WorkerResult = {
      ok: false,
      error: err instanceof Error ? err.message : "Something went wrong reading that file.",
    };
    (self as DedicatedWorkerGlobalScope).postMessage(result);
  }
};
