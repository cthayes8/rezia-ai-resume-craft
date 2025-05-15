import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  MoveUpRight, 
  MoveDownLeft, 
  Info, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  BarChart3, 
  PieChart
} from "lucide-react";
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Gauge } from '@/components/ui/gauge'

export interface ScoreMetric {
  name: string;
  originalScore: number;
  optimizedScore: number;
}

export interface ScoreSectionUIProps {
  overallScore: number;
  metrics: ScoreMetric[];
  showOriginal: boolean;
  /** Optional LLM-generated takeaways */
  takeaways?: { title: string; description: string; level: 'info'|'success'|'warning'|'error' }[];
  /** Loading state for takeaways */
  isTakeawaysLoading?: boolean;
  /** List of red-flag warning messages */
  redFlags?: string[];
}

// --- 21st.dev magic components ---

const AnimatedProgressRing = ({ score, size = 180, strokeWidth = 12, emotion = 'neutral', showValue = true, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / 100) * circumference;
  const colorMap = {
    neutral: {
      gradient: ['#3B82F6', '#60A5FA', '#93C5FD'],
      text: 'text-blue-500'
    },
    positive: {
      gradient: ['#10B981', '#34D399', '#6EE7B7'],
      text: 'text-emerald-500'
    },
    negative: {
      gradient: ['#EF4444', '#F87171', '#FCA5A5'],
      text: 'text-red-500'
    }
  };
  const selectedColors = colorMap[emotion];
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted opacity-20" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className={cn(
            emotion === 'neutral' && "text-blue-500",
            emotion === 'positive' && "text-emerald-500",
            emotion === 'negative' && "text-red-500"
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center">
        <span className="text-3xl font-bold text-emerald-600">{score}</span>
        <span className="text-xs text-gray-500 mt-1">Overall Score</span>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, change, icon, tooltipContent, delay = 0 }) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="relative overflow-hidden rounded-lg border bg-white p-2 flex flex-col items-start shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xs text-gray-500 font-medium">{title}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
      {change !== undefined && (
        <div className={`text-xs ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
          {change > 0 ? '+' : ''}{change}%
        </div>
      )}
    </motion.div>
  );
};

const KeyTakeaway = ({ title, description, type, delay = 0 }) => {
  const iconMap = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />
  };
  const borderColorMap = {
    info: "border-l-blue-500",
    success: "border-l-emerald-500",
    warning: "border-l-amber-500",
    error: "border-l-red-500"
  };
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay }} className={cn("flex gap-3 p-3 border-l-4 bg-background rounded-r-md", borderColorMap[type])}>
      <div className="flex-shrink-0 mt-0.5">{iconMap[type]}</div>
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </motion.div>
  );
};

export const ScoreSectionUI: React.FC<ScoreSectionUIProps> = ({ overallScore, metrics, showOriginal, takeaways, isTakeawaysLoading, redFlags }) => {
  // Map metrics for cards
  // Only display these core metrics
  const desiredNames = [
    'Keyword Match',
    'Experience Alignment',
    'Bullet Strength',
    'Role Alignment',
    'Skills Match',
    'Customization Level',
  ];
  // Preserve desired order
  const displayedMetrics = desiredNames
    .map(name => metrics.find(m => m.name === name))
    .filter((m): m is ScoreMetric => !!m);
  // Map to display cards
  const metricCards = displayedMetrics.map((m, i) => {
    const orig = m.originalScore;
    const opt = m.optimizedScore;
    const score = showOriginal ? orig : opt;
    const changeRaw = showOriginal ? 0 : opt - orig;
    const change = parseFloat(changeRaw.toFixed(1));
    return {
      title: m.name,
      value: `${score.toFixed(1)}%`,  // one decimal
      change,
      icon: <BarChart3 className="h-4 w-4 text-primary" />,
      tooltipContent: `Score for ${m.name}`,
      delay: 0.1 * i,
    };
  });
  const emotion = overallScore >= 70 ? 'positive' : overallScore >= 40 ? 'neutral' : 'negative';

  // Utility function to get the color for the score
  function getScoreColor(score: number) {
    if (score >= 75) return 'text-emerald-600'; // green
    if (score >= 50) return 'text-amber-500';   // amber
    return 'text-red-500';                      // red
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Resume Score</CardTitle>
            <CardDescription>Analysis of your resume's performance and key metrics</CardDescription>
          </div>
          <Badge variant={emotion === 'positive' ? 'default' : emotion === 'negative' ? 'destructive' : 'secondary'}>
            {emotion === 'positive' ? 'Strong' : emotion === 'negative' ? 'Needs Work' : 'Average'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center mb-2">
          <Gauge
            value={overallScore}
            size={56}
            strokeWidth={6}
            showValue={false}
            primary={{
              0: '#ef4444',    // red
              50: '#f59e0b',   // amber
              75: '#22c55e'    // green
            }}
            secondary="#e5e7eb"
          />
          <span className={`mt-2 text-3xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
          </span>
          <span className="text-xs text-gray-500">Overall Score</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          {metricCards.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
        {/* Score Details sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full flex items-center justify-center gap-1">
              View Score Details
              <ChevronRight className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Score Details</SheetTitle>
              <SheetDescription>Reasoning behind each core metric</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {displayedMetrics.map((m, idx) => (
                <div key={idx} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium">{m.name}</h4>
                    <span className="text-xl font-semibold">
                      {(showOriginal ? m.originalScore : m.optimizedScore).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(
                      {
                        'Keyword Match': 'Percentage of job description keywords found in your resume.',
                        'Experience Alignment': 'How well your role seniority and responsibilities match the target role.',
                        'Bullet Strength': 'Composite score of action verbs, quantification, conciseness, and impact patterns.',
                        'Role Alignment': 'Assesses scope and responsibilities match using an expert LLM evaluator.',
                        'Skills Match': 'Percentage of JD requirements present in your skills section.',
                        'Customization Level': 'Embedding-based similarity between your resume text and the job description.',
                      } as Record<string, string>
                    )[m.name]}
                  </p>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        <hr className="my-4 border-gray-200" />
        {/* Key takeaways (LLM-driven) */}
        {!isTakeawaysLoading && takeaways && takeaways.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Key Takeaways</h3>
            <div className="space-y-2">
              <AnimatePresence>
                {takeaways.map((t, i) => (
                  <KeyTakeaway key={i} title={t.title} description={t.description} type={t.level as any} delay={0.1 * i} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
        {/* Red Flags section (always shown when available) */}
        {redFlags !== undefined && (
          <div className="space-y-3 mt-6">
            <h3 className={`text-sm font-medium ${redFlags.length > 0 ? 'text-red-600' : 'text-gray-500'}`}>Red Flags</h3>
            <div className="space-y-2">
              {redFlags.length > 0 ? (
                redFlags.map((flag, i) => (
                  <KeyTakeaway key={i} title="Issue" description={flag} type="error" delay={0.1 * i} />
                ))
              ) : (
                <p className="text-sm text-gray-500">No issues detected</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

<aside className="w-[340px] shrink-0 font-sans">
  {/* ... */}
</aside>