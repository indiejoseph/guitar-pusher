type Props = {
	chordName: string;
	notes?: string[];
};

export default function ChordDisplay({ chordName, notes = [] }: Props) {
	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<div className="invisible">-</div>
			{/* Chord Name - High Visibility with Anton Font */}
			<h3 className="font-['Anton'] text-8xl font-bold tracking-wider text-foreground">
				{chordName}
			</h3>

			{/* Target Notes as Pills */}
			<div className="flex flex-wrap justify-center gap-3">
				{notes.length ? (
					notes.map((n) => (
						<span
							key={n}
							className="px-4 py-2 font-mono text-lg border rounded-full border-border bg-muted text-muted-foreground"
						>
							{n}
						</span>
					))
				) : (
					<span className="text-sm text-muted-foreground">No notes</span>
				)}
			</div>
		</div>
	);
}
