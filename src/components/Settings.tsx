import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'

type Props = {
  open: boolean
  onClose: () => void
  keyRoot: string
  setKeyRoot: (k: string) => void
  timeSignature: string
  setTimeSignature: (t: string) => void
  tempo: number
  setTempo: (n: number) => void
  metronomeEnabled: boolean
  setMetronomeEnabled: (b: boolean) => void
}

const KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const TIME_SIGNATURES = ['4/4','3/4','6/8','5/4','7/8','16/8']

export default function Settings({
  open,
  onClose,
  keyRoot,
  setKeyRoot,
  timeSignature,
  setTimeSignature,
  tempo,
  setTempo,
  metronomeEnabled,
  setMetronomeEnabled,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Key</label>
            <select
              value={keyRoot}
              onChange={(e) => setKeyRoot(e.target.value)}
              className="block w-full px-3 py-2 mt-1 rounded border-input bg-background"
            >
              {KEYS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Time signature</label>
            <select
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
              className="block w-full px-3 py-2 mt-1 rounded border-input bg-background"
            >
              {TIME_SIGNATURES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Tempo (BPM)</label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min={50}
                max={220}
                value={tempo}
                onChange={(e) => setTempo(Number(e.target.value))}
                className="flex-1"
              />
              <div className="w-16 text-right">{tempo}</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Metronome</div>
              <div className="text-sm text-muted-foreground">Play a click at the selected tempo</div>
            </div>
            <label className="inline-flex items-center">
              <input type="checkbox" checked={metronomeEnabled} onChange={(e) => setMetronomeEnabled(e.target.checked)} className="mr-2" />
              <span>{metronomeEnabled ? 'On' : 'Off'}</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="default">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
