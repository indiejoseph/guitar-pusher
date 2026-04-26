// Chord generation and manipulation utilities

export type KeyMode = "major" | "minor";

export type ChordDef = {
	name: string;
	notes: string[];
	degree: string;
};

export type SeqEntry = { id: string; chordIdx: number };

export const NOTE_NAMES = [
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

export const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_SCALE_STEPS = [0, 2, 3, 5, 7, 8, 10];

// Harmony rules: which degrees can follow which
export const HARMONY_RULES: Record<string, string[]> = {
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

let seqCounter = 0;

export const getNoteAtSemitone = (root: string, semitoneOffset: number) => {
	const rootIndex = NOTE_NAMES.indexOf(root);
	if (rootIndex < 0) return root;
	return NOTE_NAMES[(rootIndex + semitoneOffset + 12) % 12];
};

export const getChordTones = (
	scale: string[],
	degree: number,
	intervals: number[],
) => {
	const degreeIndex = degree - 1;
	return intervals.map(
		(interval) => scale[(degreeIndex + interval) % scale.length],
	);
};

export const getChordFromRoot = (root: string, semitoneIntervals: number[]) =>
	semitoneIntervals.map((offset) => getNoteAtSemitone(root, offset));

export const buildChordsForKey = (
	keyRoot: string,
	keyMode: KeyMode,
): ChordDef[] => {
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

export const generateSequence = (
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
