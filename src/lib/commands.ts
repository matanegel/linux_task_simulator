import type { FSNode } from './levels';
import { parseArgs } from './parseArgs';

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
    let lastOutput: string | undefined = undefined;
    for (const part of parts) {
      lastOutput = executeSingle(part, ctx, lastOutput);
    }
    return lastOutput || '';
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
    case 'awk': return cmdAwk(args.slice(1), ctx, pipedInput);
    case 'sed': return cmdSed(args.slice(1), ctx, pipedInput);
    case 'tac': return cmdTac(args.slice(1), ctx, pipedInput);
    case 'paste': return cmdPaste(args.slice(1), ctx);
    case 'tee': return cmdTee(args.slice(1), ctx, pipedInput);
    case 'xargs': return cmdXargs(args.slice(1), ctx, pipedInput);
    case 'basename': return cmdBasename(args.slice(1));
    case 'dirname': return cmdDirname(args.slice(1));
    case 'rev': return cmdRev(args.slice(1), ctx, pipedInput);
    case 'seq': return cmdSeq(args.slice(1));
    case 'ps': return cmdPs(ctx);
    case 'echo': return args.slice(1).join(' ');
    case 'clear': return '__CLEAR__';
    case 'help': return getHelp();
    case 'hint': return '__HINT__';
    case 'man': return cmdMan(args.slice(1));
    case 'whoami': return 'recruit';
    case 'date': return new Date().toUTCString();
    default:
      if (cmd.startsWith('./')) return cmdExec(cmd, ctx);
      return `bash: ${cmd}: command not found`;
  }
}

function cmdLs(args: string[], ctx: CommandContext): string {
  const { parsed, error } = parseArgs(args, {
    booleans: ['l', 'a', 'h', 't'],
    command: 'ls',
  });
  if (error) return error;

  const showAll = !!parsed.flags['a'];
  const showLong = !!parsed.flags['l'];
  const humanReadable = !!parsed.flags['h'];
  const sortByTime = !!parsed.flags['t'];
  const pathArg = parsed.positional[0];
  const target = pathArg ? resolvePath(ctx.cwd, pathArg) : ctx.cwd;
  const node = getNode(ctx.fs, target);

  if (!node || node.type !== 'dir') return `ls: cannot access '${pathArg || target}': No such file or directory`;

  let entries = Object.entries(node.children || {});
  if (!showAll) entries = entries.filter(([name]) => !name.startsWith('.'));
  if (sortByTime) entries.reverse(); // simulate time-sort by reversing insertion order

  if (showLong) {
    const formatSize = (size: number) => {
      if (!humanReadable) return String(size);
      if (size >= 1048576) return (size / 1048576).toFixed(1) + 'M';
      if (size >= 1024) return (size / 1024).toFixed(1) + 'K';
      return String(size);
    };

    const rows = entries.map(([name, n]) => {
      const perm = n.type === 'dir' ? 'drwxr-xr-x' : (n.permissions || '-rw-r--r--');
      const size = n.content?.length || 4096;
      const displayName = n.type === 'dir' ? `\x1b[34m${name}/\x1b[0m` : name;
      return { perm, size: formatSize(size), displayName };
    });
    const maxSize = Math.max(...rows.map(r => r.size.length), 1);
    const lines = rows.map(r =>
      `${r.perm} 1 recruit recruit ${r.size.padStart(maxSize)} Mar 12 09:00 ${r.displayName}`
    );
    return lines.join('\n');
  }

  return entries.map(([name, n]) =>
    n.type === 'dir' ? `\x1b[34m${name}/\x1b[0m` : name
  ).join('  ');
}

function cmdCat(args: string[], ctx: CommandContext): string {
  const { parsed, error } = parseArgs(args, {
    booleans: ['n'],
    command: 'cat',
  });
  if (error) return error;

  if (parsed.positional.length === 0) return 'cat: missing operand';
  const numberLines = !!parsed.flags['n'];
  const results: string[] = [];
  for (const arg of parsed.positional) {
    const path = resolvePath(ctx.cwd, arg);
    const node = getNode(ctx.fs, path);
    if (!node) { results.push(`cat: ${arg}: No such file or directory`); continue; }
    if (node.type === 'dir') { results.push(`cat: ${arg}: Is a directory`); continue; }
    const content = node.content || '';
    if (numberLines) {
      const lines = content.split('\n');
      results.push(lines.map((l, i) => `     ${i + 1}\t${l}`).join('\n'));
    } else {
      results.push(content);
    }
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
  const { parsed, error } = parseArgs(args, {
    booleans: ['r', 'R', 'i', 'v', 'n'],
    withValue: ['f'],
    command: 'grep',
  });
  if (error) return error;

  const recursive = !!parsed.flags['r'] || !!parsed.flags['R'];
  const ignoreCase = !!parsed.flags['i'];
  const invert = !!parsed.flags['v'];
  const showLineNums = !!parsed.flags['n'];

  // -f FILE: read patterns from file
  let patterns: string[] = [];
  if (parsed.values['f']) {
    const patFile = resolvePath(ctx.cwd, parsed.values['f']);
    const patNode = getNode(ctx.fs, patFile);
    if (!patNode || patNode.type !== 'file') return `grep: ${parsed.values['f']}: No such file or directory`;
    patterns = (patNode.content || '').split('\n').filter(p => p.length > 0);
    if (!patterns.length) return 'grep: no patterns found in file';
  } else {
    const pattern = parsed.positional[0];
    if (!pattern) return 'grep: missing pattern';
    patterns = [pattern];
  }

  const matchFn = (line: string) => {
    const matches = patterns.some(p =>
      ignoreCase
        ? line.toLowerCase().includes(p.toLowerCase())
        : line.includes(p)
    );
    return invert ? !matches : matches;
  };

  const formatLines = (lines: string[], content: string, prefix?: string) => {
    const allLines = content.split('\n');
    const result: string[] = [];
    for (const line of lines) {
      if (showLineNums) {
        const lineNum = allLines.indexOf(line) + 1;
        const p = prefix ? `${prefix}:` : '';
        result.push(`${p}${lineNum}:${line}`);
      } else if (prefix) {
        result.push(`${prefix}:${line}`);
      } else {
        result.push(line);
      }
    }
    return result;
  };

  if (pipedInput !== undefined) {
    const lines = pipedInput.split('\n').filter(matchFn);
    if (!lines.length) return '';
    return formatLines(lines, pipedInput).join('\n');
  }

  const fileArgIndex = parsed.values['f'] ? 0 : 1;
  const target = parsed.positional[fileArgIndex] || '.';

  if (recursive) {
    const results: string[] = [];
    const searchDir = (dirPath: string) => {
      const dirNode = getNode(ctx.fs, dirPath);
      if (!dirNode || !dirNode.children) return;
      for (const [name, node] of Object.entries(dirNode.children)) {
        const fullPath = dirPath === '/' ? `/${name}` : `${dirPath}/${name}`;
        if (node.type === 'file' && node.content) {
          const matching = node.content.split('\n').filter(matchFn);
          results.push(...formatLines(matching, node.content, `\x1b[35m${fullPath}\x1b[0m`));
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
          results.push(...formatLines(matching, node.content, `\x1b[35m${name}\x1b[0m`));
        }
      }
    }
    return results.length ? results.join('\n') : 'grep: no matches found';
  }

  const filePath = resolvePath(ctx.cwd, target);
  const node = getNode(ctx.fs, filePath);
  if (!node || node.type !== 'file') return `grep: ${target}: No such file or directory`;
  const lines = (node.content || '').split('\n').filter(matchFn);
  if (!lines.length) return '';
  return formatLines(lines, node.content || '').join('\n');
}

function octalToPermString(octal: string, isDir: boolean): string {
  const map: Record<string, string> = {
    '0': '---', '1': '--x', '2': '-w-', '3': '-wx',
    '4': 'r--', '5': 'r-x', '6': 'rw-', '7': 'rwx',
  };
  const digits = octal.padStart(3, '0');
  const prefix = isDir ? 'd' : '-';
  return prefix + (map[digits[0]] || '---') + (map[digits[1]] || '---') + (map[digits[2]] || '---');
}

function applySymbolicMode(current: string, mode: string): string {
  const perms = current.split('');
  // Handle +x, u+x, a+x, +r, +w, etc.
  const match = mode.match(/^([ugoa]*)([+-])([rwx]+)$/);
  if (!match) return current;
  const [, who, op, bits] = match;
  const targets = (!who || who.includes('a')) ? ['u', 'g', 'o'] : who.split('');
  const offsets: Record<string, number> = { u: 1, g: 4, o: 7 };
  const bitMap: Record<string, number> = { r: 0, w: 1, x: 2 };
  for (const t of targets) {
    const base = offsets[t];
    if (!base) continue;
    for (const b of bits) {
      const idx = base + bitMap[b];
      perms[idx] = op === '+' ? b : '-';
    }
  }
  return perms.join('');
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
    const isDir = targetNode.type === 'dir';
    const currentPerms = targetNode.permissions || (isDir ? 'drwxr-xr-x' : '-rw-r--r--');
    if (/^\d{3,4}$/.test(mode)) {
      // Octal mode: take last 3 digits
      const digits = mode.slice(-3);
      targetNode.permissions = octalToPermString(digits, isDir);
    } else {
      // Symbolic mode: +x, u+x, go-w, etc.
      targetNode.permissions = applySymbolicMode(currentPerms, mode);
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

  // Use execOutput if available (keeps secrets hidden from cat)
  if (node.execOutput) return node.execOutput;

  const content = node.content || '';
  const lines = content.split('\n');
  const output: string[] = [];
  for (const line of lines) {
    if (line.startsWith('#!') || line.startsWith('#')) continue;
    if (line.startsWith('echo ')) {
      output.push(line.slice(5).replace(/"/g, ''));
    }
  }
  return output.join('\n') || 'Script executed successfully.';
}

function cmdSort(args: string[], ctx: CommandContext, pipedInput?: string): string {
  const { parsed, error } = parseArgs(args, {
    booleans: ['r', 'n', 'u', 'b'],
    command: 'sort',
  });
  if (error) return error;

  const reverse = !!parsed.flags['r'];
  const numeric = !!parsed.flags['n'];
  const unique = !!parsed.flags['u'];
  const ignoreLeadingBlanks = !!parsed.flags['b'];

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = parsed.positional[0];
    if (!file) return 'sort: missing operand';
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `sort: ${file}: No such file or directory`;
    content = node.content || '';
  }

  let lines = content.split('\n').filter(Boolean);

  // -b: strip leading whitespace from lines before sorting AND in output
  if (ignoreLeadingBlanks) {
    lines = lines.map(l => l.trimStart());
  }

  if (numeric) {
    lines.sort((a, b) => parseInt(a) - parseInt(b));
  } else {
    lines.sort();
  }
  if (reverse) lines.reverse();
  if (unique) lines = [...new Set(lines)];
  return lines.join('\n');
}

function cmdUniq(args: string[], ctx: CommandContext, pipedInput?: string): string {
  const { parsed, error } = parseArgs(args, {
    booleans: ['u', 'd', 'c'],
    command: 'uniq',
  });
  if (error) return error;

  const showUnique = !!parsed.flags['u'];
  const showDuplicates = !!parsed.flags['d'];
  const showCount = !!parsed.flags['c'];

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = parsed.positional[0];
    if (!file) return 'uniq: missing operand';
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `uniq: ${file}: No such file or directory`;
    content = node.content || '';
  }

  const lines = content.split('\n').filter(Boolean);

  // Count consecutive duplicates (like real uniq) — compare trimmed to handle whitespace
  const groups: { line: string; count: number }[] = [];
  for (const line of lines) {
    const trimmed = line.trimStart();
    const lastGroup = groups.length > 0 ? groups[groups.length - 1] : null;
    if (lastGroup && lastGroup.line.trimStart() === trimmed) {
      lastGroup.count++;
    } else {
      groups.push({ line, count: 1 });
    }
  }

  let filtered = groups;
  if (showUnique) {
    filtered = groups.filter(g => g.count === 1);
  } else if (showDuplicates) {
    filtered = groups.filter(g => g.count > 1);
  }

  if (showCount) {
    return filtered.map(g => `      ${g.count} ${g.line}`).join('\n');
  }

  return filtered.map(g => g.line).join('\n');
}

function cmdTail(args: string[], ctx: CommandContext, pipedInput?: string): string {
  const { parsed, error } = parseArgs(args, {
    withValue: ['n'],
    command: 'tail',
  });
  if (error) return error;

  let n = parseInt(parsed.values['n'] || '10') || 10;

  // Handle +N syntax for tail
  const plusArg = parsed.positional.find(a => a.startsWith('+'));
  let fromLine = 0;
  if (plusArg) fromLine = parseInt(plusArg) - 1;

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = parsed.positional.find(a => !a.startsWith('+'));
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
  const { parsed, error } = parseArgs(args, {
    withValue: ['n'],
    command: 'head',
  });
  if (error) return error;

  let n = parseInt(parsed.values['n'] || '10') || 10;

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = parsed.positional[0];
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
  const { parsed, error } = parseArgs(args, {
    booleans: ['l', 'w', 'c'],
    command: 'wc',
  });
  if (error) return error;

  const linesOnly = !!parsed.flags['l'];
  const wordsOnly = !!parsed.flags['w'];

  let content: string;
  let fileName = '';
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = parsed.positional[0];
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
  let delimiter = '\t';
  let fieldStr = '1';
  const consumed = new Set<number>();

  // Parse -d and -f flags (handle -d, / -d , / -f3 / -f 3)
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '-d' && i + 1 < args.length) {
      delimiter = args[i + 1].replace(/['"]/g, '');
      consumed.add(i); consumed.add(i + 1); i++;
    } else if (a.startsWith('-d') && a.length > 2) {
      delimiter = a.slice(2).replace(/['"]/g, '');
      consumed.add(i);
    } else if (a === '-f' && i + 1 < args.length) {
      fieldStr = args[i + 1];
      consumed.add(i); consumed.add(i + 1); i++;
    } else if (a.startsWith('-f') && a.length > 2) {
      fieldStr = a.slice(2);
      consumed.add(i);
    }
  }

  // Parse field numbers (support ranges like 1,3 or 2-4)
  const fieldNums: number[] = [];
  for (const part of fieldStr.split(',')) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      for (let n = start; n <= end; n++) fieldNums.push(n - 1);
    } else {
      fieldNums.push(parseInt(part) - 1);
    }
  }

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    const file = args.find((a, i) => !consumed.has(i) && !a.startsWith('-'));
    if (!file) return 'cut: missing operand';
    const path = resolvePath(ctx.cwd, file);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `cut: ${file}: No such file or directory`;
    content = node.content || '';
  }

  return content.split('\n').map(line => {
    const trimmedLine = line.trimStart();
    const parts = trimmedLine.split(delimiter);
    return fieldNums.map(f => parts[f] ?? '').join(delimiter);
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

// ═══════════════════════════════════════════
// Stage 2 Commands: awk, sed, tac, paste, tee, xargs, basename, dirname, rev, seq, ps
// ═══════════════════════════════════════════

function cmdAwk(args: string[], ctx: CommandContext, pipedInput?: string): string {
  // Parse -F delimiter
  let delimiter = /\s+/;
  let delimStr = ' ';
  let programIdx = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-F' && i + 1 < args.length) {
      delimStr = args[i + 1].replace(/['"]/g, '');
      delimiter = new RegExp(delimStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      programIdx = i + 2;
      break;
    } else if (args[i].startsWith("-F") && args[i].length > 2) {
      delimStr = args[i].slice(2).replace(/['"]/g, '');
      delimiter = new RegExp(delimStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      programIdx = i + 1;
      break;
    }
  }

  // Find the awk program (in quotes)
  let program = '';
  const rawArgs = args.slice(programIdx);
  // Join args and find content between quotes
  const joined = rawArgs.join(' ');
  const qMatch = joined.match(/^'([^']*)'(.*)$/) || joined.match(/^"([^"]*)"(.*)$/);
  let fileArg = '';
  if (qMatch) {
    program = qMatch[1];
    fileArg = qMatch[2].trim();
  } else {
    program = rawArgs[0] || '';
    fileArg = rawArgs[1] || '';
  }

  if (!program) return 'awk: missing program';

  // Get input
  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    if (!fileArg) return 'awk: missing input file';
    const path = resolvePath(ctx.cwd, fileArg);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `awk: ${fileArg}: No such file or directory`;
    content = node.content || '';
  }

  const lines = content.split('\n');
  const output: string[] = [];

  // Parse simple awk patterns:
  // '{print $N}' | '$N == "val" {print $M}' | '$N == val' | 'NR>1 {sum+=$N} END {print sum}' | '/pattern/'
  
  // Check for BEGIN/END blocks
  let beginBlock = '';
  let mainPattern = '';
  let mainAction = '';
  let endBlock = '';

  const beginMatch = program.match(/BEGIN\s*\{([^}]*)\}/);
  const endMatch = program.match(/END\s*\{([^}]*)\}/);
  if (beginMatch) beginBlock = beginMatch[1];
  if (endMatch) endBlock = endMatch[1];

  // Remove BEGIN/END blocks to get main
  let mainProg = program
    .replace(/BEGIN\s*\{[^}]*\}/, '')
    .replace(/END\s*\{[^}]*\}/, '')
    .trim();

  // Parse main: pattern {action} or just {action} or just pattern
  const mainMatch = mainProg.match(/^([^{]*?)\s*\{([^}]*)\}\s*$/);
  if (mainMatch) {
    mainPattern = mainMatch[1].trim();
    mainAction = mainMatch[2].trim();
  } else if (mainProg.startsWith('{') && mainProg.endsWith('}')) {
    mainAction = mainProg.slice(1, -1).trim();
  } else if (mainProg) {
    mainPattern = mainProg;
    mainAction = 'print $0';
  }

  // Variables for awk execution
  const vars: Record<string, number> = {};

  const getFields = (line: string) => {
    const fields = line.split(delimiter);
    return ['', ...fields]; // $0 = full line at index concept
  };

  const evalExpr = (expr: string, fields: string[], fullLine: string, nr: number): string => {
    let result = expr;
    // Replace $0 with full line
    result = result.replace(/\$0/g, fullLine);
    // Replace $N with field values
    result = result.replace(/\$(\d+)/g, (_, n) => fields[parseInt(n)] || '');
    // Replace NR
    result = result.replace(/\bNR\b/g, String(nr));
    // Replace NF
    result = result.replace(/\bNF\b/g, String(fields.length - 1));
    // Replace variable references
    for (const [k, v] of Object.entries(vars)) {
      result = result.replace(new RegExp('\\b' + k + '\\b', 'g'), String(v));
    }
    return result;
  };

  const executeAction = (action: string, fields: string[], fullLine: string, nr: number): string | null => {
    // Handle multiple statements separated by ;
    const statements = action.split(';').map(s => s.trim()).filter(Boolean);
    let printOutput: string | null = null;

    for (const stmt of statements) {
      // sum+=$N
      const accMatch = stmt.match(/^(\w+)\s*\+=\s*\$(\d+)$/);
      if (accMatch) {
        const varName = accMatch[1];
        const fieldIdx = parseInt(accMatch[2]);
        const val = parseFloat(fields[fieldIdx] || '0');
        vars[varName] = (vars[varName] || 0) + val;
        continue;
      }

      // variable = expression
      const assignMatch = stmt.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch && !stmt.startsWith('print')) {
        const varName = assignMatch[1];
        const val = evalExpr(assignMatch[2], fields, fullLine, nr);
        vars[varName] = parseFloat(val) || 0;
        continue;
      }

      // print
      if (stmt.startsWith('print')) {
        const printExpr = stmt.replace(/^print\s*/, '');
        if (!printExpr) {
          printOutput = fullLine;
        } else {
          printOutput = evalExpr(printExpr, fields, fullLine, nr);
        }
      }
    }
    return printOutput;
  };

  const checkPattern = (pattern: string, fields: string[], fullLine: string, nr: number): boolean => {
    if (!pattern) return true;
    // NR>1
    const nrMatch = pattern.match(/^NR\s*([><=!]+)\s*(\d+)$/);
    if (nrMatch) {
      const op = nrMatch[1];
      const val = parseInt(nrMatch[2]);
      if (op === '>') return nr > val;
      if (op === '>=') return nr >= val;
      if (op === '<') return nr < val;
      if (op === '==') return nr === val;
      if (op === '!=') return nr !== val;
    }
    // $N == "val" or $N == val
    const fieldMatch = pattern.match(/^\$(\d+)\s*([=!<>]+)\s*"?([^"]*)"?$/);
    if (fieldMatch) {
      const fieldVal = fields[parseInt(fieldMatch[1])] || '';
      const op = fieldMatch[2];
      const cmpVal = fieldMatch[3];
      if (op === '==' || op === '=') return fieldVal === cmpVal;
      if (op === '!=') return fieldVal !== cmpVal;
      if (op === '>') return parseFloat(fieldVal) > parseFloat(cmpVal);
      if (op === '<') return parseFloat(fieldVal) < parseFloat(cmpVal);
      if (op === '>=') return parseFloat(fieldVal) >= parseFloat(cmpVal);
      if (op === '<=') return parseFloat(fieldVal) <= parseFloat(cmpVal);
    }
    // /regex/
    const regexMatch = pattern.match(/^\/(.+)\/$/);
    if (regexMatch) {
      return new RegExp(regexMatch[1]).test(fullLine);
    }
    return true;
  };

  // Process lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nr = i + 1;
    const fields = getFields(line);

    if (checkPattern(mainPattern, fields, line, nr)) {
      if (mainAction) {
        const result = executeAction(mainAction, fields, line, nr);
        if (result !== null) output.push(result);
      } else {
        output.push(line);
      }
    }
  }

  // END block
  if (endBlock) {
    const result = executeAction(endBlock, [''], '', lines.length + 1);
    if (result !== null) output.push(result);
  }

  return output.join('\n');
}

function cmdSed(args: string[], ctx: CommandContext, pipedInput?: string): string {
  if (args.length === 0) return 'sed: missing script';

  let script = args[0];
  let fileArg = args[1] || '';
  
  // Handle quoted scripts
  if (script.startsWith("'") || script.startsWith('"')) {
    const quote = script[0];
    const joined = args.join(' ');
    const endQ = joined.indexOf(quote, 1);
    if (endQ > 0) {
      script = joined.substring(1, endQ);
      fileArg = joined.substring(endQ + 1).trim();
    }
  }

  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    if (!fileArg) return 'sed: missing input file';
    const path = resolvePath(ctx.cwd, fileArg);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `sed: ${fileArg}: No such file or directory`;
    content = node.content || '';
  }

  const lines = content.split('\n');

  // Parse sed commands: s/old/new/[g], /pattern/d, Nd
  // Substitution: s/old/new/g
  const subMatch = script.match(/^s(.)(.+?)\1(.*?)\1(g?)$/);
  if (subMatch) {
    const [, , pattern, replacement, globalFlag] = subMatch;
    const regex = globalFlag
      ? new RegExp(pattern, 'g')
      : new RegExp(pattern);
    return lines.map(l => l.replace(regex, replacement)).join('\n');
  }

  // Delete by pattern: /pattern/d
  const delPatternMatch = script.match(/^\/(.+)\/d$/);
  if (delPatternMatch) {
    const pattern = new RegExp(delPatternMatch[1]);
    return lines.filter(l => !pattern.test(l)).join('\n');
  }

  // Delete by line number: Nd
  const delLineMatch = script.match(/^(\d+)d$/);
  if (delLineMatch) {
    const lineNum = parseInt(delLineMatch[1]);
    return lines.filter((_, i) => i + 1 !== lineNum).join('\n');
  }

  // Print specific line: Np
  const printLineMatch = script.match(/^(\d+)p$/);
  if (printLineMatch) {
    const lineNum = parseInt(printLineMatch[1]);
    return lines[lineNum - 1] || '';
  }

  return content;
}

function cmdTac(args: string[], ctx: CommandContext, pipedInput?: string): string {
  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    if (args.length === 0) return 'tac: missing operand';
    const path = resolvePath(ctx.cwd, args[0]);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `tac: ${args[0]}: No such file or directory`;
    content = node.content || '';
  }
  return content.split('\n').reverse().join('\n');
}

function cmdPaste(args: string[], ctx: CommandContext): string {
  const files = args.filter(a => !a.startsWith('-'));
  if (files.length < 2) return 'paste: missing operand';

  const delimiter = '\t';
  const fileContents = files.map(f => {
    const path = resolvePath(ctx.cwd, f);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return null;
    return (node.content || '').split('\n');
  });

  if (fileContents.some(c => c === null)) return 'paste: file not found';

  const maxLines = Math.max(...fileContents.map(c => c!.length));
  const output: string[] = [];
  for (let i = 0; i < maxLines; i++) {
    output.push(fileContents.map(c => c![i] || '').join(delimiter));
  }
  return output.join('\n');
}

function cmdTee(args: string[], ctx: CommandContext, pipedInput?: string): string {
  if (pipedInput === undefined) return 'tee: missing input (use with pipe)';
  const file = args.find(a => !a.startsWith('-'));
  if (file) {
    const path = resolvePath(ctx.cwd, file);
    const append = args.includes('-a');
    const existing = getNode(ctx.fs, path);
    let content = pipedInput;
    if (append && existing?.type === 'file') {
      content = (existing.content || '') + '\n' + pipedInput;
    }
    const newFs = setNode(ctx.fs, path, { type: 'file', content });
    ctx.setFs(newFs);
  }
  return pipedInput;
}

function cmdXargs(args: string[], ctx: CommandContext, pipedInput?: string): string {
  if (pipedInput === undefined) return 'xargs: missing input (use with pipe)';
  const items = pipedInput.split('\n').filter(Boolean);
  
  if (args.length === 0 || (args.length === 1 && args[0] === 'echo')) {
    return items.join(' ');
  }
  
  // xargs <cmd> — run cmd with each item
  const cmd = args.join(' ');
  const results: string[] = [];
  for (const item of items) {
    const result = executeSingle(`${cmd} ${item}`, ctx);
    if (result) results.push(result);
  }
  return results.join('\n');
}

function cmdBasename(args: string[]): string {
  if (args.length === 0) return 'basename: missing operand';
  const path = args[0].replace(/['"]/g, '');
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || '/';
}

function cmdDirname(args: string[]): string {
  if (args.length === 0) return 'dirname: missing operand';
  const path = args[0].replace(/['"]/g, '');
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash <= 0) return '/';
  return path.substring(0, lastSlash);
}

function cmdRev(args: string[], ctx: CommandContext, pipedInput?: string): string {
  let content: string;
  if (pipedInput !== undefined) {
    content = pipedInput;
  } else {
    if (args.length === 0) return 'rev: missing operand';
    const path = resolvePath(ctx.cwd, args[0]);
    const node = getNode(ctx.fs, path);
    if (!node || node.type !== 'file') return `rev: ${args[0]}: No such file or directory`;
    content = node.content || '';
  }
  return content.split('\n').map(l => l.split('').reverse().join('')).join('\n');
}

function cmdSeq(args: string[]): string {
  if (args.length === 0) return 'seq: missing operand';
  let start = 1, end = 1, step = 1;
  if (args.length === 1) { end = parseInt(args[0]); }
  else if (args.length === 2) { start = parseInt(args[0]); end = parseInt(args[1]); }
  else { start = parseInt(args[0]); step = parseInt(args[1]); end = parseInt(args[2]); }
  
  const result: number[] = [];
  if (step > 0) { for (let i = start; i <= end; i += step) result.push(i); }
  else if (step < 0) { for (let i = start; i >= end; i += step) result.push(i); }
  return result.join('\n');
}

function cmdPs(ctx: CommandContext): string {
  // Look for .processes file in filesystem
  const procNode = getNode(ctx.fs, '/.processes');
  if (procNode?.type === 'file' && procNode.content) {
    return procNode.content;
  }
  return 'PID  USER      CPU%  MEM%  COMMAND\n1    root      0.0   0.1   init\n245  recruit   0.1   0.3   bash';
}

function cmdMan(args: string[]): string {
  if (args.length === 0) return 'What manual page do you want?\nUsage: man <command>';
  const cmd = args[0];
  const page = MAN_PAGES[cmd];
  if (!page) return `No manual entry for ${cmd}`;
  return page;
}

const MAN_PAGES: Record<string, string> = {
  ls: [
    '\x1b[1mLS(1)\x1b[0m                     User Commands                     \x1b[1mLS(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       ls - list directory contents',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mls\x1b[0m [\x1b[4mOPTION\x1b[0m]... [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       List information about files in the current directory.',
    '',
    '       \x1b[1m-a\x1b[0m     do not ignore entries starting with . (show hidden files)',
    '       \x1b[1m-l\x1b[0m     use a long listing format (permissions, size, date)',
    '       \x1b[1m-h\x1b[0m     with -l, print sizes in human readable format (K, M)',
    '       \x1b[1m-t\x1b[0m     sort by modification time, newest first',
  ].join('\n'),

  cat: [
    '\x1b[1mCAT(1)\x1b[0m                    User Commands                    \x1b[1mCAT(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       cat - concatenate files and print on the standard output',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mcat\x1b[0m [\x1b[4mOPTION\x1b[0m]... [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Concatenate FILE(s) to standard output.',
    '',
    '       \x1b[1m-n\x1b[0m     number all output lines',
  ].join('\n'),

  cd: [
    '\x1b[1mCD(1)\x1b[0m                     User Commands                     \x1b[1mCD(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       cd - change the working directory',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mcd\x1b[0m [\x1b[4mdir\x1b[0m]',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Change the current directory to \x1b[4mdir\x1b[0m.',
    '       With no arguments, changes to /.',
    '       Use .. to go up one level.',
  ].join('\n'),

  pwd: [
    '\x1b[1mPWD(1)\x1b[0m                    User Commands                    \x1b[1mPWD(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       pwd - print name of current/working directory',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mpwd\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Print the full filename of the current working directory.',
  ].join('\n'),

  grep: [
    '\x1b[1mGREP(1)\x1b[0m                   User Commands                   \x1b[1mGREP(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       grep - print lines that match patterns',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mgrep\x1b[0m [\x1b[4mOPTION\x1b[0m]... \x1b[4mPATTERN\x1b[0m [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Search for PATTERN in each FILE or standard input.',
    '',
    '       \x1b[1m-i\x1b[0m     ignore case distinctions in patterns and data',
    '       \x1b[1m-v\x1b[0m     invert match: select non-matching lines',
    '       \x1b[1m-r\x1b[0m     read all files under each directory, recursively',
    '       \x1b[1m-n\x1b[0m     prefix each line of output with the line number',
    '       \x1b[1m-f\x1b[0m \x1b[4mFILE\x1b[0m  obtain patterns from FILE, one per line',
  ].join('\n'),

  chmod: [
    '\x1b[1mCHMOD(1)\x1b[0m                  User Commands                  \x1b[1mCHMOD(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       chmod - change file mode bits',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mchmod\x1b[0m [\x1b[4mMODE\x1b[0m] \x1b[4mFILE\x1b[0m...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Change the file mode (permissions) of each FILE.',
    '',
    '       Symbolic modes: \x1b[1m+x\x1b[0m (add execute), \x1b[1m-w\x1b[0m (remove write)',
    '       Octal modes: \x1b[1m755\x1b[0m (rwxr-xr-x), \x1b[1m644\x1b[0m (rw-r--r--)',
    '       Who: \x1b[1mu\x1b[0m (user), \x1b[1mg\x1b[0m (group), \x1b[1mo\x1b[0m (others), \x1b[1ma\x1b[0m (all)',
  ].join('\n'),

  sort: [
    '\x1b[1mSORT(1)\x1b[0m                   User Commands                   \x1b[1mSORT(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       sort - sort lines of text files',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1msort\x1b[0m [\x1b[4mOPTION\x1b[0m]... [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Write sorted concatenation of all FILE(s) to standard output.',
    '',
    '       \x1b[1m-b\x1b[0m     ignore leading blanks',
    '       \x1b[1m-n\x1b[0m     compare according to string numerical value',
    '       \x1b[1m-r\x1b[0m     reverse the result of comparisons',
    '       \x1b[1m-u\x1b[0m     output only the first of an equal run',
  ].join('\n'),

  uniq: [
    '\x1b[1mUNIQ(1)\x1b[0m                   User Commands                   \x1b[1mUNIQ(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       uniq - report or omit repeated lines',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1muniq\x1b[0m [\x1b[4mOPTION\x1b[0m]... [\x1b[4mINPUT\x1b[0m]',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Filter adjacent matching lines from INPUT, writing to output.',
    '       Note: input should be sorted first for best results.',
    '',
    '       \x1b[1m-c\x1b[0m     prefix lines by the number of occurrences',
    '       \x1b[1m-d\x1b[0m     only print duplicate lines, one for each group',
    '       \x1b[1m-u\x1b[0m     only print unique lines (lines that appear exactly once)',
  ].join('\n'),

  head: [
    '\x1b[1mHEAD(1)\x1b[0m                   User Commands                   \x1b[1mHEAD(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       head - output the first part of files',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mhead\x1b[0m [\x1b[4mOPTION\x1b[0m]... [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Print the first 10 lines of each FILE to standard output.',
    '',
    '       \x1b[1m-n\x1b[0m \x1b[4mN\x1b[0m   print the first N lines instead of the first 10',
  ].join('\n'),

  tail: [
    '\x1b[1mTAIL(1)\x1b[0m                   User Commands                   \x1b[1mTAIL(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       tail - output the last part of files',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mtail\x1b[0m [\x1b[4mOPTION\x1b[0m]... [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Print the last 10 lines of each FILE to standard output.',
    '',
    '       \x1b[1m-n\x1b[0m \x1b[4mN\x1b[0m   output the last N lines instead of the last 10',
  ].join('\n'),

  wc: [
    '\x1b[1mWC(1)\x1b[0m                     User Commands                     \x1b[1mWC(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       wc - print newline, word, and byte counts',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mwc\x1b[0m [\x1b[4mOPTION\x1b[0m]... [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Print line, word, and byte counts for each FILE.',
    '',
    '       \x1b[1m-l\x1b[0m     print the newline (line) count',
    '       \x1b[1m-w\x1b[0m     print the word count',
    '       \x1b[1m-c\x1b[0m     print the byte count',
  ].join('\n'),

  find: [
    '\x1b[1mFIND(1)\x1b[0m                   User Commands                   \x1b[1mFIND(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       find - search for files in a directory hierarchy',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mfind\x1b[0m [\x1b[4mpath\x1b[0m] [\x1b[4mexpression\x1b[0m]',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Search for files in a directory tree rooted at path.',
    '',
    '       \x1b[1m-name\x1b[0m \x1b[4mpattern\x1b[0m   file name matches pattern (supports * and ?)',
  ].join('\n'),

  mv: [
    '\x1b[1mMV(1)\x1b[0m                     User Commands                     \x1b[1mMV(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       mv - move (rename) files',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mmv\x1b[0m \x1b[4mSOURCE\x1b[0m \x1b[4mDEST\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Rename SOURCE to DEST, or move SOURCE to directory DEST.',
  ].join('\n'),

  cp: [
    '\x1b[1mCP(1)\x1b[0m                     User Commands                     \x1b[1mCP(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       cp - copy files and directories',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mcp\x1b[0m \x1b[4mSOURCE\x1b[0m \x1b[4mDEST\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Copy SOURCE to DEST.',
  ].join('\n'),

  rm: [
    '\x1b[1mRM(1)\x1b[0m                     User Commands                     \x1b[1mRM(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       rm - remove files or directories',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mrm\x1b[0m [\x1b[4mOPTION\x1b[0m]... \x1b[4mFILE\x1b[0m...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Remove each specified FILE.',
    '',
    '       \x1b[1m-r\x1b[0m     remove directories and their contents recursively',
  ].join('\n'),

  mkdir: [
    '\x1b[1mMKDIR(1)\x1b[0m                  User Commands                  \x1b[1mMKDIR(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       mkdir - make directories',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mmkdir\x1b[0m \x1b[4mDIRECTORY\x1b[0m...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Create the DIRECTORY(ies), if they do not already exist.',
  ].join('\n'),

  touch: [
    '\x1b[1mTOUCH(1)\x1b[0m                  User Commands                  \x1b[1mTOUCH(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       touch - change file timestamps / create empty files',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mtouch\x1b[0m \x1b[4mFILE\x1b[0m...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Update access and modification times of FILE.',
    '       If FILE does not exist, create an empty file.',
  ].join('\n'),

  echo: [
    '\x1b[1mECHO(1)\x1b[0m                   User Commands                   \x1b[1mECHO(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       echo - display a line of text',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mecho\x1b[0m [\x1b[4mSTRING\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Echo the STRING(s) to standard output.',
    '       Use \x1b[1m>\x1b[0m to write to file: echo hello > file.txt',
    '       Use \x1b[1m>>\x1b[0m to append: echo hello >> file.txt',
  ].join('\n'),

  diff: [
    '\x1b[1mDIFF(1)\x1b[0m                   User Commands                   \x1b[1mDIFF(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       diff - compare files line by line',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mdiff\x1b[0m \x1b[4mFILE1\x1b[0m \x1b[4mFILE2\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Compare FILE1 and FILE2 line by line.',
    '       Lines from FILE1 are prefixed with <',
    '       Lines from FILE2 are prefixed with >',
  ].join('\n'),

  cut: [
    '\x1b[1mCUT(1)\x1b[0m                    User Commands                    \x1b[1mCUT(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       cut - remove sections from each line of files',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mcut\x1b[0m \x1b[4mOPTION\x1b[0m... [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Print selected parts of lines from each FILE.',
    '',
    '       \x1b[1m-d\x1b[0m \x1b[4mDELIM\x1b[0m   use DELIM instead of TAB for field delimiter',
    '       \x1b[1m-f\x1b[0m \x1b[4mLIST\x1b[0m    select only these fields (e.g., 1,3 or 2-4)',
  ].join('\n'),

  tr: [
    '\x1b[1mTR(1)\x1b[0m                     User Commands                     \x1b[1mTR(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       tr - translate or delete characters',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mtr\x1b[0m \x1b[4mSET1\x1b[0m \x1b[4mSET2\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Translate characters in SET1 to corresponding characters in SET2.',
    '       Supports ranges: \x1b[1mA-Z\x1b[0m, \x1b[1ma-z\x1b[0m, \x1b[1m0-9\x1b[0m',
    '',
    '       Example: cat file | tr A-Z a-z   (convert to lowercase)',
  ].join('\n'),

  awk: [
    '\x1b[1mAWK(1)\x1b[0m                    User Commands                    \x1b[1mAWK(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       awk - pattern scanning and text processing language',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    "       \x1b[1mawk\x1b[0m [\x1b[4m-F sep\x1b[0m] '\x1b[4mprogram\x1b[0m' [\x1b[4mfile\x1b[0m]",
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Process text line by line, splitting into fields.',
    '',
    "       \x1b[1m-F\x1b[0m \x1b[4msep\x1b[0m    set field separator (default: whitespace)",
    '       \x1b[1m$1, $2...\x1b[0m  access fields by number ($0 = whole line)',
    '       \x1b[1mNR\x1b[0m         current line number',
    '       \x1b[1mNF\x1b[0m         number of fields in current line',
    '',
    '\x1b[1mEXAMPLES\x1b[0m',
    "       awk '{print $1}' file          Print first field of each line",
    "       awk -F',' '{print $2}' f.csv   Print 2nd CSV column",
    "       awk '$3 > 100' file            Print lines where field 3 > 100",
    "       awk 'NR>1 {s+=$2} END {print s}'  Sum field 2, skip header",
  ].join('\n'),

  sed: [
    '\x1b[1mSED(1)\x1b[0m                    User Commands                    \x1b[1mSED(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       sed - stream editor for filtering and transforming text',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    "       \x1b[1msed\x1b[0m '\x1b[4mcommand\x1b[0m' [\x1b[4mfile\x1b[0m]",
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Apply editing commands to text, line by line.',
    '',
    '\x1b[1mCOMMANDS\x1b[0m',
    "       \x1b[1ms/old/new/\x1b[0m     substitute first 'old' with 'new' on each line",
    "       \x1b[1ms/old/new/g\x1b[0m    substitute ALL occurrences (global)",
    '       \x1b[1m/pattern/d\x1b[0m     delete lines matching pattern',
    '       \x1b[1mNd\x1b[0m             delete line number N',
    '',
    '\x1b[1mEXAMPLES\x1b[0m',
    "       sed 's/foo/bar/' file          Replace foo with bar",
    "       sed 's/foo/bar/g' file         Replace all foo with bar",
    "       sed '/DEBUG/d' file            Remove lines containing DEBUG",
  ].join('\n'),

  tac: [
    '\x1b[1mTAC(1)\x1b[0m                    User Commands                    \x1b[1mTAC(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       tac - concatenate and print files in reverse',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mtac\x1b[0m [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Write each FILE to standard output, last line first.',
    '       Like cat but in reverse line order.',
  ].join('\n'),

  paste: [
    '\x1b[1mPASTE(1)\x1b[0m                  User Commands                  \x1b[1mPASTE(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       paste - merge lines of files',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mpaste\x1b[0m \x1b[4mFILE1\x1b[0m \x1b[4mFILE2\x1b[0m...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Merge corresponding lines from each FILE, separated by tabs.',
  ].join('\n'),

  tee: [
    '\x1b[1mTEE(1)\x1b[0m                    User Commands                    \x1b[1mTEE(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       tee - read from stdin, write to stdout and files',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mtee\x1b[0m [\x1b[4m-a\x1b[0m] \x1b[4mFILE\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Copy stdin to stdout AND to FILE.',
    '       Use with pipes: cmd | tee output.txt',
    '',
    '       \x1b[1m-a\x1b[0m     append to FILE instead of overwriting',
  ].join('\n'),

  xargs: [
    '\x1b[1mXARGS(1)\x1b[0m                  User Commands                  \x1b[1mXARGS(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       xargs - build and execute command lines from standard input',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mxargs\x1b[0m [\x1b[4mcommand\x1b[0m]',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Read items from stdin and execute command with those items.',
    '       Default command is echo.',
    '',
    '\x1b[1mEXAMPLES\x1b[0m',
    '       cat files.txt | xargs echo     Print all items on one line',
    '       cat files.txt | xargs cat      Cat each listed file',
  ].join('\n'),

  basename: [
    '\x1b[1mBASENAME(1)\x1b[0m               User Commands               \x1b[1mBASENAME(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       basename - strip directory from filename',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mbasename\x1b[0m \x1b[4mPATH\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Print PATH with any leading directory components removed.',
    '       basename /usr/bin/sort → sort',
  ].join('\n'),

  dirname: [
    '\x1b[1mDIRNAME(1)\x1b[0m                User Commands                \x1b[1mDIRNAME(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       dirname - strip last component from file name',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mdirname\x1b[0m \x1b[4mPATH\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Print PATH with its last component removed.',
    '       dirname /usr/bin/sort → /usr/bin',
  ].join('\n'),

  rev: [
    '\x1b[1mREV(1)\x1b[0m                    User Commands                    \x1b[1mREV(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       rev - reverse lines characterwise',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mrev\x1b[0m [\x1b[4mFILE\x1b[0m]...',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Reverse the order of characters in every line.',
  ].join('\n'),

  seq: [
    '\x1b[1mSEQ(1)\x1b[0m                    User Commands                    \x1b[1mSEQ(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       seq - print a sequence of numbers',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mseq\x1b[0m [\x1b[4mFIRST\x1b[0m [\x1b[4mINCREMENT\x1b[0m]] \x1b[4mLAST\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Print numbers from FIRST to LAST, by INCREMENT.',
    '       seq 5 → 1 2 3 4 5',
    '       seq 2 5 → 2 3 4 5',
    '       seq 1 2 10 → 1 3 5 7 9',
  ].join('\n'),

  ps: [
    '\x1b[1mPS(1)\x1b[0m                     User Commands                     \x1b[1mPS(1)\x1b[0m',
    '',
    '\x1b[1mNAME\x1b[0m',
    '       ps - report a snapshot of current processes',
    '',
    '\x1b[1mSYNOPSIS\x1b[0m',
    '       \x1b[1mps\x1b[0m',
    '',
    '\x1b[1mDESCRIPTION\x1b[0m',
    '       Display information about running processes.',
    '       Shows PID, USER, CPU%, MEM%, and COMMAND.',
  ].join('\n'),
};

function getHelp(): string {
  return [
    '\x1b[1;31m╔══════════════════════════════════════╗\x1b[0m',
    '\x1b[1;31m║\x1b[0m  \x1b[1mLinux Quest - Available Commands\x1b[0m   \x1b[1;31m║\x1b[0m',
    '\x1b[1;31m╚══════════════════════════════════════╝\x1b[0m',
    '',
    '  \x1b[33m── Stage 1: Basic ──\x1b[0m',
    '  \x1b[32mls\x1b[0m              List directory contents',
    '  \x1b[32mcat\x1b[0m <file>      Display file contents',
    '  \x1b[32mcd\x1b[0m <dir>        Change directory',
    '  \x1b[32mpwd\x1b[0m             Print working directory',
    '  \x1b[32mgrep\x1b[0m <p> <file> Search for pattern',
    '  \x1b[32mchmod\x1b[0m <m> <f>   Change file permissions',
    '  \x1b[32msort\x1b[0m <file>     Sort lines',
    '  \x1b[32muniq\x1b[0m            Filter duplicate lines',
    '  \x1b[32mtail\x1b[0m / \x1b[32mhead\x1b[0m     Output first/last lines',
    '  \x1b[32mwc\x1b[0m <file>       Count lines/words/bytes',
    '  \x1b[32mfind\x1b[0m . -name X  Find files by name',
    '  \x1b[32mmv\x1b[0m / \x1b[32mcp\x1b[0m / \x1b[32mrm\x1b[0m    Move/copy/remove files',
    '  \x1b[32mmkdir\x1b[0m / \x1b[32mtouch\x1b[0m  Create dirs/files',
    '  \x1b[32mdiff\x1b[0m <f1> <f2>  Compare files',
    '  \x1b[32mcut\x1b[0m / \x1b[32mtr\x1b[0m        Extract columns / translate chars',
    '  \x1b[32mecho\x1b[0m <text>     Print text',
    '',
    '  \x1b[33m── Stage 2: Advanced ──\x1b[0m',
    '  \x1b[32mawk\x1b[0m             Pattern scanning & text processing',
    '  \x1b[32msed\x1b[0m             Stream editor (find/replace)',
    '  \x1b[32mtac\x1b[0m             Print file in reverse line order',
    '  \x1b[32mpaste\x1b[0m           Merge files side by side',
    '  \x1b[32mtee\x1b[0m             Pipe to file AND stdout',
    '  \x1b[32mxargs\x1b[0m           Build commands from stdin',
    '  \x1b[32mbasename\x1b[0m        Extract filename from path',
    '  \x1b[32mdirname\x1b[0m         Extract directory from path',
    '  \x1b[32mrev\x1b[0m             Reverse characters per line',
    '  \x1b[32mseq\x1b[0m             Print number sequences',
    '  \x1b[32mps\x1b[0m              List running processes',
    '',
    '  \x1b[33m── Utilities ──\x1b[0m',
    '  \x1b[32mman\x1b[0m <cmd>       Show manual page for command',
    '  \x1b[32mclear\x1b[0m           Clear terminal',
    '  \x1b[32mhint\x1b[0m            Ask the Sensei',
    '  \x1b[32mhelp\x1b[0m            Show this message',
    '',
    '  Use \x1b[33m|\x1b[0m to pipe: sort file | uniq',
    '  Use \x1b[33m>\x1b[0m to write: echo hello > file.txt',
    '  Use \x1b[33m>>\x1b[0m to append: echo hello >> file.txt',
    '  Use \x1b[33mman <cmd>\x1b[0m to see flags & options',
  ].join('\n');
}

export function getCompletions(partial: string, ctx: CommandContext): string[] {
  const parts = partial.split(/\s+/);
  if (parts.length <= 1) {
    const cmds = ['ls', 'cat', 'cd', 'pwd', 'grep', 'chmod', 'sort', 'uniq', 'tail', 'head', 'wc', 'find', 'mv', 'cp', 'rm', 'mkdir', 'touch', 'diff', 'cut', 'tr', 'echo', 'clear', 'help', 'hint', 'man', 'whoami', 'date'];
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
