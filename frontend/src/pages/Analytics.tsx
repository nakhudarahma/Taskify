import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Clock, Target, BarChart3, Mic,
  CheckCircle, Calendar, Zap, Send, Loader2,
  MicOff, MessageSquare, AlertCircle
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useVoiceFeedback } from "@/hooks/useVoiceFeedback";
import { getAnalyticsResponse, getPersonalityMessage } from "@/lib/personalityMessages";
import { format, isToday, isThisWeek, isYesterday, isThisMonth, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Check browser support for speech recognition
const getSpeechRecognition = (): any => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

const Analytics = () => {
  const { tasks = [], completedTasks = [], pendingTasks = [], loading } = useTasks();
  const { profile } = useAuth();
  const { speakCustom, isEnabled } = useVoiceFeedback();
  const personality = profile?.ai_personality;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check voice support on mount
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  // Get tasks completed today with their titles (Using parseISO for reliable parsing)
  const todayCompletedTasks = completedTasks.filter(t => t.completed_at && isToday(parseISO(t.completed_at)));
  const yesterdayCompletedTasks = completedTasks.filter(t => t.completed_at && isYesterday(parseISO(t.completed_at)));
  const thisWeekCompletedTasks = completedTasks.filter(t => t.completed_at && isThisWeek(parseISO(t.completed_at)));
  const thisMonthCompletedTasks = completedTasks.filter(t => t.completed_at && isThisMonth(parseISO(t.completed_at)));
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  // Weekly breakdown
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyData = weekDays.map(day => {
    const dayTasks = completedTasks.filter(t => {
      if (!t.completed_at) return false;
      const taskDate = parseISO(t.completed_at);
      return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });
    return {
      day: format(day, 'EEE'),
      fullDay: format(day, 'EEEE'),
      tasks: dayTasks.length,
      taskTitles: dayTasks.map(t => t.title),
      isToday: isToday(day),
    };
  });

  const maxTasks = Math.max(...weeklyData.map(d => d.tasks), 1);

  // Find most productive day
  const mostProductiveDay = weeklyData.reduce((max, day) =>
    day.tasks > max.tasks ? day : max, weeklyData[0]);

  // Format task list for voice/text
  const formatTaskList = (taskList: typeof completedTasks, limit = 5): string => {
    if (taskList.length === 0) return "";
    const items = taskList.slice(0, limit).map(t => `• ${t.title}`).join('\n');
    const remaining = taskList.length > limit ? `\n...and ${taskList.length - limit} more` : "";
    return items + remaining;
  };


  // Answer user questions with specific task names
  // SINGLE SOURCE OF TRUTH: one response string used for both display and voice
  const generateAnswer = useCallback((question: string): string => {
    const q = question.toLowerCase();

    // Context for AI
    const context = {
      todayCompletedCount: todayCompletedTasks.length,
      taskName: 'productivity' // Generic subject
    };

    // Today's completed tasks
    if (q.includes('today') && (q.includes('complete') || q.includes('done') || q.includes('finish') || q.includes('which'))) {
      if (todayCompletedTasks.length === 0) {
        return getPersonalityMessage(personality, 'dailySummary', context);
      }
      const taskList = formatTaskList(todayCompletedTasks);
      // We use the dailySummary type but append the list for utility
      return `${getPersonalityMessage(personality, 'dailySummary', context)}\n${taskList}`;
    }

    // Yesterday's completed tasks
    if (q.includes('yesterday') && (q.includes('complete') || q.includes('done') || q.includes('finish') || q.includes('which'))) {
      if (yesterdayCompletedTasks.length === 0) {
        return "You didn't complete any tasks yesterday. A wasted day.";
      }
      const taskList = formatTaskList(yesterdayCompletedTasks);
      return `Yesterday, you completed ${yesterdayCompletedTasks.length} tasks:\n${taskList}. Try to beat that today.`;
    }

    // This week's completed tasks
    if (q.includes('week') && (q.includes('complete') || q.includes('done') || q.includes('finish') || q.includes('summary') || q.includes('which'))) {
      if (thisWeekCompletedTasks.length === 0) {
        return "Zero tasks this week. Embarrassing.";
      }
      const taskList = formatTaskList(thisWeekCompletedTasks);
      return `This week: ${thisWeekCompletedTasks.length} tasks done:\n${taskList}`;
    }

    // Pending tasks
    if (q.includes('pending') || q.includes('left') || q.includes('remaining') || q.includes('to do') || q.includes('todo')) {
      if (pendingTasks.length === 0) {
        return "No pending tasks. You're either efficient or lying.";
      }
      const taskList = formatTaskList(pendingTasks);
      return `You have ${pendingTasks.length} pending tasks:\n${taskList}. Get to work.`;
    }

    // Most productive day
    if (q.includes('productive') || q.includes('best day')) {
      if (mostProductiveDay.tasks === 0) {
        return "No productivity detected this week.";
      }
      return `Best day: ${mostProductiveDay.fullDay} with ${mostProductiveDay.tasks} tasks. Replicate that effort.`;
    }

    // This month's completed tasks
    if (q.includes('month') && (q.includes('complete') || q.includes('done') || q.includes('finish') || q.includes('summary') || q.includes('which'))) {
      if (thisMonthCompletedTasks.length === 0) {
        return "Zero tasks this month. You need to step it up.";
      }
      return `This month: ${thisMonthCompletedTasks.length} tasks done. Keep pushing.`;
    }

    // Default response
    return getPersonalityMessage(personality, 'dailySummary', { todayCompletedCount: completedTasks.length });
  }, [tasks.length, completedTasks.length, pendingTasks.length, todayCompletedTasks, yesterdayCompletedTasks, thisWeekCompletedTasks, thisMonthCompletedTasks, completionRate, mostProductiveDay, personality]);

  const handleQuestion = useCallback((question: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: question };
    // SINGLE SOURCE OF TRUTH: same string for display and voice
    const aiResponse = generateAnswer(question);
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponse };

    // Debug safety check: log AI response vs rendered message
    if (import.meta.env.DEV) {
      console.log('[AI Debug] Raw AI response:', aiResponse);
      console.log('[AI Debug] Chat-rendered message:', aiResponse);
      if (aiResponse !== assistantMsg.content) {
        console.error('[AI Debug] MISMATCH DETECTED: AI response differs from rendered message');
      }
    }

    setMessages(prev => [...prev, userMsg, assistantMsg]);

    if (isEnabled) {
      // Voice speaks the EXACT same text shown in chat
      speakCustom(aiResponse);
    }
  }, [generateAnswer, speakCustom, isEnabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    handleQuestion(inputValue.trim());
    setInputValue("");
  };

  const startVoiceInput = useCallback(async () => {
    setVoiceError(null);

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      setVoiceError("Voice input not supported in this browser.");
      return;
    }

    // Check microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (permError) {
      setVoiceError("Microphone access denied. Please allow microphone access.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsProcessing(true);
        setTimeout(() => {
          handleQuestion(transcript);
          setIsProcessing(false);
        }, 300);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        recognitionRef.current = null;

        if (event.error === 'not-allowed') {
          setVoiceError("Microphone access denied.");
        } else if (event.error === 'no-speech') {
          setVoiceError("No speech detected. Please try again.");
        } else if (event.error !== 'aborted') {
          setVoiceError("Voice input failed. Please try again.");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Voice input error:', error);
      setVoiceError("Failed to start voice input.");
    }
  }, [handleQuestion]);

  const stopVoiceInput = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  // Quick question buttons
  const quickQuestions = [
    { label: "Tasks completed today", question: "Which tasks did I complete today?", icon: CheckCircle },
    { label: "Tasks pending", question: "What tasks do I have pending?", icon: Clock },
    { label: "This week's summary", question: "What did I complete this week?", icon: Calendar },
    { label: "Most productive day", question: "What was my most productive day?", icon: Zap },
  ];

  const stats = [
    { label: "Completed", value: completedTasks.length, icon: TrendingUp, color: "bg-success/10 text-success" },
    { label: "Pending", value: pendingTasks.length, icon: Clock, color: "bg-warning/10 text-warning" },
    { label: "Completion Rate", value: `${completionRate}%`, icon: Target, color: "bg-primary/10 text-primary" },
  ];

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Analyzing your productivity...</p>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-40 rounded-xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Empty state (no tasks yet)
  if (tasks.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Ask me about your productivity</p>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 glass-card">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-foreground">No data yet.</h3>
            <p className="text-muted-foreground">Create some tasks first. Then we'll have something to judge.</p>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground italic">"{getPersonalityMessage(personality, 'sarcasticGreeting', { userName: profile?.name || 'User' })}"</p>
        </div>

        {/* Stats Summary */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="glass-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Visual Charts Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Donut Chart - Completed vs Pending */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Task Status Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center">
                {(() => {
                  const donutData = [
                    { name: 'Completed', value: completedTasks.length, color: 'hsl(175 55% 50%)' },
                    { name: 'Pending', value: pendingTasks.length, color: 'hsl(195 70% 55%)' },
                  ];
                  const totalTasks = tasks.length;

                  return totalTasks > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value: number, name: string) => [`${value} tasks`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm">No tasks to display</p>
                  );
                })()}
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(175 55% 50%)' }} />
                  <span className="text-sm text-muted-foreground">Completed ({completedTasks.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(195 70% 55%)' }} />
                  <span className="text-sm text-muted-foreground">Pending ({pendingTasks.length})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart - Weekly Tasks */}
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Weekly Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`${value} tasks`, 'Completed']}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar
                      dataKey="tasks"
                      radius={[4, 4, 0, 0]}
                      fill="hsl(195 70% 55%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">Tasks completed each day this week</p>
            </CardContent>
          </Card>
        </section>

        {/* Weekly Overview - Simplified visual bar */}
        <section>
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-base">Weekly Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-32">
                {weeklyData.map((data, index) => (
                  <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((data.tasks / maxTasks) * 100, 8)}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className={`w-full rounded-t-lg min-h-[4px] ${data.isToday ? 'bg-primary' : 'bg-primary/40'}`}
                    />
                    <span className={`text-xs ${data.isToday ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {data.day}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Questions */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Questions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickQuestions.map((q, index) => (
              <motion.button
                key={q.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleQuestion(q.question)}
                className="quick-card text-left"
              >
                <q.icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-medium text-foreground">{q.label}</p>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Q&A Chat */}
        <section>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Ask About Your Productivity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="min-h-[120px] max-h-[300px] overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Ask a question like "Which tasks did I complete today?"
                  </p>
                ) : (
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-xl max-w-[90%] md:max-w-[85%] whitespace-pre-line ${msg.role === 'user'
                          ? 'bg-primary/10 ml-auto'
                          : 'bg-secondary'
                          }`}
                      >
                        <p className="text-sm text-foreground">{msg.content}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing...</span>
                  </div>
                )}

                {isListening && (
                  <div className="flex items-center gap-2 text-primary">
                    <Mic className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">Listening... speak your question</span>
                  </div>
                )}

                {voiceError && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{voiceError}</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about your tasks..."
                  className="flex-1 bg-secondary/50"
                  disabled={isListening || isProcessing}
                />
                <Button
                  type="button"
                  size="icon"
                  variant={isListening ? "destructive" : voiceSupported ? "outline" : "ghost"}
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  disabled={isProcessing || !voiceSupported}
                  title={!voiceSupported ? "Voice not supported" : isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : !voiceSupported ? <AlertCircle className="w-4 h-4 text-muted-foreground" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  className="bg-primary text-primary-foreground hover:bg-primary/85"
                  disabled={!inputValue.trim() || isProcessing}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
