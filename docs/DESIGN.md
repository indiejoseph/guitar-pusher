# Pusher: Visual Layouts

This document outlines the UI structure and layout patterns for the AI Guitar Trainer.

---

## 🏗️ Main Dashboard Layout

The main screen is designed for high visibility while playing, ensuring the user can see the target chord and their progress from a distance.

Whole design is a **responsive grid** that adapts to desktop and mobile:

- Everything should be centered and large enough to read at a glance.
- Minimal distractions: the focus is on the chord and progress, not on flashy UI elements.
- Important information:
  - Current Chord and Target Notes
  - Next Chord Preview
  - No need show the detections in the main UI, if the user manage to play the correct notes, then go to next bar, otherwise, just remain in the current bar, and show the progress ring filling up as the user play the correct notes.

### 1. Header
- **Left:** App Title ("PUSHER")
- **Right:** Action Bar
    - **Settings Button(a gear icon):** Opens the configuration modal.

### 2. Main Game Area (Grid)
- **Primary Row(2/3 height):**
    - **Chord Card:** Large display of the `Current Chord` name and a list of target notes.
    - **Progress Ring:** A circular meter that fills up as the user plays correct chord tones. It should the success vs error ratio for the current bar. Once it hits **50% of the bar's duration**, it triggers the `nextChord()` function to advance to the next chord. the progress ring should place behind the chord card, like a halo effect, so the user can easily see the progress without looking away from the target chord. default color is grey, but when the user play the correct note, the progress ring would fill with accent color (e.g., Green) from left to right, and if the user play the wrong note, the progress ring would fill with red color from right to left, so the user can easily see the success vs error ratio for the current bar.
- **Secondary Row(1/3 height):**
    - **Next Chord Preview:** Current chord -> next chord, maximum 2 chords to avoid overwhelming the user.
    - **Start Button:** Large, centered button to start the session. Changes to "Restart" after the first run.

---

## ⚙️ Settings Modal
A centralized dialog for session configuration.

- **Musical Context:** Dropdowns for Root Key and Time Signature.
- **Rhythm Control:** Slider for Tempo (BPM) with numerical readout.
- **Time Signature:** Dropdown for 4/4, 3/4, 6/8, etc.
- **Backing Track:** Toggle for the "Backing Track" engine, drum, bass and harmony can be toggled on/off independently. if bass or harmony is toggled on, would show headphone recommendation with icon to use headphone to avoid wrong detection caused by the backing track.

---

## 🎨 Visual States

| State | Visual Cues |
| :--- | :--- |
| **Idle** | Grayscale/Muted colors, "Start" button visible. |
| **Play** | Active progress ring, live updating frequency meters. |
| **Success (Hit)** | Progress ring fills with accent color (e.g., Green/Primary). |
| **Error** | Red status text in the feedback bar (e.g., "Microphone blocked"). |

---

## 📱 Responsive behavior

- **Desktop:** Side-by-side grid (Chord vs. Progress).
- **Mobile/Tablet:** Single column stack. The `ChordDisplay` remains at the top, with the `ProgressRing` following below to ensure the user doesn't have to scroll to see the "target."
