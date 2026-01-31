/**
 * SprintLoop Form Validation System
 * 
 * Phase 141-160: Advanced form validation
 * - Real-time inline validation
 * - Field-level error display
 * - Success indicators
 * - Validation rules engine
 */

import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react'
import { Check, X, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'

// ============================================================================
// VALIDATION TYPES
// ============================================================================

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

interface ValidationRule {
    validate: (value: string) => boolean | Promise<boolean>
    message: string
}

interface FieldState {
    value: string
    status: ValidationStatus
    error: string | null
    touched: boolean
    dirty: boolean
}

interface FormState {
    [field: string]: FieldState
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const validationRules = {
    required: (message = 'This field is required'): ValidationRule => ({
        validate: (value) => value.trim().length > 0,
        message,
    }),

    minLength: (min: number, message?: string): ValidationRule => ({
        validate: (value) => value.length >= min,
        message: message || `Must be at least ${min} characters`,
    }),

    maxLength: (max: number, message?: string): ValidationRule => ({
        validate: (value) => value.length <= max,
        message: message || `Must be no more than ${max} characters`,
    }),

    email: (message = 'Please enter a valid email'): ValidationRule => ({
        validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message,
    }),

    url: (message = 'Please enter a valid URL'): ValidationRule => ({
        validate: (value) => {
            try {
                new URL(value)
                return true
            } catch {
                return false
            }
        },
        message,
    }),

    pattern: (regex: RegExp, message: string): ValidationRule => ({
        validate: (value) => regex.test(value),
        message,
    }),

    matches: (fieldName: string, message = 'Fields do not match'): ValidationRule => ({
        validate: (value) => {
            // This needs form context to work
            return true
        },
        message,
    }),

    custom: (fn: (value: string) => boolean | Promise<boolean>, message: string): ValidationRule => ({
        validate: fn,
        message,
    }),

    // Password strength
    password: {
        hasUppercase: (message = 'Must contain an uppercase letter'): ValidationRule => ({
            validate: (value) => /[A-Z]/.test(value),
            message,
        }),
        hasLowercase: (message = 'Must contain a lowercase letter'): ValidationRule => ({
            validate: (value) => /[a-z]/.test(value),
            message,
        }),
        hasNumber: (message = 'Must contain a number'): ValidationRule => ({
            validate: (value) => /\d/.test(value),
            message,
        }),
        hasSpecial: (message = 'Must contain a special character'): ValidationRule => ({
            validate: (value) => /[!@#$%^&*(),.?":{}|<>]/.test(value),
            message,
        }),
    },
}

// ============================================================================
// USE FIELD VALIDATION HOOK
// ============================================================================

interface UseFieldValidationOptions {
    rules: ValidationRule[]
    validateOnChange?: boolean
    validateOnBlur?: boolean
    debounceMs?: number
}

export function useFieldValidation({
    rules,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
}: UseFieldValidationOptions) {
    const [state, setState] = useState<FieldState>({
        value: '',
        status: 'idle',
        error: null,
        touched: false,
        dirty: false,
    })

    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const validate = useCallback(async (value: string): Promise<boolean> => {
        setState(prev => ({ ...prev, status: 'validating' }))

        for (const rule of rules) {
            const isValid = await rule.validate(value)
            if (!isValid) {
                setState(prev => ({
                    ...prev,
                    status: 'invalid',
                    error: rule.message,
                }))
                return false
            }
        }

        setState(prev => ({
            ...prev,
            status: 'valid',
            error: null,
        }))
        return true
    }, [rules])

    const debouncedValidate = useCallback((value: string) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(() => validate(value), debounceMs)
    }, [validate, debounceMs])

    const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setState(prev => ({ ...prev, value, dirty: true }))
        if (validateOnChange && state.touched) {
            debouncedValidate(value)
        }
    }, [validateOnChange, state.touched, debouncedValidate])

    const onBlur = useCallback(() => {
        setState(prev => ({ ...prev, touched: true }))
        if (validateOnBlur && state.dirty) {
            validate(state.value)
        }
    }, [validateOnBlur, state.dirty, state.value, validate])

    const reset = useCallback(() => {
        setState({
            value: '',
            status: 'idle',
            error: null,
            touched: false,
            dirty: false,
        })
    }, [])

    const setValue = useCallback((value: string) => {
        setState(prev => ({ ...prev, value }))
    }, [])

    return {
        ...state,
        onChange,
        onBlur,
        validate: () => validate(state.value),
        reset,
        setValue,
    }
}

// ============================================================================
// VALIDATED INPUT COMPONENT
// ============================================================================

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'> {
    label: string
    rules: ValidationRule[]
    hint?: string
    showSuccessIndicator?: boolean
    validateOnChange?: boolean
    validateOnBlur?: boolean
    debounceMs?: number
    onValidChange?: (value: string, isValid: boolean) => void
}

export function ValidatedInput({
    label,
    rules,
    hint,
    showSuccessIndicator = true,
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300,
    onValidChange,
    className = '',
    type = 'text',
    ...props
}: ValidatedInputProps) {
    const field = useFieldValidation({
        rules,
        validateOnChange,
        validateOnBlur,
        debounceMs,
    })

    const [showPassword, setShowPassword] = useState(false)
    const inputId = props.id || `input-${Math.random().toString(36).slice(2)}`
    const isPassword = type === 'password'

    useEffect(() => {
        if (onValidChange && field.dirty) {
            onValidChange(field.value, field.status === 'valid')
        }
    }, [field.value, field.status, field.dirty, onValidChange])

    const getStatusIcon = () => {
        switch (field.status) {
            case 'validating':
                return <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            case 'valid':
                return showSuccessIndicator ? <Check className="w-4 h-4 text-green-400" /> : null
            case 'invalid':
                return <AlertCircle className="w-4 h-4 text-red-400" />
            default:
                return null
        }
    }

    const getInputClasses = () => {
        const base = `
            w-full bg-white/5 border rounded-lg px-4 py-2.5
            text-white placeholder-gray-500
            transition-all duration-200
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
        `

        switch (field.status) {
            case 'valid':
                return `${base} border-green-500/50 focus:ring-green-500 focus:border-transparent`
            case 'invalid':
                return `${base} border-red-500/50 focus:ring-red-500 focus:border-transparent`
            default:
                return `${base} border-white/10 hover:border-white/20 focus:ring-purple-500 focus:border-transparent`
        }
    }

    return (
        <div className={`w-full ${className}`}>
            <label
                htmlFor={inputId}
                className="block text-sm font-medium text-gray-300 mb-1.5"
            >
                {label}
                {rules.some(r => r.message.includes('required')) && (
                    <span className="text-red-400 ml-1">*</span>
                )}
            </label>

            <div className="relative">
                <input
                    {...props}
                    id={inputId}
                    type={isPassword && showPassword ? 'text' : type}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={field.status === 'invalid'}
                    aria-describedby={
                        field.error ? `${inputId}-error` :
                            hint ? `${inputId}-hint` : undefined
                    }
                    className={`${getInputClasses()} ${isPassword ? 'pr-20' : 'pr-10'}`}
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {getStatusIcon()}
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-500 hover:text-white transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Error message */}
            {field.error && field.touched && (
                <p
                    id={`${inputId}-error`}
                    className="mt-1.5 text-sm text-red-400 flex items-center gap-1"
                    role="alert"
                >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {field.error}
                </p>
            )}

            {/* Hint */}
            {hint && !field.error && (
                <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-gray-500">
                    {hint}
                </p>
            )}
        </div>
    )
}

// ============================================================================
// PASSWORD STRENGTH INDICATOR
// ============================================================================

interface PasswordStrengthProps {
    password: string
    className?: string
}

export function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
    const checks = [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'Contains uppercase', met: /[A-Z]/.test(password) },
        { label: 'Contains lowercase', met: /[a-z]/.test(password) },
        { label: 'Contains number', met: /\d/.test(password) },
        { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ]

    const strength = checks.filter(c => c.met).length
    const strengthPercent = (strength / checks.length) * 100

    const getStrengthLabel = () => {
        if (strength <= 1) return { label: 'Weak', color: 'text-red-400' }
        if (strength <= 2) return { label: 'Fair', color: 'text-orange-400' }
        if (strength <= 3) return { label: 'Good', color: 'text-yellow-400' }
        if (strength <= 4) return { label: 'Strong', color: 'text-green-400' }
        return { label: 'Very Strong', color: 'text-green-300' }
    }

    const getStrengthColor = () => {
        if (strength <= 1) return 'bg-red-500'
        if (strength <= 2) return 'bg-orange-500'
        if (strength <= 3) return 'bg-yellow-500'
        if (strength <= 4) return 'bg-green-500'
        return 'bg-green-400'
    }

    const strengthInfo = getStrengthLabel()

    if (!password) return null

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Strength bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Password strength</span>
                    <span className={strengthInfo.color}>{strengthInfo.label}</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${strengthPercent}%` }}
                    />
                </div>
            </div>

            {/* Requirements checklist */}
            <div className="grid grid-cols-2 gap-2">
                {checks.map((check, i) => (
                    <div
                        key={i}
                        className={`flex items-center gap-2 text-xs ${check.met ? 'text-green-400' : 'text-gray-500'
                            }`}
                    >
                        {check.met ? (
                            <Check className="w-3.5 h-3.5" />
                        ) : (
                            <X className="w-3.5 h-3.5" />
                        )}
                        {check.label}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// FORM CONTEXT
// ============================================================================

interface FormContextValue {
    values: Record<string, string>
    errors: Record<string, string | null>
    touched: Record<string, boolean>
    isValid: boolean
    isSubmitting: boolean
    setValue: (field: string, value: string) => void
    setError: (field: string, error: string | null) => void
    setTouched: (field: string, touched: boolean) => void
    handleSubmit: (onSubmit: (values: Record<string, string>) => void | Promise<void>) => (e: React.FormEvent) => void
}

const FormContext = createContext<FormContextValue | null>(null)

export function useFormContext() {
    const context = useContext(FormContext)
    if (!context) throw new Error('useFormContext must be used within Form')
    return context
}

// ============================================================================
// FORM COMPONENT
// ============================================================================

interface FormProps {
    children: React.ReactNode
    initialValues?: Record<string, string>
    onSubmit?: (values: Record<string, string>) => void | Promise<void>
    className?: string
}

export function Form({
    children,
    initialValues = {},
    onSubmit,
    className = ''
}: FormProps) {
    const [values, setValues] = useState<Record<string, string>>(initialValues)
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [touched, setTouchedState] = useState<Record<string, boolean>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const setValue = useCallback((field: string, value: string) => {
        setValues(prev => ({ ...prev, [field]: value }))
    }, [])

    const setError = useCallback((field: string, error: string | null) => {
        setErrors(prev => ({ ...prev, [field]: error }))
    }, [])

    const setTouched = useCallback((field: string, isTouched: boolean) => {
        setTouchedState(prev => ({ ...prev, [field]: isTouched }))
    }, [])

    const isValid = Object.values(errors).every(e => e === null)

    const handleSubmit = useCallback(
        (submitFn: (values: Record<string, string>) => void | Promise<void>) =>
            async (e: React.FormEvent) => {
                e.preventDefault()
                if (!isValid) return

                setIsSubmitting(true)
                try {
                    await submitFn(values)
                } finally {
                    setIsSubmitting(false)
                }
            },
        [values, isValid]
    )

    return (
        <FormContext.Provider
            value={{
                values,
                errors,
                touched,
                isValid,
                isSubmitting,
                setValue,
                setError,
                setTouched,
                handleSubmit,
            }}
        >
            <form
                className={className}
                onSubmit={onSubmit ? handleSubmit(onSubmit) : undefined}
            >
                {children}
            </form>
        </FormContext.Provider>
    )
}

// ============================================================================
// INLINE ERROR
// ============================================================================

interface InlineErrorProps {
    message: string
    className?: string
}

export function InlineError({ message, className = '' }: InlineErrorProps) {
    return (
        <div
            className={`flex items-center gap-1.5 text-sm text-red-400 ${className}`}
            role="alert"
        >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
        </div>
    )
}

// ============================================================================
// SUCCESS INDICATOR
// ============================================================================

interface SuccessIndicatorProps {
    message?: string
    className?: string
}

export function SuccessIndicator({ message, className = '' }: SuccessIndicatorProps) {
    return (
        <div
            className={`flex items-center gap-1.5 text-sm text-green-400 ${className}`}
        >
            <Check className="w-4 h-4 flex-shrink-0" />
            {message && <span>{message}</span>}
        </div>
    )
}
