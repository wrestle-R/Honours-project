export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a
      className={`brand ${footer ? "brand-footer" : ""}`}
      href="/"
      aria-label="Lucent home"
    >
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path
          d="M16 3v26M4.7 9.5l22.6 13M4.7 22.5l22.6-13"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
      <span>LUCENT</span>
    </a>
  );
}
