type Props = {
  chordName: string
  notes?: string[]
}

export default function ChordDisplay({ chordName, notes = [] }: Props) {
  return (
    <div className="p-4 rounded-lg bg-card text-card-foreground">
      <h3 className="text-lg font-semibold">{chordName}</h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {notes.length ? (
          notes.map((n) => (
            <span key={n} className="px-2 py-1 text-sm rounded bg-muted text-muted-foreground">
              {n}
            </span>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No notes</span>
        )}
      </div>
    </div>
  )
}
