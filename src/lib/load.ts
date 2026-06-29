import { unzipSync, strFromU8 } from "fflate";

/**
 * Turn a user-selected file into the parsed JSON of their conversations export.
 * Accepts either the whole ChatGPT export `.zip` (we find conversations.json
 * inside it) or a bare `conversations.json`. Everything happens locally.
 */
export async function readExportFile(file: File): Promise<unknown> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".zip")) {
    const buf = new Uint8Array(await file.arrayBuffer());
    const unzipped = unzipSync(buf, {
      filter: (f) => f.name.toLowerCase().endsWith("conversations.json"),
    });
    const entry = Object.keys(unzipped)[0];
    if (!entry) {
      throw new Error(
        "Couldn't find conversations.json inside that ZIP. Make sure it's your ChatGPT data export."
      );
    }
    return JSON.parse(strFromU8(unzipped[entry]));
  }

  if (name.endsWith(".json")) {
    return JSON.parse(await file.text());
  }

  throw new Error(
    "Unsupported file. Drop your ChatGPT export .zip — or the conversations.json inside it."
  );
}
