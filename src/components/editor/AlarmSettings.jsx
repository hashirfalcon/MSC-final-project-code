import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Volume2, Bell, Eye, MessageSquare, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AlarmSettings = ({ alarmConfig, onAlarmConfigChange }) => {
  const defaultConfig = {
    audioEnabled: true,
    audioFrequency: 1000,
    audioDuration: 300,
    audioVolume: 0.3,
    voiceEnabled: true,
    voiceRate: 1.0,
    voicePitch: 1.0,
    visualEnabled: true,
    visualDuration: 1700,
    notificationEnabled: true,
    alarmType: "critical", // critical, warning, info
  };

  // Merge with default config to ensure all fields are present
  const config = { ...defaultConfig, ...alarmConfig };

  // Debug logging
  console.log("AlarmSettings - alarmConfig prop:", alarmConfig);
  console.log("AlarmSettings - merged config:", config);

  const updateConfig = (key, value) => {
    const newConfig = { ...config, [key]: value };
    console.log("AlarmSettings - updating config:", key, value, newConfig);
    onAlarmConfigChange(newConfig);
  };

  const testAlarm = (type) => {
    if (type === "audio" && config.audioEnabled) {
      playTestSound(config.audioFrequency, config.audioDuration, config.audioVolume);
    } else if (type === "voice" && config.voiceEnabled) {
      speakTest("This is a test alarm alert", config.voiceRate, config.voicePitch);
    } else if (type === "notification" && config.notificationEnabled) {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Test Alarm', {
            body: 'This is a test notification',
            icon: '/favicon.ico'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Test Alarm', {
                body: 'This is a test notification',
                icon: '/favicon.ico'
              });
            }
          });
        }
      }
    }
  };

  const playTestSound = (frequency, duration, volume) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.error("Error playing test sound:", error);
    }
  };

  const speakTest = (text, rate, pitch) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const getAlarmTypeColor = (type) => {
    switch(type) {
      case "critical": return "bg-red-500/10 text-red-600 border-red-500/20";
      case "warning": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "info": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            🚨 Alarm Settings
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure how alerts are triggered when this rule matches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Severity:</Label>
          <Select value={config.alarmType} onValueChange={(value) => updateConfig("alarmType", value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">🔴 Critical</SelectItem>
              <SelectItem value="warning">🟡 Warning</SelectItem>
              <SelectItem value="info">🔵 Info</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Audio Alarm Settings */}
      <div className="space-y-4 p-4 bg-white rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-blue-600" />
            <div>
              <Label className="font-semibold">Audio Alarm</Label>
              <p className="text-xs text-muted-foreground">Play beep sound</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.audioEnabled}
              onCheckedChange={(checked) => updateConfig("audioEnabled", checked)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => testAlarm("audio")}
              disabled={!config.audioEnabled}
            >
              <Play className="w-3 h-3 mr-1" />
              Test
            </Button>
          </div>
        </div>

        {config.audioEnabled && (
          <div className="space-y-3 pl-7">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-sm">Frequency: {config.audioFrequency}Hz</Label>
                <Badge variant="outline" className="text-xs">
                  {config.audioFrequency < 500 ? "Low" : config.audioFrequency > 1500 ? "High" : "Medium"}
                </Badge>
              </div>
              <Slider
                value={[config.audioFrequency]}
                onValueChange={([value]) => updateConfig("audioFrequency", value)}
                min={200}
                max={2000}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Duration: {config.audioDuration}ms</Label>
              <Slider
                value={[config.audioDuration]}
                onValueChange={([value]) => updateConfig("audioDuration", value)}
                min={100}
                max={1000}
                step={50}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Volume: {Math.round(config.audioVolume * 100)}%</Label>
              <Slider
                value={[config.audioVolume * 100]}
                onValueChange={([value]) => updateConfig("audioVolume", value / 100)}
                min={0}
                max={100}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Voice Alarm Settings */}
      <div className="space-y-4 p-4 bg-white rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <div>
              <Label className="font-semibold">Voice Alarm</Label>
              <p className="text-xs text-muted-foreground">Text-to-speech alert</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.voiceEnabled}
              onCheckedChange={(checked) => updateConfig("voiceEnabled", checked)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => testAlarm("voice")}
              disabled={!config.voiceEnabled}
            >
              <Play className="w-3 h-3 mr-1" />
              Test
            </Button>
          </div>
        </div>

        {config.voiceEnabled && (
          <div className="space-y-3 pl-7">
            <div className="space-y-2">
              <Label className="text-sm">Speech Rate: {config.voiceRate.toFixed(1)}x</Label>
              <Slider
                value={[config.voiceRate * 10]}
                onValueChange={([value]) => updateConfig("voiceRate", value / 10)}
                min={5}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Pitch: {config.voicePitch.toFixed(1)}</Label>
              <Slider
                value={[config.voicePitch * 10]}
                onValueChange={([value]) => updateConfig("voicePitch", value / 10)}
                min={5}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Visual Alarm Settings */}
      <div className="space-y-4 p-4 bg-white rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-red-600" />
            <div>
              <Label className="font-semibold">Visual Alarm</Label>
              <p className="text-xs text-muted-foreground">Full-screen flashing alert</p>
            </div>
          </div>
          <Switch
            checked={config.visualEnabled}
            onCheckedChange={(checked) => updateConfig("visualEnabled", checked)}
          />
        </div>

        {config.visualEnabled && (
          <div className="space-y-2 pl-7">
            <Label className="text-sm">Flash Duration: {config.visualDuration}ms</Label>
            <Slider
              value={[config.visualDuration]}
              onValueChange={([value]) => updateConfig("visualDuration", value)}
              min={500}
              max={3000}
              step={100}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Browser Notification Settings */}
      <div className="space-y-4 p-4 bg-white rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-600" />
            <div>
              <Label className="font-semibold">Desktop Notification</Label>
              <p className="text-xs text-muted-foreground">Browser notification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.notificationEnabled}
              onCheckedChange={(checked) => updateConfig("notificationEnabled", checked)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => testAlarm("notification")}
              disabled={!config.notificationEnabled}
            >
              <Play className="w-3 h-3 mr-1" />
              Test
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm font-medium text-blue-900 mb-2">Active Alarms:</p>
        <div className="flex flex-wrap gap-2">
          {config.audioEnabled && (
            <Badge variant="outline" className="bg-white">
              🔊 Audio ({config.audioFrequency}Hz)
            </Badge>
          )}
          {config.voiceEnabled && (
            <Badge variant="outline" className="bg-white">
              🗣️ Voice
            </Badge>
          )}
          {config.visualEnabled && (
            <Badge variant="outline" className="bg-white">
              🚨 Visual
            </Badge>
          )}
          {config.notificationEnabled && (
            <Badge variant="outline" className="bg-white">
              📬 Notification
            </Badge>
          )}
          {!config.audioEnabled && !config.voiceEnabled && !config.visualEnabled && !config.notificationEnabled && (
            <Badge variant="outline" className="bg-gray-100 text-gray-600">
              No alarms enabled
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AlarmSettings;

