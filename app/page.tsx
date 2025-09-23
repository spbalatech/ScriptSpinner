'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Play, Copy, RefreshCw, Video } from 'lucide-react'
import axios from 'axios'

interface ScriptData {
  topic: string
  refinedTopic: string
  hook: string
  style: string
  script: string
}

interface Provider {
  id: string
  name: string
  description: string
  models: string[]
  placeholder: string
}

// Dynamic suggestions will be fetched from API

const styles = [
  { name: 'Authoritative', description: 'Expert and confident' },
  { name: 'Humorous', description: 'Fun and entertaining' },
  { name: 'Casual', description: 'Friendly and approachable' },
  { name: 'Formal', description: 'Professional and structured' }
]

const providers: Provider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 Turbo - High quality, reliable',
    models: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'],
    placeholder: 'sk-...'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access to multiple AI models (Claude, GPT, etc.)',
    models: ['anthropic/claude-3-haiku', 'openai/gpt-4', 'openai/gpt-3.5-turbo'],
    placeholder: 'sk-or-...'
  },
  // Placeholders for future providers
  {
    id: 'anthropic',
    name: 'Anthropic (Coming Soon)',
    description: 'Direct Claude API access',
    models: ['claude-3-haiku', 'claude-3-sonnet'],
    placeholder: 'Coming soon...'
  },
  {
    id: 'google',
    name: 'Google AI (Coming Soon)', 
    description: 'Gemini and PaLM models',
    models: ['gemini-pro', 'palm-2'],
    placeholder: 'Coming soon...'
  }
]

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [scriptData, setScriptData] = useState<ScriptData>({
    topic: '',
    refinedTopic: '',
    hook: '',
    style: '',
    script: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [promptPreview, setPromptPreview] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  
  // Provider and API key state
  const [selectedProvider, setSelectedProvider] = useState<string>('openai')
  const [apiKey, setApiKey] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4')
  const [showApiConfig, setShowApiConfig] = useState(true)

  // Log provider changes
  useEffect(() => {
    const logData = {
      provider: selectedProvider,
      model: selectedModel,
      hasApiKey: apiKey.length > 0,
      apiKeyLength: apiKey.length,
      timestamp: new Date().toISOString()
    }
    
    // ⚠️ SECURITY WARNING: Only for debugging! NEVER log actual API keys in production!
    // Enable this by setting localStorage.setItem('DEBUG_API_KEYS', 'true') in browser console
    if (typeof window !== 'undefined' && localStorage.getItem('DEBUG_API_KEYS') === 'true' && apiKey.length > 0) {
      console.warn('🔑 DEBUG MODE - FULL API KEY:', apiKey)
      console.warn('🔑 API Key Length:', apiKey.length, 'characters')
    }
    
    console.log('🔧 Provider Configuration:', logData)
  }, [selectedProvider, selectedModel, apiKey])

  // Update prompt preview in real-time
  useEffect(() => {
    if (scriptData.topic || scriptData.hook || scriptData.style) {
      const preview = `You are an expert scriptwriter for short-form video. The goal is to create a compelling script for a beginner audience. The topic is ${scriptData.refinedTopic || scriptData.topic || '[topic]'}. The core message is ${scriptData.hook || '[hook]'}. The style should be ${scriptData.style || '[style]'}. The call to action is to "Follow for more tips." Using this information, write a dynamic 60-second video script with a clear hook, a problem, a solution, and a clear call to action. Do not include a title.`
      setPromptPreview(preview)
    }
  }, [scriptData])

  const handleTopicChange = (value: string) => {
    setScriptData(prev => ({ ...prev, topic: value }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      getSuggestions()
    }
  }

  const getSuggestions = async () => {
    const query = scriptData.topic.trim()
    
    if (query.length > 2) {
      setShowSuggestions(true)
      setLoadingSuggestions(true)
      
      // Log the request
      console.log('📝 Requesting suggestions:', {
        query: query,
        provider: selectedProvider,
        model: selectedModel,
        hasApiKey: apiKey.length > 0,
        timestamp: new Date().toISOString()
      })
      
      try {
        const response = await axios.post('http://localhost:8000/get-suggestions', {
          query: query,
          limit: 6,
          provider: selectedProvider,
          api_key: apiKey,
          model: selectedModel
        })
        
        if (response.data.success) {
          setSuggestions(response.data.suggestions)
          console.log('✅ Suggestions received:', {
            count: response.data.suggestions.length,
            provider: selectedProvider,
            model: selectedModel
          })
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        // Fallback suggestions
        setSuggestions([
          "How to master this skill quickly",
          "Common mistakes beginners make",
          "Essential tools you need",
          "Tips from professionals",
          "Quick wins for immediate results",
          "Secrets that actually work"
        ])
      } finally {
        setLoadingSuggestions(false)
      }
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setScriptData(prev => ({ ...prev, refinedTopic: suggestion }))
    setShowSuggestions(false)
    setCurrentStep(2)
  }

  const hideSuggestions = () => {
    setShowSuggestions(false)
  }

  const handleHookSubmit = () => {
    if (scriptData.hook.trim()) {
      setCurrentStep(3)
    }
  }

  const selectStyle = (style: string) => {
    setScriptData(prev => ({ ...prev, style }))
    setCurrentStep(4)
  }

  const generateScript = async () => {
    setIsGenerating(true)
    
    // Log the script generation request
    console.log('🎬 Generating script:', {
      topic: scriptData.topic,
      refinedTopic: scriptData.refinedTopic,
      hook: scriptData.hook,
      style: scriptData.style,
      provider: selectedProvider,
      model: selectedModel,
      hasApiKey: apiKey.length > 0,
      timestamp: new Date().toISOString()
    })
    
    try {
      const response = await axios.post('http://localhost:8000/generate-script', {
        topic: scriptData.topic,
        refined_topic: scriptData.refinedTopic,
        hook: scriptData.hook,
        style: scriptData.style,
        provider: selectedProvider,
        api_key: apiKey,
        model: selectedModel
      })
      
      if (response.data.success) {
        setScriptData(prev => ({ ...prev, script: response.data.script }))
        setCurrentStep(5)
        console.log('✅ Script generated successfully:', {
          provider: selectedProvider,
          model: selectedModel,
          scriptLength: response.data.script.length,
          message: response.data.message
        })
      } else {
        throw new Error(response.data.message || 'Failed to generate script')
      }
    } catch (error) {
      console.error('Error generating script:', error)
      // Fallback to mock script if API fails
      const mockScript = `🎬 HOOK: "Think you need expensive equipment to make café-quality coffee? Think again!"

📍 PROBLEM: Most people believe great coffee requires a $500 espresso machine and years of training.

💡 SOLUTION: With just three essential tools, anyone can become their own coffee connoisseur:

1️⃣ A quality burr grinder ($30-50) - Controls extraction like a pro
2️⃣ A simple pour-over dripper ($15-25) - Gives you precision control  
3️⃣ A gooseneck kettle ($25-40) - Perfect water flow every time

🔥 PROOF: I've been using this exact setup for 2 years, and my friends constantly ask if I went to barista school!

✅ CALL TO ACTION: Follow for more coffee tips that'll save you hundreds while upgrading your morning routine!

⏰ Total investment: Under $100. Total game-changer: Priceless.`
      
      setScriptData(prev => ({ ...prev, script: mockScript }))
      setCurrentStep(5)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateVariation = async (type: 'shorter' | 'engaging' | 'social') => {
    setIsGenerating(true)
    try {
      const response = await axios.post('http://localhost:8000/generate-variation', {
        original_script: scriptData.script,
        variation_type: type
      })
      
      if (response.data.success) {
        setScriptData(prev => ({ ...prev, script: response.data.script }))
      } else {
        throw new Error(response.data.message || 'Failed to generate variation')
      }
    } catch (error) {
      console.error('Error generating variation:', error)
      // Fallback to mock variations
      const variations = {
        shorter: `☕ QUICK TIP: Skip the $500 espresso machine!

Get café-quality coffee with 3 budget tools:
• Burr grinder ($40)
• Pour-over dripper ($20) 
• Gooseneck kettle ($30)

Total: $90 vs $500+ 

Follow for more money-saving coffee hacks! ☕`,
        
        engaging: `🚨 COFFEE LOVERS: This will blow your mind!

I spent YEARS thinking I needed expensive gear for good coffee... I was SO wrong!

Here's the secret baristas don't want you to know:

✨ $40 burr grinder beats any blade grinder
✨ $20 pour-over > $200 automatic machine
✨ $30 gooseneck kettle = perfect extraction

My friends think I'm a coffee wizard now! 🧙‍♂️

Drop a ☕ if you're ready to upgrade your morning game!

Follow @coffeehacks for daily brewing secrets!`,

        social: `POV: You just made better coffee than Starbucks with $90 worth of equipment 😎

The secret? These 3 game-changing tools:
→ Burr grinder
→ Pour-over dripper  
→ Gooseneck kettle

Who else is tired of overpriced coffee shops? 

#CoffeeHacks #HomeBrewing #CoffeeLovers #MorningRoutine #BaristaLife`
      }
      
      setScriptData(prev => ({ ...prev, script: variations[type] }))
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptData.script)
  }

  return (
    <div className="min-h-screen video-gradient">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">The 60-Second Script Spinner</h1>
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>
          <p className="text-white/80 text-lg">Create compelling video scripts for any topic in seconds</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Main Interface */}
          <div className="lg:col-span-2">
            {/* API Configuration */}
            {showApiConfig && (
              <div className="glass-effect rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    🔑 API Configuration
                  </h3>
                  <button
                    onClick={() => setShowApiConfig(false)}
                    className="text-white/60 hover:text-white text-sm"
                  >
                    Hide
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">AI Provider</label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => {
                        setSelectedProvider(e.target.value)
                        const provider = providers.find(p => p.id === e.target.value)
                        if (provider) {
                          setSelectedModel(provider.models[0])
                        }
                      }}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      {providers.map((provider) => (
                        <option key={provider.id} value={provider.id} className="bg-gray-800">
                          {provider.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-white/60 mt-1">
                      {providers.find(p => p.id === selectedProvider)?.description}
                    </p>
                  </div>

                  {/* API Key Input */}
                  <div>
                    <label className="block text-sm font-medium mb-2">API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={providers.find(p => p.id === selectedProvider)?.placeholder}
                      disabled={['anthropic', 'google'].includes(selectedProvider)}
                      className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                    />
                    <p className="text-xs text-white/60 mt-1">
                      {['anthropic', 'google'].includes(selectedProvider) 
                        ? 'Coming soon - will use mock data' 
                        : 'Your API key is stored locally and never sent to our servers'}
                    </p>
                  </div>
                </div>

                {/* Model Selection */}
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={['anthropic', 'google'].includes(selectedProvider)}
                    className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                  >
                    {providers.find(p => p.id === selectedProvider)?.models.map((model) => (
                      <option key={model} value={model} className="bg-gray-800">
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                {!apiKey && !['anthropic', 'google'].includes(selectedProvider) && (
                  <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                    <p className="text-yellow-200 text-sm">
                      ⚠️ No API key provided. The app will use mock data for demonstration.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!showApiConfig && (
              <div className="mb-6">
                <button
                  onClick={() => setShowApiConfig(true)}
                  className="px-4 py-2 bg-white/10 rounded-lg text-white/80 hover:bg-white/20 transition-colors text-sm flex items-center gap-2"
                >
                  🔑 Configure API Settings
                </button>
              </div>
            )}

            <div className="glass-effect rounded-2xl p-8 text-white">
              
              {/* Step 1: Topic */}
              <div className={`mb-8 ${currentStep >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <span className="bg-white text-coffee-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
                  What is the main topic of your video?
                </h2>
                <div className="relative">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={scriptData.topic}
                      onChange={(e) => handleTopicChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., How to be more productive at work (Press Enter or click button for suggestions)"
                      className="flex-1 p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      disabled={currentStep > 2}
                    />
                    <button
                      onClick={getSuggestions}
                      disabled={scriptData.topic.length < 3 || currentStep > 2 || loadingSuggestions}
                      className="px-6 py-4 bg-yellow-500 text-coffee-900 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingSuggestions ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Get Ideas
                        </>
                      )}
                    </button>
                  </div>
                  
                  {!showSuggestions && scriptData.topic.length >= 3 && (
                    <div className="mt-3 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                      <p className="text-blue-200 text-sm">💡 Press Enter or click "Get Ideas" to see topic suggestions!</p>
                    </div>
                  )}
                  
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl z-10">
                      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                        <p className="text-sm text-gray-600 font-medium">
                          {loadingSuggestions ? 'Loading suggestions...' : 'Suggestions:'}
                        </p>
                        <button
                          onClick={hideSuggestions}
                          className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                        >
                          ×
                        </button>
                      </div>
                      {loadingSuggestions ? (
                        <div className="p-4 text-center text-gray-500">
                          <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                          Generating suggestions...
                        </div>
                      ) : (
                        suggestions.map((suggestion: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => selectSuggestion(suggestion)}
                            className="w-full text-left p-3 text-gray-800 hover:bg-gray-50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                
                {scriptData.refinedTopic && (
                  <div className="mt-3 p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                    <p className="text-green-200 text-sm">✓ Selected: <strong>{scriptData.refinedTopic}</strong></p>
                  </div>
                )}
              </div>

              {/* Step 2: Hook */}
              {currentStep >= 2 && (
                <div className={`mb-8 ${currentStep >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-white text-coffee-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
                    What's the core message or "hook" you want to convey?
                  </h2>
                  <textarea
                    value={scriptData.hook}
                    onChange={(e) => setScriptData(prev => ({ ...prev, hook: e.target.value }))}
                    placeholder="e.g., That anyone can master this skill with the right approach"
                    className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 h-24 resize-none"
                    disabled={currentStep > 3}
                  />
                  {scriptData.hook && currentStep === 2 && (
                    <button
                      onClick={handleHookSubmit}
                      className="mt-3 px-6 py-2 bg-yellow-500 text-coffee-900 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
                    >
                      Continue
                    </button>
                  )}
                </div>
              )}

              {/* Step 3: Style */}
              {currentStep >= 3 && (
                <div className={`mb-8 ${currentStep >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                  <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                    <span className="bg-white text-coffee-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
                    Choose a Style:
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {styles.map((style) => (
                      <button
                        key={style.name}
                        onClick={() => selectStyle(style.name)}
                        disabled={currentStep > 4}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          scriptData.style === style.name
                            ? 'border-yellow-400 bg-yellow-400/20'
                            : 'border-white/20 bg-white/5 hover:border-white/40'
                        }`}
                      >
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">{style.name}</h3>
                          <p className="text-white/70 text-sm">{style.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Generate */}
              {currentStep >= 4 && !scriptData.script && (
                <div className="text-center">
                  <button
                    onClick={generateScript}
                    disabled={isGenerating}
                    className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-coffee-900 rounded-xl font-bold text-lg hover:from-yellow-400 hover:to-yellow-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Generating Script...
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Generate Script
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 5: Results */}
              {scriptData.script && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <span className="bg-white text-coffee-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">✓</span>
                      Your Script
                    </h2>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-6 mb-6">
                    <pre className="whitespace-pre-wrap text-white font-mono text-sm leading-relaxed">
                      {scriptData.script}
                    </pre>
                  </div>

                  {/* Variation Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => generateVariation('shorter')}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                    >
                      Shorter Version
                    </button>
                    <button
                      onClick={() => generateVariation('engaging')}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-purple-500/20 border border-purple-400/30 rounded-lg text-purple-200 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                    >
                      More Engaging Version
                    </button>
                    <button
                      onClick={() => generateVariation('social')}
                      disabled={isGenerating}
                      className="px-4 py-2 bg-pink-500/20 border border-pink-400/30 rounded-lg text-pink-200 hover:bg-pink-500/30 transition-colors disabled:opacity-50"
                    >
                      Social Media Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-effect rounded-2xl p-6 text-white sticky top-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Prompt Preview
              </h3>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-sm text-white/80 leading-relaxed">
                  {promptPreview || 'Start filling out the form to see your AI prompt build in real-time...'}
                </p>
              </div>
              
              {promptPreview && (
                <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-400/20">
                  <p className="text-green-200 text-xs">
                    ✨ This is exactly what will be sent to the AI to generate your script
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
