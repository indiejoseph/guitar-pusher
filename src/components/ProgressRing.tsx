import { cn } from "@/lib/utils";

type Props = {
	size?: number;
	stroke?: number;
	beats: number; // number of segments (e.g. 4 for 4/4, 5 for 5/4)
	beatProgress: number; // continuous value 0..beats (e.g. 2.5 = halfway through 3rd beat)
	detectionProgress: number; // 0..1 note detection threshold progress
	noteDetectionEnabled: boolean;
	label?: string;
	className?: string;
};

const GAP_DEGREES = 6; // gap between segments in degrees

export default function ProgressRing({
	size = 320,
	stroke = 12,
	beats,
	beatProgress,
	detectionProgress,
	noteDetectionEnabled,
	label,
	className,
}: Props) {
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const cx = size / 2;
	const cy = size / 2;

	const totalGapDeg = GAP_DEGREES * beats;
	const segmentDeg = (360 - totalGapDeg) / beats;
	const segmentLen = (segmentDeg / 360) * circumference;
	const detectionMet = detectionProgress >= 0.6;
	const currentBeat = Math.floor(beatProgress);

	return (
		<div
			className={cn(
				"relative flex items-center justify-center",
				className,
			)}
		>
			<svg
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
				className="transform -rotate-90"
				aria-label="Progress ring"
			>
				{Array.from({ length: beats }, (_, k) => k).map((i) => {
					const startDeg =
						i * (segmentDeg + GAP_DEGREES) + GAP_DEGREES / 2;
					const startOffset = (startDeg / 360) * circumference;

					const isPast = i < currentBeat;
					const isCurrent = i === currentBeat;
					const fractionalFill = isCurrent
						? beatProgress - currentBeat
						: 0;
					const fillLen = isPast
						? segmentLen
						: isCurrent
							? segmentLen * fractionalFill
							: 0;

					// Color logic:
					// - Past beats: primary if no detection, green if detection met
					// - Current beat filling: primary
					// - Unfilled: dark track
					const pastColor =
						noteDetectionEnabled && detectionMet
							? "text-emerald-500"
							: "text-primary";

					return (
						<g key={`beat-${beats}-${i}`}>
							{/* Background segment track */}
							<circle
								cx={cx}
								cy={cy}
								r={radius}
								fill="none"
								stroke="currentColor"
								strokeWidth={stroke}
								strokeDasharray={`${segmentLen} ${circumference - segmentLen}`}
								strokeDashoffset={-startOffset}
								strokeLinecap="round"
								className="text-zinc-800"
							/>

							{/* Filled portion */}
							{fillLen > 0 && (
								<circle
									cx={cx}
									cy={cy}
									r={radius}
									fill="none"
									stroke="currentColor"
									strokeWidth={stroke}
									strokeDasharray={`${fillLen} ${circumference - fillLen}`}
									strokeDashoffset={-startOffset}
									strokeLinecap="round"
									className={cn(
										"transition-colors duration-200",
										isPast ? pastColor : "text-primary",
									)}
								/>
							)}
						</g>
					);
				})}

				{/* Detection progress overlay ring (thin, inside) */}
				{noteDetectionEnabled && detectionProgress > 0 && (
					<circle
						cx={cx}
						cy={cy}
						r={radius - stroke * 0.8}
						fill="none"
						stroke="currentColor"
						strokeWidth={stroke * 0.25}
						strokeLinecap="round"
						strokeDasharray={`${circumference * 0.9}`}
						strokeDashoffset={
							circumference * 0.9 * (1 - detectionProgress)
						}
						className={cn(
							"transition-all duration-200",
							detectionMet
								? "text-emerald-500"
								: "text-emerald-500/40",
						)}
					/>
				)}
			</svg>

			{/* Centered Text */}
			{label && (
				<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
					<span className="font-['Anton'] text-6xl uppercase tracking-wider text-foreground">
						{label}
					</span>
				</div>
			)}
		</div>
	);
}
