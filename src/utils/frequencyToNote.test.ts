import { describe, it, expect } from "vitest";
import { frequencyToNote, getCentsFromPitch } from "./frequencyToNote";

describe("frequencyToNote", () => {
	it("should convert A4 (440 Hz) to A4", () => {
		const note = frequencyToNote(440);
		expect(note).toBe("A4");
	});

	it("should convert C4 (261.63 Hz) to C4", () => {
		const note = frequencyToNote(261.63);
		expect(note).toBe("C4");
	});

	it("should convert E2 (82.41 Hz) to E2", () => {
		const note = frequencyToNote(82.41);
		expect(note).toBe("E2");
	});

	it("should convert A2 (110 Hz) to A2", () => {
		const note = frequencyToNote(110);
		expect(note).toBe("A2");
	});

	it("should convert high C5 (523.25 Hz) to C5", () => {
		const note = frequencyToNote(523.25);
		expect(note).toBe("C5");
	});

	it("should convert low C1 (32.70 Hz) to C1", () => {
		const note = frequencyToNote(32.70);
		expect(note).toBe("C1");
	});

	it("should handle frequencies between semitones (rounds to nearest)", () => {
		// Frequency between C4 and C#4
		const note = frequencyToNote(270);
		expect(note).toMatch(/C#?4/);
	});
});

describe("getCentsFromPitch", () => {
	it("should return 0 cents for same frequency", () => {
		const cents = getCentsFromPitch(440, 440);
		expect(cents).toBeCloseTo(0, 1);
	});

	it("should return ~100 cents for one semitone up", () => {
		// Semitone ratio is 2^(1/12) ≈ 1.059463
		const cents = getCentsFromPitch(440 * Math.pow(2, 1 / 12), 440);
		expect(cents).toBeCloseTo(100, 1);
	});

	it("should return ~-100 cents for one semitone down", () => {
		const cents = getCentsFromPitch(440 / Math.pow(2, 1 / 12), 440);
		expect(cents).toBeCloseTo(-100, 1);
	});

	it("should return ~1200 cents for one octave up", () => {
		const cents = getCentsFromPitch(880, 440);
		expect(cents).toBeCloseTo(1200, 1);
	});

	it("should return ~1200 cents for one octave down", () => {
		const cents = getCentsFromPitch(220, 440);
		expect(cents).toBeCloseTo(-1200, 1);
	});

	it("should handle cent calculation for guitar note range", () => {
		// Standard guitar low E (82.41 Hz) vs A4 (440 Hz)
		const cents = getCentsFromPitch(82.41, 440);
		expect(cents).toBeLessThan(0);
		// Should be roughly 29 semitones lower (~2900 cents)
		expect(Math.abs(cents)).toBeCloseTo(2900, -1);
	});
});
