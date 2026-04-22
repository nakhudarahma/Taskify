import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, MessageCircle, Shield, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type AIPersonality = "ruthless_coach" | "sarcastic_friend" | "drill_sergeant" | "calm_therapist";

const personalities: {
  id: AIPersonality;
  title: string;
  description: string;
  icon: typeof Flame;
  color: string;
}[] = [
    {
      id: "ruthless_coach",
      title: "Ruthless Coach",
      description: "No excuses accepted. Every missed deadline is a failure you chose.",
      icon: Flame,
      color: "bg-destructive/10 text-destructive border-destructive/20",
    },
    {
      id: "sarcastic_friend",
      title: "Sarcastic Friend",
      description: "Will roast your procrastination while pretending to care.",
      icon: MessageCircle,
      color: "bg-warning/10 text-warning border-warning/20",
    },
    {
      id: "drill_sergeant",
      title: "Drill Sergeant",
      description: "Orders, not suggestions. You will comply or face consequences.",
      icon: Shield,
      color: "bg-primary/10 text-primary border-primary/20",
    },
    {
      id: "calm_therapist",
      title: "Calm Therapist",
      description: "Understands your avoidance patterns. Still won't let you off the hook.",
      icon: Heart,
      color: "bg-accent/10 text-accent border-accent/20",
    },
  ];

interface PersonalitySelectionProps {
  onSelected: () => void;
}

const PersonalitySelection = ({ onSelected }: PersonalitySelectionProps) => {
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<AIPersonality | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);

    const { error } = await updateProfile({ ai_personality: selected });

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save personality selection." });
    } else {
      localStorage.setItem('has_personality', 'true');
      onSelected();
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background hero-pattern flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full space-y-8"
      >
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Pick a personality (commit or die)
          </h1>
          <p className="text-muted-foreground">
            This determines how Taskify talks to you. Choose wisely.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {personalities.map((p, index) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelected(p.id)}
              className={`glass-card p-6 text-left transition-all border-2 ${selected === p.id
                  ? "border-primary shadow-lg"
                  : "border-transparent hover:border-border"
                }`}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${p.color} mb-4`}>
                <p.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.description}</p>
            </motion.button>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            disabled={!selected || saving}
            onClick={handleConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/85 gap-2 px-8 btn-cheerful shadow-lg h-14 text-base"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              "Lock It In"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PersonalitySelection;
