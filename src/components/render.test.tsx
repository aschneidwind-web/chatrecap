// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import App from "../App";
import Dashboard from "./Dashboard";
import { computeStats } from "../lib/stats";
import { demoExport } from "../lib/demo";

afterEach(cleanup);

describe("render smoke tests", () => {
  it("renders the landing page without crashing", () => {
    render(<App />);
    expect(screen.getByText("Drop your ChatGPT export here")).toBeTruthy();
    expect(screen.getByText(/Why you can trust it with your chats/i)).toBeTruthy();
  });

  it("renders the full dashboard with demo data without crashing", () => {
    const stats = computeStats(demoExport());
    // demo data should be substantial and well-formed
    expect(stats.messageCount).toBeGreaterThan(100);
    expect(stats.byHour).toHaveLength(24);
    expect(stats.heatmap).toHaveLength(7);
    expect(stats.models.length).toBeGreaterThan(0);

    render(<Dashboard stats={stats} isDemo onReset={() => {}} />);
    expect(screen.getByText("Conversations")).toBeTruthy();
    expect(screen.getByText("Messages exchanged")).toBeTruthy();
    expect(screen.getByText("When you chat")).toBeTruthy();
    expect(screen.getByText("Models you leaned on")).toBeTruthy();
  });
});
