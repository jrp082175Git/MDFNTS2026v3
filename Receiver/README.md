# Receiver

A Node.js application that interfaces with the PSE New Trading System MDF Server Feed using MoldUDP64 over UDP multicast.

## Usage

First, install the required dependencies:

```bash
npm install
```

Then, run the application:

```bash
node src/index.js PROD RETRANS:ON START:Y JP
```

Arguments:
1. `PROD` or `DR`
2. `RETRANS:ON` or `RETRANS:OFF`
3. `START:Y` (start fresh) or `START:N` (reload from data files)
4. User initials (comma-separated, e.g., `JP,MP`)

## Configuration

Configuration is located in `receiver.config.json` and optionally overridden by `.env`.
