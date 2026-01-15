import { useState } from 'react'
import { ChevronDown, Check, Cpu } from 'lucide-react'
import { AI_MODELS, type AIModel } from '../config/models'

interface ModelSelectorProps {
    selectedModel: AIModel
    onModelChange: (model: AIModel) => void
    compact?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, compact = false }: ModelSelectorProps) {
    const [showDropdown, setShowDropdown] = useState(false)

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`
          flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 
          rounded-lg transition-all
          ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}
        `}
            >
                <Cpu className={`text-purple-400 ${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                <span className={`text-white ${compact ? 'text-xs' : 'text-sm'}`}>
                    {selectedModel.name}
                </span>
                {!compact && (
                    <span className="text-xs text-gray-500">{selectedModel.provider}</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute top-full right-0 mt-2 w-72 p-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50">
                        <div className="text-xs text-gray-500 px-3 py-1.5 mb-1">Select AI Model</div>
                        {AI_MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    onModelChange(model)
                                    setShowDropdown(false)
                                }}
                                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                  ${selectedModel.id === model.id
                                        ? 'bg-purple-500/20 text-white'
                                        : 'text-gray-300 hover:bg-white/5'
                                    }
                `}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{model.name}</span>
                                        {model.recommended && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                                Best for coding
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-500">{model.provider}</span>
                                        <span className="text-xs text-gray-600">•</span>
                                        <span className="text-xs text-gray-600">{model.description}</span>
                                    </div>
                                </div>
                                {selectedModel.id === model.id && (
                                    <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
