// SprintLoop Logo Component - Uses the actual app icon
export function SprintLoopLogo({
    size = 32,
    className = ''
}: {
    size?: number
    className?: string
}) {
    return (
        <div
            className={className}
            style={{
                width: size,
                height: size,
                borderRadius: size * 0.22,
                overflow: 'hidden',
                flexShrink: 0
            }}
        >
            <img
                src="./sprintloop-logo.png"
                alt="SprintLoop"
                width={size}
                height={size}
                style={{
                    objectFit: 'cover',
                    display: 'block'
                }}
            />
        </div>
    )
}

// SVG fallback logo (used when image not available or for special cases)
export function SprintLoopLogoSVG({
    size = 32,
    className = ''
}: {
    size?: number
    className?: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            className={className}
        >
            <defs>
                <linearGradient id="sprintloop-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
            </defs>
            {/* Shield with S */}
            <path
                d="M50 5 L90 20 L90 50 Q90 80 50 95 Q10 80 10 50 L10 20 Z"
                fill="url(#sprintloop-gradient)"
                opacity="0.2"
            />
            <path
                d="M50 5 L90 20 L90 50 Q90 80 50 95 Q10 80 10 50 L10 20 Z"
                stroke="url(#sprintloop-gradient)"
                strokeWidth="3"
                fill="none"
            />
            <path
                d="M35 35 Q35 25 50 25 Q65 25 65 35 Q65 50 50 50 Q35 50 35 65 Q35 75 50 75 Q65 75 65 65"
                stroke="url(#sprintloop-gradient)"
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    )
}

