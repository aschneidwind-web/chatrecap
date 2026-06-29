import type { NormalizedMessage, ParsedExport } from "./parse";

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  weekday: number; // 0=Sun .. 6=Sat
  dayKey: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
}

export type DatePartsFn = (unixSeconds: number) => DateParts;

const pad = (n: number) => String(n).padStart(2, "0");

/** Default: bucket timestamps in the viewer's LOCAL time ("your busiest hour"). */
export const localDateParts: DatePartsFn = (s) => {
  const d = new Date(s * 1000);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return {
    year,
    month,
    day,
    hour: d.getHours(),
    weekday: d.getDay(),
    dayKey: `${year}-${pad(month)}-${pad(day)}`,
    monthKey: `${year}-${pad(month)}`,
  };
};

/** Timezone-stable variant — used by tests and as a deterministic fallback. */
export const utcDateParts: DatePartsFn = (s) => {
  const d = new Date(s * 1000);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return {
    year,
    month,
    day,
    hour: d.getUTCHours(),
    weekday: d.getUTCDay(),
    dayKey: `${year}-${pad(month)}-${pad(day)}`,
    monthKey: `${year}-${pad(month)}`,
  };
};

export interface Stats {
  conversationCount: number;
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  userWords: number;
  assistantWords: number;
  userChars: number;
  avgMessagesPerConversation: number;
  firstDate: number | null;
  lastDate: number | null;
  daysActive: number;
  longestStreak: number;
  byMonth: { key: string; count: number }[];
  byHour: number[]; // length 24
  byWeekday: number[]; // length 7
  heatmap: number[][]; // [7][24]
  models: { model: string; count: number }[];
  busiestDay: { day: string; count: number } | null;
  longestConversation: { title: string; count: number } | null;
  topWords: { word: string; count: number }[];
}

const STOPWORDS = new Set(
  (
    "the a an and or but if then else for to of in on at by with from as is are was were be been being " +
    "this that these those it its it's i you he she they we me my your our their them his her him do does did " +
    "doing done have has had having will would can could should shall may might must not no yes so just " +
    "about into over under than too very can't don't won't im i'm ive i've you're youre ll ve re isn't aren't " +
    "what when where which who whom how why all any some such only own same other more most any each few here there " +
    "out up down off again once also get got make made like want need please thanks thank ok okay also use using " +
    "one two please give tell show write create help me my mine our ours"
  )
    .split(/\s+/)
    .filter(Boolean)
);

function computeLongestStreak(dayKeys: Set<string>): number {
  if (dayKeys.size === 0) return 0;
  // Convert YYYY-MM-DD to a UTC day-number so consecutiveness is timezone-stable.
  const dayNums = [...dayKeys]
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
    })
    .sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < dayNums.length; i++) {
    if (dayNums[i] === dayNums[i - 1] + 1) {
      run++;
      longest = Math.max(longest, run);
    } else if (dayNums[i] !== dayNums[i - 1]) {
      run = 1;
    }
  }
  return longest;
}

function topWordsFrom(messages: NormalizedMessage[], limit = 25) {
  const counts = new Map<string, number>();
  for (const m of messages) {
    if (m.role !== "user") continue;
    const tokens = m.text.toLowerCase().match(/[a-z][a-z']{2,}/g);
    if (!tokens) continue;
    for (const raw of tokens) {
      const w = raw.replace(/^'+|'+$/g, "");
      if (w.length < 3 || STOPWORDS.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

/**
 * Compute all dashboard statistics from a parsed export.
 * `dateParts` is injectable so callers (and tests) control timezone behavior.
 */
export function computeStats(
  parsed: ParsedExport,
  dateParts: DatePartsFn = localDateParts
): Stats {
  const { messages, conversations } = parsed;

  let userMessages = 0;
  let assistantMessages = 0;
  let userWords = 0;
  let assistantWords = 0;
  let userChars = 0;
  let firstDate: number | null = null;
  let lastDate: number | null = null;

  const byHour = new Array(24).fill(0);
  const byWeekday = new Array(7).fill(0);
  const heatmap: number[][] = Array.from({ length: 7 }, () =>
    new Array(24).fill(0)
  );
  const byMonth = new Map<string, number>();
  const byDay = new Map<string, number>();
  const models = new Map<string, number>();
  const activeDays = new Set<string>();

  for (const m of messages) {
    if (m.role === "user") {
      userMessages++;
      userWords += m.words;
      userChars += m.chars;
    } else {
      assistantMessages++;
      assistantWords += m.words;
      if (m.model) models.set(m.model, (models.get(m.model) ?? 0) + 1);
    }

    if (m.createTime != null) {
      if (firstDate == null || m.createTime < firstDate) firstDate = m.createTime;
      if (lastDate == null || m.createTime > lastDate) lastDate = m.createTime;

      const p = dateParts(m.createTime);
      byHour[p.hour]++;
      byWeekday[p.weekday]++;
      heatmap[p.weekday][p.hour]++;
      byMonth.set(p.monthKey, (byMonth.get(p.monthKey) ?? 0) + 1);
      byDay.set(p.dayKey, (byDay.get(p.dayKey) ?? 0) + 1);
      activeDays.add(p.dayKey);
    }
  }

  let busiestDay: { day: string; count: number } | null = null;
  for (const [day, count] of byDay) {
    if (!busiestDay || count > busiestDay.count) busiestDay = { day, count };
  }

  let longestConversation: { title: string; count: number } | null = null;
  for (const c of conversations) {
    if (!longestConversation || c.messageCount > longestConversation.count) {
      longestConversation = { title: c.title, count: c.messageCount };
    }
  }

  const messageCount = messages.length;
  const conversationCount = conversations.length;

  return {
    conversationCount,
    messageCount,
    userMessages,
    assistantMessages,
    userWords,
    assistantWords,
    userChars,
    avgMessagesPerConversation: conversationCount
      ? messageCount / conversationCount
      : 0,
    firstDate,
    lastDate,
    daysActive: activeDays.size,
    longestStreak: computeLongestStreak(activeDays),
    byMonth: [...byMonth.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => a.key.localeCompare(b.key)),
    byHour,
    byWeekday,
    heatmap,
    models: [...models.entries()]
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count),
    busiestDay,
    longestConversation,
    topWords: topWordsFrom(messages),
  };
}
