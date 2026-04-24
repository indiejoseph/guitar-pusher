import { PitchDetector } from "pitchy";
import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";

export const usePitchDetector = () => {
	const [pitch, setPitch] = useState<number | null>(null);
	const [clarity, setClarity] = useState<number>(0);
	const [volume, setVolume] = useState<number>(-Infinity);
	const [isRecording, setIsRecording] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analyserRef = useRef<AnalyserNode | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
	const streamRef = useRef<MediaStream | null>(null);

	const startRecording = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false,
				},
			});

			// Reuse Tone's AudioContext — creating a second AudioContext on mobile
			// suspends the first one (Tone's), which silences all backing track output.
			const audioContext = Tone.getContext().rawContext as AudioContext;
			if (audioContext.state !== "running") {
				await audioContext.resume();
			}

			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 2048;

			// High-pass filter to remove low-end rumble that interferes with pitch detection.
			const filter = audioContext.createBiquadFilter();
			filter.type = "highpass";
			filter.frequency.value = 80; // Guitar's low E is ~82Hz

			const source = audioContext.createMediaStreamSource(stream);

			// Connect: Source -> Filter -> Analyser (not to destination — mic stays silent)
			source.connect(filter);
			filter.connect(analyser);

			sourceRef.current = source;
			streamRef.current = stream;
			analyserRef.current = analyser;

			const detector = PitchDetector.forFloat32Array(analyser.fftSize);
			const input = new Float32Array(detector.inputLength);

			const updatePitch = () => {
				if (!analyser) return;
				analyser.getFloatTimeDomainData(input);

				// Compute RMS volume and gate — only detect pitch above -40 dBFS
				let sumSquares = 0;
				for (let i = 0; i < input.length; i++)
					sumSquares += input[i] * input[i];
				const rms = Math.sqrt(sumSquares / input.length);
				const dBFS = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
				setVolume(dBFS);

				if (dBFS < -40) {
					setPitch(null);
					setClarity(0);
					animationFrameRef.current = requestAnimationFrame(updatePitch);
					return;
				}

				const [detectedPitch, detectedClarity] = detector.findPitch(
					input,
					audioContext.sampleRate,
				);

				setPitch(detectedPitch || null);
				setClarity(detectedClarity ?? 0);
				animationFrameRef.current = requestAnimationFrame(updatePitch);
			};

			updatePitch();
			setIsRecording(true);
			setError(null);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not access microphone",
			);
			setIsRecording(false);
		}
	}, []);

	const stopRecording = useCallback(() => {
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}
		// Disconnect mic from the shared Tone context (do NOT close it)
		sourceRef.current?.disconnect();
		sourceRef.current = null;
		// Stop all mic tracks so the browser indicator light turns off
		for (const t of streamRef.current?.getTracks() ?? []) t.stop();
		streamRef.current = null;
		analyserRef.current = null;
		setIsRecording(false);
		setPitch(null);
		setClarity(0);
		setVolume(-Infinity);
	}, []);

	useEffect(() => {
		return () => stopRecording();
	}, [stopRecording]);

	return {
		pitch,
		clarity,
		volume,
		isRecording,
		startRecording,
		stopRecording,
		error,
	};
};
