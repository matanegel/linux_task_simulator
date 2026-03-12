import { useState, useCallback } from 'react';
import { levels, type FSNode } from '@/lib/levels';
import GameTerminal from '@/components/GameTerminal';
import MissionBriefing from '@/components/MissionBriefing';
import Sensei from '@/components/Sensei';
import SuccessAnimation from '@/components/SuccessAnimation';

export default function Index() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [fs, setFs] = useState<Record<string, FSNode>>(JSON.parse(JSON.stringify(levels[0].filesystem)));
  const [cwd, setCwd] = useState(levels[0].startDir);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [senseiOpen, setSenseiOpen] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);

  const level = levels[currentLevel];

  const handleCommandExecuted = useCallback((cmd: string) => {
    setCommandHistory(prev => [...prev, cmd]);
  }, []);

  const handleHintRequested = useCallback(() => {
    setSenseiOpen(true);
    setHintIndex(prev => prev + 1);
  }, []);

  const handleLevelComplete = useCallback(() => {
    if (!showSuccess) setShowSuccess(true);
  }, [showSuccess]);

  const handleSubmitAnswer = useCallback((answer: string): boolean => {
    if (answer.toLowerCase() === level.answer.toLowerCase()) {
      handleLevelComplete();
      return true;
    }
    return false;
  }, [level.answer, handleLevelComplete]);

  const handleNextLevel = useCallback(() => {
    setShowSuccess(false);
    const next = currentLevel + 1 >= levels.length ? 0 : currentLevel + 1;
    setCurrentLevel(next);
    setFs(JSON.parse(JSON.stringify(levels[next].filesystem)));
    setCwd(levels[next].startDir);
    setCommandHistory([]);
    setHintIndex(0);
    setSenseiOpen(false);
  }, [currentLevel]);

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
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground px-3 py-1 rounded bg-secondary">
            LVL {level.id}/4
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Mission Briefing */}
        <div className="w-[380px] shrink-0 border-r border-border p-6">
          <MissionBriefing
            levelId={level.id}
            title={level.title}
            subtitle={level.subtitle}
            briefing={level.briefing}
            objective={level.objective}
            toolbelt={level.toolbelt}
            onSubmitAnswer={handleSubmitAnswer}
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
            onLevelComplete={handleLevelComplete}
            validateLevel={level.validate}
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
