import { motion, useInView } from "framer-motion";
import { Mic, ArrowRight, Sparkles, Clock, BarChart3, Calendar, CheckCircle, Bell, MessageSquare, ShieldAlert, Skull, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const howItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px" });

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background hero-pattern">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Mic className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground leading-tight">Taskify</span>
              <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">Your voice-powered task assistant</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-primary">
                Login
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/85 btn-cheerful shadow-md">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-sm text-foreground"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              AI-Powered Task Management
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground px-4"
            >
              Taskify stops you from
              <br />
              <span className="gradient-text">procrastinating</span>
              <br />
              by forcing action, not lists.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              This is not a to-do app. It's a commitment system.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/85 gap-2 px-8 btn-cheerful shadow-lg h-14 text-base">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 h-14 text-base border-2"
                onClick={scrollToHowItWorks}
              >
                See How It Works
              </Button>
            </motion.div>
          </div>

          {/* Voice Animation Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-20 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary rounded-full blur-3xl opacity-20 scale-150" />
              <div className="relative w-36 h-36 rounded-full bg-primary flex items-center justify-center glow-lg animate-pulse-glow shadow-2xl">
                <Mic className="w-14 h-14 text-primary-foreground" />
              </div>
              {/* Floating task cards - Hidden on mobile to prevent overflow */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-44 top-0 glass-card p-4 w-52 shadow-lg hidden lg:block"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <div className="text-sm font-medium text-foreground">Submit AI assignment</div>
                </div>
                <div className="text-xs text-muted-foreground">Tomorrow, 5:00 PM</div>
              </motion.div>
              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-48 bottom-0 glass-card p-4 w-48 shadow-lg hidden lg:block"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-accent" />
                  <div className="text-sm font-medium text-foreground">Team meeting</div>
                </div>
                <div className="text-xs text-muted-foreground">Friday, 10:00 AM</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={howItWorksRef} id="how-it-works" className="py-20 px-6 scroll-mt-20">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">How Taskify Actually Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No fluff. No hand-holding. Just consequences.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "You Speak. Taskify Judges.",
                description: "Only real tasks are accepted. Inputs like \"hello\" or random speech will return Invalid task.",
                icon: Mic,
                color: "bg-primary/10 text-primary",
              },
              {
                step: "02",
                title: "Deadlines Are Non-Negotiable",
                description: "Miss a task and your streak resets instantly.",
                icon: ShieldAlert,
                color: "bg-accent/10 text-accent",
              },
              {
                step: "03",
                title: "Avoidance Has Consequences",
                description: "Expired tasks are deleted forever. No recovery.",
                icon: Skull,
                color: "bg-destructive/10 text-destructive",
              },
              {
                step: "04",
                title: "The AI Will Call You Out",
                description: "The system exists to confront procrastination, not comfort it.",
                icon: Brain,
                color: "bg-warning/10 text-warning",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="glass-card p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${item.color} mb-5`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div className="text-xs text-primary font-semibold mb-2">Step {item.step}</div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 md:p-12 text-center relative overflow-hidden shadow-xl"
          >
            <div className="absolute inset-0 bg-primary opacity-5" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Ready to stop procrastinating?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Taskify exists to make avoidance uncomfortable. Commit or don't.
              </p>
              <Link to="/auth?mode=signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/85 gap-2 px-8 btn-cheerful shadow-lg h-14 text-base">
                  Start Using Taskify
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Mic className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">Taskify</span>
              <span className="text-[10px] text-muted-foreground">Your voice-powered task assistant</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">You're not busy. You're avoiding.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
