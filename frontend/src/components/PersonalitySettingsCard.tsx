import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, MessageCircle, Shield, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PasswordConfirmDialog from "@/components/PasswordConfirmDialog";
import type { AIPersonality } from "@/components/PersonalitySelection";

const personalities: {
  id: AIPersonality;
  title: string;
  description: string;
  icon: typeof Flame;
}[] = [
  {
    id: "ruthless_coach",
    title: "Ruthless Coach",
    description: "No excuses accepted. Every missed deadline is a failure you chose.",
    icon: Flame,
  },
  {
    id: "sarcastic_friend",
    title: "Sarcastic Friend",
    description: "Will roast your procrastination while pretending to care.",
    icon: MessageCircle,
  },
  {
    id: "drill_sergeant",
    title: "Drill Sergeant",
    description: "Orders, not suggestions. You will comply or face consequences.",
    icon: Shield,
  },
  {
    id: "calm_therapist",
    title: "Calm Therapist",
    description: "Understands your avoidance patterns. Still holds you accountable.",
    icon: Heart,
  },
];

interface PersonalitySettingsCardProps {
  animationDelay?: number;
}

const PersonalitySettingsCard = ({ animationDelay = 0.15 }: PersonalitySettingsCardProps) => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();

  const currentPersonality = (profile?.ai_personality as AIPersonality) || null;
  const [selectedPersonality, setSelectedPersonality] = useState<string>(currentPersonality || "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasChanged = selectedPersonality !== (currentPersonality || "");

  const handleApply = () => {
    if (!hasChanged || !selectedPersonality) return;
    setShowConfirm(true);
  };

  const handleConfirmed = async () => {
    setShowConfirm(false);
    setSaving(true);

    const { error } = await updateProfile({ ai_personality: selectedPersonality });

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Could not apply personality change. Try again.",
      });
    } else {
      toast({
        title: "Personality updated",
        description: `AI voice set to ${personalities.find((p) => p.id === selectedPersonality)?.title || selectedPersonality}.`,
      });
    }

    setSaving(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: animationDelay }}
      >
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Voice & Personality</CardTitle>
                <CardDescription>
                  Choose how Taskify communicates with you
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <RadioGroup
              value={selectedPersonality}
              onValueChange={setSelectedPersonality}
              className="space-y-3"
            >
              {personalities.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPersonality === p.id;
                return (
                  <Label
                    key={p.id}
                    htmlFor={`personality-${p.id}`}
                    className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={p.id}
                      id={`personality-${p.id}`}
                      className="mt-0.5"
                    />
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground leading-tight">
                          {p.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>

            <Button
              onClick={handleApply}
              disabled={!hasChanged || saving}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/85 h-11"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                "Apply Personality"
              )}
            </Button>

            {currentPersonality && (
              <p className="text-xs text-muted-foreground text-center">
                Current: {personalities.find((p) => p.id === currentPersonality)?.title || currentPersonality}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <PasswordConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirmed={handleConfirmed}
      />
    </>
  );
};

export default PersonalitySettingsCard;
