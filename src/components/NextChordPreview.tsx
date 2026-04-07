type ChordPreview = {
	name: string;
};

type SequenceEntry = {
	id: string;
	chordIdx: number;
};

type Props = {
	sequence: SequenceEntry[];
	seqPos: number;
	chords: ChordPreview[];
};

export default function NextChordPreview({ sequence, seqPos, chords }: Props) {
	return (
		<div
			key={`seq-${sequence.map((e) => e.id).join("-")}`}
			className="flex items-center gap-2 overflow-hidden"
			style={{ animation: "chord-slide-in 0.3s ease-out" }}
		>
			{sequence.map((entry, i) => {
				const isCurrent = i === seqPos;
				const isPast = i < seqPos;
				return (
					<div
						key={entry.id}
						className={`flex border flex-col items-center justify-center px-4 py-2 text-center h-14 rounded-2xl transition-all duration-300 ${
							isCurrent
								? "w-18 border-primary bg-primary/25"
								: isPast
									? "w-18 bg-zinc-900/50 opacity-40"
									: "w-18 bg-zinc-900"
						}`}
					>
						<span
							className={`font-['Inter'] text-[9px] font-bold tracking-[0.15em] ${
								isCurrent ? "text-white/70" : "text-zinc-500"
							}`}
						>
							{isCurrent ? "NOW" : isPast ? "DONE" : `${i + 1}`}
						</span>
						<span
							className={`font-['Anton'] ${
								isCurrent
									? "text-white"
									: isPast
										? "text-zinc-600"
										: "text-zinc-300"
							}`}
						>
							{chords[entry.chordIdx]?.name}
						</span>
					</div>
				);
			})}
		</div>
	);
}
