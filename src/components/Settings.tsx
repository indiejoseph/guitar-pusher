import { HeadphonesIcon, Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from "./ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";

type Props = {
	open: boolean;
	onClose: () => void;
	keyRoot: string;
	setKeyRoot: (k: string) => void;
	keyMode: "major" | "minor";
	setKeyMode: (m: "major" | "minor") => void;
	timeSignature: string;
	setTimeSignature: (t: string) => void;
	tempo: number;
	setTempo: (n: number) => void;
	backingTrackEnabled: boolean;
	setBackingTrackEnabled: (b: boolean) => void;
	drumsEnabled: boolean;
	setDrumsEnabled: (b: boolean) => void;
	bassEnabled: boolean;
	setBassEnabled: (b: boolean) => void;
	harmonyEnabled: boolean;
	setHarmonyEnabled: (b: boolean) => void;
	metronomeEnabled: boolean;
	setMetronomeEnabled: (b: boolean) => void;
	countInEnabled: boolean;
	setCountInEnabled: (b: boolean) => void;

};

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KEY_MODES: Array<{ label: string; value: "major" | "minor" }> = [
	{ label: "Major", value: "major" },
	{ label: "Minor", value: "minor" },
];
const TIME_SIGNATURES = ["4/4", "3/4", "5/4", "12/8"];

export default function Settings({
	open,
	onClose,
	keyRoot,
	setKeyRoot,
	keyMode,
	setKeyMode,
	timeSignature,
	setTimeSignature,
	tempo,
	setTempo,
	backingTrackEnabled,
	setBackingTrackEnabled,
	drumsEnabled,
	setDrumsEnabled,
	bassEnabled,
	setBassEnabled,
	harmonyEnabled,
	setHarmonyEnabled,
	metronomeEnabled,
	setMetronomeEnabled,
	countInEnabled,
	setCountInEnabled,

}: Props) {
	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				if (!v) onClose();
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader className="shrink-0">
					<DialogTitle className="flex items-center gap-2">
						<HugeiconsIcon icon={Settings02Icon} size={20} strokeWidth={2} />
						Session Settings
					</DialogTitle>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto -mx-6 px-6">
					<FieldGroup className="mt-4">
						<div className="grid grid-cols-3 gap-4">
							<Field>
								<FieldLabel>Root Key</FieldLabel>
								<Select
									value={keyRoot}
									onValueChange={(val) => val && setKeyRoot(val)}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select key" />
									</SelectTrigger>
									<SelectContent>
										{KEYS.map((k) => (
											<SelectItem key={k} value={k}>
												{k}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>

							<Field>
								<FieldLabel>Mode</FieldLabel>
								<Select
									value={keyMode}
									onValueChange={(val) => {
										if (val === "major" || val === "minor") {
											setKeyMode(val);
										}
									}}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select mode" />
									</SelectTrigger>
									<SelectContent>
										{KEY_MODES.map((m) => (
											<SelectItem key={m.value} value={m.value}>
												{m.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>

							<Field>
								<FieldLabel>Time Signature</FieldLabel>
								<Select
									value={timeSignature}
									onValueChange={(val) => val && setTimeSignature(val)}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select time" />
									</SelectTrigger>
									<SelectContent>
										{TIME_SIGNATURES.map((t) => (
											<SelectItem key={t} value={t}>
												{t}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						</div>

						<Field>
							<div className="flex flex-row items-center justify-between">
								<FieldLabel>Tempo (BPM)</FieldLabel>
								<span className="text-sm font-bold tabular-nums">{tempo}</span>
							</div>
							<Slider
								value={[tempo]}
								onValueChange={(vals) => {
									if (Array.isArray(vals)) {
										setTempo(vals[0]);
									}
								}}
								min={40}
								max={240}
								step={1}
							/>
						</Field>

						<Field
							orientation="horizontal"
							className="items-center justify-between"
						>
							<FieldContent>
								<FieldLabel>Metronome</FieldLabel>
								<FieldDescription>Click on every beat</FieldDescription>
							</FieldContent>
							<Switch
								checked={metronomeEnabled}
								onCheckedChange={setMetronomeEnabled}
							/>
						</Field>

						<Field
							orientation="horizontal"
							className="items-center justify-between"
						>
							<FieldContent>
								<FieldLabel>Count-In</FieldLabel>
								<FieldDescription>
									Click one bar before starting
								</FieldDescription>
							</FieldContent>
							<Switch
								checked={countInEnabled}
								onCheckedChange={setCountInEnabled}
							/>
						</Field>


						<Field
							orientation="horizontal"
							className="items-center justify-between"
						>
							<FieldContent>
								<FieldLabel>Backing Track</FieldLabel>
								<FieldDescription>Drums, bass, and harmony</FieldDescription>
							</FieldContent>
							<Switch
								checked={backingTrackEnabled}
								onCheckedChange={setBackingTrackEnabled}
							/>
						</Field>

						<Field
							orientation="horizontal"
							className="items-center justify-between"
						>
							<FieldContent>
								<FieldLabel>Drums</FieldLabel>
								<FieldDescription>Kick, snare, and hi-hat</FieldDescription>
							</FieldContent>
							<Switch
								checked={drumsEnabled}
								onCheckedChange={setDrumsEnabled}
								disabled={!backingTrackEnabled}
							/>
						</Field>

						<Field
							orientation="horizontal"
							className="items-center justify-between"
						>
							<FieldContent>
								<FieldLabel>Bass</FieldLabel>
								<FieldDescription>Root note groove</FieldDescription>
							</FieldContent>
							<Switch
								checked={bassEnabled}
								onCheckedChange={setBassEnabled}
								disabled={!backingTrackEnabled}
							/>
						</Field>

						<Field
							orientation="horizontal"
							className="items-center justify-between"
						>
							<FieldContent>
								<FieldLabel>Harmony</FieldLabel>
								<FieldDescription>Chord pad layer</FieldDescription>
							</FieldContent>
							<Switch
								checked={harmonyEnabled}
								onCheckedChange={setHarmonyEnabled}
								disabled={!backingTrackEnabled}
							/>
						</Field>

						{backingTrackEnabled && (
							<Alert className="bg-amber-50 border-amber-200/50 text-amber-600">
								<HugeiconsIcon
									icon={HeadphonesIcon}
									className="size-4 text-amber-600"
								/>
								<AlertTitle className="text-amber-800">
									Headphones Recommended
								</AlertTitle>
								<AlertDescription className="text-amber-700/80">
									Using headphones prevents the backing track from interfering
									with pitch detection.
								</AlertDescription>
							</Alert>
						)}
					</FieldGroup>
				</div>

				<DialogFooter className="shrink-0">
					<Button onClick={onClose} className="w-full sm:w-auto">
						Done
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
