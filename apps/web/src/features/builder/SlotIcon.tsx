import type { BuilderStep } from '../../store'

export function SlotIcon({ step, className }: { step: BuilderStep; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      {step === 'cpu' && (
        <>
          <rect x="14" y="14" width="20" height="20" rx="2" />
          <path d="M18 8v6M24 8v6M30 8v6M18 34v6M24 34v6M30 34v6M8 18h6M8 24h6M8 30h6M34 18h6M34 24h6M34 30h6" />
        </>
      )}
      {step === 'motherboard' && (
        <>
          <rect x="8" y="8" width="32" height="32" rx="2" />
          <rect x="14" y="14" width="10" height="10" />
          <path d="M28 16h8M28 20h8M14 30h20M14 34h12" />
        </>
      )}
      {step === 'cooler' && (
        <>
          <rect x="16" y="8" width="16" height="28" rx="2" />
          <circle cx="24" cy="20" r="5" />
          <path d="M12 38h24" />
        </>
      )}
      {step === 'ram' && (
        <>
          <rect x="8" y="14" width="6" height="20" rx="1" />
          <rect x="16" y="14" width="6" height="20" rx="1" />
          <rect x="24" y="14" width="6" height="20" rx="1" />
          <rect x="32" y="14" width="6" height="20" rx="1" />
        </>
      )}
      {step === 'gpu' && (
        <>
          <rect x="6" y="16" width="36" height="16" rx="2" />
          <circle cx="16" cy="24" r="4" />
          <circle cx="30" cy="24" r="4" />
          <path d="M6 20H4M6 28H4" />
        </>
      )}
      {step === 'storage' && (
        <>
          <rect x="10" y="12" width="28" height="24" rx="2" />
          <circle cx="24" cy="24" r="6" />
          <circle cx="24" cy="24" r="1.5" fill="currentColor" />
        </>
      )}
      {step === 'psu' && (
        <>
          <rect x="8" y="12" width="32" height="24" rx="2" />
          <circle cx="20" cy="24" r="5" />
          <path d="M30 20h6M30 24h6M30 28h4" />
        </>
      )}
      {step === 'case' && (
        <>
          <rect x="14" y="6" width="20" height="36" rx="2" />
          <circle cx="24" cy="16" r="3" />
          <path d="M20 28h8M20 33h8" />
        </>
      )}
      {step === 'monitor' && (
        <>
          <rect x="6" y="8" width="36" height="24" rx="2" />
          <path d="M24 32v6M16 38h16" />
        </>
      )}
      {step === 'peripheral' && (
        <>
          <rect x="6" y="28" width="22" height="10" rx="2" />
          <path d="M10 32h4M16 32h4M22 32h2M10 35h14" />
          <rect x="32" y="12" width="10" height="16" rx="5" />
        </>
      )}
    </svg>
  )
}
