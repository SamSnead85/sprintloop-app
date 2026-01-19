/**
 * Auth Screen Component
 * Beautiful sign-in/sign-up UI with OAuth and magic link support
 */
import { useState } from 'react';
import {
    Mail,
    Lock,
    User,
    Github,
    Loader2,
    ArrowRight,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { SprintLoopLogo } from './SprintLoopLogo';
import { useAuthStore } from '../stores/auth-store';

type AuthMode = 'signin' | 'signup' | 'magic-link' | 'magic-link-sent';

export function AuthScreen() {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const { signIn, signUp, signInWithProvider, signInWithMagicLink, isLoading, error, clearError } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mode === 'magic-link') {
            const success = await signInWithMagicLink(email);
            if (success) setMode('magic-link-sent');
            return;
        }

        if (mode === 'signin') {
            await signIn(email, password);
        } else if (mode === 'signup') {
            await signUp(email, password, name);
        }
    };

    const handleOAuth = async (provider: 'github' | 'google') => {
        await signInWithProvider(provider);
    };

    // Magic link sent confirmation
    if (mode === 'magic-link-sent') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-md text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-400" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                    <p className="text-gray-400 mb-6">
                        We sent a magic link to <span className="text-white">{email}</span>
                    </p>
                    <button
                        onClick={() => setMode('signin')}
                        className="text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                        ← Back to sign in
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-slate-950 flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 text-center">
                    <SprintLoopLogo size={80} className="mx-auto mb-6" />
                    <h1 className="text-4xl font-bold text-white mb-4">SprintLoop</h1>
                    <p className="text-xl text-gray-300 mb-8">AI-Native Developer Workspace</p>

                    <div className="flex flex-col gap-4 text-left max-w-xs">
                        {[
                            'Build apps 10x faster with AI',
                            'Plan, code, and deploy in one place',
                            'Sync across all your devices',
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                                <span className="text-gray-300">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <SprintLoopLogo size={48} className="mx-auto mb-3" />
                        <h1 className="text-2xl font-bold text-white">SprintLoop</h1>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white">
                            {mode === 'signin' && 'Welcome back'}
                            {mode === 'signup' && 'Create your account'}
                            {mode === 'magic-link' && 'Sign in with magic link'}
                        </h2>
                        <p className="text-gray-400 mt-2">
                            {mode === 'signin' && 'Sign in to access your workspace'}
                            {mode === 'signup' && 'Start building with AI today'}
                            {mode === 'magic-link' && 'No password needed'}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                            <button onClick={clearError} className="ml-2 underline">Dismiss</button>
                        </div>
                    )}

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button
                            onClick={() => handleOAuth('github')}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors disabled:opacity-50"
                        >
                            <Github className="w-5 h-5" />
                            <span className="text-sm font-medium">GitHub</span>
                        </button>
                        <button
                            onClick={() => handleOAuth('google')}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white transition-colors disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-sm font-medium">Google</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-950 text-gray-500">or continue with email</span>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'signup' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                />
                            </div>
                        </div>

                        {mode !== 'magic-link' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {mode === 'signin' && 'Sign in'}
                                    {mode === 'signup' && 'Create account'}
                                    {mode === 'magic-link' && 'Send magic link'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer links */}
                    <div className="mt-6 text-center text-sm">
                        {mode === 'signin' && (
                            <>
                                <button
                                    onClick={() => setMode('magic-link')}
                                    className="text-indigo-400 hover:text-indigo-300"
                                >
                                    Use magic link instead
                                </button>
                                <span className="text-gray-600 mx-2">•</span>
                                <button
                                    onClick={() => setMode('signup')}
                                    className="text-gray-400 hover:text-white"
                                >
                                    Create an account
                                </button>
                            </>
                        )}
                        {mode === 'signup' && (
                            <button
                                onClick={() => setMode('signin')}
                                className="text-gray-400 hover:text-white"
                            >
                                Already have an account? Sign in
                            </button>
                        )}
                        {mode === 'magic-link' && (
                            <button
                                onClick={() => setMode('signin')}
                                className="text-gray-400 hover:text-white"
                            >
                                ← Back to sign in
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
