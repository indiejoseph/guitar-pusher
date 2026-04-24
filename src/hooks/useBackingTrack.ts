import { type RefObject, useCallback, useEffect, useRef } from "react";
import * as Tone from "tone";

interface BackingTrackProps {
	tempo: number;
	timeSignature: string;
	currentChord: { name: string; notes: string[] };
	isPlaying: boolean;
	drumsEnabled: boolean;
	bassEnabled: boolean;
	harmonyEnabled: boolean;
	metronomeEnabled: boolean;
	/** Set to true when threshold is hit; hook fires onBarAdvance on the next Tone.js downbeat. */
	readyToAdvanceRef?: RefObject<boolean>;
	/** Called (via Tone.getDraw) on the scheduled downbeat when readyToAdvanceRef is true. */
	onBarAdvance?: () => void;
}

export const useBackingTrack = ({
	tempo,
	timeSignature,
	currentChord,
	isPlaying,
	drumsEnabled,
	bassEnabled,
	harmonyEnabled,
	metronomeEnabled,
	readyToAdvanceRef,
	onBarAdvance,
}: BackingTrackProps) => {
	const kickSynthRef = useRef<Tone.MembraneSynth | null>(null);
	const snareSynthRef = useRef<Tone.NoiseSynth | null>(null);
	const hihatSynthRef = useRef<Tone.MetalSynth | null>(null);
	const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
	const polySynthRef = useRef<Tone.PolySynth | null>(null);
	const metronomeSynthRef = useRef<Tone.Player | null>(null);
	const loopRef = useRef<Tone.Loop | null>(null);

	// CRITICAL: Keep track of steps across re-renders to prevent rhythm resets
	const stepRef = useRef(0);

	// Live-value refs — loop reads these directly so the transport never needs to restart
	const currentChordRef = useRef(currentChord);
	const drumsRef = useRef(drumsEnabled);
	const bassRef = useRef(bassEnabled);
	const harmonyRef = useRef(harmonyEnabled);
	const metronomeRef = useRef(metronomeEnabled);
	// Stable ref for the advance callback so the loop closure never goes stale
	const onBarAdvanceRef = useRef(onBarAdvance);
	useEffect(() => {
		onBarAdvanceRef.current = onBarAdvance;
	}, [onBarAdvance]);

	// Keep live refs in sync with props
	useEffect(() => {
		currentChordRef.current = currentChord;
	}, [currentChord]);
	useEffect(() => {
		drumsRef.current = drumsEnabled;
	}, [drumsEnabled]);
	useEffect(() => {
		bassRef.current = bassEnabled;
	}, [bassEnabled]);
	useEffect(() => {
		harmonyRef.current = harmonyEnabled;
	}, [harmonyEnabled]);
	useEffect(() => {
		metronomeRef.current = metronomeEnabled;
	}, [metronomeEnabled]);

	useEffect(() => {
		// Drum Synths
		kickSynthRef.current = new Tone.MembraneSynth({
			envelope: { sustain: 0, attack: 0.02, decay: 0.8 },
			octaves: 10,
			volume: -6,
		}).toDestination();

		snareSynthRef.current = new Tone.NoiseSynth({
			noise: { type: "white" },
			envelope: { attack: 0.005, decay: 0.2, sustain: 0 },
			volume: -10,
		}).toDestination();

		hihatSynthRef.current = new Tone.MetalSynth({
			envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
			volume: -20,
		}).toDestination();

		// Bass
		bassSynthRef.current = new Tone.MonoSynth({
			oscillator: { type: "triangle" },
			envelope: { attack: 0.05, decay: 0.3, sustain: 0.4, release: 0.8 },
			volume: -10,
		}).toDestination();

		// Harmony (PolySynth)
		polySynthRef.current = new Tone.PolySynth(Tone.Synth, {
			oscillator: { type: "triangle" }, // Softer than sine at high octaves
			envelope: { attack: 0.025, decay: 0.1, sustain: 0.3, release: 1 },
			volume: -25, // Keep it low so it doesn't mask the guitar
		}).toDestination();
		polySynthRef.current.set({ volume: -15 });

		// Metronome click (matches count-in sound)
		metronomeSynthRef.current = new Tone.Player(
			"/sounds/woodblock.wav",
		).toDestination();

		return () => {
			[
				kickSynthRef,
				snareSynthRef,
				hihatSynthRef,
				bassSynthRef,
				polySynthRef,
				metronomeSynthRef,
			].forEach((ref) => {
				ref.current?.dispose();
			});
			loopRef.current?.dispose();
		};
	}, []);

	useEffect(() => {
		Tone.getTransport().bpm.value = tempo;
	}, [tempo]);

	const startBackingTrack = useCallback(async () => {
		if (Tone.getContext().state !== "running") {
			await Tone.start();
		}

		const transport = Tone.getTransport();
		// Reset to bar 1 on (re)start — only called when isPlaying flips or timeSignature changes.
		transport.stop();
		transport.position = 0;
		stepRef.current = 0;

		if (loopRef.current) loopRef.current.dispose();

		const [num, den] = timeSignature.split("/").map(Number);
		const stepsPerBar = num * (8 / den);
		// Steps per main beat (8th-note grid: e.g. 4/4 → 2 steps/beat, 12/8 → 3)
		const stepsPerBeat = den === 8 ? 3 : 2;

		// Duration of one full bar expressed in eighth notes
		const barDuration = Tone.Time("8n").toSeconds() * stepsPerBar;

		loopRef.current = new Tone.Loop((time) => {
			const currentStep = stepRef.current % stepsPerBar;
			const isDownbeat = currentStep === 0;
			const isBarEndStep = currentStep === stepsPerBar - 1;
			// Read live values from refs — no transport restart needed on chord/flag changes
			const chord = currentChordRef.current;
			const root = `${chord.notes[0]}2`;
			const highChordNotes = chord.notes.map((n, i) =>
				i === 0 ? `${n}3` : `${n}4`,
			);

			// --- BAR END: commit chord advance one step before downbeat ---
			// This gives React time to propagate the new chord so the next downbeat
			// plays the new harmony/bass instead of sustaining the old chord for a bar.
			if (isBarEndStep && readyToAdvanceRef?.current) {
				readyToAdvanceRef.current = false;
				Tone.getDraw().schedule(() => {
					onBarAdvanceRef.current?.();
				}, time);
			}

			// --- HARMONY: Trigger on the first beat of every bar ---
			if (harmonyRef.current && isDownbeat) {
				polySynthRef.current?.triggerAttackRelease(
					highChordNotes,
					barDuration,
					time,
					0.4,
				);
			}

			// --- METRONOME: click on every main beat ---
			if (metronomeRef.current && currentStep % stepsPerBeat === 0) {
				metronomeSynthRef.current?.start(time);
			}

			// --- HI-HAT: Trigger every step ---
			if (drumsRef.current) {
				hihatSynthRef.current?.triggerAttackRelease("F#1", "32n", time, 0.15);
			}

			// --- 12/8 [B - - S - B B - - S - - ] ---
			if (timeSignature === "12/8") {
				if (currentStep === 0 || currentStep === 5 || currentStep === 6) {
					if (drumsRef.current) {
						kickSynthRef.current?.triggerAttackRelease("C1", "8n", time);
					}
					if (bassRef.current) {
						bassSynthRef.current?.triggerAttackRelease(root, "4n", time, 0.8);
					}
				}
				if (drumsRef.current && (currentStep === 3 || currentStep === 9)) {
					snareSynthRef.current?.triggerAttackRelease("16n", time);
				}
			}

			// --- 4/4 [B - S - B B S -] ---
			else if (timeSignature === "4/4") {
				if (currentStep === 0 || currentStep === 4 || currentStep === 5) {
					if (drumsRef.current) {
						kickSynthRef.current?.triggerAttackRelease("C1", "8n", time);
					}
					if (bassRef.current) {
						bassSynthRef.current?.triggerAttackRelease(root, "4n", time, 0.8);
					}
				}
				if (drumsRef.current && (currentStep === 2 || currentStep === 6))
					snareSynthRef.current?.triggerAttackRelease("16n", time);
			}

			// --- 5/4 [B - S - B B S - S -] ---
			else if (timeSignature === "5/4") {
				if (currentStep === 0 || currentStep === 4 || currentStep === 5) {
					if (drumsRef.current) {
						kickSynthRef.current?.triggerAttackRelease("C1", "8n", time);
					}
					const duration =
						currentStep === 4 ? "8n" : currentStep === 5 ? "2.n" : "4n";
					if (bassRef.current) {
						bassSynthRef.current?.triggerAttackRelease(
							root,
							duration,
							time,
							0.8,
						);
					}
				}
				if (
					drumsRef.current &&
					(currentStep === 2 || currentStep === 6 || currentStep === 8)
				)
					snareSynthRef.current?.triggerAttackRelease("16n", time);
			}

			// --- 3/4 [B - S - S - ] ---
			else if (timeSignature === "3/4") {
				if (currentStep === 0) {
					if (drumsRef.current) {
						kickSynthRef.current?.triggerAttackRelease("C1", "8n", time);
					}
					if (bassRef.current) {
						bassSynthRef.current?.triggerAttackRelease(root, "2.n", time, 0.8);
					}
				}
				if (drumsRef.current && (currentStep === 4 || currentStep === 8))
					snareSynthRef.current?.triggerAttackRelease("16n", time);
			}

			stepRef.current++;
		}, "8n").start(0);

		transport.start();
		// readyToAdvanceRef is a stable ref object — including it satisfies the linter without causing restarts
	}, [timeSignature, readyToAdvanceRef]);

	const stopBackingTrack = useCallback(() => {
		Tone.getTransport().stop();
		loopRef.current?.stop();
		stepRef.current = 0; // Reset rhythm on stop
	}, []);

	useEffect(() => {
		if (isPlaying) {
			startBackingTrack();
		} else {
			stopBackingTrack();
		}
	}, [isPlaying, startBackingTrack, stopBackingTrack]);

	return { isPlaying };
};
