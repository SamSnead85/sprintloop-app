/**
 * Theme Selector Component
 * 
 * UI for selecting and previewing themes.
 */

import { useState } from 'react';
import { Check, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useThemeService, Theme } from '../lib/theme/theme-service';

interface ThemeSelectorProps {
    className?: string;
    compact?: boolean;
}

export function ThemeSelector({ className = '', compact = false }: ThemeSelectorProps) {
    const {
        currentThemeId,
        themes,
        followSystem,
        setTheme,
        setFollowSystem,
        isDarkMode,
    } = useThemeService();

    const [isOpen, setIsOpen] = useState(false);

    const handleThemeSelect = (themeId: string) => {
        setTheme(themeId);
        setFollowSystem(false);
        setIsOpen(false);
    };

    const handleSystemToggle = () => {
        setFollowSystem(!followSystem);
        setIsOpen(false);
    };

    if (compact) {
        return (
            <button
                className={`theme-selector-compact ${className}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Change Theme"
            >
                {isDarkMode() ? <Moon size={16} /> : <Sun size={16} />}
            </button>
        );
    }

    return (
        <div className={`theme-selector ${className}`}>
            <button
                className="theme-selector-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Palette size={16} />
                <span>Theme</span>
            </button>

            {isOpen && (
                <div className="theme-selector-dropdown">
                    {/* System Theme Option */}
                    <button
                        className={`theme-option ${followSystem ? 'active' : ''}`}
                        onClick={handleSystemToggle}
                    >
                        <Monitor size={16} />
                        <span>System Theme</span>
                        {followSystem && <Check size={14} className="check-icon" />}
                    </button>

                    <div className="theme-separator" />

                    {/* Theme Options */}
                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            className={`theme-option ${currentThemeId === theme.id && !followSystem ? 'active' : ''}`}
                            onClick={() => handleThemeSelect(theme.id)}
                        >
                            <ThemePreview theme={theme} />
                            <span>{theme.name}</span>
                            {currentThemeId === theme.id && !followSystem && (
                                <Check size={14} className="check-icon" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// =============================================================================
// THEME PREVIEW
// =============================================================================

interface ThemePreviewProps {
    theme: Theme;
}

function ThemePreview({ theme }: ThemePreviewProps) {
    const { colors } = theme;

    return (
        <div
            className="theme-preview"
            style={{
                background: colors.bgPrimary,
                border: `1px solid ${colors.border}`,
            }}
        >
            <div
                className="theme-preview-accent"
                style={{ background: colors.accent }}
            />
        </div>
    );
}

// =============================================================================
// THEME SETTINGS PANEL
// =============================================================================

interface ThemeSettingsProps {
    className?: string;
}

export function ThemeSettings({ className = '' }: ThemeSettingsProps) {
    const {
        themes,
        currentThemeId,
        followSystem,
        setTheme,
        setFollowSystem,
    } = useThemeService();

    return (
        <div className={`theme-settings ${className}`}>
            <h3 className="theme-settings-title">Appearance</h3>

            {/* System Theme Toggle */}
            <label className="theme-setting-row">
                <span>Follow System Theme</span>
                <input
                    type="checkbox"
                    checked={followSystem}
                    onChange={(e) => setFollowSystem(e.target.checked)}
                />
            </label>

            {/* Theme Grid */}
            <div className="theme-grid">
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        className={`theme-card ${currentThemeId === theme.id ? 'selected' : ''}`}
                        onClick={() => {
                            setTheme(theme.id);
                            setFollowSystem(false);
                        }}
                        disabled={followSystem}
                    >
                        <ThemeCardPreview theme={theme} />
                        <span className="theme-card-name">{theme.name}</span>
                        {theme.type === 'dark' ? (
                            <Moon size={12} className="theme-type-icon" />
                        ) : (
                            <Sun size={12} className="theme-type-icon" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ThemeCardPreview({ theme }: { theme: Theme }) {
    const { colors } = theme;

    return (
        <div
            className="theme-card-preview"
            style={{ background: colors.bgPrimary }}
        >
            {/* Simulated IDE layout */}
            <div className="theme-preview-sidebar" style={{ background: colors.bgSecondary }} />
            <div className="theme-preview-content">
                <div className="theme-preview-editor" style={{ background: colors.bgPrimary }}>
                    <div className="theme-preview-line" style={{ background: colors.syntaxKeyword, width: '40%' }} />
                    <div className="theme-preview-line" style={{ background: colors.syntaxString, width: '60%' }} />
                    <div className="theme-preview-line" style={{ background: colors.syntaxFunction, width: '50%' }} />
                </div>
            </div>
            <div className="theme-preview-panel" style={{ background: colors.bgTertiary }} />
        </div>
    );
}

export default ThemeSelector;
