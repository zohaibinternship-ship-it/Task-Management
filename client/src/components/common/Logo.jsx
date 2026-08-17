export default function Logo({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <g stroke="#eab308" strokeLinejoin="miter">
        <path
          d="M50 4 L58 12 L88 12 L88 42 L96 50 L88 58 L88 88 L58 88 L50 96 L42 88 L12 88 L12 58 L4 50 L12 42 L12 12 L42 12 Z"
          strokeWidth="4.5"
        />
        <path
          d="M50 4 L58 12 L88 12 L88 42 L96 50 L88 58 L88 88 L58 88 L50 96 L42 88 L12 88 L12 58 L4 50 L12 42 L12 12 L42 12 Z"
          strokeWidth="2"
          transform="translate(50 50) scale(0.78) translate(-50 -50)"
        />
        <path
          d="M20 28 L28 20 L50 42 L72 20 L80 28 L58 50 L80 72 L72 80 L50 58 L28 80 L20 72 L42 50 Z"
          strokeWidth="4"
          transform="translate(50 50) scale(0.72) translate(-50 -50)"
        />
        <path d="M50 43 L57 50 L50 57 L43 50 Z" strokeWidth="2" />
      </g>
    </svg>
  );
}
