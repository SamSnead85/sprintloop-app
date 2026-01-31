/**
 * SprintLoop Form Input Components
 * 
 * Phase 2551-2600: Form inputs
 * - Text input
 * - Number input
 * - Textarea
 * - Toggle switch
 * - Radio group
 * - Checkbox
 * - Slider
 */

import React, { useState, useRef, useCallback, forwardRef } from 'react'
import {
    Eye,
    EyeOff,
    AlertCircle
} from 'lucide-react'

// ============================================================================
// TEXT INPUT
// ============================================================================

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string
    error?: string
    hint?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    size?: 'sm' | 'md' | 'lg'
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(({
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    size = 'md',
    className = '',
    type = 'text',
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const isPassword = type === 'password'

    const sizeClasses = {
        sm: 'h-8 text-xs',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
    }

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {leftIcon}
                    </div>
                )}
                <input
                    ref={ref}
                    type={isPassword ? (showPassword ? 'text' : 'password') : type}
                    className={`
                        w-full px-3 bg-white/5 border rounded-lg text-white placeholder-gray-500
                        transition-colors focus:outline-none
                        ${sizeClasses[size]}
                        ${leftIcon ? 'pl-10' : ''}
                        ${rightIcon || isPassword ? 'pr-10' : ''}
                        ${error
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-white/10 hover:border-white/20 focus:border-purple-500'
                        }
                        ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    {...props}
                />
                {isPassword ? (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                ) : rightIcon ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {rightIcon}
                    </div>
                ) : null}
            </div>
            {error && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {error}
                </div>
            )}
            {hint && !error && (
                <p className="mt-1 text-xs text-gray-500">{hint}</p>
            )}
        </div>
    )
})

TextInput.displayName = 'TextInput'

// ============================================================================
// TEXTAREA
// ============================================================================

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string
    error?: string
    hint?: string
    maxLength?: number
    showCount?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
    label,
    error,
    hint,
    maxLength,
    showCount = false,
    className = '',
    ...props
}, ref) => {
    const [length, setLength] = useState(props.value?.toString().length || 0)

    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                maxLength={maxLength}
                onChange={(e) => {
                    setLength(e.target.value.length)
                    props.onChange?.(e)
                }}
                className={`
                    w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-500
                    transition-colors focus:outline-none resize-y min-h-24
                    ${error
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-white/10 hover:border-white/20 focus:border-purple-500'
                    }
                    ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                {...props}
            />
            <div className="flex justify-between mt-1">
                {error ? (
                    <div className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {error}
                    </div>
                ) : hint ? (
                    <p className="text-xs text-gray-500">{hint}</p>
                ) : (
                    <span />
                )}
                {showCount && maxLength && (
                    <span className={`text-xs ${length >= maxLength ? 'text-red-400' : 'text-gray-500'}`}>
                        {length}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    )
})

Textarea.displayName = 'Textarea'

// ============================================================================
// TOGGLE SWITCH
// ============================================================================

interface ToggleSwitchProps {
    checked?: boolean
    onChange?: (checked: boolean) => void
    label?: string
    description?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function ToggleSwitch({
    checked = false,
    onChange,
    label,
    description,
    disabled = false,
    size = 'md',
    className = '',
}: ToggleSwitchProps) {
    const sizes = {
        sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
        md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
        lg: { track: 'w-12 h-6', thumb: 'w-5 h-5', translate: 'translate-x-6' },
    }

    return (
        <div className={`flex items-start gap-3 ${className}`}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => onChange?.(!checked)}
                className={`
                    relative inline-flex flex-shrink-0 rounded-full transition-colors
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900
                    ${sizes[size].track}
                    ${checked ? 'bg-purple-500' : 'bg-white/20'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <span
                    className={`
                        inline-block rounded-full bg-white shadow-sm transition-transform
                        ${sizes[size].thumb}
                        ${checked ? sizes[size].translate : 'translate-x-0.5'}
                        ${size === 'sm' ? 'mt-0.5' : 'mt-0.5'}
                    `}
                />
            </button>
            {(label || description) && (
                <div className="flex-1">
                    {label && (
                        <div className={`font-medium text-white ${size === 'sm' ? 'text-sm' : ''}`}>
                            {label}
                        </div>
                    )}
                    {description && (
                        <div className="text-sm text-gray-500">{description}</div>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// CHECKBOX
// ============================================================================

interface CheckboxProps {
    checked?: boolean
    onChange?: (checked: boolean) => void
    label?: string
    description?: string
    disabled?: boolean
    indeterminate?: boolean
    className?: string
}

export function Checkbox({
    checked = false,
    onChange,
    label,
    description,
    disabled = false,
    indeterminate = false,
    className = '',
}: CheckboxProps) {
    return (
        <label className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
            <div className="relative flex-shrink-0 mt-0.5">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange?.(e.target.checked)}
                    disabled={disabled}
                    className="sr-only"
                />
                <div
                    className={`
                        w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                        ${checked || indeterminate
                            ? 'bg-purple-500 border-purple-500'
                            : 'bg-transparent border-white/30 hover:border-white/50'
                        }
                        ${disabled ? 'opacity-50' : ''}
                    `}
                >
                    {checked && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                    {indeterminate && !checked && (
                        <div className="w-2 h-0.5 bg-white rounded" />
                    )}
                </div>
            </div>
            {(label || description) && (
                <div className="flex-1">
                    {label && (
                        <div className={`font-medium text-white ${disabled ? 'opacity-50' : ''}`}>
                            {label}
                        </div>
                    )}
                    {description && (
                        <div className={`text-sm text-gray-500 ${disabled ? 'opacity-50' : ''}`}>
                            {description}
                        </div>
                    )}
                </div>
            )}
        </label>
    )
}

// ============================================================================
// RADIO GROUP
// ============================================================================

interface RadioOption {
    value: string
    label: string
    description?: string
    disabled?: boolean
}

interface RadioGroupProps {
    options: RadioOption[]
    value?: string
    onChange?: (value: string) => void
    label?: string
    orientation?: 'horizontal' | 'vertical'
    className?: string
}

export function RadioGroup({
    options,
    value,
    onChange,
    label,
    orientation = 'vertical',
    className = '',
}: RadioGroupProps) {
    return (
        <div className={className}>
            {label && (
                <div className="text-sm font-medium text-gray-400 mb-2">{label}</div>
            )}
            <div className={`flex ${orientation === 'vertical' ? 'flex-col gap-2' : 'flex-wrap gap-4'}`}>
                {options.map(option => (
                    <label
                        key={option.value}
                        className={`flex items-start gap-3 ${option.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <div className="relative flex-shrink-0 mt-0.5">
                            <input
                                type="radio"
                                name={label}
                                value={option.value}
                                checked={value === option.value}
                                onChange={(e) => onChange?.(e.target.value)}
                                disabled={option.disabled}
                                className="sr-only"
                            />
                            <div
                                className={`
                                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${value === option.value
                                        ? 'border-purple-500'
                                        : 'border-white/30 hover:border-white/50'
                                    }
                                    ${option.disabled ? 'opacity-50' : ''}
                                `}
                            >
                                {value === option.value && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className={`font-medium text-white ${option.disabled ? 'opacity-50' : ''}`}>
                                {option.label}
                            </div>
                            {option.description && (
                                <div className={`text-sm text-gray-500 ${option.disabled ? 'opacity-50' : ''}`}>
                                    {option.description}
                                </div>
                            )}
                        </div>
                    </label>
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// SLIDER
// ============================================================================

interface SliderProps {
    value?: number
    onChange?: (value: number) => void
    min?: number
    max?: number
    step?: number
    label?: string
    showValue?: boolean
    formatValue?: (value: number) => string
    disabled?: boolean
    className?: string
}

export function Slider({
    value = 0,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue = true,
    formatValue = (v) => v.toString(),
    disabled = false,
    className = '',
}: SliderProps) {
    const percentage = ((value - min) / (max - min)) * 100

    return (
        <div className={className}>
            {(label || showValue) && (
                <div className="flex items-center justify-between mb-2">
                    {label && (
                        <span className="text-sm font-medium text-gray-400">{label}</span>
                    )}
                    {showValue && (
                        <span className="text-sm text-white font-mono">{formatValue(value)}</span>
                    )}
                </div>
            )}
            <div className="relative">
                <input
                    type="range"
                    value={value}
                    onChange={(e) => onChange?.(Number(e.target.value))}
                    min={min}
                    max={max}
                    step={step}
                    disabled={disabled}
                    className={`
                        w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                        focus:outline-none
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-110
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    style={{
                        background: `linear-gradient(to right, rgb(168 85 247) ${percentage}%, rgba(255 255 255 / 0.1) ${percentage}%)`,
                    }}
                />
            </div>
        </div>
    )
}
