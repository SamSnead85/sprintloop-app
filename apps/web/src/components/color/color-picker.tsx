/**
 * SprintLoop Color Picker
 * 
 * Phase 3451-3500: Color Picker
 * - Color picker with gradients
 * - Preset colors
 * - Opacity slider
 * - Hex/RGB input
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Pipette, Copy, Check } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface HSV {
    h: number
    s: number
    v: number
}

interface RGB {
    r: number
    g: number
    b: number
}

interface ColorPickerProps {
    value?: string
    onChange?: (color: string) => void
    presets?: string[]
    showOpacity?: boolean
    showInput?: boolean
    className?: string
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

function hexToRgb(hex: string): RGB {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 }
}

function rgbToHex(rgb: RGB): string {
    return '#' + [rgb.r, rgb.g, rgb.b]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('')
}

function hsvToRgb(hsv: HSV): RGB {
    const { h, s, v } = hsv
    const i = Math.floor(h * 6)
    const f = h * 6 - i
    const p = v * (1 - s)
    const q = v * (1 - f * s)
    const t = v * (1 - (1 - f) * s)

    let r = 0, g = 0, b = 0
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break
        case 1: r = q; g = v; b = p; break
        case 2: r = p; g = v; b = t; break
        case 3: r = p; g = q; b = v; break
        case 4: r = t; g = p; b = v; break
        case 5: r = v; g = p; b = q; break
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    }
}

function rgbToHsv(rgb: RGB): HSV {
    const r = rgb.r / 255
    const g = rgb.g / 255
    const b = rgb.b / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min

    let h = 0
    const s = max === 0 ? 0 : d / max
    const v = max

    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
        }
        h /= 6
    }

    return { h, s, v }
}

// ============================================================================
// DEFAULT PRESETS
// ============================================================================

const defaultPresets = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e',
    '#64748b', '#374151', '#1f2937', '#000000', '#ffffff',
]

// ============================================================================
// COLOR PICKER
// ============================================================================

export function ColorPicker({
    value = '#a855f7',
    onChange,
    presets = defaultPresets,
    showOpacity = false,
    showInput = true,
    className = '',
}: ColorPickerProps) {
    const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(hexToRgb(value)))
    const [opacity, setOpacity] = useState(1)
    const [copied, setCopied] = useState(false)

    const saturationRef = useRef<HTMLDivElement>(null)
    const hueRef = useRef<HTMLDivElement>(null)
    const opacityRef = useRef<HTMLDivElement>(null)

    const rgb = hsvToRgb(hsv)
    const hex = rgbToHex(rgb)
    const colorWithOpacity = opacity < 1
        ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`
        : hex

    // Update internal state when value prop changes
    useEffect(() => {
        const newHsv = rgbToHsv(hexToRgb(value))
        setHsv(newHsv)
    }, [value])

    const updateColor = useCallback((newHsv: HSV) => {
        setHsv(newHsv)
        const newRgb = hsvToRgb(newHsv)
        const newHex = rgbToHex(newRgb)
        onChange?.(newHex)
    }, [onChange])

    // Saturation/Value picker handler
    const handleSaturationPick = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!saturationRef.current) return

        const rect = saturationRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

        updateColor({ ...hsv, s: x, v: 1 - y })
    }, [hsv, updateColor])

    // Hue slider handler
    const handleHuePick = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!hueRef.current) return

        const rect = hueRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))

        updateColor({ ...hsv, h: x })
    }, [hsv, updateColor])

    // Opacity slider handler
    const handleOpacityPick = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!opacityRef.current) return

        const rect = opacityRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))

        setOpacity(x)
        const newRgb = hsvToRgb(hsv)
        onChange?.(`rgba(${newRgb.r}, ${newRgb.g}, ${newRgb.b}, ${x.toFixed(2)})`)
    }, [hsv, onChange])

    // Generic drag handler
    const createDragHandler = (handler: (e: MouseEvent) => void) => {
        return (e: React.MouseEvent) => {
            handler(e as unknown as MouseEvent)

            const handleMove = (e: MouseEvent) => {
                e.preventDefault()
                handler(e)
            }

            const handleUp = () => {
                document.removeEventListener('mousemove', handleMove)
                document.removeEventListener('mouseup', handleUp)
            }

            document.addEventListener('mousemove', handleMove)
            document.addEventListener('mouseup', handleUp)
        }
    }

    // Copy color
    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(colorWithOpacity)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [colorWithOpacity])

    // Handle hex input
    const handleHexInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (/^#[0-9a-f]{6}$/i.test(value)) {
            updateColor(rgbToHsv(hexToRgb(value)))
        }
    }, [updateColor])

    return (
        <div className={`w-64 ${className}`}>
            {/* Saturation/Value picker */}
            <div
                ref={saturationRef}
                onMouseDown={createDragHandler(handleSaturationPick)}
                className="relative h-40 rounded-lg cursor-crosshair overflow-hidden"
                style={{
                    backgroundColor: `hsl(${hsv.h * 360}, 100%, 50%)`,
                }}
            >
                {/* White gradient (left to right) */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to right, white, transparent)',
                    }}
                />
                {/* Black gradient (top to bottom) */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: 'linear-gradient(to bottom, transparent, black)',
                    }}
                />
                {/* Picker dot */}
                <div
                    className="absolute w-4 h-4 -ml-2 -mt-2 border-2 border-white rounded-full shadow-lg"
                    style={{
                        left: `${hsv.s * 100}%`,
                        top: `${(1 - hsv.v) * 100}%`,
                        backgroundColor: hex,
                    }}
                />
            </div>

            {/* Hue slider */}
            <div
                ref={hueRef}
                onMouseDown={createDragHandler(handleHuePick)}
                className="relative h-3 mt-3 rounded-full cursor-pointer"
                style={{
                    background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                }}
            >
                <div
                    className="absolute w-4 h-4 -ml-2 -mt-0.5 border-2 border-white rounded-full shadow"
                    style={{
                        left: `${hsv.h * 100}%`,
                        backgroundColor: `hsl(${hsv.h * 360}, 100%, 50%)`,
                    }}
                />
            </div>

            {/* Opacity slider */}
            {showOpacity && (
                <div
                    ref={opacityRef}
                    onMouseDown={createDragHandler(handleOpacityPick)}
                    className="relative h-3 mt-3 rounded-full cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, transparent, ${hex})`,
                    }}
                >
                    {/* Checkered pattern for transparency */}
                    <div
                        className="absolute inset-0 rounded-full -z-10"
                        style={{
                            backgroundImage: `
                                linear-gradient(45deg, #808080 25%, transparent 25%),
                                linear-gradient(-45deg, #808080 25%, transparent 25%),
                                linear-gradient(45deg, transparent 75%, #808080 75%),
                                linear-gradient(-45deg, transparent 75%, #808080 75%)
                            `,
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                        }}
                    />
                    <div
                        className="absolute w-4 h-4 -ml-2 -mt-0.5 border-2 border-white rounded-full shadow"
                        style={{
                            left: `${opacity * 100}%`,
                            backgroundColor: colorWithOpacity,
                        }}
                    />
                </div>
            )}

            {/* Color preview and input */}
            {showInput && (
                <div className="flex items-center gap-2 mt-4">
                    <div
                        className="w-10 h-10 rounded-lg border border-white/10"
                        style={{ backgroundColor: colorWithOpacity }}
                    />
                    <input
                        type="text"
                        value={hex.toUpperCase()}
                        onChange={handleHexInput}
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                    <button
                        onClick={handleCopy}
                        className="p-2 text-gray-500 hover:text-white transition-colors"
                        title="Copy color"
                    >
                        {copied ? (
                            <Check className="w-4 h-4 text-green-400" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                    </button>
                </div>
            )}

            {/* Presets */}
            {presets.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                    {presets.map(preset => (
                        <button
                            key={preset}
                            onClick={() => updateColor(rgbToHsv(hexToRgb(preset)))}
                            className={`
                                w-6 h-6 rounded-md transition-transform hover:scale-110
                                ${preset === hex ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}
                            `}
                            style={{ backgroundColor: preset }}
                            title={preset}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// SIMPLE COLOR PICKER (Button trigger)
// ============================================================================

interface SimpleColorPickerProps {
    value?: string
    onChange?: (color: string) => void
    presets?: string[]
    className?: string
}

export function SimpleColorPicker({
    value = '#a855f7',
    onChange,
    presets = defaultPresets,
    className = '',
}: SimpleColorPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
            >
                <div
                    className="w-5 h-5 rounded border border-white/10"
                    style={{ backgroundColor: value }}
                />
                <span className="text-sm text-gray-400 font-mono">{value.toUpperCase()}</span>
                <Pipette className="w-4 h-4 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 p-4 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50">
                    <ColorPicker
                        value={value}
                        onChange={(color) => {
                            onChange?.(color)
                        }}
                        presets={presets}
                    />
                </div>
            )}
        </div>
    )
}
