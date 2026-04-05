import { useEffect, useState } from 'react'
import { usePitchDetector } from './hooks/usePitchDetector'
import ChordDisplay from './components/ChordDisplay'
import ProgressRing from './components/ProgressRing'
import Settings from './components/Settings'
import { Button } from './components/ui/button'
import { frequencyToNote } from './utils/frequencyToNote'

function App() {
  const { pitch, clarity, isRecording, startRecording, stopRecording, error } = usePitchDetector()

  const chords = [
    { name: 'G Major', notes: ['G', 'B', 'D'] },
    { name: 'C Major', notes: ['C', 'E', 'G'] },
    { name: 'D Major', notes: ['D', 'F#', 'A'] },
  ]

  const [idx, setIdx] = useState(0)
  const [progress, setProgress] = useState(0)

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [keyRoot, setKeyRoot] = useState('C')
  const [timeSignature, setTimeSignature] = useState('4/4')
  const [tempo, setTempo] = useState(120)
  const [metronomeEnabled, setMetronomeEnabled] = useState(false)
  const [metronomeRunning, setMetronomeRunning] = useState(false)

  // Update progress based on detected pitch while recording
  useEffect(() => {
    if (!isRecording) return
    const tick = setInterval(() => {
      if (!pitch) {
        setProgress((p) => Math.max(0, p - 0.01))
        return
      }
      const note = frequencyToNote(pitch) // e.g. G4
      const noteName = note.replace(/[0-9]/g, '')
      const targetNotes = chords[idx].notes
      const matched = targetNotes.includes(noteName)
      setProgress((p) => {
        const next = p + (matched ? 0.03 : -0.01)
        return Math.max(0, Math.min(1, next))
      })
    }, 100)

    return () => clearInterval(tick)
  }, [isRecording, pitch, idx])

  useEffect(() => {
    if (progress >= 0.5) {
      setIdx((i) => (i + 1) % chords.length)
      setProgress(0)
    }
  }, [progress])

  // Metronome: simple click using Web Audio API (runs when metronomeRunning is true)
  useEffect(() => {
    if (!metronomeRunning) return
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    let beat = 0
    const beatsPerBar = parseInt(timeSignature.split('/')[0]) || 4
    const intervalMs = 60000 / Math.max(1, tempo)

    let id: ReturnType<typeof setInterval> | null = null

    const start = () => {
      id = setInterval(() => {
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        const isDownbeat = beat % beatsPerBar === 0
        osc.type = 'sine'
        osc.frequency.value = isDownbeat ? 1000 : 800
        gain.gain.setValueAtTime(0.0001, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.001)
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.09)
        beat++
      }, intervalMs)
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(start).catch(start)
    } else {
      start()
    }

    return () => {
      if (id) clearInterval(id)
      audioCtx.close()
    }
  }, [metronomeRunning, tempo, timeSignature])

  // Keep metronomeRunning in sync with metronomeEnabled while recording
  useEffect(() => {
    if (isRecording) {
      setMetronomeRunning(metronomeEnabled)
    }
  }, [metronomeEnabled, isRecording])

  const handleStartStop = () => {
    if (isRecording) {
      stopRecording()
      setMetronomeRunning(false)
    } else {
      startRecording()
      setMetronomeRunning(metronomeEnabled)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">AI Guitar Trainer</h1>
          <div className="flex items-center gap-3">
            <Button onClick={handleStartStop}>
              {isRecording ? 'Stop' : 'Start'}
            </Button>
            <Button onClick={() => setSettingsOpen(true)} variant="secondary">
              Settings
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <ChordDisplay chordName={chords[idx].name} notes={chords[idx].notes} />

            <div className="px-4 py-2 rounded bg-card text-card-foreground">
              <div>Pitch: {pitch ? `${Math.round(pitch)} Hz` : '—'}</div>
              <div>Note: {pitch ? frequencyToNote(pitch) : '—'}</div>
              <div>Clarity: {Math.round(clarity * 100)}%</div>
              <div className="mt-1 text-sm">Key: {keyRoot} • {timeSignature} • {tempo} BPM</div>
              {error && <div className="text-destructive">{error}</div>}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <ProgressRing value={progress} size={160} stroke={14} />
            <div className="mt-4 text-sm text-muted-foreground">Progress to next chord</div>
          </div>
        </div>

        <Settings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          keyRoot={keyRoot}
          setKeyRoot={setKeyRoot}
          timeSignature={timeSignature}
          setTimeSignature={setTimeSignature}
          tempo={tempo}
          setTempo={setTempo}
          metronomeEnabled={metronomeEnabled}
          setMetronomeEnabled={setMetronomeEnabled}
        />
      </div>
    </div>
  )
}

export default App
