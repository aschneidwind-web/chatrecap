import type { RawConversation, RawNode } from "../lib/schema";

export const T = (iso: string) => Math.floor(Date.parse(iso) / 1000);

export interface MsgSpec {
  role: string;
  text?: string;
  at?: string;
  model?: string;
  hidden?: boolean;
  parts?: unknown[];
}

function node(spec: MsgSpec): RawNode {
  return {
    message: {
      author: { role: spec.role },
      create_time: spec.at ? T(spec.at) : null,
      content: { content_type: "text", parts: spec.parts ?? [spec.text ?? ""] },
      metadata: {
        ...(spec.model ? { model_slug: spec.model } : {}),
        ...(spec.hidden ? { is_visually_hidden_from_conversation: true } : {}),
      },
    },
  };
}

export function makeConv(
  title: string,
  create_time: string,
  specs: MsgSpec[]
): RawConversation {
  const mapping: Record<string, RawNode> = {
    // Root system node with a null message — must be filtered out.
    root: { id: "root", parent: null, children: [], message: null },
  };
  specs.forEach((s, i) => {
    mapping[`n${i}`] = { id: `n${i}`, ...node(s) };
  });
  return {
    title,
    create_time: T(create_time),
    update_time: T(create_time),
    id: title.toLowerCase().replace(/\s+/g, "-"),
    mapping,
  };
}

/** Deterministic sample export with several filtered-out node types mixed in. */
export const sampleRaw: RawConversation[] = [
  makeConv("Cooking help", "2025-01-01T09:00:00Z", [
    { role: "user", text: "How do I bake bread please", at: "2025-01-01T09:00:00Z" },
    {
      role: "assistant",
      text: "Sure! Here is how to bake bread at home.",
      at: "2025-01-01T09:00:30Z",
      model: "gpt-4o",
    },
    { role: "user", text: "bread bread sourdough recipe", at: "2025-01-02T10:00:00Z" },
    {
      role: "assistant",
      text: "Sourdough takes time and patience.",
      at: "2025-01-02T10:05:00Z",
      model: "gpt-4o",
    },
    { role: "user", text: "thanks", at: "2025-01-02T10:06:00Z" },
    { role: "assistant", text: "You are welcome.", at: "2025-01-02T10:06:10Z", model: "gpt-4o" },
    // The following four must all be filtered out:
    { role: "system", text: "you are a helpful assistant", at: "2025-01-01T09:00:00Z" },
    { role: "assistant", text: "(hidden tool scaffolding)", at: "2025-01-01T09:00:00Z", hidden: true },
    { role: "tool", text: "tool output", at: "2025-01-01T09:00:00Z" },
    { role: "user", text: "", at: "2025-01-02T10:06:00Z" },
  ]),
  makeConv("Python code", "2025-01-04T23:00:00Z", [
    { role: "user", text: "Fix this python code error", at: "2025-01-04T23:00:00Z" },
    { role: "assistant", text: "Here is the fix.", at: "2025-01-04T23:00:20Z", model: "o1" },
  ]),
];
