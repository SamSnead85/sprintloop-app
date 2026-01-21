import { Download, Terminal, Shield, Bot, Code2, ArrowRight, Apple, MonitorDot } from 'lucide-react';
import { useMemo } from 'react';

// Platform detection
function usePlatform() {
    return useMemo(() => {
        const platform = navigator.platform.toLowerCase();
        const userAgent = navigator.userAgent.toLowerCase();

        if (platform.includes('mac') || userAgent.includes('mac')) {
            return { os: 'macOS', icon: Apple, downloadUrl: '/releases/SprintLoop-latest.dmg' };
        } else if (platform.includes('win') || userAgent.includes('win')) {
            return { os: 'Windows', icon: MonitorDot, downloadUrl: '/releases/SprintLoop-Setup-latest.exe' };
        } else {
            return { os: 'Linux', icon: Terminal, downloadUrl: '/releases/SprintLoop-latest.AppImage' };
        }
    }, []);
}

// Feature data
const features = [
    { icon: Code2, label: 'AI Code Gen' },
    { icon: Bot, label: 'Agent Fleet' },
    { icon: Terminal, label: 'Terminal' },
    { icon: Shield, label: 'SOC 2 Ready' },
];

// Particle component
function Particles() {
    const particles = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 60}%`,
            delay: `${Math.random() * 6}s`,
            size: 2 + Math.random() * 4,
        })), []
    );

    return (
        <>
            {particles.map(p => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        left: p.left,
                        top: p.top,
                        animationDelay: p.delay,
                        width: p.size,
                        height: p.size,
                    }}
                />
            ))}
        </>
    );
}

// Navigation
function Navigation() {
    const platform = usePlatform();

    return (
        <nav className="nav">
            <a href="/" className="nav-logo">
                <div className="nav-logo-icon" />
                SprintLoop
            </a>
            <div className="nav-links">
                <a href="#features" className="nav-link">Features</a>
                <a href="https://app.sprintloop.ai" className="nav-link">Web App</a>
                <a href="https://docs.sprintloop.ai" className="nav-link">Docs</a>
                <a href="https://github.com/SamSnead85/sprintloop-app" className="nav-link">GitHub</a>
                <a href={platform.downloadUrl} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    <Download size={16} />
                    Download
                </a>
            </div>
        </nav>
    );
}

// Hero Section
function Hero() {
    const platform = usePlatform();
    const PlatformIcon = platform.icon;

    return (
        <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
            <div className="hero-bg" />
            <Particles />

            <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
                {/* Floating Logo */}
                <div style={{
                    width: 80,
                    height: 80,
                    margin: '0 auto 2rem',
                    background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                    borderRadius: 20,
                    boxShadow: '0 20px 40px rgba(124, 92, 255, 0.3)',
                    animation: 'float 4s ease-in-out infinite'
                }} />

                <h1 className="headline">
                    Experience liftoff with the<br />
                    <span style={{ background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        AI-native workspace
                    </span>
                </h1>

                <p className="subheadline mt-8">
                    SprintLoop combines a premium code editor, autonomous agents, and seamless automation—all in one unified interface. Build the new way.
                </p>

                {/* CTA Buttons */}
                <div className="flex items-center justify-center gap-4 mt-12">
                    <a href="https://app.sprintloop.ai" className="btn btn-primary">
                        <ArrowRight size={20} />
                        Launch Web App
                    </a>
                    <a href={platform.downloadUrl} className="btn btn-secondary">
                        <PlatformIcon size={20} />
                        Download for {platform.os}
                    </a>
                </div>

                <p className="mt-4" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Free to use • Desktop v0.1.0 • Web app always up-to-date
                </p>

                {/* Feature Grid */}
                <div className="feature-grid mt-16">
                    {features.map((feature) => (
                        <div key={feature.label} className="feature-item">
                            <div className="feature-icon">
                                <feature.icon size={24} />
                            </div>
                            <span className="feature-label">{feature.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// IDE Preview Section
function IDEPreview() {
    return (
        <section id="features" className="container" style={{ paddingTop: '4rem', paddingBottom: '6rem' }}>
            <h2 className="headline text-center mb-8" style={{ fontSize: '2rem' }}>
                The agent-first IDE
            </h2>
            <p className="subheadline text-center mb-8">
                Built for developers who want AI that works with them, not against them.
            </p>

            <div className="ide-preview">
                <div className="ide-titlebar">
                    <div className="ide-dot ide-dot-red" />
                    <div className="ide-dot ide-dot-yellow" />
                    <div className="ide-dot ide-dot-green" />
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>SprintLoop</span>
                </div>
                <div className="ide-content">
                    <div><span className="ide-comment">// SprintLoop Agent Fleet — ready for action</span></div>
                    <div>&nbsp;</div>
                    <div>
                        <span className="ide-keyword">const</span> fleet = <span className="ide-function">createAgentFleet</span>({'{'}
                    </div>
                    <div style={{ paddingLeft: '1.5rem' }}>
                        communications: <span className="ide-string">'Claude 4.5'</span>,
                    </div>
                    <div style={{ paddingLeft: '1.5rem' }}>
                        research: <span className="ide-string">'Gemini 2.5 Pro'</span>,
                    </div>
                    <div style={{ paddingLeft: '1.5rem' }}>
                        development: <span className="ide-string">'GPT-5'</span>,
                    </div>
                    <div style={{ paddingLeft: '1.5rem' }}>
                        browser: <span className="ide-string">'Playwright Agent'</span>,
                    </div>
                    <div>{'}'});</div>
                    <div>&nbsp;</div>
                    <div>
                        <span className="ide-keyword">await</span> fleet.<span className="ide-function">execute</span>(<span className="ide-string">"Build and deploy the feature"</span>);
                    </div>
                </div>
            </div>
        </section>
    );
}

// Footer
function Footer() {
    return (
        <footer className="footer">
            <p>© 2026 SprintLoop. All rights reserved.</p>
            <div className="flex items-center justify-center gap-4 mt-4">
                <a href="/privacy" className="nav-link">Privacy</a>
                <a href="/terms" className="nav-link">Terms</a>
                <a href="https://app.sprintloop.ai" className="nav-link">Web App</a>
                <a href="https://github.com/SamSnead85/sprintloop-app" className="nav-link">GitHub</a>
            </div>
        </footer>
    );
}

// Main App
export default function App() {
    return (
        <>
            <Navigation />
            <main>
                <Hero />
                <IDEPreview />
            </main>
            <Footer />
        </>
    );
}
