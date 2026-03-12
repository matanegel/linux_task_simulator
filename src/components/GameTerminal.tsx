import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import 'xterm/css/xterm.css';
import { executeCommand, getCompletions, type CommandContext } from '@/lib/commands';
import type { FSNode } from '@/lib/levels';

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

const PROMPT_COLOR = '\x1b[1;31m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';

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

  cwdRef.current = cwd;
  fsRef.current = fs;

  const getPrompt = useCallback(() => {
    const dir = cwdRef.current === '/' ? '/' : cwdRef.current.split('/').pop() || '/';
    return `${PROMPT_COLOR}[recruit@linuxquest ${GREEN}${dir}${PROMPT_COLOR}]$${RESET} `;
  }, []);

  const writePrompt = useCallback(() => {
    xtermRef.current?.write('\r\n' + getPrompt());
  }, [getPrompt]);

  const refreshLine = useCallback(() => {
    const term = xtermRef.current;
    if (!term) return;
    term.write('\r' + getPrompt() + inputBuffer.current + '\x1b[K');
    // Move cursor to correct position
    const diff = inputBuffer.current.length - cursorPos.current;
    if (diff > 0) term.write(`\x1b[${diff}D`);
  }, [getPrompt]);

  useEffect(() => {
    if (!termRef.current) return;

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
    term.write('\r\n' + getPrompt());

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
          } else if (output === '__HINT__') {
            onHintRequested();
          } else if (output) {
            term.writeln(output);
          }

          // Check validation after command
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
      } else if (code === 3) { // Ctrl+C
        inputBuffer.current = '';
        cursorPos.current = 0;
        term.write('^C');
        term.write('\r\n' + getPrompt());
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
    </div>
  );
}
