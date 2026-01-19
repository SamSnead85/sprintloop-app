// SprintLoop Logo Component - Using SVG for transparent background
export function SprintLoopLogo({
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
            {/* Shield shape with S */}
            <path
                d="M50 5 L90 20 L90 50 Q90 80 50 95 Q10 80 10 50 L10 20 Z"
                fill="url(#sprintloop-gradient)"
                opacity="0.15"
            />
            <path
                d="M50 5 L90 20 L90 50 Q90 80 50 95 Q10 80 10 50 L10 20 Z"
                stroke="url(#sprintloop-gradient)"
                strokeWidth="2"
                fill="none"
            />
            {/* S letter */}
            <path
                d="M35 35 Q35 25 50 25 Q65 25 65 35 Q65 50 50 50 Q35 50 35 65 Q35 75 50 75 Q65 75 65 65"
                stroke="url(#sprintloop-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    )
}

// Fallback SVG logo (used when image not available)
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
            {/* Interlocking loops forming an S */}
            <path
                d="M30 35 Q30 20 50 20 Q70 20 70 35 Q70 50 50 50 Q30 50 30 65 Q30 80 50 80 Q70 80 70 65"
                stroke="url(#sprintloop-gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="30" cy="35" r="15" stroke="url(#sprintloop-gradient)" strokeWidth="6" fill="none" />
            <circle cx="70" cy="65" r="15" stroke="url(#sprintloop-gradient)" strokeWidth="6" fill="none" />
        </svg>
    )
}
