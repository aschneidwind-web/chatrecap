import type { RawConversation, RawContent } from "./schema";

export interface NormalizedMessage {
  role: "user" | "assistant";
  text: string;
  words: number;
  chars: number;
  createTime: number | null; // unix seconds
  model: string | null;
  conversationId: string;
}

export interface NormalizedConversation {
  id: string;
  title: string;
  createTime: number | null;
  updateTime: number | null;
  messageCount: number;
}

export interface ParsedExport {
  conversations: NormalizedConversation[];
  messages: NormalizedMessage[];
  warnings: string[];
}

/** Pull plain text out of a message's content, ignoring images/other binary parts. */
function extractText(content: RawContent | undefined): string {
  if (!content) return "";
  if (Array.isArray(content.parts)) {
    return content.parts
      .filter((p): p is string => typeof p === "string")
      .join("\n")
      .trim();
  }
  if (typeof content.text === "string") return content.text.trim();
  return "";
}

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

/**
 * Normalize an untrusted parsed `conversations.json` into flat, typed structures.
 * Never throws on bad data — malformed conversations are skipped with a warning.
 * Keeps only visible user/assistant text messages (drops system, tool calls,
 * hidden context, and empty messages).
 */
export function parseConversations(input: unknown): ParsedExport {
  const warnings: string[] = [];
  let rawList: RawConversation[] = [];

  if (Array.isArray(input)) {
    rawList = input as RawConversation[];
  } else if (
    input &&
    typeof input === "object" &&
    Array.isArray((input as { conversations?: unknown }).conversations)
  ) {
    rawList = (input as { conversations: RawConversation[] }).conversations;
  } else {
    warnings.push(
      "Unrecognized file shape: expected an array of conversations (conversations.json)."
    );
    return { conversations: [], messages: [], warnings };
  }

  const conversations: NormalizedConversation[] = [];
  const messages: NormalizedMessage[] = [];

  rawList.forEach((conv, idx) => {
    try {
      const convId = conv.id || conv.conversation_id || `conv-${idx}`;
      const mapping = conv.mapping;
      let count = 0;
      const times: number[] = [];

      if (mapping && typeof mapping === "object") {
        for (const node of Object.values(mapping)) {
          const msg = node?.message;
          if (!msg) continue;
          const role = msg.author?.role;
          if (role !== "user" && role !== "assistant") continue;
          if (msg.metadata?.is_visually_hidden_from_conversation) continue;
          const text = extractText(msg.content);
          if (!text) continue;

          const createTime =
            typeof msg.create_time === "number" ? msg.create_time : null;
          if (createTime != null) times.push(createTime);

          messages.push({
            role,
            text,
            words: countWords(text),
            chars: text.length,
            createTime,
            model:
              typeof msg.metadata?.model_slug === "string"
                ? msg.metadata.model_slug
                : null,
            conversationId: convId,
          });
          count++;
        }
      }

      const createTime =
        typeof conv.create_time === "number"
          ? conv.create_time
          : times.length
          ? Math.min(...times)
          : null;

      conversations.push({
        id: convId,
        title:
          typeof conv.title === "string" && conv.title.trim()
            ? conv.title.trim()
            : "Untitled",
        createTime,
        updateTime:
          typeof conv.update_time === "number" ? conv.update_time : null,
        messageCount: count,
      });
    } catch {
      warnings.push(`Skipped a malformed conversation at index ${idx}.`);
    }
  });

  return { conversations, messages, warnings };
}
