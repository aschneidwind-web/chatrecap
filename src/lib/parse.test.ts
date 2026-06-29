import { parseConversations } from "./parse";
import { makeConv, sampleRaw } from "../test/fixtures";

describe("parseConversations", () => {
  it("keeps only visible user/assistant text messages", () => {
    const { conversations, messages } = parseConversations(sampleRaw);

    expect(conversations).toHaveLength(2);
    expect(messages).toHaveLength(8);

    // No filtered content leaked through.
    for (const m of messages) {
      expect(["user", "assistant"]).toContain(m.role);
      expect(m.text).not.toBe("");
      expect(m.text).not.toContain("hidden tool scaffolding");
      expect(m.text).not.toBe("tool output");
      expect(m.text).not.toContain("helpful assistant");
    }
  });

  it("records per-conversation message counts and titles", () => {
    const { conversations } = parseConversations(sampleRaw);
    const cooking = conversations.find((c) => c.title === "Cooking help");
    const python = conversations.find((c) => c.title === "Python code");
    expect(cooking?.messageCount).toBe(6);
    expect(python?.messageCount).toBe(2);
  });

  it("captures the assistant model slug", () => {
    const { messages } = parseConversations(sampleRaw);
    const assistant = messages.find((m) => m.role === "assistant");
    expect(assistant?.model).toBe("gpt-4o");
  });

  it("extracts text from multimodal parts and drops non-string (image) parts", () => {
    const raw = [
      makeConv("Multimodal", "2025-02-01T00:00:00Z", [
        {
          role: "user",
          parts: [{ content_type: "image_asset_pointer" }, "describe this picture"],
          at: "2025-02-01T00:00:00Z",
        },
      ]),
    ];
    const { messages } = parseConversations(raw);
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("describe this picture");
  });

  it("falls back to a wrapped { conversations: [...] } shape", () => {
    const { conversations } = parseConversations({ conversations: sampleRaw });
    expect(conversations).toHaveLength(2);
  });

  it("returns a warning (not a throw) for unrecognized input", () => {
    const result = parseConversations({ nope: true });
    expect(result.messages).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
