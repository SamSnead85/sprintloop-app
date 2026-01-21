/**
 * LLM Settings Panel
 * Configure cloud and on-prem LLM connections
 */
import { useState, useEffect } from 'react'
import {
    Settings,
    Server,
    Cloud,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Loader2
} from 'lucide-react'
import {
    getOnPremConfig,
    saveOnPremConfig,
    checkOllamaConnection,
    ON_PREM_MODEL_PRESETS,
    type OnPremConfig,
} from '../lib/ai/on-prem-provider'
import { getApiKeyStatus } from '../lib/ai/provider'

interface ConnectionStatus {
    connected: boolean
    models: string[]
    error?: string
    checking: boolean
}

export function LLMSettings() {
    const [activeTab, setActiveTab] = useState<'cloud' | 'onprem'>('cloud')
    const [config, setConfig] = useState<OnPremConfig>(getOnPremConfig())
    const [ollamaStatus, setOllamaStatus] = useState<ConnectionStatus>({
        connected: false,
        models: [],
        checking: false,
    })
    const [isSaving, setIsSaving] = useState(false)

    const cloudStatus = getApiKeyStatus()

    // Check Ollama connection on mount
    useEffect(() => {
        if (config.endpoints.ollama) {
            checkConnection()
        }
    }, [])

    const checkConnection = async () => {
        setOllamaStatus(s => ({ ...s, checking: true }))

        const result = await checkOllamaConnection(config.endpoints.ollama)

        setOllamaStatus({
            connected: result.connected,
            models: result.models,
            error: result.error,
            checking: false,
        })
    }

    const handleSave = () => {
        setIsSaving(true)
        saveOnPremConfig(config)
        setTimeout(() => setIsSaving(false), 500)
    }

    const updateEndpoint = (key: keyof OnPremConfig['endpoints'], value: string) => {
        setConfig(c => ({
            ...c,
            endpoints: { ...c.endpoints, [key]: value },
        }))
    }

    return (
        <div className="h-full flex flex-col bg-slate-900">
            {/* Header */}
            <div className="h-10 flex items-center px-3 border-b border-white/5">
                <Settings className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-white">LLM Settings</span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5">
                <button
                    onClick={() => setActiveTab('cloud')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${activeTab === 'cloud'
                        ? 'text-white border-b-2 border-purple-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Cloud className="w-4 h-4" />
                    Cloud APIs
                </button>
                <button
                    onClick={() => setActiveTab('onprem')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${activeTab === 'onprem'
                        ? 'text-white border-b-2 border-purple-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Server className="w-4 h-4" />
                    On-Prem / Local
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'cloud' ? (
                    <CloudSettings status={cloudStatus} />
                ) : (
                    <OnPremSettings
                        config={config}
                        setConfig={setConfig}
                        ollamaStatus={ollamaStatus}
                        onCheckConnection={checkConnection}
                        updateEndpoint={updateEndpoint}
                    />
                )}
            </div>

            {/* Save Button */}
            {activeTab === 'onprem' && (
                <div className="p-3 border-t border-white/5">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Configuration'
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

function CloudSettings({ status }: { status: ReturnType<typeof getApiKeyStatus> }) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">
                Configure API keys in your <code className="text-purple-400">.env.local</code> file:
            </p>

            <ProviderStatus
                name="Anthropic (Claude)"
                configured={status.anthropic}
                envVar="VITE_ANTHROPIC_API_KEY"
            />

            <ProviderStatus
                name="OpenAI (GPT)"
                configured={status.openai}
                envVar="VITE_OPENAI_API_KEY"
            />

            <ProviderStatus
                name="Google (Gemini)"
                configured={status.google}
                envVar="VITE_GOOGLE_AI_API_KEY"
            />

            {!status.anyConfigured && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-sm text-yellow-400">
                        No cloud APIs configured. Add at least one API key to use cloud models, or configure an on-prem provider.
                    </p>
                </div>
            )}
        </div>
    )
}

function ProviderStatus({
    name,
    configured,
    envVar
}: {
    name: string
    configured: boolean
    envVar: string
}) {
    return (
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
                {configured ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                    <XCircle className="w-5 h-5 text-gray-500" />
                )}
                <div>
                    <div className="text-sm font-medium text-white">{name}</div>
                    <div className="text-xs text-gray-500 font-mono">{envVar}</div>
                </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${configured ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                {configured ? 'Connected' : 'Not configured'}
            </span>
        </div>
    )
}

function OnPremSettings({
    config,
    setConfig,
    ollamaStatus,
    onCheckConnection,
    updateEndpoint,
}: {
    config: OnPremConfig
    setConfig: React.Dispatch<React.SetStateAction<OnPremConfig>>
    ollamaStatus: ConnectionStatus
    onCheckConnection: () => void
    updateEndpoint: (key: keyof OnPremConfig['endpoints'], value: string) => void
}) {
    return (
        <div className="space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                    <div className="text-sm font-medium text-white">Enable On-Prem Models</div>
                    <div className="text-xs text-gray-500">Use local or self-hosted models</div>
                </div>
                <button
                    onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
                    className={`w-12 h-6 rounded-full transition-colors ${config.enabled ? 'bg-purple-600' : 'bg-gray-600'
                        }`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                </button>
            </div>

            {config.enabled && (
                <>
                    {/* Ollama endpoint */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                            Ollama Endpoint
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={config.endpoints.ollama || ''}
                                onChange={(e) => updateEndpoint('ollama', e.target.value)}
                                placeholder="http://localhost:11434"
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <button
                                onClick={onCheckConnection}
                                disabled={ollamaStatus.checking}
                                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                {ollamaStatus.checking ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                            </button>
                        </div>

                        {/* Connection status */}
                        <div className={`text-xs flex items-center gap-1 ${ollamaStatus.connected ? 'text-green-400' : 'text-gray-500'
                            }`}>
                            {ollamaStatus.connected ? (
                                <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    Connected • {ollamaStatus.models.length} models available
                                </>
                            ) : ollamaStatus.error ? (
                                <>
                                    <XCircle className="w-3 h-3 text-red-400" />
                                    <span className="text-red-400">{ollamaStatus.error}</span>
                                </>
                            ) : (
                                'Not connected'
                            )}
                        </div>
                    </div>

                    {/* Available models */}
                    {ollamaStatus.connected && ollamaStatus.models.length > 0 && (
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-white">
                                Available Models
                            </label>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {ollamaStatus.models.map(model => {
                                    const preset = Object.values(ON_PREM_MODEL_PRESETS).find(
                                        p => model.startsWith(p.modelId.split(':')[0])
                                    )
                                    return (
                                        <div
                                            key={model}
                                            className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{preset?.icon || '🤖'}</span>
                                                <div>
                                                    <div className="text-sm text-white">{model}</div>
                                                    {preset?.description && (
                                                        <div className="text-xs text-gray-500">{preset.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* vLLM endpoint */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                            vLLM Endpoint <span className="text-gray-500">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={config.endpoints.vllm || ''}
                            onChange={(e) => updateEndpoint('vllm', e.target.value)}
                            placeholder="http://localhost:8000"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    {/* Custom OpenAI-compatible */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                            Custom Endpoint <span className="text-gray-500">(OpenAI-compatible)</span>
                        </label>
                        <input
                            type="text"
                            value={config.endpoints.custom || ''}
                            onChange={(e) => updateEndpoint('custom', e.target.value)}
                            placeholder="https://your-server.com/v1"
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                    </div>

                    {/* Popular model presets */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-white">
                            Recommended Models
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Install these with Ollama: <code className="text-purple-400">ollama pull model-name</code>
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {['qwen2.5-coder-32b', 'deepseek-coder-v2', 'llama3.3-70b', 'mistral-nemo'].map(id => {
                                const preset = ON_PREM_MODEL_PRESETS[id]
                                if (!preset) return null
                                return (
                                    <div
                                        key={id}
                                        className="p-2 bg-white/5 rounded-lg text-xs"
                                    >
                                        <div className="flex items-center gap-1 text-white">
                                            <span>{preset.icon}</span>
                                            {preset.displayName}
                                        </div>
                                        <div className="text-gray-500 mt-0.5">{preset.description}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
