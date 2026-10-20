export function YourGpuPill({ hex }: { hex: string }) {
  return (
    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white" style={{ background: hex }}>
      Tu placa
    </span>
  )
}
