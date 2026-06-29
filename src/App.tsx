import { useRef, useState } from "react";
import Landing from "./components/Landing";
import Dashboard from "./components/Dashboard";
import { computeStats, type Stats } from "./lib/stats";
import { demoExport } from "./lib/demo";
import { REPO_URL } from "./lib/config";
import type { WorkerResult } from "./worker/analyze.worker";

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-line/60 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent-3 to-accent-2 text-ink">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden>
              <path d="M4 4h16v11H8l-4 4z" />
            </svg>
          </span>
          ChatRecap
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-white/50 transition hover:text-white"
        >
          Source
        </a>
      </div>
    </header>
  );
}

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    setBusy(true);
    workerRef.current?.terminate();
    const worker = new Worker(new URL("./worker/analyze.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<WorkerResult>) => {
      const res = e.data;
      setBusy(false);
      worker.terminate();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.empty) {
        setError(
          "We couldn't find any conversations in that file. Make sure it's your ChatGPT export (the .zip, or conversations.json)."
        );
        return;
      }
      setIsDemo(false);
      setStats(res.stats);
    };
    worker.onerror = () => {
      setBusy(false);
      setError("Something went wrong while reading that file.");
      worker.terminate();
    };
    worker.postMessage(file);
  };

  const handleDemo = () => {
    setError(null);
    setIsDemo(true);
    setStats(computeStats(demoExport()));
  };

  const reset = () => {
    setStats(null);
    setIsDemo(false);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      <Header />
      {stats ? (
        <Dashboard stats={stats} isDemo={isDemo} onReset={reset} />
      ) : (
        <Landing onFile={handleFile} onDemo={handleDemo} busy={busy} error={error} />
      )}
    </div>
  );
}
