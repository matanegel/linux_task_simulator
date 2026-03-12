import type { FSNode } from './levels';

export interface CommandContext {
  fs: Record<string, FSNode>;
  cwd: string;
  history: string[];
  setCwd: (path: string) => void;
  setFs: (fs: Record<string, FSNode>) => void;
  addHistory: (cmd: string) => void;
}

function resolvePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return normalizePath(target);
  const parts = cwd === '/' ? [] : cwd.split('/').filter(Boolean);
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  return '/' + parts.join('/');
}

function normalizePath(p: string): string {
  const parts = p.split('/').filter(Boolean);
  const resolved: string[] = [];
  for (const seg of parts) {
    if (seg === '..') resolved.pop();
    else if (seg !== '.') resolved.push(seg);
  }
  return '/' + resolved.join('/');
}

function getNode(fs: Record<string, FSNode>, path: string): FSNode | null {
  if (path === '/') return fs['/'];
  const parts = path.split('/').filter(Boolean);
  let current = fs['/'];
  for (const part of parts) {
    if (!current || current.type !== 'dir' || !current.children?.[part]) return null;
    current = current.children[part];
  }
  return current;
}

function getParentAndName(fs: Record<string, FSNode>, path: string): { parent: FSNode | null; name: string } {
  const parts = path.split('/').filter(Boolean);
  const name = parts.pop() || '';
  const parentPath = '/' + parts.join('/');
  return { parent: getNode(fs, parentPath), name };
}

export function executeCommand(input: string, ctx: CommandContext): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  ctx.addHistory(trimmed);

  // Handle pipes
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map(p => p.trim());
    let lastOutput = '';
    for (const part of parts) {
      lastOutput = executeSingle(part, ctx, lastOutput);
    }
    return lastOutput;
  }

  return executeSingle(trimmed, ctx);
}

function executeSingle(input: string, ctx: CommandContext, pipedInput?: string): string {
  const args = input.split(/\s+/);
  const cmd = args[0];

  switch (cmd) {
    case 'ls': return cmdLs(args.slice(1), ctx);
    case 'cat': return cmdCat(args.slice(1), ctx);
    case 'cd': return cmdCd(args.slice(1), ctx);
    case 'pwd': return ctx.cwd;
    case 'grep': return cmdGrep(args.slice(1), ctx, pipedInput);
    case 'chmod': return cmdChmod(args.slice(1), ctx);
    case 'sort': return cmdSort(args.slice(1), ctx, pipedInput);
    case 'uniq': return cmdUniq(args.slice(1), ctx, pipedInput);
    case 'tail': return cmdTail(args.slice(1), ctx, pipedInput);
    case 'echo': return args.slice(1).join(' ');
    case 'clear': return '__CLEAR__';
    case 'help': return getHelp();
    case 'hint': return '__HINT__';
    case 'whoami': return 'recruit';
    case 'date': return new Date().toUTCString();
    default:
      if (cmd.startsWith('./')) return cmdExec(cmd, ctx);
      return `bash: ${cmd}: command not found`;
  }
}

function cmdLs(args: string[], ctx: CommandContext): string {
  const showAll = args.includes('-a');
  const showLong = args.includes('-l');
  const pathArg = args.find(a => !a.startsWith('-'));
  const target = pathArg ? resolvePath(ctx.cwd, pathArg) : ctx.cwd;
  const node = getNode(ctx.fs, target);

  if (!node || node.type !== 'dir') return `ls: cannot access '${pathArg || target}': No such file or directory`;

  const entries = Object.entries(node.children || {});
  const filtered = showAll ? entries : entries.filter(([name]) => !name.startsWith('.'));

  if (showLong) {
    const lines = filtered.map(([name, n]) => {
      const perm = n.type === 'dir' ? 'drwxr-xr-x' : (n.permissions || '-rw-r--r--');
      const size = n.content?.length || 4096;
      const type = n.type === 'dir' ? `\x1b[34m${name}/\x1b[0m` : name;
      return `${perm}  1 recruit recruit  ${String(size).padStart(5)}  Mar 12 09:00  ${type}`;
    });
    return lines.join('\n');
  }

  return filtered.map(([name, n]) =>
    n.type === 'dir' ? `\x1b[34m${name}/\x1b[0m` : name
  ).join('  ');
}

function cmdCat(args: string[], ctx: CommandContext): string {
  if (args.length === 0) return 'cat: missing operand';
  const results: string[] = [];
  for (const arg of args) {
    const path = resolvePath(ctx.cwd, arg);
    const node = getNode(ctx.fs, path);
    if (!node) { results.push(`cat: ${arg}: No such file or directory`); continue; }
    if (node.type === 'dir') { results.push(`cat: ${arg}: Is a directory`); continue; }
    results.push(node.content || '');
  }
  return results.join('\n');
}

function cmdCd(args: string[], ctx: CommandContext): string {
  const target = args[0] || '/';
  const path = resolvePath(ctx.cwd, target);
  const node = getNode(ctx.fs, path);
  if (!node) return `bash: cd: ${target}: No such file or directory`;
  if (node.type !== 'dir') return `bash: cd: ${target}: Not a directory`;
  ctx.setCwd(path);
  return '';
}

function cmdGrep(args: string[], ctx: CommandContext, pipedInput?: string): string {
  const recursive = args.includes('-r') || args.includes('-R');
  const filtered = args.filter(a => !a.startsWith('-'));
  const pattern = filtered[0];
  if (!pattern) return 'grep: missing pattern';

  if (pipedInput !== undefined) {
    const lines = pipedInput.split('\n').filter(l => l.includes(pattern));
    return lines.length ? lines.join('\n') : '';
  }

  const target = filtered[1] || '.';

  if (recursive) {
    const results: string[] = [];
    const searchDir = (dirPath: string) => {
      const dirNode = getNode(ctx.fs, dirPath);
      if (!dirNode || !dirNode.children) return;
      for (const [name, node] of Object.entries(dirNode.children)) {
        const fullPath = dirPath === '/' ? `/${name}` : `${dirPath}/${name}`;
        if (node.type === 'file' && node.content?.includes(pattern)) {
          const matching = node.content.split('\n').filter(l => l.includes(pattern));
          matching.forEach(l => results.push(`\x1b[35m${fullPath}\x1b[0m:\x1b[31m${pattern}\x1b[0m${l.replace(pattern, '')}`));
        } else if (node.type === 'dir') {
          searchDir(fullPath);
        }
      }
    };
    const searchPath = resolvePath(ctx.cwd, target);
    searchDir(searchPath);
    return results.length ? results.join('\n') : `grep: no matches found`;
  }

  const filePath = resolvePath(ctx.cwd, target);
  const node = getNode(ctx.fs, filePath);
  if (!node || node.type !== 'file') return `grep: ${target}: No such file or directory`;
  const lines = (node.content || '').split('\n').filter(l => l.includes(pattern));
  return lines.length ? lines.join('\n') : '';
}

function cmdChmod(args: string[], ctx: CommandContext): string {
  if (args.length < 2) return 'chmod: missing operand';
  const mode = args[0];
  const target = args[1];
  const path = resolvePath(ctx.cwd, target);
  const node = getNode(ctx.fs, path);
  if (!node) return `chmod: cannot access '${target}': No such file or directory`;

  const newFs = JSON.parse(JSON.stringify(ctx.fs));
  const targetNode = getNode(newFs, path);
  if (targetNode) {
    if (mode === '+x' || mode === '755' || mode === 'u+x') {
      targetNode.permissions = '-rwxr-xr-x';
    }
  }
  ctx.setFs(newFs);
  return '';
}

function cmdExec(cmd: string, ctx: CommandContext): string {
  const filename = cmd.slice(2);
  const path = resolvePath(ctx.cwd, filename);
  const node = getNode(ctx.fs, path);
  if (!node) return `bash: ${cmd}: No such file or directory`;
  if (node.type !== 'file') return `bash: ${cmd}: Is a directory`;
  if (!node.permissions?.includes('x')) return `bash: ${cmd}: Permission denied`;

  const content = node.content || '';
  const lines = content.split('\n');
  const output: string[] = [];
  for (const line of lines) {
    if (line.startsWith('#!')) continue;
    if (line.startsWith('echo ')) {
      output.push(line.slice(5).replace(/"/g, ''));
    }
  }
  return output.join('\n') || 'Script executed successfully.';
}

function cmdSort(args: string[], ctx: CommandContext, pipedInput?: string): string {
  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = args.find(a => !a.startsWith('-'));
    if (!file) return 'sort: missing operand';
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `sort: ${file}: No such file or directory`;
    content = node.content || '';
  }
  const lines = content.split('\n').filter(Boolean);
  lines.sort();
  return lines.join('\n');
}

function cmdUniq(args: string[], _ctx: CommandContext, pipedInput?: string): string {
  const showUnique = args.includes('-u');
  const content = pipedInput || '';
  const lines = content.split('\n').filter(Boolean);

  if (showUnique) {
    const counts = new Map<string, number>();
    for (const line of lines) counts.set(line, (counts.get(line) || 0) + 1);
    return Array.from(counts.entries()).filter(([, c]) => c === 1).map(([l]) => l).join('\n');
  }

  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== lines[i - 1]) result.push(lines[i]);
  }
  return result.join('\n');
}

function cmdTail(args: string[], ctx: CommandContext, pipedInput?: string): string {
  let n = 10;
  const nIdx = args.indexOf('-n');
  if (nIdx !== -1 && args[nIdx + 1]) n = parseInt(args[nIdx + 1]) || 10;

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = args.find(a => !a.startsWith('-') && !(!isNaN(parseInt(a)) && args[args.indexOf(a) - 1] === '-n'));
    if (!file) return 'tail: missing operand';
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `tail: ${file}: No such file or directory`;
    content = node.content || '';
  }

  const lines = content.split('\n');
  return lines.slice(-n).join('\n');
}

function getHelp(): string {
  return [
    '\x1b[1;31m╔══════════════════════════════════════╗\x1b[0m',
    '\x1b[1;31m║\x1b[0m  \x1b[1mLinux Quest - Available Commands\x1b[0m   \x1b[1;31m║\x1b[0m',
    '\x1b[1;31m╚══════════════════════════════════════╝\x1b[0m',
    '',
    '  \x1b[32mls\x1b[0m [-a] [-l]     List directory contents',
    '  \x1b[32mcat\x1b[0m <file>       Display file contents',
    '  \x1b[32mcd\x1b[0m <dir>         Change directory',
    '  \x1b[32mpwd\x1b[0m              Print working directory',
    '  \x1b[32mgrep\x1b[0m [-r] <pat>  Search for pattern',
    '  \x1b[32mchmod\x1b[0m <mode> <f> Change file permissions',
    '  \x1b[32msort\x1b[0m <file>      Sort lines',
    '  \x1b[32muniq\x1b[0m [-u]        Filter duplicate lines',
    '  \x1b[32mtail\x1b[0m [-n N]      Output last N lines',
    '  \x1b[32mclear\x1b[0m            Clear terminal',
    '  \x1b[32mhint\x1b[0m             Ask the Sensei for help',
    '  \x1b[32mhelp\x1b[0m             Show this message',
    '',
    '  Use \x1b[33m|\x1b[0m to pipe commands: sort file | uniq -u',
  ].join('\n');
}

export function getCompletions(partial: string, ctx: CommandContext): string[] {
  const parts = partial.split(/\s+/);
  if (parts.length <= 1) {
    const cmds = ['ls', 'cat', 'cd', 'pwd', 'grep', 'chmod', 'sort', 'uniq', 'tail', 'echo', 'clear', 'help', 'hint', 'whoami', 'date'];
    return cmds.filter(c => c.startsWith(parts[0]));
  }

  const lastPart = parts[parts.length - 1];
  const dirPart = lastPart.includes('/') ? lastPart.substring(0, lastPart.lastIndexOf('/') + 1) : '';
  const namePart = lastPart.includes('/') ? lastPart.substring(lastPart.lastIndexOf('/') + 1) : lastPart;
  const searchDir = dirPart ? resolvePath(ctx.cwd, dirPart) : ctx.cwd;
  const node = getNode(ctx.fs, searchDir);

  if (!node || !node.children) return [];
  return Object.entries(node.children)
    .filter(([name]) => name.startsWith(namePart))
    .map(([name, n]) => dirPart + name + (n.type === 'dir' ? '/' : ''));
}
