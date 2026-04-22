import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { User, LogOut, Save, Volume2, VolumeX, BellRing } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PersonalitySettingsCard from "@/components/PersonalitySettingsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Reminders are now set per-task at creation time - no global defaults

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, updateProfile, signOut } = useAuth();
  
  const [settings, setSettings] = useState({
    name: profile?.display_name || "",
    voiceFeedback: profile?.voice_feedback_enabled ?? true,
  });
  const [voiceVolume, setVoiceVolume] = useState([80]);
  const [saving, setSaving] = useState(false);

  // Test voice with current settings
  const testVoice = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance("Hello! This is how I'll sound when giving you updates.");
      utterance.rate = 0.92;
      utterance.pitch = 0.95;
      utterance.volume = voiceVolume[0] / 100;
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoiceNames = ['Daniel', 'Alex', 'Tom', 'Oliver', 'Microsoft Guy Online', 'Microsoft David'];
      
      for (const voiceName of preferredVoiceNames) {
        const voice = voices.find(v => v.name.includes(voiceName) && v.lang.startsWith('en'));
        if (voice) {
          utterance.voice = voice;
          break;
        }
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, [voiceVolume]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      display_name: settings.name,
      voice_feedback_enabled: settings.voiceFeedback,
    });
    setSaving(false);
    
    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save settings" });
    } else {
      toast({ title: "Settings saved.", description: "Your preferences have been updated." });
    }
  };

  const handleLogout = async () => {
    // Cancel any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    await signOut();
    navigate("/");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Profile</CardTitle>
                  <CardDescription>Your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input id="name" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="bg-secondary/50" placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile?.email || ""} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Voice Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  {settings.voiceFeedback ? <Volume2 className="w-5 h-5 text-accent" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div>
                  <CardTitle className="text-lg">Voice Settings</CardTitle>
                  <CardDescription>Configure how Taskify speaks to you</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">AI Voice Feedback</p>
                  <p className="text-sm text-muted-foreground">Hear audio confirmations and responses</p>
                </div>
                <Switch checked={settings.voiceFeedback} onCheckedChange={(checked) => setSettings({ ...settings, voiceFeedback: checked })} />
              </div>
              
              {settings.voiceFeedback && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">Voice Volume</p>
                    <span className="text-sm text-muted-foreground">{voiceVolume[0]}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                    <Slider
                      value={voiceVolume}
                      onValueChange={setVoiceVolume}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="sm" onClick={testVoice} className="gap-2">
                    <Volume2 className="w-4 h-4" />
                    Test Voice
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Voice & Personality */}
        <PersonalitySettingsCard animationDelay={0.15} />

        {/* Reminder Info Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <BellRing className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Reminders</CardTitle>
                  <CardDescription>How task reminders work</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Reminders are set individually for each task when you create them.</p>
                <p>When creating a task (voice or manual), you'll be asked:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>When is this task due? (date and time)</li>
                  <li>When would you like to be reminded?</li>
                </ul>
                <p>You can also edit reminder times from your task list.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground hover:bg-primary/85 gap-2 btn-cheerful h-12">
            {saving ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-destructive/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Sign Out</p>
                  <p className="text-sm text-muted-foreground">Log out of your Taskify account</p>
                </div>
                <Button variant="outline" onClick={handleLogout} className="gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
