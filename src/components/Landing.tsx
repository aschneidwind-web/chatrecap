import { useRef, useState } from "react";

function Dropzone({
  onFile,
  busy,
}: {
  onFile: (f: File) => void;
  busy: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
        over ? "border-accent bg-accent/10" : "border-line bg-panel/40 hover:border-accent/60"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".zip,.json,application/zip,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="text-base font-semibold text-white">
        {busy ? "Crunching your numbers…" : "Drop your ChatGPT export here"}
      </div>
      <div className="mt-1 text-sm text-white/45">
        {busy ? "This can take a few seconds for large histories." : "the .zip — or the conversations.json inside it · click to browse"}
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/60 p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-3 to-accent-2 text-sm font-bold text-ink">
        {n}
      </div>
      <h3 className="mt-3 font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-white/55">{children}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <details className="group border-b border-line py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-white/85">
        {q}
        <span className="text-white/30 transition group-open:rotate-45">+</span>
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-white/55">{a}</div>
    </details>
  );
}

export default function Landing({
  onFile,
  onDemo,
  busy,
  error,
}: {
  onFile: (f: File) => void;
  onDemo: () => void;
  busy: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-16 sm:pt-24">
      {/* Hero */}
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-xs text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          100% in your browser · nothing is uploaded
        </span>
        <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
          See your year in <span className="brand-gradient">ChatGPT</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/55 sm:text-lg">
          Turn your ChatGPT data export into a beautiful dashboard — your busiest hours, the
          models you lean on, words you overuse, streaks and more. Private by design: your file
          never leaves your device.
        </p>
      </div>

      <div className="mt-8">
        <Dropzone onFile={onFile} busy={busy} />
        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
        <div className="mt-3 text-center text-sm text-white/45">
          Don’t have your export handy?{" "}
          <button onClick={onDemo} className="font-medium text-accent underline-offset-4 hover:underline">
            Explore a live demo →
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-16 grid gap-3 sm:grid-cols-3">
        <Step n={1} title="Export from ChatGPT">
          In ChatGPT: <span className="text-white/75">Settings → Data controls → Export data</span>.
          You’ll get an email with a .zip.
        </Step>
        <Step n={2} title="Drop it in here">
          Drag the .zip (or the conversations.json inside) onto the box above. It’s read locally.
        </Step>
        <Step n={3} title="See your story">
          Get an instant, shareable dashboard of how you actually use ChatGPT.
        </Step>
      </div>

      {/* Privacy */}
      <div className="mt-16 rounded-2xl border border-line bg-panel/50 p-6">
        <h2 className="text-lg font-semibold text-white">Why you can trust it with your chats</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/60">
          <li>
            <span className="text-white/85">No upload, no server.</span> Parsing and number-crunching
            happen entirely in your browser tab. Your conversations are never transmitted.
          </li>
          <li>
            <span className="text-white/85">No account, no tracking cookies, no ad networks.</span>{" "}
            Nothing from your file is ever read by anything but your own browser.
          </li>
          <li>
            <span className="text-white/85">Open source.</span> The whole thing is on GitHub, so you can
            read exactly what it does — or run it offline.
          </li>
        </ul>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-lg font-semibold text-white">Questions</h2>
        <div className="mt-2">
          <Faq q="Is my ChatGPT data really private?" a={
            <>Yes. ChatRecap is a static web page with no backend. Your export is read and analyzed
            locally in your browser; nothing about your conversations is sent anywhere. You can even
            disconnect from the internet after the page loads.</>
          } />
          <Faq q="How do I export my ChatGPT data?" a={
            <>In ChatGPT, open Settings → Data controls → Export data. OpenAI emails you a download
            link; the .zip contains a file called conversations.json. Drop the whole .zip (or just
            that file) into ChatRecap.</>
          } />
          <Faq q="What does it show me?" a={
            <>Total conversations and messages, words you typed vs. words ChatGPT wrote, a weekday ×
            hour heatmap of when you chat, the models you used most, your most-used words, your
            longest daily streak, busiest day and longest conversation.</>
          } />
          <Faq q="Does it work with the free plan?" a={
            <>Yes — any ChatGPT account can export its data, free or paid.</>
          } />
          <Faq q="Will it support Claude / other assistants?" a={
            <>That’s next. ChatRecap is built to add other chat exports; Claude support is on the
            roadmap.</>
          } />
        </div>
      </div>

      <footer className="mt-16 border-t border-line pt-6 text-center text-xs text-white/35">
        ChatRecap is an independent project and isn’t affiliated with OpenAI. “ChatGPT” is a
        trademark of OpenAI. · Built for fun, runs on your machine.
      </footer>
    </div>
  );
}
