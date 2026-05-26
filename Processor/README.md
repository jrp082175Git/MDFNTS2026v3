# Processor

A Node.js Processor application that connects to the Receiver Relay Server to parse MDF messages into Proprietary Business Messages.

## Usage

First, install dependencies:
```bash
npm install
```

Then run the application:
```bash
node src/index.js RETRANS:ON START:Y DISPLAY:OFF JP
```

Arguments:
1. `RETRANS:ON` or `RETRANS:OFF`
2. `START:Y` or `START:N`
3. `DISPLAY:ON` or `DISPLAY:OFF`
4. User initials, comma-separated

Configuration is in `processor.config.json` and optionally overridden via `.env`.
