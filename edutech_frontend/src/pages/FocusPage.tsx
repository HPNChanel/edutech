import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Music, 
  Image as ImageIcon,
  Maximize,
  Minimize,
  Volume2,
  Clock,
  Target,
  Trophy,
  Flame,
  Calendar,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { focusService } from '@/services/focusService'
import { toast } from 'react-hot-toast'

interface FocusSession {
  id?: number
  duration_minutes: number
  session_type: 'focus' | 'break' | 'long_break'
  notes?: string
}

interface FocusSettings {
  default_focus_duration: number
  default_short_break: number
  default_long_break: number
  sessions_until_long_break: number
  auto_start_breaks: boolean
  auto_start_focus: boolean
  sound_enabled: boolean
}

const QUICK_TIMES = [
  { value: 25, label: '25 min', color: 'from-blue-500 to-blue-600' },
  { value: 30, label: '30 min', color: 'from-purple-500 to-purple-600' },
  { value: 50, label: '50 min', color: 'from-orange-500 to-orange-600' }
]

export default function FocusPage() {
  // Auth
  const { user } = useAuth()

  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60) // seconds
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState(25) // minutes
  const [sessionType, setSessionType] = useState<'focus' | 'break' | 'long_break'>('focus')
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null)

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  
  // Background and music state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null)
  const [backgroundMusic, setBackgroundMusic] = useState<string | null>(null)
  const [musicVolume, setMusicVolume] = useState([0.5])
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [musicProgress, setMusicProgress] = useState(0)
  const [musicDuration, setMusicDuration] = useState(0)

  // Settings state
  const [settings, setSettings] = useState<FocusSettings>({
    default_focus_duration: 25,
    default_short_break: 5,
    default_long_break: 15,
    sessions_until_long_break: 4,
    auto_start_breaks: false,
    auto_start_focus: false,
    sound_enabled: true
  })

  // Animation state
  const [pulseAnimation, setPulseAnimation] = useState(false)

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)
  const musicInputRef = useRef<HTMLInputElement>(null)
  const completedRef = useRef<boolean>(false)

  // Load settings on mount
  useEffect(() => {
    loadFocusSettings()
  }, [])

  // Timer effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      completedRef.current = false
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1 && !completedRef.current) {
            completedRef.current = true
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  // Music progress tracking
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current
      const updateProgress = () => {
        if (audio.duration) {
          setMusicProgress((audio.currentTime / audio.duration) * 100)
          setMusicDuration(audio.duration)
        }
      }
      
      audio.addEventListener('timeupdate', updateProgress)
      audio.addEventListener('loadedmetadata', updateProgress)
      
      return () => {
        audio.removeEventListener('timeupdate', updateProgress)
        audio.removeEventListener('loadedmetadata', updateProgress)
      }
    }
  }, [backgroundMusic])

  // Focus mode effect - communicate with parent layout
  useEffect(() => {
    // Dispatch custom event to toggle focus mode
    const event = new CustomEvent('focusModeToggle', { 
      detail: { focusMode } 
    })
    window.dispatchEvent(event)

    return () => {
      // Clean up when component unmounts
      if (focusMode) {
        const event = new CustomEvent('focusModeToggle', { 
          detail: { focusMode: false } 
        })
        window.dispatchEvent(event)
      }
    }
  }, [focusMode])

  // Pulse animation effect
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setPulseAnimation(true)
        setTimeout(() => setPulseAnimation(false), 300)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isRunning])

  const loadFocusSettings = async () => {
    try {
      const response = await focusService.getSettings()
      setSettings(response.data)
      setDuration(response.data.default_focus_duration)
      setTimeLeft(response.data.default_focus_duration * 60)
    } catch (error) {
      console.error('Failed to load focus settings:', error)
    }
  }

  const startTimer = async () => {
    if (!currentSession) {
      try {
        const response = await focusService.createSession({
          duration_minutes: duration,
          session_type: sessionType
        })
        setCurrentSession(response.data)
      } catch {
        toast.error('Failed to start focus session')
        return
      }
    }
    completedRef.current = false
    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(duration * 60)
    setCurrentSession(null)
    completedRef.current = false
  }

  const handleTimerComplete = async () => {
    setIsRunning(false)
    
    // Complete the session in backend
    if (currentSession?.id) {
      try {
        await focusService.completeSession(currentSession.id, duration)
        
        if (sessionType === 'focus') {
          setSessionsCompleted(prev => prev + 1)
          toast.success(`🎉 Great work ${user?.name || 'there'}! Time for a well-deserved break!`, {
            duration: 5000,
            style: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontWeight: '600'
            },
          })
        }
      } catch (error) {
        console.error('Failed to complete session:', error)
      }
    }

    // Play completion sound if enabled
    if (settings.sound_enabled) {
      playCompletionSound()
    }

    // Auto-start next session if enabled
    if (sessionType === 'focus') {
      const shouldStartLongBreak = sessionsCompleted > 0 && 
        (sessionsCompleted + 1) % settings.sessions_until_long_break === 0
      
      if (settings.auto_start_breaks) {
        const nextSessionType = shouldStartLongBreak ? 'long_break' : 'break'
        const nextDuration = shouldStartLongBreak ? 
          settings.default_long_break : settings.default_short_break
        
        setSessionType(nextSessionType)
        setDuration(nextDuration)
        setTimeLeft(nextDuration * 60)
        setCurrentSession(null)
        
        if (settings.auto_start_focus) {
          setTimeout(() => startTimer(), 2000)
        }
      }
    } else if (settings.auto_start_focus) {
      setSessionType('focus')
      setDuration(settings.default_focus_duration)
      setTimeLeft(settings.default_focus_duration * 60)
      setCurrentSession(null)
      setTimeout(() => startTimer(), 2000)
    }
  }

  const playCompletionSound = () => {
    // Create a more pleasant completion sound
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext
    const audioContext = new AudioContext()
    
    // Create a pleasant chime sound
    const createTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime)
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + startTime + 0.1)
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration)
      
      oscillator.start(audioContext.currentTime + startTime)
      oscillator.stop(audioContext.currentTime + startTime + duration)
    }
    
    // Play a pleasant three-tone chime
    createTone(523, 0, 0.3)    // C5
    createTone(659, 0.15, 0.3) // E5
    createTone(784, 0.3, 0.4)  // G5
  }

  const setQuickTime = (minutes: number) => {
    if (!isRunning) {
      setDuration(minutes)
      setTimeLeft(minutes * 60)
      setSessionType('focus')
    }
  }

  const setCustomTime = (minutes: number) => {
    if (!isRunning && minutes >= 1 && minutes <= 180) {
      setDuration(minutes)
      setTimeLeft(minutes * 60)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMusicUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setBackgroundMusic(url)
      setIsMusicPlaying(false)
    }
  }

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsMusicPlaying(!isMusicPlaying)
    }
  }

  const updateMusicVolume = (value: number[]) => {
    setMusicVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value[0]
    }
  }

  const seekMusic = (value: number[]) => {
    if (audioRef.current && musicDuration) {
      const seekTime = (value[0] / 100) * musicDuration
      audioRef.current.currentTime = seekTime
      setMusicProgress(value[0])
    }
  }

  const getProgressPercentage = () => {
    const totalSeconds = duration * 60
    const elapsed = totalSeconds - timeLeft
    return (elapsed / totalSeconds) * 100
  }

  const getSessionTypeInfo = () => {
    switch (sessionType) {
      case 'focus':
        return {
          title: 'Focus Time',
          color: 'from-blue-500 via-purple-500 to-pink-500',
          icon: Target,
          description: 'Deep focus session'
        }
      case 'break':
        return {
          title: 'Short Break',
          color: 'from-green-400 via-blue-500 to-purple-600',
          icon: Clock,
          description: 'Quick refresh'
        }
      case 'long_break':
        return {
          title: 'Long Break',
          color: 'from-purple-400 via-pink-500 to-red-500',
          icon: Calendar,
          description: 'Extended rest'
        }
      default:
        return {
          title: 'Focus Time',
          color: 'from-blue-500 via-purple-500 to-pink-500',
          icon: Target,
          description: 'Deep focus session'
        }
    }
  }

  const sessionInfo = getSessionTypeInfo()

  const pageStyle = backgroundImage ? {
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {}

  return (
    <div 
      className={cn(
        "min-h-screen transition-all duration-500 relative overflow-hidden",
        backgroundImage 
          ? "bg-black/40" 
          : "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      )}
      style={pageStyle}
    >
      {/* Animated Background Elements */}
      {!backgroundImage && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-10 opacity-50">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
          </div>
        </div>
      )}

      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-0" />

      {/* Header Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all duration-300"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFocusMode(!focusMode)}
          className="bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all duration-300"
        >
          {focusMode ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          <span className="ml-2 hidden sm:inline">
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all duration-300"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        
        {/* Session Stats Card */}
        <Card className="mb-8 bg-white/10 border-white/20 backdrop-blur-xl text-white shadow-2xl">
          <CardContent className="px-6 py-4">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span>Today: {sessionsCompleted}</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span>Streak: 3</span>
              </div>
              <div className="flex items-center gap-2">
                <sessionInfo.icon className="h-5 w-5 text-blue-400" />
                <span>{sessionInfo.description}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Type Header */}
        <div className="text-center mb-8">
          <div className={cn(
            "inline-block px-6 py-3 rounded-2xl text-white font-semibold mb-4 bg-gradient-to-r shadow-lg",
            sessionInfo.color
          )}>
            <div className="flex items-center gap-2">
              <sessionInfo.icon className="h-5 w-5" />
              {sessionInfo.title}
            </div>
          </div>
        </div>

        {/* Main Timer Card */}
        <Card className="w-full max-w-lg bg-white/10 border-white/20 backdrop-blur-xl shadow-2xl text-white">
          <CardContent className="p-8">
            {/* Circular Progress Timer */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              {/* Outer glow ring */}
              <div className={cn(
                "absolute inset-0 rounded-full transition-all duration-1000",
                pulseAnimation && isRunning ? "shadow-2xl shadow-purple-500/50 scale-105" : "shadow-lg"
              )}>
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-white/20"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#progressGradient)"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
                    className="transition-all duration-1000 filter drop-shadow-lg"
                    strokeLinecap="round"
                  />
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="50%" stopColor="#764ba2" />
                      <stop offset="100%" stopColor="#f093fb" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              
              {/* Timer Display */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm opacity-70">
                    {Math.round(getProgressPercentage())}% complete
                  </div>
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Button
                onClick={isRunning ? pauseTimer : startTimer}
                size="lg"
                className={cn(
                  "h-16 w-16 rounded-full text-white shadow-lg transition-all duration-300 transform hover:scale-110",
                  isRunning 
                    ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700" 
                    : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                )}
              >
                {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </Button>
              
              <Button
                onClick={resetTimer}
                variant="outline"
                size="lg"
                className="h-16 w-16 rounded-full border-white/30 text-white hover:bg-white/20 transition-all duration-300 transform hover:scale-110"
                disabled={isRunning}
              >
                <RotateCcw className="h-6 w-6" />
              </Button>
            </div>

            {/* Quick Time Buttons */}
            {!isRunning && (
              <div className="flex items-center justify-center gap-3 mb-6">
                {QUICK_TIMES.map((time) => (
                  <Button
                    key={time.value}
                    onClick={() => setQuickTime(time.value)}
                    variant={duration === time.value ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "transition-all duration-300 transform hover:scale-105",
                      duration === time.value 
                        ? `bg-gradient-to-r ${time.color} text-white shadow-lg`
                        : "border-white/30 text-white hover:bg-white/20"
                    )}
                  >
                    {time.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Custom Time Input */}
            {!isRunning && (
              <div className="flex items-center gap-3 justify-center">
                <Input
                  type="number"
                  min="1"
                  max="180"
                  value={duration}
                  onChange={(e) => setCustomTime(parseInt(e.target.value) || 1)}
                  className="w-20 text-center bg-white/10 border-white/30 text-white placeholder-white/50"
                  placeholder="Min"
                />
                <span className="text-sm text-white/70">minutes</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media Controls */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {/* Background Upload */}
          <Button
            variant="outline"
            onClick={() => backgroundInputRef.current?.click()}
            className="bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all duration-300"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Background
          </Button>
          <input
            ref={backgroundInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackgroundUpload}
            className="hidden"
            aria-label="Upload background image"
          />

          {/* Music Upload */}
          <Button
            variant="outline"
            onClick={() => musicInputRef.current?.click()}
            className="bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20 transition-all duration-300"
          >
            <Music className="h-4 w-4 mr-2" />
            Music
          </Button>
          <input
            ref={musicInputRef}
            type="file"
            accept="audio/*"
            onChange={handleMusicUpload}
            className="hidden"
            aria-label="Upload background music"
          />
        </div>

        {/* Music Player */}
        {backgroundMusic && (
          <Card className="mt-6 w-full max-w-md bg-white/10 border-white/20 backdrop-blur-xl text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Button
                  onClick={toggleMusic}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                >
                  {isMusicPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <div className="flex-1">
                  <Slider
                    value={[musicProgress]}
                    onValueChange={seekMusic}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-white/70" />
                <div className="flex-1">
                  <Slider
                    value={musicVolume}
                    onValueChange={updateMusicVolume}
                    max={1}
                    step={0.01}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden Audio Element */}
        {backgroundMusic && (
          <audio
            ref={audioRef}
            src={backgroundMusic}
            loop
            onPlay={() => setIsMusicPlaying(true)}
            onPause={() => setIsMusicPlaying(false)}
          />
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Focus Settings
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Default Focus Duration</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Input
                      type="number"
                      min="1"
                      max="180"
                      value={settings.default_focus_duration}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        default_focus_duration: parseInt(e.target.value) || 25
                      }))}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">minutes</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Sound Notifications</Label>
                  <Switch
                    checked={settings.sound_enabled}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      sound_enabled: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Auto-start Breaks</Label>
                  <Switch
                    checked={settings.auto_start_breaks}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      auto_start_breaks: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Auto-start Focus</Label>
                  <Switch
                    checked={settings.auto_start_focus}
                    onCheckedChange={(checked) => setSettings(prev => ({
                      ...prev,
                      auto_start_focus: checked
                    }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setShowSettings(false)}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 