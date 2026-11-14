# TradeGhost — Security & Privacy Steering

## Data handling (MVP)
- All CSV processing and calculations run in the browser. No trade data leaves the device.
- **No persistence:** do not use localStorage, sessionStorage, IndexedDB, cookies, or any server storage for trade data.
- Imported data lives in memory for the session only and is cleared on reload/close.
- No exchange API keys are requested or accepted.
- No external analytics or tracking calls.

## Disclaimers (shown in-app, e.g. Settings + import flow)
- TradeGhost processes uploaded trading history locally and does not transmit financial data anywhere.
- TradeGhost provides historical performance analysis and educational insights, **not** financial or investment advice.
- Users are responsible for the accuracy of their imported data.

## Hygiene
- No secrets in code (none exist in this local app — keep it that way).
- Treat all uploaded file contents as untrusted data; validate before use.
- Quote/escape untrusted values if ever interpolated into commands or templates.
