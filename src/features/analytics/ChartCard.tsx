import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  /** Plain-language summary of the chart's data for screen readers. */
  summary: string
  children: ReactNode
}

export default function ChartCard({ title, subtitle, summary, children }: Props) {
  return (
    <figure className="rounded-lg border border-line bg-surface p-4">
      <figcaption className="mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </figcaption>
      <div role="img" aria-label={`${title}. ${summary}`} className="text-muted">
        {children}
      </div>
    </figure>
  )
}
