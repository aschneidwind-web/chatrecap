import type { ParsedExport, NormalizedMessage, NormalizedConversation } from "./parse";

/** Deterministic PRNG so the demo looks identical on every visit. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TOPICS = [
  ["python", "function", "error", "debug", "code", "script", "loop"],
  ["recipe", "dinner", "bread", "sauce", "ingredients", "bake"],
  ["resume", "cover", "letter", "interview", "career", "email"],
  ["react", "component", "state", "hook", "typescript", "build"],
  ["spanish", "translate", "grammar", "practice", "vocabulary"],
  ["workout", "routine", "protein", "sleep", "habit", "running"],
  ["essay", "outline", "argument", "thesis", "edit", "draft"],
  ["budget", "savings", "invest", "spreadsheet", "expenses"],
  ["travel", "itinerary", "flight", "packing", "tokyo", "lisbon"],
  ["startup", "marketing", "landing", "users", "pricing", "growth"],
];

const MODELS = [
  { slug: "gpt-4o", w: 52 },
  { slug: "o1", w: 14 },
  { slug: "gpt-4o-mini", w: 16 },
  { slug: "gpt-4", w: 10 },
  { slug: "o3-mini", w: 8 },
];

// Relative likelihood of starting a chat at a given local hour (0-23).
const HOUR_WEIGHTS = [
  0.3, 0.2, 0.1, 0.1, 0.1, 0.2, 0.6, 1.2, 2.4, 3.4, 3.6, 3.0, 2.6, 2.8, 3.0,
  3.1, 2.9, 2.6, 3.0, 3.6, 3.4, 2.4, 1.4, 0.7,
];

function weightedPick<T>(rng: () => number, items: T[], weight: (t: T) => number): T {
  const total = items.reduce((s, it) => s + weight(it), 0);
  let r = rng() * total;
  for (const it of items) {
    r -= weight(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

/**
 * A realistic synthetic export so visitors can see the full dashboard without
 * exporting their own data. ~10 months of activity, weekday/hour patterns,
 * a believable model mix and a meaningful word distribution.
 */
export function demoExport(): ParsedExport {
  const rng = mulberry32(20260626);
  const messages: NormalizedMessage[] = [];
  const conversations: NormalizedConversation[] = [];

  const end = new Date();
  end.setHours(21, 0, 0, 0);
  const DAYS = 300;

  let convIndex = 0;
  for (let d = DAYS; d >= 0; d--) {
    // Weekends a touch lighter; some days have no chats at all.
    const day = new Date(end.getTime() - d * 86_400_000);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const chatChance = isWeekend ? 0.45 : 0.72;
    if (rng() > chatChance) continue;

    const convsToday = 1 + Math.floor(rng() * (isWeekend ? 2 : 3));
    for (let c = 0; c < convsToday; c++) {
      const topic = TOPICS[Math.floor(rng() * TOPICS.length)];
      const hour = weightedPick(rng, [...Array(24).keys()], (h) => HOUR_WEIGHTS[h]);
      const minute = Math.floor(rng() * 60);
      const start = new Date(day);
      start.setHours(hour, minute, 0, 0);

      const convId = `demo-${convIndex++}`;
      const title =
        topic[0][0].toUpperCase() + topic[0].slice(1) + " " + topic[1 % topic.length];
      const turns = 1 + Math.floor(rng() * 6); // user/assistant pairs
      let msgCount = 0;
      let t = start.getTime();

      for (let turn = 0; turn < turns; turn++) {
        // user
        const uWords = 4 + Math.floor(rng() * 22);
        const uTokens: string[] = [];
        for (let i = 0; i < uWords; i++) {
          uTokens.push(rng() < 0.55 ? topic[Math.floor(rng() * topic.length)] : "the");
        }
        const uText = uTokens.join(" ");
        messages.push({
          role: "user",
          text: uText,
          words: uWords,
          chars: uText.length,
          createTime: Math.floor(t / 1000),
          model: null,
          conversationId: convId,
        });
        msgCount++;
        t += (8 + rng() * 60) * 1000;

        // assistant
        const aWords = 40 + Math.floor(rng() * 260);
        const aText = "lorem ".repeat(aWords).trim();
        messages.push({
          role: "assistant",
          text: aText,
          words: aWords,
          chars: aText.length,
          createTime: Math.floor(t / 1000),
          model: weightedPick(rng, MODELS, (m) => m.w).slug,
          conversationId: convId,
        });
        msgCount++;
        t += (20 + rng() * 90) * 1000;
      }

      conversations.push({
        id: convId,
        title,
        createTime: Math.floor(start.getTime() / 1000),
        updateTime: Math.floor(t / 1000),
        messageCount: msgCount,
      });
    }
  }

  return { conversations, messages, warnings: [] };
}
