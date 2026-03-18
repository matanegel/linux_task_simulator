import { useState } from 'react';
import { Target, Wrench, ChevronRight, Send, ShieldCheck, ExternalLink, Lock, CheckCircle2 } from 'lucide-react';

const MAN_PAGE_URLS: Record<string, string> = {
  'ls': 'https://man7.org/linux/man-pages/man1/ls.1.html',
  'cat': 'https://man7.org/linux/man-pages/man1/cat.1.html',
  'cd': 'https://man7.org/linux/man-pages/man1/cd.1p.html',
  'pwd': 'https://man7.org/linux/man-pages/man1/pwd.1.html',
  'grep': 'https://man7.org/linux/man-pages/man1/grep.1.html',
  'chmod': 'https://man7.org/linux/man-pages/man1/chmod.1.html',
  'sort': 'https://man7.org/linux/man-pages/man1/sort.1.html',
  'uniq': 'https://man7.org/linux/man-pages/man1/uniq.1.html',
  'tail': 'https://man7.org/linux/man-pages/man1/tail.1.html',
  'head': 'https://man7.org/linux/man-pages/man1/head.1.html',
  'wc': 'https://man7.org/linux/man-pages/man1/wc.1.html',
  'find': 'https://man7.org/linux/man-pages/man1/find.1.html',
  'mv': 'https://man7.org/linux/man-pages/man1/mv.1.html',
  'cp': 'https://man7.org/linux/man-pages/man1/cp.1.html',
  'rm': 'https://man7.org/linux/man-pages/man1/rm.1.html',
  'mkdir': 'https://man7.org/linux/man-pages/man1/mkdir.1.html',
  'touch': 'https://man7.org/linux/man-pages/man1/touch.1.html',
  'echo': 'https://man7.org/linux/man-pages/man1/echo.1.html',
  'diff': 'https://man7.org/linux/man-pages/man1/diff.1.html',
  'cut': 'https://man7.org/linux/man-pages/man1/cut.1.html',
  'tr': 'https://man7.org/linux/man-pages/man1/tr.1.html',
  'awk': 'https://man7.org/linux/man-pages/man1/awk.1p.html',
  'sed': 'https://man7.org/linux/man-pages/man1/sed.1.html',
  'tac': 'https://man7.org/linux/man-pages/man1/tac.1.html',
  'paste': 'https://man7.org/linux/man-pages/man1/paste.1.html',
  'tee': 'https://man7.org/linux/man-pages/man1/tee.1.html',
  'xargs': 'https://man7.org/linux/man-pages/man1/xargs.1.html',
  'basename': 'https://man7.org/linux/man-pages/man1/basename.1.html',
  'dirname': 'https://man7.org/linux/man-pages/man1/dirname.1.html',
  'rev': 'https://man7.org/linux/man-pages/man1/rev.1.html',
  'seq': 'https://man7.org/linux/man-pages/man1/seq.1.html',
  'ps': 'https://man7.org/linux/man-pages/man1/ps.1.html',
};

function getManUrl(tool: string): string | null {
  // Extract base command (e.g., "ls -l" → "ls")
  const base = tool.split(/\s+/)[0].replace('./', '');
  return MAN_PAGE_URLS[base] || null;
}

interface MissionBriefingProps {
  levelId: number;
  totalLevels: number;
  title: string;
  subtitle: string;
  briefing: string;
  objective: string;
  toolbelt: string[];
  onSubmitAnswer: (answer: string) => boolean;
  isSolved: boolean;
  solvedLevels: Set<number>;
}

export default function MissionBriefing({ levelId, totalLevels, title, subtitle, briefing, objective, toolbelt, onSubmitAnswer, isSolved, solvedLevels }: MissionBriefingProps) {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    const correct = onSubmitAnswer(answer.trim());
    if (!correct) {
      setError(true);
      setTimeout(() => setError(false), 1500);
    } else {
      setAnswer('');
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2">
      {/* Level Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-mono text-primary tracking-[0.3em] uppercase">{subtitle}</p>
          {isSolved ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-terminal-green/15 text-terminal-green border border-terminal-green/30">
              <CheckCircle2 className="w-3 h-3" /> Solved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              <Lock className="w-3 h-3" /> Locked
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">{title}</h1>
      </div>

      {/* Mission Briefing */}
      <div className="mission-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChevronRight className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Mission Briefing</h2>
        </div>
        <p className="text-sm leading-relaxed text-secondary-foreground">{briefing}</p>
      </div>

      {/* Objective */}
      <div className="mission-card p-4 border-l-2 border-l-primary">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">Objective</h2>
        </div>
        <p className="font-mono text-sm text-terminal-green">{objective}</p>
      </div>

      {/* Answer Submission */}
      <form onSubmit={handleSubmit} className="mission-card p-4 border-l-2 border-l-terminal-green">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-4 h-4 text-terminal-green" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-terminal-green">Submit Answer</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Use the terminal to find the answer, then submit it here.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer..."
            className={`flex-1 bg-secondary border rounded px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 transition-colors ${
              error ? 'border-primary ring-1 ring-primary' : 'border-border focus:ring-terminal-green'
            }`}
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded text-sm font-semibold flex items-center gap-1 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        {error && (
          <p className="text-xs text-primary mt-2 font-mono animate-pulse">✗ Incorrect. Keep investigating...</p>
        )}
      </form>

      {/* Toolbelt */}
      <div className="mission-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-terminal-amber" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recommended Toolbelt</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {toolbelt.map((tool) => {
            const manUrl = getManUrl(tool);
            return manUrl ? (
              <a
                key={tool}
                href={manUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="toolbelt-item inline-flex items-center gap-1.5 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                {tool}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
            ) : (
              <span key={tool} className="toolbelt-item">{tool}</span>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2 opacity-60">Click a command to view its man page</p>
      </div>

      {/* Level Progress */}
      <div className="mt-auto pt-4">
        <div className="flex gap-1">
          {Array.from({ length: totalLevels }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                solvedLevels.has(i) ? 'bg-terminal-green' : i === levelId - 1 ? 'bg-primary animate-pulse-glow' : 'bg-secondary'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Level {levelId} of {totalLevels} · {solvedLevels.size} solved
        </p>
      </div>
    </div>
  );
}
