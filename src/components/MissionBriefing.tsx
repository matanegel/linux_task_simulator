import { Target, Wrench, ChevronRight } from 'lucide-react';

interface MissionBriefingProps {
  levelId: number;
  title: string;
  subtitle: string;
  briefing: string;
  objective: string;
  toolbelt: string[];
}

export default function MissionBriefing({ levelId, title, subtitle, briefing, objective, toolbelt }: MissionBriefingProps) {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2">
      {/* Level Header */}
      <div>
        <p className="text-xs font-mono text-primary tracking-[0.3em] uppercase mb-1">{subtitle}</p>
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

      {/* Toolbelt */}
      <div className="mission-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-terminal-amber" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recommended Toolbelt</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {toolbelt.map((tool) => (
            <span key={tool} className="toolbelt-item">{tool}</span>
          ))}
        </div>
      </div>

      {/* Level Progress */}
      <div className="mt-auto pt-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((l) => (
            <div
              key={l}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                l < levelId ? 'bg-terminal-green' : l === levelId ? 'bg-primary animate-pulse-glow' : 'bg-secondary'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Level {levelId} of 4</p>
      </div>
    </div>
  );
}
