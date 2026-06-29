// Loose types describing the *untrusted* shape of OpenAI's ChatGPT data export
// (conversations.json). Everything is optional because we never trust the input.

export interface RawAuthor {
  role?: string;
  name?: string | null;
}

export interface RawContent {
  content_type?: string;
  parts?: unknown[];
  text?: string;
}

export interface RawMessageMeta {
  model_slug?: string;
  is_visually_hidden_from_conversation?: boolean;
}

export interface RawMessage {
  id?: string;
  author?: RawAuthor;
  create_time?: number | null;
  update_time?: number | null;
  content?: RawContent;
  metadata?: RawMessageMeta;
}

export interface RawNode {
  id?: string;
  parent?: string | null;
  children?: string[];
  message?: RawMessage | null;
}

export interface RawConversation {
  title?: string;
  create_time?: number | null;
  update_time?: number | null;
  id?: string;
  conversation_id?: string;
  mapping?: Record<string, RawNode>;
}
