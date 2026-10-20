export function BrandLogo({
  src,
  alt,
  className = 'h-8 w-16',
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-white/95 px-1.5 py-1 ${className}`}>
      <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
    </span>
  )
}
