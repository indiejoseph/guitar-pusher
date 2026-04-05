# Pusher

AI Guitar Trainer Project

## Project Overview
This is an AI-powered guitar training application that provides real-time pitch detection and feedback to help users practice chord progressions and solos. The app uses a hybrid architecture combining instant feedback with high-accuracy AI analysis.

## Tech Stack

### Phase 1: Web Application
- **Framework:** Vite + React with TypeScript
- **Styling:** Tailwind CSS
- **Pitch Detection:** `pitchy` library (McLeod Pitch Method)
- **Audio:** Web Audio API with `getUserMedia`

### Phase 2: AI Analysis
- **Transcription:** `@spotify/basic-pitch` for polyphonic note detection
- **Processing:** 2-second audio buffer segments

### Phase 3: Mobile
- **Platform:** Capacitor for iOS/Android
- **Audio Plugin:** `capacitor-voice-recorder`

## Architecture Principles

### Two-Tier Detection System
1. **Live Engine (pitchy):** Monophonic, ~20ms latency, instant UI feedback
2. **AI Engine (Basic Pitch):** Polyphonic, ~200ms latency, detailed analysis

### Audio Configuration
**CRITICAL:** Always set `echoCancellation: false` in `getUserMedia` constraints. Modern audio processing destroys guitar frequencies needed for pitch detection.

```typescript
const constraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false
  }
};
```

## Game Logic Rules

### Note Detection
- **Tolerance:** ±15 cents from target frequency
- **Stability:** Notes must be stable for 100ms to register as a "hit"
- **Progression:** Advance to next chord when user plays correct notes for 50% of bar duration

### Scoring System
- Progress ring fills as correct chord tones are played
- "Deep Score" shows interval accuracy (e.g., "3rd played 8 times")

## Code Conventions

### TypeScript
- Use strict mode
- Define interfaces for all audio data structures
- Properly type Web Audio API nodes and buffers

### React Patterns
- Create custom hook `usePitchDetector` for audio logic
- Separate UI components from audio processing
- Use state machine pattern for chord progression management

### File Structure
```
src/
├── hooks/
│   ├── usePitchDetector.ts
│   └── useBasicPitch.ts
├── components/
│   ├── ChordDisplay.tsx
│   ├── ProgressRing.tsx
│   └── Metronome.tsx
├── utils/
│   ├── frequencyToNote.ts
│   └── noteMatching.ts
└── types/
    └── audio.ts
```

## Performance Considerations
- Run pitch detection in separate Web Worker if possible
- Throttle UI updates to 60fps max
- Use Wake Lock API on mobile to prevent screen dimming
- Buffer audio analysis to avoid blocking UI thread

## Common Pitfalls to Avoid
❌ Don't use standard FFT for guitar - it picks up harmonics  
❌ Don't make tolerance too strict (<10 cents) - real playing varies  
❌ Don't process every audio frame - batch at ~60fps  
❌ Don't enable echo cancellation - it ruins pitch data  

## Musical Theory Constants
```typescript
const A4_FREQUENCY = 440; // Hz
const CENTS_TOLERANCE = 15;
const STABILITY_THRESHOLD_MS = 100;
const PROGRESSION_ADVANCE_THRESHOLD = 0.5; // 50% of bar
```

## Development Workflow
1. Test audio in browser first (Phase 1)
2. Validate with real guitar input, not synthetic tones
3. Add Basic Pitch analysis (Phase 2)
4. Only then migrate to Capacitor (Phase 3)

## Testing Notes
- Always test with actual guitar audio, not sine waves
- Test on multiple devices (iOS audio APIs differ from Android)
- Verify microphone permissions are properly requested
- Check that audio context doesn't auto-suspend

## References
- [pitchy documentation](https://github.com/ianprime0509/pitchy)
- [Spotify Basic Pitch](https://github.com/spotify/basic-pitch)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Capacitor Audio](https://capacitorjs.com/docs/apis/permissions)

## Pitchy Example Usage

```javascript
import { PitchDetector } from "https://esm.sh/pitchy@4";

function updatePitch(analyserNode, detector, input, sampleRate) {
  analyserNode.getFloatTimeDomainData(input);
  const [pitch, clarity] = detector.findPitch(input, sampleRate);

  document.getElementById("pitch").textContent = `${
    Math.round(pitch * 10) / 10
  } Hz`;
  document.getElementById("clarity").textContent = `${Math.round(
    clarity * 100,
  )} %`;
  window.setTimeout(
    () => updatePitch(analyserNode, detector, input, sampleRate),
    100,
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const audioContext = new window.AudioContext();
  const analyserNode = audioContext.createAnalyser();

  document
    .getElementById("resume-button")
    .addEventListener("click", () => audioContext.resume());

  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    audioContext.createMediaStreamSource(stream).connect(analyserNode);
    const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
    detector.minVolumeDecibels = -10;
    const input = new Float32Array(detector.inputLength);
    updatePitch(analyserNode, detector, input, audioContext.sampleRate);
  });
});
```

## Storybook

When working on UI components, always use the `storybook` MCP tools to access Storybook's component and documentation knowledge before answering or taking any action.

- **CRITICAL: Never hallucinate component properties!** Before using ANY property on a component from a design system (including common-sounding ones like `shadow`, etc.), you MUST use the MCP tools to check if the property is actually documented for that component.
- Query `list-all-documentation` to get a list of all components
- Query `get-documentation` for that component to see all available properties and examples
- Only use properties that are explicitly documented or shown in example stories
- If a property isn't documented, do not assume properties based on naming conventions or common patterns from other libraries. Check back with the user in these cases.
- Use the `get-storybook-story-instructions` tool to fetch the latest instructions for creating or updating stories. This will ensure you follow current conventions and recommendations.
- Check your work by running `run-story-tests`.

Remember: A story name might not reflect the property name correctly, so always verify properties through documentation or example stories before using them.