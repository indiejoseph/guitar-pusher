export const frequencyToNote = (frequency: number): string => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const halfStepsAboveC0 = Math.round(12 * Math.log2(frequency / 16.35));
  const octave = Math.floor(halfStepsAboveC0 / 12);
  const noteIndex = ((halfStepsAboveC0 % 12) + 12) % 12;
  return `${notes[noteIndex]}${octave}`;
};

export const getCentsFromPitch = (frequency: number, targetFrequency: number): number => {
  return 1200 * Math.log2(frequency / targetFrequency);
};
