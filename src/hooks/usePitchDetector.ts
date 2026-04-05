import { useState, useEffect, useCallback, useRef } from 'react';
import { PitchDetector } from 'pitchy';

export const usePitchDetector = (sampleRate: number = 44100) => {
  const [pitch, setPitch] = useState<number | null>(null);
  const [clarity, setClarity] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate,
        sampleRatenst analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const detector = PitchDetector.forFloat32Array(analyser.fftSize);
      const input = new Float32Array(detector.inputLength);

      const updatePitch = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(input);
        const [detectedPitch, detectedClarity] = detector.findPitch(input, audioContext.sampleRate);

        setPitch(detectedPitch);
        setClarity(detectedClarity);
        animationFrameRef.current = requestAnimationFrame(updatePitch);
      };

      updatePitch();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not access microphone');
      setIsRecording(false);
    }
  }, [sampleRate]);

  const stopRecording = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
    setPitch(null);
    setClarity(0);
  }, []);

  useEffect(() => {
    return () => stopRecording();
  }, [stopRecording]);

  return { pitch, clarity, isRecording, startRecording, stopRecording, error };
};
