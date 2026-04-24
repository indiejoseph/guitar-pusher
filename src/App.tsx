import { Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Dices, Ear, Play, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Tone from "tone";
import ChordDisplay from "./components/ChordDisplay";
import { DetectionStats } from "./components/DetectionStats";
import NextChordPreview from "./components/NextChordPreview.tsx";
import ProgressRing from "./components/ProgressRing";
import Settings from "./components/Settings";
import { Button } from "./components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./components/ui/dialog";
import { useBackingTrack } from "./hooks/useBackingTrack";
import { usePitchDetector } from "./hooks/usePitchDetector";
import { frequencyToNote } from "./utils/frequencyToNote";

const NOTE_NAMES = [
	"C",
	"C#",
	"D",
	"D#",
	"E",
	"F",
	"F#",
	"G",
	"G#",
	"A",
	"A#",
	"B",
];

const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_STEPS = [0, 2, 3, 5, 7, 8, 10];

type KeyMode = "major" | "minor";

type ChordDef = {
	name: string;
	notes: string[];
	degree: string;
};

// Harmony rules: which degrees can follow which
const HARMONY_RULES: Record<string, string[]> = {
	I: ["ii", "iii", "IV", "V", "vi", "III7", "VI7"],
	ii: ["V", "IV", "vii°"],
	iii: ["vi", "IV", "ii"],
	IV: ["iv", "V", "I"],
	iv: ["I"],
	V: ["I", "vi", "iv"],
	vi: ["ii", "IV", "VI7", "V"],
	"vii°": ["I", "iii"],
	III7: ["vi", "IV"],
	VI7: ["ii", "V"],
};

type SeqEntry = { id: string; chordIdx: number };

let seqCounter = 0;
const generateSequence = (
	chords: ChordDef[],
	keyRoot: string,
	keyMode: KeyMode,
): SeqEntry[] => {
	const mappedChords = chords.map((c, i) => ({ ...c, idx: i }));

	// In minor mode, always start from tonic minor triad (e.g. Am).
	let firstChord =
		keyMode === "minor"
			? mappedChords.find((c) => c.name === `${keyRoot}m`)
			: undefined;

	// Fallback to any tonic chord (degree "I" for major, "i" for minor).
	if (!firstChord) {
		const tonicDegree = keyMode === "minor" ? "i" : "I";
		const iChords = mappedChords.filter((c) => c.degree === tonicDegree);
		firstChord = iChords[Math.floor(Math.random() * iChords.length)];
	}

	// Last-resort fallback to first chord.
	if (!firstChord) {
		firstChord = mappedChords[0];
	}
	const seq: SeqEntry[] = [
		{ id: `s${seqCounter++}`, chordIdx: firstChord.idx },
	];
	const usedDegrees = new Set([firstChord.degree]);

	for (let step = 1; step < 4; step++) {
		const prevDegree = chords[seq[seq.length - 1].chordIdx].degree;
		const allowed = (HARMONY_RULES[prevDegree] ?? []).filter(
			(d) => !usedDegrees.has(d),
		);

		// Find candidate chords matching allowed degrees
		let candidates = chords
			.map((c, i) => ({ ...c, idx: i }))
			.filter((c) => allowed.includes(c.degree));

		// Fallback: any chord not already used
		if (candidates.length === 0) {
			candidates = chords
				.map((c, i) => ({ ...c, idx: i }))
				.filter((c) => !usedDegrees.has(c.degree));
		}
		// Last resort: any chord not the same as previous
		if (candidates.length === 0) {
			candidates = chords
				.map((c, i) => ({ ...c, idx: i }))
				.filter((c) => c.idx !== seq[seq.length - 1].chordIdx);
		}

		const pick = candidates[Math.floor(Math.random() * candidates.length)];
		seq.push({ id: `s${seqCounter++}`, chordIdx: pick.idx });
		usedDegrees.add(pick.degree);
	}
	return seq;
};

const getNoteAtSemitone = (root: string, semitoneOffset: number) => {
	const rootIndex = NOTE_NAMES.indexOf(root);
	if (rootIndex < 0) return root;
	return NOTE_NAMES[(rootIndex + semitoneOffset + 12) % 12];
};

const getChordTones = (
	scale: string[],
	degree: number,
	intervals: number[],
) => {
	const degreeIndex = degree - 1;
	return intervals.map(
		(interval) => scale[(degreeIndex + interval) % scale.length],
	);
};

const getChordFromRoot = (root: string, semitoneIntervals: number[]) =>
	semitoneIntervals.map((offset) => getNoteAtSemitone(root, offset));

const buildChordsForKey = (keyRoot: string, keyMode: KeyMode): ChordDef[] => {
	const scaleSteps =
		keyMode === "major" ? MAJOR_SCALE_STEPS : MINOR_SCALE_STEPS;
	const scale = scaleSteps.map((step) => getNoteAtSemitone(keyRoot, step));

	if (keyMode === "minor") {
		return [
			// Triads (natural minor)
			{
				name: `${scale[0]}m`,
				notes: getChordFromRoot(scale[0], [0, 3, 7]),
				degree: "i",
			},
			{
				name: `${scale[1]}dim`,
				notes: getChordFromRoot(scale[1], [0, 3, 6]),
				degree: "ii°",
			},
			{
				name: `${scale[2]}`,
				notes: getChordFromRoot(scale[2], [0, 4, 7]),
				degree: "III",
			},
			{
				name: `${scale[3]}m`,
				notes: getChordFromRoot(scale[3], [0, 3, 7]),
				degree: "iv",
			},
			{
				name: `${scale[4]}m`,
				notes: getChordFromRoot(scale[4], [0, 3, 7]),
				degree: "v",
			},
			{
				name: `${scale[4]}`,
				notes: getChordFromRoot(scale[4], [0, 4, 7]),
				degree: "V",
			},
			{
				name: `${scale[5]}`,
				notes: getChordFromRoot(scale[5], [0, 4, 7]),
				degree: "VI",
			},
			{
				name: `${scale[6]}`,
				notes: getChordFromRoot(scale[6], [0, 4, 7]),
				degree: "VII",
			},
			// Seventh chords
			{
				name: `${scale[0]}m7`,
				notes: getChordFromRoot(scale[0], [0, 3, 7, 10]),
				degree: "i",
			},
			{
				name: `${scale[1]}m7b5`,
				notes: getChordFromRoot(scale[1], [0, 3, 6, 10]),
				degree: "ii°",
			},
			{
				name: `${scale[2]}maj7`,
				notes: getChordFromRoot(scale[2], [0, 4, 7, 11]),
				degree: "III",
			},
			{
				name: `${scale[3]}m7`,
				notes: getChordFromRoot(scale[3], [0, 3, 7, 10]),
				degree: "iv",
			},
			{
				name: `${scale[4]}m7`,
				notes: getChordFromRoot(scale[4], [0, 3, 7, 10]),
				degree: "v",
			},
			{
				name: `${scale[4]}7`,
				notes: getChordFromRoot(scale[4], [0, 4, 7, 10]),
				degree: "V",
			},
			{
				name: `${scale[5]}maj7`,
				notes: getChordFromRoot(scale[5], [0, 4, 7, 11]),
				degree: "VI",
			},
			{
				name: `${scale[6]}7`,
				notes: getChordFromRoot(scale[6], [0, 4, 7, 10]),
				degree: "VII",
			},
		];
	}

	return [
		// Triads
		{
			name: `${scale[0]}`,
			notes: getChordTones(scale, 1, [0, 2, 4]),
			degree: "I",
		},
		{
			name: `${scale[1]}m`,
			notes: getChordTones(scale, 2, [0, 2, 4]),
			degree: "ii",
		},
		{
			name: `${scale[2]}m`,
			notes: getChordTones(scale, 3, [0, 2, 4]),
			degree: "iii",
		},
		{
			name: `${scale[3]}`,
			notes: getChordTones(scale, 4, [0, 2, 4]),
			degree: "IV",
		},
		{
			name: `${scale[3]}m`,
			notes: getChordFromRoot(scale[3], [0, 3, 7]),
			degree: "iv",
		},
		{
			name: `${scale[4]}`,
			notes: getChordTones(scale, 5, [0, 2, 4]),
			degree: "V",
		},
		{
			name: `${scale[5]}m`,
			notes: getChordTones(scale, 6, [0, 2, 4]),
			degree: "vi",
		},
		{
			name: `${scale[6]}dim`,
			notes: getChordTones(scale, 7, [0, 2, 4]),
			degree: "vii°",
		},
		// Seventh chords
		{
			name: `${scale[0]}maj7`,
			notes: getChordTones(scale, 1, [0, 2, 4, 6]),
			degree: "I",
		},
		{
			name: `${scale[1]}m7`,
			notes: getChordTones(scale, 2, [0, 2, 4, 6]),
			degree: "ii",
		},
		{
			name: `${scale[2]}m7`,
			notes: getChordTones(scale, 3, [0, 2, 4, 6]),
			degree: "iii",
		},
		// Diatonic sevenths in major: IV is maj7, V is dominant 7.
		{
			name: `${scale[3]}maj7`,
			notes: getChordTones(scale, 4, [0, 2, 4, 6]),
			degree: "IV",
		},
		{
			name: `${scale[4]}7`,
			notes: getChordTones(scale, 5, [0, 2, 4, 6]),
			degree: "V",
		},
		{
			name: `${scale[2]}7`,
			notes: getChordFromRoot(scale[2], [0, 4, 7, 10]),
			degree: "III7",
		},
		{
			name: `${scale[5]}7`,
			notes: getChordFromRoot(scale[5], [0, 4, 7, 10]),
			degree: "VI7",
		},
		{
			name: `${scale[5]}m7`,
			notes: getChordTones(scale, 6, [0, 2, 4, 6]),
			degree: "vi",
		},
		{
			name: `${scale[6]}dim7`,
			notes: getChordTones(scale, 7, [0, 2, 4, 6]),
			degree: "vii°",
		},
	];
};

function App() {
	const isDev = import.meta.env.DEV;
	const {
		pitch,
		clarity,
		volume,
		isRecording,
		startRecording,
		stopRecording,
		error,
	} = usePitchDetector();
	const [keyRoot, setKeyRoot] = useState("C");
	const [keyMode, setKeyMode] = useState<KeyMode>("major");

	const chords = useMemo(
		() => buildChordsForKey(keyRoot, keyMode),
		[keyRoot, keyMode],
	);

	const [sequence, setSequence] = useState<SeqEntry[]>(() =>
		generateSequence(buildChordsForKey("C", "major"), "C", "major"),
	);
	const [seqPos, setSeqPos] = useState(0);
	const idx = sequence[seqPos]?.chordIdx ?? 0;
	const [progress, setProgress] = useState(0);
	const [hasStarted, setHasStarted] = useState(false);
	const [currentBar, setCurrentBar] = useState(1);
	const [beatProgress, setBeatProgress] = useState(0);
	const pitchRef = useRef(pitch);
	const progressRef = useRef(0);
	const chordStartRef = useRef(0);
	const advanceAtRef = useRef(0); // scheduled bar-boundary timestamp for chord advance
	const readyToAdvanceRef = useRef(false); // true = waiting for Tone.js downbeat to advance
	const backingTrackActiveRef = useRef(false); // tracks whether Tone.js loop is running

	// Settings state
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [timeSignature, setTimeSignature] = useState("4/4");
	const [tempo, setTempo] = useState(120);
	const [backingTrackEnabled, setBackingTrackEnabled] = useState(true);
	const [drumsEnabled, setDrumsEnabled] = useState(true);
	const [bassEnabled, setBassEnabled] = useState(true);
	const [harmonyEnabled, setHarmonyEnabled] = useState(true);
	const [metronomeEnabled, setMetronomeEnabled] = useState(false);
	const [countInEnabled, setCountInEnabled] = useState(true);
	const [noteDetectionEnabled, setNoteDetectionEnabled] = useState(false);
	const [detectionTipsOpen, setDetectionTipsOpen] = useState(false);
	const [detectionTipsCheckbox, setDetectionTipsCheckbox] = useState(false);
	const [skipDetectionTips, setSkipDetectionTips] = useState(() => {
		try {
			const stored = localStorage.getItem("skipDetectionTips");
			return stored ? JSON.parse(stored) : false;
		} catch {
			return false;
		}
	});
	const [countIn, setCountIn] = useState<number | null>(null);
	const countInSynthRef = useRef<Tone.Player | null>(null);

	const mainBeats = useMemo(() => {
		const [num, den] = timeSignature.split("/").map(Number);
		return den === 8 && num % 3 === 0 ? num / 3 : num;
	}, [timeSignature]);

	// advanceSequence is defined here so it's available for useBackingTrack's onBarAdvance.
	const advanceSequence = useCallback(() => {
		setSeqPos((pos) => {
			const nextPos = pos + 1;
			if (nextPos >= sequence.length) return 0;
			return nextPos;
		});
		chordStartRef.current = Date.now();
		progressRef.current = 0;
		setProgress(0);
		setBeatProgress(0);
		advanceAtRef.current = 0;
		readyToAdvanceRef.current = false;
	}, [sequence.length]);

	// Keep backingTrackActiveRef in sync so the interval can branch without being in its deps
	const backingTrackActive =
		isRecording && backingTrackEnabled && countIn === null;
	useEffect(() => {
		backingTrackActiveRef.current = backingTrackActive;
	}, [backingTrackActive]);

	// Backing Track Hook
	useBackingTrack({
		tempo,
		timeSignature,
		currentChord: chords[idx],
		isPlaying: backingTrackActive,
		drumsEnabled,
		bassEnabled,
		harmonyEnabled,
		metronomeEnabled,
		readyToAdvanceRef,
		onBarAdvance: advanceSequence,
	});

	// Keep pitch ref in sync so the interval doesn't depend on pitch changes
	useEffect(() => {
		pitchRef.current = pitch;
	}, [pitch]);

	useEffect(() => {
		progressRef.current = progress;
	}, [progress]);

	const handleRandomize = useCallback(() => {
		setSequence(generateSequence(chords, keyRoot, keyMode));
		setSeqPos(0);
		progressRef.current = 0;
		advanceAtRef.current = 0;
		readyToAdvanceRef.current = false;
		setProgress(0);
	}, [chords, keyRoot, keyMode]);

	// Update progress based on detected pitch while recording
	useEffect(() => {
		if (!isRecording || countIn !== null) return;
		chordStartRef.current = Date.now();
		const [num, den] = timeSignature.split("/").map(Number);
		const barDurationMs = num * (60 / tempo) * 1000 * (4 / den);

		const mainBeats = den === 8 && num % 3 === 0 ? num / 3 : num;
		const beatDurationMs = barDurationMs / mainBeats;

		const tick = setInterval(() => {
			const now = Date.now();
			const elapsed = now - chordStartRef.current;
			const bar = Math.floor(elapsed / barDurationMs) + 1;
			setCurrentBar(bar);

			// Beat progress within the current bar (0..mainBeats)
			const elapsedInBar = elapsed % barDurationMs;
			setBeatProgress(elapsedInBar / beatDurationMs);

			// Auto-advance mode: schedule advance at each bar boundary
			if (advanceAtRef.current === 0) {
				const elapsedMs = now - chordStartRef.current;
				const currentBarNum = Math.floor(elapsedMs / barDurationMs);
				advanceAtRef.current =
					chordStartRef.current + (currentBarNum + 1) * barDurationMs;
				if (backingTrackActiveRef.current) {
					readyToAdvanceRef.current = true;
				}
			}

			// Only process pitch if note detection is enabled
			if (noteDetectionEnabled) {
				const currentPitch = pitchRef.current;
				if (!currentPitch) {
					// No signal — no change
				} else {
					const note = frequencyToNote(currentPitch); // e.g. G4
					const noteName = note.replace(/[0-9]/g, "");
					const targetNotes = chords[idx].notes;
					const matched = targetNotes.includes(noteName);
					// Only increase on correct notes; wrong notes have no effect
					const next = progressRef.current + (matched ? 0.03 : 0);
					const clamped = Math.min(1, next);

					// When threshold first hit, schedule the advance.
					if (
						clamped >= 0.6 &&
						!readyToAdvanceRef.current &&
						advanceAtRef.current === 0
					) {
						if (backingTrackActiveRef.current) {
							// Tone.js will call advanceSequence on its own next downbeat — perfectly aligned.
							readyToAdvanceRef.current = true;
						} else {
							// No Tone.js loop — fall back to wall-clock bar boundary.
							const elapsedMs = now - chordStartRef.current;
							const currentBarNum = Math.floor(elapsedMs / barDurationMs);
							advanceAtRef.current =
								chordStartRef.current + (currentBarNum + 1) * barDurationMs;
						}
					}

					progressRef.current = clamped;
					setProgress(clamped);
				}
			}

			// Wall-clock fallback advance (only active when backing track is off).
			if (advanceAtRef.current !== 0 && now >= advanceAtRef.current) {
				advanceSequence();
			}
		}, 100);

		return () => clearInterval(tick);
	}, [
		isRecording,
		idx,
		chords,
		tempo,
		timeSignature,
		countIn,
		advanceSequence,
		noteDetectionEnabled,
	]);

	const handleKeyRootChange = (nextKeyRoot: string) => {
		const nextChords = buildChordsForKey(nextKeyRoot, keyMode);
		setKeyRoot(nextKeyRoot);
		setSequence(generateSequence(nextChords, nextKeyRoot, keyMode));
		setSeqPos(0);
		progressRef.current = 0;
		advanceAtRef.current = 0;
		readyToAdvanceRef.current = false;
		setProgress(0);
	};

	const handleKeyModeChange = (nextKeyMode: KeyMode) => {
		const nextChords = buildChordsForKey(keyRoot, nextKeyMode);
		setKeyMode(nextKeyMode);
		setSequence(generateSequence(nextChords, keyRoot, nextKeyMode));
		setSeqPos(0);
		progressRef.current = 0;
		advanceAtRef.current = 0;
		readyToAdvanceRef.current = false;
		setProgress(0);
	};

	const playCountIn = useCallback(async () => {
		if (Tone.getContext().state !== "running") {
			await Tone.start();
		}
		if (!countInSynthRef.current) {
			countInSynthRef.current = new Tone.Player(
				"/sounds/woodblock.wav",
			).toDestination();
			// Wait for audio buffer to load
			await Tone.loaded();
		}
		const [num, den] = timeSignature.split("/").map(Number);
		// Count main beats, not subdivisions (e.g. 12/8 → 4 beats, 7/8 → 7 beats)
		const mainBeats = den === 8 && num % 3 === 0 ? num / 3 : num;
		// Each denominator unit duration in ms (quarter = 60/bpm, eighth = half that)
		const unitMs = (60 / tempo) * 1000 * (4 / den);
		const beatMs = (num / mainBeats) * unitMs;

		for (let i = mainBeats; i >= 1; i--) {
			setCountIn(i);
			// Restart playback from the beginning
			countInSynthRef.current?.stop();
			countInSynthRef.current?.start();
			// Always wait one beat so "1" is shown/heard before playback starts.
			await new Promise((r) => setTimeout(r, beatMs));
		}
		countInSynthRef.current?.stop();
		setCountIn(null);
	}, [tempo, timeSignature]);

	const handleStartStop = async () => {
		if (isRecording) {
			stopRecording();
		} else {
			// Mobile browsers require audio context unlock directly from user gesture.
			if (Tone.getContext().state !== "running") {
				await Tone.start();
			}
			setHasStarted(true);
			setSeqPos(0);
			progressRef.current = 0;
			advanceAtRef.current = 0;
			readyToAdvanceRef.current = false;
			setProgress(0);
			// Init mic before count-in so there's no gap when it ends
			await startRecording();
			if (countInEnabled) {
				await playCountIn();
			}
			// Start bar timing from the actual play start point (after count-in).
			chordStartRef.current = Date.now();
			progressRef.current = 0;
			advanceAtRef.current = 0;
			readyToAdvanceRef.current = false;
			setProgress(0);
		}
	};

	return (
		<div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-50">
			{/* Header */}
			<header className="px-6 py-4 border-b border-zinc-800">
				<div className="flex items-center justify-between max-w-6xl mx-auto">
					<h1 className="font-['Anton'] text-3xl font-bold tracking-wider uppercase">
						PUSHER
					</h1>
					<button
						type="button"
						onClick={() => setSettingsOpen(true)}
						className="p-2 transition-colors rounded-full text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
					>
						<HugeiconsIcon icon={Settings02Icon} size={24} />
					</button>
				</div>
			</header>

			{/* Main Game Area */}
			<main className="flex flex-col flex-1 w-full max-w-6xl px-6 mx-auto">
				<div className="flex items-center justify-center flex-1 py-10">
					<div className="relative flex items-center justify-center">
						<div className="absolute text-zinc-700">
							<ProgressRing
								beats={mainBeats}
								beatProgress={beatProgress}
								detectionProgress={progress}
								noteDetectionEnabled={noteDetectionEnabled}
								size={360}
								stroke={12}
							/>
						</div>
						{countIn !== null ? (
							<div
								key={`count-${countIn}`}
								className="relative z-10 flex flex-col items-center gap-2"
								style={{ animation: "chord-slide-in 0.2s ease-out" }}
							>
								<span className="font-['Anton'] text-9xl text-primary">
									{countIn}
								</span>
								<span className="text-sm font-medium tracking-widest uppercase text-zinc-500">
									Count In
								</span>
							</div>
						) : (
							<div
								key={`chord-${idx}`}
								className="relative z-10"
								style={{ animation: "chord-slide-in 0.3s ease-out" }}
							>
								<ChordDisplay
									chordName={chords[idx].name}
									notes={chords[idx].notes}
								/>
							</div>
						)}
					</div>
				</div>

				<section className="flex flex-col items-center gap-8 pb-10">
					<NextChordPreview
						sequence={sequence}
						seqPos={seqPos}
						chords={chords}
					/>

					<div className="flex items-center justify-center gap-4">
						<Button
							onClick={() => {
								if (skipDetectionTips) {
									setNoteDetectionEnabled(!noteDetectionEnabled);
								} else {
									setDetectionTipsOpen(true);
								}
							}}
							size="icon-lg"
							aria-label="Note detection tips"
							className={`size-12 rounded-full cursor-pointer transition-colors ${
								noteDetectionEnabled
									? "bg-secondary text-white hover:bg-secondary/70 hover:ring-2 hover:ring-secondary/40"
									: "bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
							}`}
						>
							<Ear className="size-5" />
						</Button>
						<Button
							onClick={handleStartStop}
							size="icon-lg"
							aria-label={
								hasStarted
									? isRecording
										? "Stop session"
										: "Restart session"
									: "Start session"
							}
							className="size-24 rounded-full cursor-pointer bg-primary text-white shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:bg-primary/90"
						>
							{isRecording ? (
								<Square className="size-8" />
							) : (
								<Play className="size-8" />
							)}
						</Button>
						<Button
							onClick={handleRandomize}
							disabled={isRecording}
							size="icon-lg"
							aria-label="Randomize chord sequence"
							className="transition-colors rounded-full cursor-pointer size-12 bg-zinc-800 text-zinc-500 hover:bg-zinc-700"
						>
							<Dices className="size-5" />
						</Button>
					</div>

					{isDev && isRecording && noteDetectionEnabled && (
						<div className="w-full max-w-xl pt-6 border-t border-zinc-800">
							<DetectionStats
								pitch={pitch}
								clarity={clarity}
								volume={volume}
								keyRoot={keyRoot}
								timeSignature={timeSignature}
								tempo={tempo}
								currentBar={currentBar}
								error={error}
							/>
						</div>
					)}
				</section>
			</main>

			<Dialog open={detectionTipsOpen} onOpenChange={setDetectionTipsOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Note Detection Mode</DialogTitle>
						<DialogDescription>
							Chord progression will pause unless you play over 50% of the
							correct chord tones.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 text-sm text-foreground">
						<div>
							<p className="mb-1 font-semibold">✓ Better for Arpeggio</p>
							<p className="text-muted-foreground">
								Ideal for practicing individual notes and arpeggios where
								precision is important.
							</p>
						</div>
						<div>
							<p className="mb-1 font-semibold">
								✗ Not ideal for Improvisation
							</p>
							<p className="text-muted-foreground">
								May pause progression when playing passing tones or outside
								notes during improv.
							</p>
						</div>
					</div>
					<label className="flex items-center gap-2 pt-2 text-sm font-medium cursor-pointer">
						<input
							type="checkbox"
							checked={detectionTipsCheckbox}
							onChange={(e) => setDetectionTipsCheckbox(e.target.checked)}
							className="w-4 h-4 rounded cursor-pointer border-input bg-background"
						/>
						<span className="text-muted-foreground">Don't show this again</span>
					</label>
					<DialogFooter className="gap-2">
						<Button
							variant="outline"
							onClick={() => setDetectionTipsOpen(false)}
						>
							Close
						</Button>
						<Button
							className="bg-secondary hover:bg-secondary/90"
							onClick={() => {
								setNoteDetectionEnabled(!noteDetectionEnabled);
								if (detectionTipsCheckbox) {
									localStorage.setItem(
										"skipDetectionTips",
										JSON.stringify(true),
									);
									setSkipDetectionTips(true);
								}
								setDetectionTipsOpen(false);
								setDetectionTipsCheckbox(false);
							}}
						>
							{noteDetectionEnabled ? "Disable" : "Enable"} Detection
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Settings
				open={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				keyRoot={keyRoot}
				setKeyRoot={handleKeyRootChange}
				keyMode={keyMode}
				setKeyMode={handleKeyModeChange}
				timeSignature={timeSignature}
				setTimeSignature={setTimeSignature}
				tempo={tempo}
				setTempo={setTempo}
				backingTrackEnabled={backingTrackEnabled}
				setBackingTrackEnabled={setBackingTrackEnabled}
				drumsEnabled={drumsEnabled}
				setDrumsEnabled={setDrumsEnabled}
				bassEnabled={bassEnabled}
				setBassEnabled={setBassEnabled}
				harmonyEnabled={harmonyEnabled}
				setHarmonyEnabled={setHarmonyEnabled}
				metronomeEnabled={metronomeEnabled}
				setMetronomeEnabled={setMetronomeEnabled}
				countInEnabled={countInEnabled}
				setCountInEnabled={setCountInEnabled}
			/>
		</div>
	);
}
export default App;
