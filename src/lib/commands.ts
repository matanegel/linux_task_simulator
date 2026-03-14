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

function setNode(fs: Record<string, FSNode>, path: string, node: FSNode): Record<string, FSNode> {
  const newFs = JSON.parse(JSON.stringify(fs));
  const parts = path.split('/').filter(Boolean);
  const name = parts.pop()!;
  let current = newFs['/'];
  for (const part of parts) {
    if (!current.children?.[part]) return fs;
    current = current.children[part];
  }
  if (!current.children) current.children = {};
  current.children[name] = node;
  return newFs;
}

function removeNode(fs: Record<string, FSNode>, path: string): Record<string, FSNode> {
  const newFs = JSON.parse(JSON.stringify(fs));
  const parts = path.split('/').filter(Boolean);
  const name = parts.pop()!;
  let current = newFs['/'];
  for (const part of parts) {
    if (!current.children?.[part]) return fs;
    current = current.children[part];
  }
  if (current.children) delete current.children[name];
  return newFs;
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

  // Handle output redirection
  if (trimmed.includes('>>') || (trimmed.includes('>') && !trimmed.includes('>>'))) {
    return handleRedirection(trimmed, ctx);
  }

  return executeSingle(trimmed, ctx);
}

function handleRedirection(input: string, ctx: CommandContext): string {
  const append = input.includes('>>');
  const parts = input.split(append ? '>>' : '>');
  const cmd = parts[0].trim();
  const file = parts[1]?.trim();
  if (!file) return 'bash: syntax error near unexpected token';

  const output = executeSingle(cmd, ctx);
  const path = resolvePath(ctx.cwd, file);
  const existing = getNode(ctx.fs, path);

  let content = output;
  if (append && existing?.type === 'file') {
    content = (existing.content || '') + '\n' + output;
  }

  const newFs = setNode(ctx.fs, path, { type: 'file', content });
  ctx.setFs(newFs);
  return '';
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
    case 'head': return cmdHead(args.slice(1), ctx, pipedInput);
    case 'wc': return cmdWc(args.slice(1), ctx, pipedInput);
    case 'find': return cmdFind(args.slice(1), ctx);
    case 'mv': return cmdMv(args.slice(1), ctx);
    case 'cp': return cmdCp(args.slice(1), ctx);
    case 'rm': return cmdRm(args.slice(1), ctx);
    case 'mkdir': return cmdMkdir(args.slice(1), ctx);
    case 'touch': return cmdTouch(args.slice(1), ctx);
    case 'diff': return cmdDiff(args.slice(1), ctx);
    case 'cut': return cmdCut(args.slice(1), ctx, pipedInput);
    case 'tr': return cmdTr(args.slice(1), ctx, pipedInput);
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
  const ignoreCase = args.includes('-i');
  const filtered = args.filter(a => !a.startsWith('-'));
  const pattern = filtered[0];
  if (!pattern) return 'grep: missing pattern';

  const matchFn = (line: string) => ignoreCase
    ? line.toLowerCase().includes(pattern.toLowerCase())
    : line.includes(pattern);

  if (pipedInput !== undefined) {
    const lines = pipedInput.split('\n').filter(matchFn);
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
        if (node.type === 'file' && node.content) {
          const matching = node.content.split('\n').filter(matchFn);
          matching.forEach(l => results.push(`\x1b[35m${fullPath}\x1b[0m:${l}`));
        } else if (node.type === 'dir') {
          searchDir(fullPath);
        }
      }
    };
    const searchPath = resolvePath(ctx.cwd, target);
    searchDir(searchPath);
    return results.length ? results.join('\n') : 'grep: no matches found';
  }

  // Handle wildcard *
  if (target === '*') {
    const results: string[] = [];
    const dirNode = getNode(ctx.fs, ctx.cwd);
    if (dirNode?.children) {
      for (const [name, node] of Object.entries(dirNode.children)) {
        if (node.type === 'file' && node.content) {
          const matching = node.content.split('\n').filter(matchFn);
          matching.forEach(l => results.push(`\x1b[35m${name}\x1b[0m:${l}`));
        }
      }
    }
    return results.length ? results.join('\n') : 'grep: no matches found';
  }

  const filePath = resolvePath(ctx.cwd, target);
  const node = getNode(ctx.fs, filePath);
  if (!node || node.type !== 'file') return `grep: ${target}: No such file or directory`;
  const lines = (node.content || '').split('\n').filter(matchFn);
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
    } else if (mode === '+r' || mode === '644') {
      targetNode.permissions = '-rw-r--r--';
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
  const reverse = args.includes('-r');
  const numeric = args.includes('-n');
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
  if (numeric) {
    lines.sort((a, b) => parseInt(a) - parseInt(b));
  } else {
    lines.sort();
  }
  if (reverse) lines.reverse();
  return lines.join('\n');
}

function cmdUniq(args: string[], _ctx: CommandContext, pipedInput?: string): string {
  const showUnique = args.includes('-u');
  const showCount = args.includes('-c');
  const content = pipedInput || '';
  const lines = content.split('\n').filter(Boolean);

  if (showUnique) {
    const counts = new Map<string, number>();
    for (const line of lines) counts.set(line, (counts.get(line) || 0) + 1);
    return Array.from(counts.entries()).filter(([, c]) => c === 1).map(([l]) => l).join('\n');
  }

  if (showCount) {
    const counts = new Map<string, number>();
    const order: string[] = [];
    for (const line of lines) {
      if (!counts.has(line)) order.push(line);
      counts.set(line, (counts.get(line) || 0) + 1);
    }
    return order.map(l => `      ${counts.get(l)} ${l}`).join('\n');
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

  // Handle +N syntax for tail
  const plusArg = args.find(a => a.startsWith('+'));
  let fromLine = 0;
  if (plusArg) fromLine = parseInt(plusArg) - 1;

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = args.find(a => !a.startsWith('-') && !a.startsWith('+') && !(!isNaN(parseInt(a)) && args[args.indexOf(a) - 1] === '-n'));
    if (!file) return 'tail: missing operand';
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `tail: ${file}: No such file or directory`;
    content = node.content || '';
  }

  const lines = content.split('\n');
  if (fromLine > 0) return lines.slice(fromLine).join('\n');
  return lines.slice(-n).join('\n');
}

function cmdHead(args: string[], ctx: CommandContext, pipedInput?: string): string {
  let n = 10;
  const nIdx = args.indexOf('-n');
  if (nIdx !== -1 && args[nIdx + 1]) n = parseInt(args[nIdx + 1]) || 10;

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = args.find(a => !a.startsWith('-') && !(!isNaN(parseInt(a)) && args[args.indexOf(a) - 1] === '-n'));
    if (!file) return 'head: missing operand';
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `head: ${file}: No such file or directory`;
    content = node.content || '';
  }

  const lines = content.split('\n');
  return lines.slice(0, n).join('\n');
}

function cmdWc(args: string[], ctx: CommandContext, pipedInput?: string): string {
  const linesOnly = args.includes('-l');
  const wordsOnly = args.includes('-w');

  let content: string;
  let fileName = '';
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = args.find(a => !a.startsWith('-'));
    if (!file) return 'wc: missing operand';
    fileName = file;
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `wc: ${file}: No such file or directory`;
    content = node.content || '';
  }

  const lines = content.split('\n');
  const lineCount = lines.length;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const byteCount = content.length;
  const suffix = fileName ? ` ${fileName}` : '';

  if (linesOnly) return `${lineCount}${suffix}`;
  if (wordsOnly) return `${wordCount}${suffix}`;
  return `  ${lineCount}  ${wordCount}  ${byteCount}${suffix}`;
}

function cmdFind(args: string[], ctx: CommandContext): string {
  const startDir = args[0] || '.';
  const nameIdx = args.indexOf('-name');
  const pattern = nameIdx !== -1 ? args[nameIdx + 1] : null;

  const results: string[] = [];
  const search = (dirPath: string, displayPath: string) => {
    const node = getNode(ctx.fs, dirPath);
    if (!node || node.type !== 'dir') return;
    for (const [name, child] of Object.entries(node.children || {})) {
      const fullPath = dirPath === '/' ? `/${name}` : `${dirPath}/${name}`;
      const displayFull = displayPath === '.' ? `./${name}` : `${displayPath}/${name}`;
      if (!pattern || matchGlob(name, pattern)) {
        results.push(displayFull);
      }
      if (child.type === 'dir') {
        search(fullPath, displayFull);
      }
    }
  };

  const resolvedStart = resolvePath(ctx.cwd, startDir);
  const displayStart = startDir;
  search(resolvedStart, displayStart);
  return results.length ? results.join('\n') : 'find: no matches';
}

function matchGlob(name: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(name);
}

function cmdMv(args: string[], ctx: CommandContext): string {
  if (args.length < 2) return 'mv: missing operand';
  const src = args[0];
  const dest = args[1];
  const srcPath = resolvePath(ctx.cwd, src);
  const srcNode = getNode(ctx.fs, srcPath);
  if (!srcNode) return `mv: cannot stat '${src}': No such file or directory`;

  let destPath = resolvePath(ctx.cwd, dest);
  const destNode = getNode(ctx.fs, destPath);
  if (destNode?.type === 'dir') {
    const name = srcPath.split('/').pop()!;
    destPath = destPath === '/' ? `/${name}` : `${destPath}/${name}`;
  }

  let newFs = setNode(ctx.fs, destPath, JSON.parse(JSON.stringify(srcNode)));
  newFs = removeNode(newFs, srcPath);
  ctx.setFs(newFs);
  return '';
}

function cmdCp(args: string[], ctx: CommandContext): string {
  if (args.length < 2) return 'cp: missing operand';
  const src = args[0];
  const dest = args[1];
  const srcPath = resolvePath(ctx.cwd, src);
  const srcNode = getNode(ctx.fs, srcPath);
  if (!srcNode) return `cp: cannot stat '${src}': No such file or directory`;
  if (srcNode.type === 'dir') return `cp: -r not specified; omitting directory '${src}'`;

  let destPath = resolvePath(ctx.cwd, dest);
  const destNode = getNode(ctx.fs, destPath);
  if (destNode?.type === 'dir') {
    const name = srcPath.split('/').pop()!;
    destPath = destPath === '/' ? `/${name}` : `${destPath}/${name}`;
  }

  const newFs = setNode(ctx.fs, destPath, JSON.parse(JSON.stringify(srcNode)));
  ctx.setFs(newFs);
  return '';
}

function cmdRm(args: string[], ctx: CommandContext): string {
  const files = args.filter(a => !a.startsWith('-'));
  if (files.length === 0) return 'rm: missing operand';
  let newFs = ctx.fs;
  for (const file of files) {
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(newFs, path);
    if (!node) return `rm: cannot remove '${file}': No such file or directory`;
    if (node.type === 'dir' && !args.includes('-r') && !args.includes('-rf')) {
      return `rm: cannot remove '${file}': Is a directory`;
    }
    newFs = removeNode(newFs, path);
  }
  ctx.setFs(newFs);
  return '';
}

function cmdMkdir(args: string[], ctx: CommandContext): string {
  if (args.length === 0) return 'mkdir: missing operand';
  let newFs = ctx.fs;
  for (const dir of args) {
    if (dir.startsWith('-')) continue;
    const path = resolvePath(ctx.cwd, dir);
    const existing = getNode(newFs, path);
    if (existing) return `mkdir: cannot create directory '${dir}': File exists`;
    newFs = setNode(newFs, path, { type: 'dir', children: {} });
  }
  ctx.setFs(newFs);
  return '';
}

function cmdTouch(args: string[], ctx: CommandContext): string {
  if (args.length === 0) return 'touch: missing operand';
  let newFs = ctx.fs;
  for (const file of args) {
    if (file.startsWith('-')) continue;
    const path = resolvePath(ctx.cwd, file);
    const existing = getNode(newFs, path);
    if (!existing) {
      newFs = setNode(newFs, path, { type: 'file', content: '' });
    }
  }
  ctx.setFs(newFs);
  return '';
}

function cmdDiff(args: string[], ctx: CommandContext): string {
  const files = args.filter(a => !a.startsWith('-'));
  if (files.length < 2) return 'diff: missing operand';

  const path1 = resolvePath(ctx.cwd, files[0]);
  const path2 = resolvePath(ctx.cwd, files[1]);
  const node1 = getNode(ctx.fs, path1);
  const node2 = getNode(ctx.fs, path2);

  if (!node1) return `diff: ${files[0]}: No such file or directory`;
  if (!node2) return `diff: ${files[1]}: No such file or directory`;

  const lines1 = (node1.content || '').split('\n');
  const lines2 = (node2.content || '').split('\n');

  const output: string[] = [];
  const maxLen = Math.max(lines1.length, lines2.length);
  for (let i = 0; i < maxLen; i++) {
    if (lines1[i] !== lines2[i]) {
      output.push(`${i + 1}c${i + 1}`);
      if (lines1[i] !== undefined) output.push(`< ${lines1[i]}`);
      output.push('---');
      if (lines2[i] !== undefined) output.push(`> ${lines2[i]}`);
    }
  }

  return output.length ? output.join('\n') : '';
}

function cmdCut(args: string[], ctx: CommandContext, pipedInput?: string): string {
  const dIdx = args.indexOf('-d');
  const delimiter = dIdx !== -1 ? args[dIdx + 1]?.replace(/['"]/g, '') || '\t' : '\t';
  const fIdx = args.indexOf('-f');
  const fieldStr = fIdx !== -1 ? args[fIdx + 1] : '1';
  const fieldNum = parseInt(fieldStr || '1') - 1;

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = args.find(a => !a.startsWith('-') && a !== delimiter && a !== fieldStr);
    if (!file) return 'cut: missing operand';
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `cut: ${file}: No such file or directory`;
    content = node.content || '';
  }

  return content.split('\n').map(line => {
    const parts = line.split(delimiter);
    return parts[fieldNum] ?? '';
  }).join('\n');
}

function cmdTr(args: string[], _ctx: CommandContext, pipedInput?: string): string {
  if (args.length < 2) return 'tr: missing operand';
  const set1 = args[0].replace(/['"]/g, '');
  const set2 = args[1].replace(/['"]/g, '');
  const content = pipedInput || '';

  // Handle character ranges like A-Z, a-z
  const expandRange = (s: string): string => {
    return s.replace(/(.)-(.)/g, (_, start, end) => {
      let result = '';
      for (let i = start.charCodeAt(0); i <= end.charCodeAt(0); i++) {
        result += String.fromCharCode(i);
      }
      return result;
    });
  };

  const expanded1 = expandRange(set1);
  const expanded2 = expandRange(set2);

  let result = '';
  for (const ch of content) {
    const idx = expanded1.indexOf(ch);
    if (idx !== -1 && idx < expanded2.length) {
      result += expanded2[idx];
    } else {
      result += ch;
    }
  }
  return result;
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
    '  \x1b[32muniq\x1b[0m [-u] [-c]   Filter duplicate lines',
    '  \x1b[32mtail\x1b[0m [-n N]      Output last N lines',
    '  \x1b[32mhead\x1b[0m [-n N]      Output first N lines',
    '  \x1b[32mwc\x1b[0m [-l] [-w]     Count lines/words/bytes',
    '  \x1b[32mfind\x1b[0m . -name X   Find files by name',
    '  \x1b[32mmv\x1b[0m <src> <dst>   Move/rename files',
    '  \x1b[32mcp\x1b[0m <src> <dst>   Copy files',
    '  \x1b[32mrm\x1b[0m <file>        Remove files',
    '  \x1b[32mmkdir\x1b[0m <dir>      Create directory',
    '  \x1b[32mtouch\x1b[0m <file>     Create empty file',
    '  \x1b[32mdiff\x1b[0m <f1> <f2>   Compare files',
    '  \x1b[32mcut\x1b[0m -d, -f N     Extract columns',
    '  \x1b[32mtr\x1b[0m <set1> <set2> Translate characters',
    '  \x1b[32mecho\x1b[0m <text>      Print text',
    '  \x1b[32mclear\x1b[0m            Clear terminal',
    '  \x1b[32mhint\x1b[0m             Ask the Sensei',
    '  \x1b[32mhelp\x1b[0m             Show this message',
    '',
    '  Use \x1b[33m|\x1b[0m to pipe: sort file | uniq -u',
    '  Use \x1b[33m>\x1b[0m to write: echo hello > file.txt',
    '  Use \x1b[33m>>\x1b[0m to append: echo hello >> file.txt',
  ].join('\n');
}

export function getCompletions(partial: string, ctx: CommandContext): string[] {
  const parts = partial.split(/\s+/);
  if (parts.length <= 1) {
    const cmds = ['ls', 'cat', 'cd', 'pwd', 'grep', 'chmod', 'sort', 'uniq', 'tail', 'head', 'wc', 'find', 'mv', 'cp', 'rm', 'mkdir', 'touch', 'diff', 'cut', 'tr', 'echo', 'clear', 'help', 'hint', 'whoami', 'date'];
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
