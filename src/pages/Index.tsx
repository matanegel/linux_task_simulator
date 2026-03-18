import { useState, useCallback, useMemo } from 'react';
import { levels, type FSNode } from '@/lib/levels';
import GameTerminal from '@/components/GameTerminal';
import MissionBriefing from '@/components/MissionBriefing';
import Sensei from '@/components/Sensei';
import SuccessAnimation from '@/components/SuccessAnimation';
import { ChevronLeft, ChevronRight, ChevronsUpDown, Check } from 'lucide-react';

const STAGE_NAMES: Record<number, string> = {
  1: 'Basic',
  2: 'Advanced',
};

export default function Index() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [levelPickerOpen, setLevelPickerOpen] = useState(false);
  const [solvedLevels, setSolvedLevels] = useState<Set<number>>(new Set());
  const [fs, setFs] = useState<Record<string, FSNode>>(JSON.parse(JSON.stringify(levels[0].filesystem)));
  const [cwd, setCwd] = useState(levels[0].startDir);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [senseiOpen, setSenseiOpen] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const level = levels[currentLevel];
  const isSolved = solvedLevels.has(currentLevel);
  const currentStage = level.stage;

  const stageLevels = useMemo(() => levels.filter(l => l.stage === currentStage), [currentStage]);
  const stageStart = useMemo(() => levels.findIndex(l => l.stage === currentStage), [currentStage]);
  const stageSolvedCount = useMemo(() => {
    return stageLevels.filter((_, i) => solvedLevels.has(stageStart + i)).length;
  }, [stageLevels, stageStart, solvedLevels]);

  const goToLevel = useCallback((index: number) => {
    if (index < 0 || index >= levels.length) return;
    setCurrentLevel(index);
    setFs(JSON.parse(JSON.stringify(levels[index].filesystem)));
    setCwd(levels[index].startDir);
    setCommandHistory([]);
    setHintIndex(0);
    setSenseiOpen(false);
    setShowSuccess(false);
  }, []);

  const handleCommandExecuted = useCallback((cmd: string) => {
    setCommandHistory(prev => [...prev, cmd]);
  }, []);

  const handleHintRequested = useCallback(() => {
    setSenseiOpen(true);
    setHintIndex(prev => prev + 1);
  }, []);

  const handleSubmitAnswer = useCallback((answer: string): boolean => {
    if (answer.toLowerCase() === level.answer.toLowerCase()) {
      setSolvedLevels(prev => new Set(prev).add(currentLevel));
      setShowSuccess(true);
      return true;
    }
    return false;
  }, [level.answer, currentLevel]);

  const handleNextLevel = useCallback(() => {
    setShowSuccess(false);
    const next = currentLevel + 1 >= levels.length ? currentLevel : currentLevel + 1;
    goToLevel(next);
  }, [currentLevel, goToLevel]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm font-mono">LQ</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Linux Quest<span className="text-primary">:</span> Terminal Challenge
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
            Stage {currentStage}: {STAGE_NAMES[currentStage]}
          </span>
        </div>

        {/* Level Navigation */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => goToLevel(currentLevel - 1)}
            disabled={currentLevel === 0}
            className="p-1.5 rounded bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLevelPickerOpen(prev => !prev)}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground px-3 py-1.5 rounded bg-secondary border border-border hover:border-primary hover:text-foreground transition-colors min-w-[110px] justify-between"
          >
            <span>LVL {level.id}/{levels.length}</span>
            <ChevronsUpDown className="w-3 h-3" />
          </button>
          {levelPickerOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setLevelPickerOpen(false)} />
              <div className="absolute top-full right-1/2 translate-x-1/2 mt-2 z-50 bg-secondary border border-border rounded-lg shadow-xl py-1 max-h-[400px] overflow-y-auto w-[280px]">
                {[1, 2].map(stage => (
                  <div key={stage}>
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 border-b border-border">
                      Stage {stage}: {STAGE_NAMES[stage]}
                    </div>
                    {levels.filter(l => l.stage === stage).map((l) => {
                      const globalIdx = levels.indexOf(l);
                      return (
                        <button
                          key={l.id}
                          onClick={() => { goToLevel(globalIdx); setLevelPickerOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center gap-2 hover:bg-accent transition-colors ${
                            globalIdx === currentLevel ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                          }`}
                        >
                          <span className="w-6 text-right shrink-0">{l.id}.</span>
                          <span className="flex-1 truncate">{l.title}</span>
                          {solvedLevels.has(globalIdx) && <Check className="w-3 h-3 text-terminal-green shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            onClick={() => goToLevel(currentLevel + 1)}
            disabled={currentLevel >= levels.length - 1}
            className="p-1.5 rounded bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-primary disabled:opacity-30 disabled:hover:border-border disabled:hover:text-muted-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Mission Briefing */}
        <div className="w-[380px] shrink-0 border-r border-border p-6">
          <MissionBriefing
            levelId={level.id}
            totalLevels={levels.length}
            title={level.title}
            subtitle={level.subtitle}
            briefing={level.briefing}
            objective={level.objective}
            toolbelt={level.toolbelt}
            onSubmitAnswer={handleSubmitAnswer}
            isSolved={isSolved}
            solvedLevels={solvedLevels}
            stage={currentStage}
            stageName={STAGE_NAMES[currentStage]}
            stageSolvedCount={stageSolvedCount}
            stageTotalCount={stageLevels.length}
          />
        </div>

        {/* Right Panel - Terminal */}
        <div className="flex-1 p-4 min-h-0">
          <GameTerminal
            key={currentLevel}
            fs={fs}
            cwd={cwd}
            commandHistory={commandHistory}
            onCwdChange={setCwd}
            onFsChange={setFs}
            onCommandExecuted={handleCommandExecuted}
            onHintRequested={handleHintRequested}
            onLevelComplete={() => {}}
            validateLevel={() => false}
            levelId={level.id}
          />
        </div>
      </div>

      {/* Sensei */}
      <Sensei
        hints={level.hints}
        hintIndex={hintIndex}
        isOpen={senseiOpen}
        onToggle={() => setSenseiOpen(prev => !prev)}
      />

      {/* Success Animation */}
      <SuccessAnimation
        show={showSuccess}
        levelTitle={level.title}
        onNext={handleNextLevel}
        isLastLevel={currentLevel >= levels.length - 1}
      />
    </div>
  );
}