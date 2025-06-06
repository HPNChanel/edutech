import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/useAuth'
import { userService } from '@/services/userService'
import { 
  Settings as SettingsIcon,
  Bell,
  Lock,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  RefreshCw,
  Shield,
  Eye,
  Mail,
  Smartphone
} from 'lucide-react'

interface SettingsData {
  // Notification preferences
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyDigest: boolean
  courseUpdates: boolean
  
  // Privacy settings
  profileVisibility: 'public' | 'private' | 'friends'
  showOnlineStatus: boolean
  allowMessages: boolean
  
  // Appearance
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  
  // Learning preferences
  dailyGoal: number
  autoplay: boolean
  subtitles: boolean
  playbackSpeed: number
}

export default function SettingsPage() {
  const { user } = useCurrentUser()
  const { toast } = useToast()
  
  const [settings, setSettings] = useState<SettingsData>({
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    courseUpdates: true,
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowMessages: true,
    theme: 'system',
    language: 'en',
    timezone: 'UTC',
    dailyGoal: 30,
    autoplay: false,
    subtitles: false,
    playbackSpeed: 1.0
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setIsLoading(true)
      // In a real app, this would fetch user settings from the API
      // For now, we'll use default values
      const userSettings = {
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: true,
        courseUpdates: true,
        profileVisibility: 'public' as const,
        showOnlineStatus: true,
        allowMessages: true,
        theme: 'system' as const,
        language: 'en',
        timezone: user?.timezone || 'UTC',
        dailyGoal: 30,
        autoplay: false,
        subtitles: false,
        playbackSpeed: 1.0
      }
      
      setSettings(userSettings)
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true)
      
      // In a real app, this would save to the API
      console.log('Saving settings:', settings)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHasChanges(false)
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully."
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: true,
        courseUpdates: true,
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowMessages: true,
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        dailyGoal: 30,
        autoplay: false,
        subtitles: false,
        playbackSpeed: 1.0
      })
      setHasChanges(true)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Save Changes Alert */}
      {hasChanges && (
        <Alert>
          <Save className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You have unsaved changes.</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={loadSettings}>
                Discard
              </Button>
              <Button size="sm" onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Receive course updates and important announcements via email
                </p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Push Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Get notifications on your device when you're away
                </p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Weekly Digest</Label>
                <p className="text-xs text-muted-foreground">
                  Receive a summary of your learning progress every week
                </p>
              </div>
              <Switch
                checked={settings.weeklyDigest}
                onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Course Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when new content is added to your courses
                </p>
              </div>
              <Switch
                checked={settings.courseUpdates}
                onCheckedChange={(checked) => handleSettingChange('courseUpdates', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Profile Visibility</Label>
              <Select 
                value={settings.profileVisibility} 
                onValueChange={(value: 'public' | 'private' | 'friends') => 
                  handleSettingChange('profileVisibility', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="friends">Friends Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Control who can see your profile and learning progress
              </p>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Show Online Status</Label>
                <p className="text-xs text-muted-foreground">
                  Let others see when you're actively learning
                </p>
              </div>
              <Switch
                checked={settings.showOnlineStatus}
                onCheckedChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Allow Messages</Label>
                <p className="text-xs text-muted-foreground">
                  Let other users send you direct messages
                </p>
              </div>
              <Switch
                checked={settings.allowMessages}
                onCheckedChange={(checked) => handleSettingChange('allowMessages', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Theme</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => 
                  handleSettingChange('theme', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      System
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Language</Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => handleSettingChange('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Timezone</Label>
              <Select 
                value={settings.timezone} 
                onValueChange={(value) => handleSettingChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Learning Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Daily Learning Goal (minutes)</Label>
              <Input
                type="number"
                min="5"
                max="480"
                value={settings.dailyGoal}
                onChange={(e) => handleSettingChange('dailyGoal', parseInt(e.target.value) || 30)}
              />
              <p className="text-xs text-muted-foreground">
                Set your target learning time per day
              </p>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Autoplay Next Lesson</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically start the next lesson when one finishes
                </p>
              </div>
              <Switch
                checked={settings.autoplay}
                onCheckedChange={(checked) => handleSettingChange('autoplay', checked)}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Show Subtitles</Label>
                <p className="text-xs text-muted-foreground">
                  Display subtitles for video content when available
                </p>
              </div>
              <Switch
                checked={settings.subtitles}
                onCheckedChange={(checked) => handleSettingChange('subtitles', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Default Playback Speed</Label>
              <Select 
                value={settings.playbackSpeed.toString()} 
                onValueChange={(value) => handleSettingChange('playbackSpeed', parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x</SelectItem>
                  <SelectItem value="0.75">0.75x</SelectItem>
                  <SelectItem value="1">1x (Normal)</SelectItem>
                  <SelectItem value="1.25">1.25x</SelectItem>
                  <SelectItem value="1.5">1.5x</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button variant="outline" onClick={handleResetSettings}>
          Reset to Defaults
        </Button>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={loadSettings}
            disabled={!hasChanges || isSaving}
          >
            Discard Changes
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
