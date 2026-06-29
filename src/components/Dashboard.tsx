import { useState } from "react";
import type { Stats } from "../lib/stats";
import {
  fmt,
  fmtDate,
  fmtDayKey,
  hourLabel,
  modelLabel,
  WEEKDAYS,
  WEEKDAY_ORDER,
} from "../lib/format";
import { SITE_URL } from "../lib/config";

const SITE_DISPLAY = SITE_URL.replace(/^https?:\/\//, "");

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-white/45">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-panel/70 p-5 ${className}`}>{children}</div>
  );
}

function StatCard({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <Panel>
      <div className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{value}</div>
      <div className="mt-1 text-sm font-medium text-white/70">{label}</div>
      {hint && <div className="mt-0.5 text-xs text-white/40">{hint}</div>}
    </Panel>
  );
}

function BarList({
  items,
  max,
}: {
  items: { label: string; value: number }[];
  max: number;
}) {
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <div className="w-28 shrink-0 truncate text-sm text-white/70" title={it.label}>
            {it.label}
          </div>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-3 via-accent to-accent-2"
              style={{ width: `${Math.max(3, (it.value / max) * 100)}%` }}
            />
          </div>
          <div className="w-14 shrink-0 text-right text-sm tabular-nums text-white/55">
            {fmt(it.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

function VBars({
  values,
  labelFor,
  highlightMax = true,
}: {
  values: number[];
  labelFor: (i: number) => string | null;
  highlightMax?: boolean;
}) {
  const max = Math.max(1, ...values);
  const maxIdx = values.indexOf(Math.max(...values));
  return (
    <div className="flex h-40 items-end gap-[3px]">
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full flex-1 items-end" title={`${fmt(v)}`}>
            <div
              className={`w-full rounded-t ${
                highlightMax && i === maxIdx
                  ? "bg-gradient-to-t from-accent-2 to-accent"
                  : "bg-white/15"
              }`}
              style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0 }}
            />
          </div>
          <div className="h-3 text-[9px] leading-none text-white/35">{labelFor(i)}</div>
        </div>
      ))}
    </div>
  );
}

function Heatmap({ heatmap }: { heatmap: number[][] }) {
  const max = Math.max(1, ...heatmap.flat());
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[440px]">
        <div className="ml-9 mb-1 flex">
          {[0, 6, 12, 18].map((h) => (
            <div key={h} className="flex-1 text-[10px] text-white/35">
              {hourLabel(h)}
            </div>
          ))}
        </div>
        {WEEKDAY_ORDER.map((wd) => (
          <div key={wd} className="mb-[3px] flex items-center gap-[3px]">
            <div className="w-8 shrink-0 text-[10px] text-white/40">{WEEKDAYS[wd]}</div>
            {Array.from({ length: 24 }, (_, h) => {
              const v = heatmap[wd][h];
              const intensity = v === 0 ? 0 : 0.18 + 0.82 * (v / max);
              return (
                <div
                  key={h}
                  title={`${WEEKDAYS[wd]} ${hourLabel(h)} — ${fmt(v)}`}
                  className="aspect-square flex-1 rounded-[3px]"
                  style={{
                    backgroundColor:
                      v === 0 ? "rgba(255,255,255,0.04)" : `rgba(167,139,250,${intensity})`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildSummary(stats: Stats): string {
  const peakHour = stats.byHour.indexOf(Math.max(...stats.byHour));
  const peakWd = stats.byWeekday.indexOf(Math.max(...stats.byWeekday));
  const top = stats.models[0];
  const lines = [
    `My ChatGPT, by the numbers (via ${SITE_DISPLAY}):`,
    `• ${fmt(stats.conversationCount)} conversations, ${fmt(stats.messageCount)} messages`,
    `• I typed ${fmt(stats.userWords)} words; ChatGPT wrote ${fmt(stats.assistantWords)}`,
    `• Most active around ${hourLabel(peakHour)} on ${WEEKDAYS[peakWd]}s`,
    top ? `• Go-to model: ${modelLabel(top.model)}` : "",
    `• Longest daily streak: ${fmt(stats.longestStreak)} days`,
    "",
    `See yours (100% in your browser): ${SITE_URL}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export default function Dashboard({
  stats,
  isDemo,
  onReset,
}: {
  stats: Stats;
  isDemo: boolean;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const totalWords = stats.userWords + stats.assistantWords;
  const readingHours = Math.round(stats.assistantWords / 238 / 60);
  const peakHour = stats.byHour.indexOf(Math.max(...stats.byHour));
  const peakWd = stats.byWeekday.indexOf(Math.max(...stats.byWeekday));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildSummary(stats));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {isDemo && (
            <span className="mb-2 inline-block rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
              Demo data — drop your own export to see yours
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your <span className="brand-gradient">ChatGPT</span>, by the numbers
          </h1>
          <p className="mt-1 text-sm text-white/45">
            {fmtDate(stats.firstDate)} – {fmtDate(stats.lastDate)} · everything below was
            computed on your device
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-white/80 transition hover:border-accent/50 hover:text-white"
          >
            {copied ? "Copied ✓" : "Copy summary"}
          </button>
          <button
            onClick={onReset}
            className="rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-white/60 transition hover:text-white"
          >
            {isDemo ? "Use my data" : "Start over"}
          </button>
        </div>
      </div>

      {/* Headline stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard value={fmt(stats.conversationCount)} label="Conversations" />
        <StatCard value={fmt(stats.messageCount)} label="Messages exchanged" />
        <StatCard value={fmt(stats.daysActive)} label="Days you showed up" />
        <StatCard
          value={fmt(stats.userWords)}
          label="Words you typed"
          hint={`≈ ${fmt(stats.userWords / 500)} pages`}
        />
        <StatCard
          value={fmt(stats.assistantWords)}
          label="Words ChatGPT wrote back"
          hint={readingHours > 0 ? `≈ ${fmt(readingHours)} hours of reading` : undefined}
        />
        <StatCard value={`${fmt(stats.longestStreak)}d`} label="Longest daily streak" />
      </div>

      <Section title="When you chat" subtitle="Your activity by weekday and hour, in your local time.">
        <Panel>
          <Heatmap heatmap={stats.heatmap} />
          <p className="mt-4 text-sm text-white/55">
            You’re most active around{" "}
            <span className="font-semibold text-white">{hourLabel(peakHour)}</span> on{" "}
            <span className="font-semibold text-white">{WEEKDAYS[peakWd]}s</span>.
          </p>
        </Panel>
      </Section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel>
          <h3 className="mb-3 text-sm font-semibold text-white/80">By hour of day</h3>
          <VBars
            values={stats.byHour}
            labelFor={(i) => ([0, 6, 12, 18].includes(i) ? hourLabel(i) : null)}
          />
        </Panel>
        <Panel>
          <h3 className="mb-3 text-sm font-semibold text-white/80">By day of week</h3>
          <VBars values={WEEKDAY_ORDER.map((i) => stats.byWeekday[i])} labelFor={(i) => WEEKDAYS[WEEKDAY_ORDER[i]]} />
        </Panel>
      </div>

      {stats.byMonth.length > 1 && (
        <Section title="Activity over time" subtitle="Messages per month.">
          <Panel>
            <VBars
              values={stats.byMonth.map((m) => m.count)}
              labelFor={(i) =>
                i % Math.ceil(stats.byMonth.length / 6) === 0 ? stats.byMonth[i].key.slice(2) : null
              }
              highlightMax={false}
            />
          </Panel>
        </Section>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {stats.models.length > 0 && (
          <Panel>
            <h3 className="mb-4 text-sm font-semibold text-white/80">Models you leaned on</h3>
            <BarList
              items={stats.models.slice(0, 6).map((m) => ({ label: modelLabel(m.model), value: m.count }))}
              max={stats.models[0].count}
            />
          </Panel>
        )}
        {stats.topWords.length > 0 && (
          <Panel>
            <h3 className="mb-4 text-sm font-semibold text-white/80">Words you use most</h3>
            <BarList
              items={stats.topWords.slice(0, 8).map((w) => ({ label: w.word, value: w.count }))}
              max={stats.topWords[0].count}
            />
          </Panel>
        )}
      </div>

      <Section title="Highlights">
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.busiestDay && (
            <Panel>
              <div className="text-sm text-white/55">Busiest single day</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {fmtDayKey(stats.busiestDay.day)}
              </div>
              <div className="text-sm text-white/45">{fmt(stats.busiestDay.count)} messages</div>
            </Panel>
          )}
          {stats.longestConversation && (
            <Panel>
              <div className="text-sm text-white/55">Longest conversation</div>
              <div className="mt-1 truncate text-lg font-semibold text-white" title={stats.longestConversation.title}>
                {stats.longestConversation.title}
              </div>
              <div className="text-sm text-white/45">
                {fmt(stats.longestConversation.count)} messages
              </div>
            </Panel>
          )}
          <Panel>
            <div className="text-sm text-white/55">Your first chat</div>
            <div className="mt-1 text-lg font-semibold text-white">{fmtDate(stats.firstDate)}</div>
          </Panel>
          <Panel>
            <div className="text-sm text-white/55">Total words, both sides</div>
            <div className="mt-1 text-lg font-semibold text-white">{fmt(totalWords)}</div>
            <div className="text-sm text-white/45">
              avg {fmt(stats.avgMessagesPerConversation)} messages / conversation
            </div>
          </Panel>
        </div>
      </Section>

      <p className="mt-10 text-center text-xs text-white/30">
        Computed entirely in your browser. Your export was never uploaded anywhere.
      </p>
    </div>
  );
}
