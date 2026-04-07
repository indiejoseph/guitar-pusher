import { frequencyToNote } from "../utils/frequencyToNote";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface DetectionStatsProps {
	pitch: number | null;
	clarity: number;
	volume?: number;
	keyRoot: string;
	timeSignature: string;
	tempo: number;
	currentBar?: number;
	error?: string | null;
}

export function DetectionStats({
	pitch,
	clarity,
	volume,
	keyRoot,
	timeSignature,
	tempo,
	currentBar,
	error,
}: DetectionStatsProps) {
	return (
		<Card>
			<CardContent className="p-4 space-y-2">
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex flex-col">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Pitch
						</span>
						<span className="text-lg font-mono">
							{pitch ? `${Math.round(pitch)} Hz` : "—"}
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Note
						</span>
						<span className="text-lg font-mono">
							{pitch ? frequencyToNote(pitch) : "—"}
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Clarity
						</span>
						<span className="text-lg font-mono">
							{Math.round(clarity * 100)}%
						</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Bar
						</span>
						<span className="text-lg font-mono">{currentBar ?? 1}</span>
					</div>
					<div className="flex flex-col">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
							Vol
						</span>
						<span
							className={`text-lg font-mono ${
								volume !== undefined && volume >= -40
									? "text-green-400"
									: "text-zinc-500"
							}`}
						>
							{volume !== undefined && Number.isFinite(volume)
								? `${Math.round(volume)} dB`
								: "—"}
						</span>
					</div>
					<div className="ml-auto flex items-center gap-2">
						<Badge variant="outline" className="font-normal capitalize">
							{keyRoot}
						</Badge>
						<Badge variant="outline" className="font-normal">
							{timeSignature}
						</Badge>
						<Badge variant="outline" className="font-normal">
							{tempo} BPM
						</Badge>
					</div>
				</div>
				{error && (
					<div className="pt-2 mt-2 border-t text-sm text-destructive font-medium animate-in fade-in slide-in-from-top-1">
						{error}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
