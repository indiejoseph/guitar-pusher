# Pusher

AI Guitar Trainer: The Ultimate Roadmap

This is the complete, multi-stage roadmap to build your "AI Guitar Trainer." We are using a **Hybrid Architecture**: a lightweight engine for instant feedback and Spotify's **Basic Pitch** for high-accuracy scoring.

---

## 🏗️ Phase 1: The "Live" Web Engine (Vite + React)
**Goal:** Build a browser app that feels like a game, reacting instantly to your notes.

### 1. Project Foundation
* **Framework:** Vite + React (TypeScript is highly recommended for handling audio types).
* **Styling:** Tailwind CSS (perfect for the "Flashcard" UI).
* **Pitch Library:** `pitchy`. It uses the **McLeod Pitch Method**, which is much better at ignoring guitar string harmonics than standard FFT.

### 2. Core "Game" Logic
* **The State Machine:** Define a key (e.g., G Major) and a progression.
* **Target Note Detection:** * **Tolerance:** Match notes within $\pm 15$ cents (don't be too strict!).
    * **Confirmation:** The note must be "stable" for **100ms** to trigger a "hit."
* **Live Scoring:** Create a "Progress Ring" that fills up as the user plays correct chord tones. Once it hits **50% of the bar's duration**, move to the next chord.

### 3. Backing Track Engine
* **Audio Stack:** `Tone.js`. Essential for rock-solid timing and browser-based synthesis.
* **Dynamic Generation:**
    * **Drums (MIDI):** Uses pre-recorded MIDI files for different time signatures (e.g., `4-4-standard.mid`, `3-4-waltz.mid`). This ensures a "human" feel and professional grooves.
    * **Bass (Procedural):** A steady bass line that follows the **Root** of the active chord using a defined rhythm pattern (e.g., 1 and 3, or a walking 8th-note line).
    * **Harmony (Procedural):** A synth "Strum" or "Pad" that plays the full target chord notes, helping the user "hear" the resolution.
* **Synchronization:** The backing track is slave to the **State Machine**. When the `nextChord()` trigger fires, the Bass and Harmony patterns update in real-time, while the Drum MIDI loop continues to provide the pulse.

---

## 🤖 Phase 2: The AI Analysis (Spotify Basic Pitch)
**Goal:** Add "Professional Mode" where the app accurately transcribes complex solos and chords.

### 1. Integration
* **NPM:** `@spotify/basic-pitch`.
* **Workflow:** Instead of "live" analysis (which is CPU heavy), record a **2-second segment** of the user's soloing.
* **Processing:** Send that audio buffer to `basicPitch.evaluateModel()`.
* **Output:** It returns a list of MIDI notes. Compare these against your chord tones for a "Deep Score" (e.g., "You hit the 3rd interval 8 times in that solo!").

---

## 📱 Phase 3: Mobile Migration (Capacitor)
**Goal:** Turn your web app into a native iOS/Android app.

### 1. The Bridge
* **Setup:** `npx cap add ios` / `npx cap add android`.
* **Permissions:** You must add `NSMicrophoneUsageDescription` (iOS) to allow the app to "hear" the guitar.

### 2. Native Optimization
* **Plugin:** `capacitor-voice-recorder`. This is more stable than the standard browser `getUserMedia` on some Android devices.
* **Performance:** Use a "Wake Lock" plugin so the screen doesn't dim while the user is playing.

---

## 📊 The "Game" Technical Specs

| Feature | Stage 1 (Web/Pitchy) | Stage 2 (Mobile/Basic Pitch) |
| :--- | :--- | :--- |
| **Detection Type** | Monophonic (one note) | Polyphonic (chords/complex solos) |
| **Latency** | ~20ms (Instant) | ~200ms (Slight delay) |
| **Accuracy** | Good for clear notes | High (handles "messy" playing) |
| **UI Feedback** | Moving meters, "Glow" effects | Detailed post-solo charts |

---

## 🛠️ Step-by-Step Execution Plan

1.  **[ ] Setup React:** Create the UI with a large "Current Chord" display and a metronome.
2.  **[ ] Web Audio Hook:** Write a custom hook `usePitchDetector` that requests mic access and logs frequencies to the console.
3.  **[ ] Tone.js Integration:** Install `tone` and setup the `Transport`. Create basic Drum, Bass, and Synth instruments.
4.  **[ ] Backing Track Engine:** Write a manager that plays the current chord's root on bass and harmony on the synth, synchronized with the beat.
5.  **[ ] Target Matching:** Map frequencies to musical notes (e.g., 440Hz = A).
6.  **[ ] Scoring Engine:** Implement the **50% Duration** rule. If the user plays the correct note for 2 out of 4 beats, trigger `nextChord()`.
7.  **[ ] Basic Pitch Module:** Add a "Record" button. After playing, show the user exactly which notes the AI detected.
8.  **[ ] Capacitor Build:** Run `npx cap open ios` and test it on a real device.



### Pro-Tip for 2026:
When using `getUserMedia`, set `echoCancellation: false`. Modern phones try to "clean up" audio for calls, which actually destroys the frequencies needed for guitar pitch detection. Disabling this is the #1 way to make your app feel professional.

**Ready to start? I can provide the `usePitchDetector` hook code or help you set up the initial Tone.js instruments.**


## Back Track Synthesis

4 / 4 time signature:
- **Drums:** Kick on 1, 3 and 3 upbeat, Snare on 2 and 4, Hi-Hat on every 8th note.
- **Bass:** Root note on 1, 3 and 3 upbeat.
- **Harmony:** Full chord strum on 1 and 3.

3 / 4 time signature:
- **Drums:** Kick on 1, Snare on 2, Hi-Hat on every 8th note.
- **Bass:** Root note on 1.
- **Harmony:** Full chord strum on 1.