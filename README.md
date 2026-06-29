# ChatRecap

**See your year in ChatGPT — privately, in your browser.**

ChatRecap turns your ChatGPT data export into a beautiful, shareable dashboard:
your busiest hours, the models you lean on, words you overuse, your longest daily
streak, and more.

It is a static web page with **no backend**. Your export is read and analyzed
entirely in your browser — your conversations are never uploaded anywhere. You can
even disconnect from the internet after the page loads and it still works.

👉 **Live site:** _(added at launch)_

---

## What it shows

- Total conversations and messages
- Words **you** typed vs. words **ChatGPT** wrote back
- A weekday × hour heatmap of when you chat
- The models you used most (GPT-4o, o1, …)
- Your most-used words
- Longest daily streak, busiest day, longest conversation, first chat

## Privacy

- **No upload, no server.** All parsing happens client-side in a Web Worker.
- **No accounts. No tracking cookies. No ad networks.** Nothing from your file ever
  leaves your browser.
- **Open source.** Read exactly what it does, or run it offline.

## How to use

1. In ChatGPT: **Settings → Data controls → Export data**. OpenAI emails you a `.zip`.
2. Open ChatRecap and drop in the `.zip` (or the `conversations.json` inside it).
3. Get your dashboard instantly.

No export handy? The site has a one-click **live demo** with synthetic data.

## How it works

- **React + TypeScript + Vite + Tailwind**, shipped as static files.
- The ChatGPT export (`conversations.json`) is unzipped in-browser with
  [`fflate`](https://github.com/101arrowz/fflate), parsed into a normalized message
  list, and aggregated into stats — all inside a Web Worker so the UI stays smooth on
  large histories.
- Pure, dependency-injected parsing/stats functions with full unit-test coverage.

## Local development

```bash
npm install
npm run dev        # start the dev server
npm test           # run the test suite
npm run build      # production build → dist/
```

## Roadmap

- Claude (`conversations.json`) and other assistant exports
- Downloadable share card image
- Per-topic breakdowns

## Disclaimer

ChatRecap is an independent project and is **not affiliated with OpenAI**.
"ChatGPT" is a trademark of OpenAI.

## License

MIT — see [LICENSE](./LICENSE).
