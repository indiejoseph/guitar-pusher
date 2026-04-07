# Guitar Pusher

Guitar Pusher is a guitar practice app that helps you train chord progression changes with real-time pitch detection, visual feedback, and an optional backing track.

## What It Does

- Detects live pitch from microphone input using pitchy
- Matches detected notes against the current target chord
- Shows progression feedback with chord display, progress ring, and sequence preview
- Supports practice controls for key, mode, tempo, and time signature
- Includes backing track layers (drums, bass, harmony) and metronome/count-in
- Provides an auto-advance mode to move chords at bar boundaries when needed

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4 + shadcn/base-ui components
- Tone.js for transport, scheduling, and backing track synthesis
- pitchy for low-latency monophonic pitch detection
- Cloudflare Workers + Wrangler for deployment

## Audio Pipeline Notes

Microphone capture in the pitch hook explicitly disables browser processing that harms guitar frequency detection:

- echoCancellation: false
- noiseSuppression: false
- autoGainControl: false

The app also applies a high-pass filter around 80 Hz before analysis to reduce low-end rumble and improve note tracking reliability.

## Core Project Structure

```text
src/
  App.tsx
  index.css
  components/
    ChordDisplay.tsx
    ProgressRing.tsx
    DetectionStats.tsx
    NextChordPreview.tsx
    Settings.tsx
    ui/
  hooks/
    usePitchDetector.ts
    useBackingTrack.ts
  utils/
    frequencyToNote.ts
worker/
  index.ts
```

## Getting Started

### Prerequisites

- Bun >= 1.2.2
- Node.js >= 22

### Install

```bash
bun install
```

### Run Locally

```bash
bun run dev
```

### Build

```bash
bun run build
```

### Preview Production Build

```bash
bun run preview
```

## Available Scripts

- bun run dev: Start Vite dev server
- bun run build: Type-check and build production assets to dist
- bun run preview: Serve built app locally
- bun run lint: Run ESLint
- bun run cf:dev: Build and run local Wrangler worker preview
- bun run cf:deploy: Build and deploy to Cloudflare Workers

## Deploy To Cloudflare Workers

This repository is configured to deploy static Vite output through a Worker with SPA fallback.

1. Authenticate Wrangler

```bash
bunx wrangler login
```

2. Deploy

```bash
bun run cf:deploy
```

3. Local Worker Preview

```bash
bun run cf:dev
```

Config files involved:

- wrangler.toml
- worker/index.ts

## Troubleshooting

- No pitch detected:
  - Verify mic permissions are granted
  - Use headphones when backing track is enabled
  - Confirm your input signal is above the gating threshold
- App does not advance chords while practicing:
  - Enable Auto-Advance in session settings for bar-based progression
- Audio sounds delayed or unstable:
  - Close other audio-intensive tabs/apps
  - Retry with lower system load and stable device audio settings

