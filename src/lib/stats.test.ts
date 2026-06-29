import { parseConversations } from "./parse";
import { computeStats, utcDateParts } from "./stats";
import { sampleRaw, T } from "../test/fixtures";

const stats = computeStats(parseConversations(sampleRaw), utcDateParts);

describe("computeStats", () => {
  it("counts conversations and messages", () => {
    expect(stats.conversationCount).toBe(2);
    expect(stats.messageCount).toBe(8);
    expect(stats.userMessages).toBe(4);
    expect(stats.assistantMessages).toBe(4);
    expect(stats.avgMessagesPerConversation).toBe(4);
  });

  it("sums words by role", () => {
    expect(stats.userWords).toBe(16);
    expect(stats.assistantWords).toBe(21);
  });

  it("computes the date range", () => {
    expect(stats.firstDate).toBe(T("2025-01-01T09:00:00Z"));
    expect(stats.lastDate).toBe(T("2025-01-04T23:00:20Z"));
  });

  it("tracks active days and the longest streak", () => {
    expect(stats.daysActive).toBe(3); // 01-01, 01-02, 01-04
    expect(stats.longestStreak).toBe(2); // 01-01 -> 01-02
  });

  it("buckets messages by hour and weekday (UTC)", () => {
    expect(stats.byHour[9]).toBe(2);
    expect(stats.byHour[10]).toBe(4);
    expect(stats.byHour[23]).toBe(2);
    expect(stats.byWeekday[3]).toBe(2); // Wed 01-01
    expect(stats.byWeekday[4]).toBe(4); // Thu 01-02
    expect(stats.byWeekday[6]).toBe(2); // Sat 01-04
    expect(stats.heatmap[4][10]).toBe(4);
  });

  it("buckets by month", () => {
    expect(stats.byMonth).toEqual([{ key: "2025-01", count: 8 }]);
  });

  it("ranks models used", () => {
    expect(stats.models).toEqual([
      { model: "gpt-4o", count: 3 },
      { model: "o1", count: 1 },
    ]);
  });

  it("finds the busiest day and longest conversation", () => {
    expect(stats.busiestDay).toEqual({ day: "2025-01-02", count: 4 });
    expect(stats.longestConversation).toEqual({ title: "Cooking help", count: 6 });
  });

  it("extracts top words from user messages only, minus stopwords", () => {
    expect(stats.topWords[0]).toEqual({ word: "bread", count: 3 });
    const words = stats.topWords.map((w) => w.word);
    expect(words).not.toContain("thanks"); // stopword
    expect(words).not.toContain("please"); // stopword
    expect(words).not.toContain("welcome"); // assistant-only word
  });
});
