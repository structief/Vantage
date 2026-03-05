export function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="2" y="1" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M4 4h4M4 6.5h4M4 9h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
