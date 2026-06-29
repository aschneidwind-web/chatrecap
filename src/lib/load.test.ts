import { zipSync, strToU8 } from "fflate";
import { readExportFile } from "./load";
import { sampleRaw } from "../test/fixtures";

describe("readExportFile", () => {
  it("reads a bare conversations.json file", async () => {
    const file = new File([JSON.stringify(sampleRaw)], "conversations.json", {
      type: "application/json",
    });
    const data = await readExportFile(file);
    expect(Array.isArray(data)).toBe(true);
    expect((data as unknown[]).length).toBe(2);
  });

  it("extracts conversations.json from a full .zip export", async () => {
    const zipped = zipSync({
      "user.json": strToU8("{}"),
      "conversations.json": strToU8(JSON.stringify(sampleRaw)),
      "message_feedback.json": strToU8("[]"),
    });
    const file = new File([zipped], "chatgpt-export.zip", { type: "application/zip" });
    const data = await readExportFile(file);
    expect(Array.isArray(data)).toBe(true);
    expect((data as unknown[]).length).toBe(2);
  });

  it("throws a helpful error when the zip has no conversations.json", async () => {
    const zipped = zipSync({ "user.json": strToU8("{}") });
    const file = new File([zipped], "wrong.zip");
    await expect(readExportFile(file)).rejects.toThrow(/conversations\.json/i);
  });
});
