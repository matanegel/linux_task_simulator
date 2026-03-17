import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { executeCommand, getCompletions, type CommandContext } from '@/lib/commands';
import type { FSNode } from '@/lib/levels';
import { Copy, Check } from 'lucide-react';

interface GameTerminalProps {
  fs: Record<string, FSNode>;
  cwd: string;
  commandHistory: string[];
  onCwdChange: (cwd: string) => void;
  onFsChange: (fs: Record<string, FSNode>) => void;
  onCommandExecuted: (cmd: string) => void;
  onHintRequested: () => void;
  onLevelComplete: () => void;
  validateLevel: (fs: Record<string, FSNode>, history: string[], cwd: string) => boolean;
  levelId: number;
}

interface OutputBlock {
  id: number;
  command: string;
  output: string;
}

const PROMPT_COLOR = '\x1b[1;31m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';

// Strip ANSI escape codes for clipboard copy
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

export default function GameTerminal({
  fs, cwd, commandHistory, onCwdChange, onFsChange,
  onCommandExecuted, onHintRequested, onLevelComplete,
  validateLevel, levelId
}: GameTerminalProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBuffer = useRef('');
  const cursorPos = useRef(0);
  const historyIndex = useRef(-1);
  const cwdRef = useRef(cwd);
  const fsRef = useRef(fs);
  const cmdHistoryRef = useRef<string[]>([]);
  const blockIdRef = useRef(0);

  const [outputBlocks, setOutputBlocks] = useState<OutputBlock[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  cwdRef.current = cwd;
  fsRef.current = fs;

  const getPrompt = useCallback(() => {
    const dir = cwdRef.current === '/' ? '/' : cwdRef.current.split('/').pop() || '/';
    return `${PROMPT_COLOR}[recruit@linuxquest ${GREEN}${dir}${PROMPT_COLOR}]$${RESET} `;
  }, []);

  const refreshLine = useCallback(() => {
    const term = xtermRef.current;
    if (!term) return;
    term.write('\r' + getPrompt() + inputBuffer.current + '\x1b[K');
    const diff = inputBuffer.current.length - cursorPos.current;
    if (diff > 0) term.write(`\x1b[${diff}D`);
  }, [getPrompt]);

  const copyToClipboard = useCallback(async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(stripAnsi(text));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Fallback: noop
    }
  }, []);

  useEffect(() => {
    if (!termRef.current) return;

    setOutputBlocks([]);

    const term = new Terminal({
      theme: {
        background: '#0f0f0f',
        foreground: '#e0e0e0',
        cursor: '#ee0000',
        cursorAccent: '#0f0f0f',
        selectionBackground: '#ee000040',
        black: '#151515',
        red: '#ee0000',
        green: '#55cc55',
        yellow: '#e6a817',
        blue: '#5577cc',
        magenta: '#cc55cc',
        cyan: '#55cccc',
        white: '#e0e0e0',
        brightBlack: '#555555',
        brightRed: '#ff3333',
        brightGreen: '#77ee77',
        brightYellow: '#ffcc33',
        brightBlue: '#7799ee',
        brightMagenta: '#ee77ee',
        brightCyan: '#77eeee',
        brightWhite: '#ffffff',
      },
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      rightClickSelectsWord: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current);

    setTimeout(() => fitAddon.fit(), 50);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome banner
    term.writeln('\x1b[1;31m');
    term.writeln('  ╔═══════════════════════════════════════════╗');
    term.writeln('  ║      LINUX QUEST: TERMINAL CHALLENGE      ║');
    term.writeln('  ╚═══════════════════════════════════════════╝');
    term.writeln('\x1b[0m');
    term.writeln('  \x1b[33mType "help" for available commands\x1b[0m');
    term.writeln('  \x1b[33mType "hint" to ask the Sensei\x1b[0m');
    term.writeln('  \x1b[2m  Ctrl+C: copy selection | Ctrl+V: paste\x1b[0m');
    term.write('\r\n' + getPrompt());

    // Handle keyboard at the DOM level for Ctrl+C/V
    const containerEl = termRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selection = term.getSelection();
        if (selection) {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(selection);
          term.clearSelection();
        } else {
          // No selection: clear current line (like real terminal)
          // Let xterm handle it via onData
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.readText().then((text) => {
          if (text) {
            // Insert pasted text into input buffer
            const clean = text.replace(/[\r\n]/g, '');
            inputBuffer.current = inputBuffer.current.slice(0, cursorPos.current) + clean + inputBuffer.current.slice(cursorPos.current);
            cursorPos.current += clean.length;
            refreshLine();
          }
        }).catch(() => {});
      }
    };

    containerEl?.addEventListener('keydown', handleKeyDown, true);

    term.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) { // Enter
        const cmd = inputBuffer.current;
        term.write('\r\n');
        inputBuffer.current = '';
        cursorPos.current = 0;
        historyIndex.current = -1;

        if (cmd.trim()) {
          cmdHistoryRef.current.unshift(cmd.trim());

          const ctx: CommandContext = {
            fs: fsRef.current,
            cwd: cwdRef.current,
            history: commandHistory,
            setCwd: onCwdChange,
            setFs: onFsChange,
            addHistory: onCommandExecuted,
          };

          const output = executeCommand(cmd, ctx);

          if (output === '__CLEAR__') {
            term.clear();
            setOutputBlocks([]);
          } else if (output === '__HINT__') {
            onHintRequested();
          } else if (output) {
            term.writeln(output.replace(/\n/g, '\r\n'));
            // Track output block for copy button
            const id = ++blockIdRef.current;
            setOutputBlocks(prev => [...prev, { id, command: cmd.trim(), output }]);
          }

          setTimeout(() => {
            if (validateLevel(fsRef.current, [...commandHistory, cmd.trim()], cwdRef.current)) {
              onLevelComplete();
            }
          }, 100);
        }

        term.write(getPrompt());
      } else if (code === 127) { // Backspace
        if (cursorPos.current > 0) {
          inputBuffer.current = inputBuffer.current.slice(0, cursorPos.current - 1) + inputBuffer.current.slice(cursorPos.current);
          cursorPos.current--;
          refreshLine();
        }
      } else if (code === 9) { // Tab
        const completions = getCompletions(inputBuffer.current, {
          fs: fsRef.current,
          cwd: cwdRef.current,
          history: [],
          setCwd: () => {},
          setFs: () => {},
          addHistory: () => {},
        });

        if (completions.length === 1) {
          const parts = inputBuffer.current.split(/\s+/);
          parts[parts.length - 1] = completions[0];
          inputBuffer.current = parts.join(' ');
          cursorPos.current = inputBuffer.current.length;
          refreshLine();
        } else if (completions.length > 1) {
          term.write('\r\n' + completions.join('  '));
          term.write('\r\n' + getPrompt() + inputBuffer.current);
        }
      } else if (data === '\x1b[A') { // Up arrow
        if (cmdHistoryRef.current.length > 0) {
          historyIndex.current = Math.min(historyIndex.current + 1, cmdHistoryRef.current.length - 1);
          inputBuffer.current = cmdHistoryRef.current[historyIndex.current];
          cursorPos.current = inputBuffer.current.length;
          refreshLine();
        }
      } else if (data === '\x1b[B') { // Down arrow
        if (historyIndex.current > 0) {
          historyIndex.current--;
          inputBuffer.current = cmdHistoryRef.current[historyIndex.current];
        } else {
          historyIndex.current = -1;
          inputBuffer.current = '';
        }
        cursorPos.current = inputBuffer.current.length;
        refreshLine();
      } else if (data === '\x1b[D') { // Left
        if (cursorPos.current > 0) {
          cursorPos.current--;
          term.write(data);
        }
      } else if (data === '\x1b[C') { // Right
        if (cursorPos.current < inputBuffer.current.length) {
          cursorPos.current++;
          term.write(data);
        }
      } else if (code === 3) { // Ctrl+C from xterm
        // If we reach here, no selection was present (handled at DOM level)
        inputBuffer.current = '';
        cursorPos.current = 0;
        term.write('\r\n' + getPrompt());
      } else if (code === 22) { // Ctrl+V from xterm — ignore, handled at DOM level
        // noop
      } else if (code >= 32) { // Printable
        inputBuffer.current = inputBuffer.current.slice(0, cursorPos.current) + data + inputBuffer.current.slice(cursorPos.current);
        cursorPos.current += data.length;
        refreshLine();
      }
    });

    const resizeHandler = () => {
      setTimeout(() => fitAddon.fit(), 50);
    };
    window.addEventListener('resize', resizeHandler);

    return () => {
      containerEl?.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', resizeHandler);
      term.dispose();
    };
  }, [levelId]);

  return (
    <div className="terminal-container relative h-full flex flex-col scanline glow-red">
      <div className="terminal-header">
        <div className="terminal-dot bg-primary" />
        <div className="terminal-dot bg-terminal-amber" />
        <div className="terminal-dot bg-terminal-green" />
        <span className="font-mono text-xs text-muted-foreground ml-2">
          recruit@linuxquest ~ bash
        </span>
      </div>
      <div ref={termRef} className="flex-1 min-h-0" />

      {/* Floating copy buttons for output blocks */}
      {outputBlocks.length > 0 && (
        <div className="absolute top-10 right-2 flex flex-col gap-1 z-10">
          {outputBlocks.slice(-5).map((block) => (
            <button
              key={block.id}
              onClick={() => copyToClipboard(block.output, block.id)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-secondary/80 border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors text-[10px] font-mono backdrop-blur-sm"
              title={`Copy output of: ${block.command}`}
            >
              {copiedId === block.id ? (
                <Check className="w-3 h-3 text-terminal-green" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span className="max-w-[100px] truncate">{block.command}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
