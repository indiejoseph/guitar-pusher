type Props = {
  size?: number
  stroke?: number
  value: number // 0..1
  className?: string
}

export default function ProgressRing({ size = 120, stroke = 10, value, className }: Props) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.max(0, Math.min(1, value)))

  return (
    <svg width={size} height={size} className={className}>
      <g transform={`translate(${size / 2}, ${size / 2})`}>
        <circle
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
          strokeOpacity={0.12}
        />
        <circle
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          transform="rotate(-90)"
        />
      </g>
    </svg>
  )
}
