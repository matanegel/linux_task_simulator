export interface FSNode {
  type: 'file' | 'dir';
  content?: string;
  permissions?: string;
  children?: Record<string, FSNode>;
}

export interface Level {
  id: number;
  title: string;
  subtitle: string;
  briefing: string;
  objective: string;
  answer: string;
  toolbelt: string[];
  hints: string[];
  filesystem: Record<string, FSNode>;
  startDir: string;
  validate: (fs: Record<string, FSNode>, history: string[], cwd: string) => boolean;
}

export const levels: Level[] = [
  {
    id: 1,
    title: "The Hook",
    subtitle: "Level 01 — Reconnaissance",
    briefing: "Welcome, recruit. You've been dropped into an unknown system. Intelligence reports a hidden file containing a 'secret_id' somewhere in the current directory. Your mission: find it and read its contents.",
    objective: "Find and read the 'secret_id' file hidden in the current directory.",
    answer: "FLAG{linux_recruit_001}",
    toolbelt: ["ls", "cat"],
    hints: [
      "Try using 'ls' to list files in the current directory.",
      "Some files might be hidden. Try 'ls -a' to see all files.",
      "Use 'cat' followed by a filename to read its contents.",
      "The secret_id file might be hidden (starts with a dot)."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'readme.txt': { type: 'file', content: 'Welcome to Linux Quest. Look closer...' },
          'notes.log': { type: 'file', content: 'Nothing interesting here. Or is there?' },
          '.secret_id': { type: 'file', content: 'FLAG{linux_recruit_001}' },
          'decoy.txt': { type: 'file', content: 'This is not the file you are looking for.' },
        }
      }
    },
    startDir: '/',
    validate: (_fs, history) => {
      return history.some(cmd => cmd.includes('cat') && cmd.includes('.secret_id'));
    }
  },
  {
    id: 2,
    title: "The Maze",
    subtitle: "Level 02 — Navigation",
    briefing: "Our scouts have identified a nested archive structure. Somewhere deep inside the 'deep/archive' directory tree lies a file containing the word 'PHOENIX'. Navigate the maze and locate it using grep.",
    objective: "Navigate to 'deep/archive' and find the file containing 'PHOENIX'.",
    toolbelt: ["cd", "pwd", "grep", "ls", "cat"],
    hints: [
      "Use 'cd deep' to enter the deep directory.",
      "Use 'pwd' to check your current location.",
      "Use 'grep -r PHOENIX .' to search recursively for the word.",
      "Once you find the file, use 'cat' to read it."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'deep': {
            type: 'dir',
            children: {
              'archive': {
                type: 'dir',
                children: {
                  'file_a.txt': { type: 'file', content: 'Fedora is a community project.' },
                  'file_b.txt': { type: 'file', content: 'CentOS Stream is the upstream for RHEL.' },
                  'classified.dat': { type: 'file', content: 'ACCESS GRANTED: PHOENIX protocol confirmed.' },
                  'noise.log': { type: 'file', content: 'Error: connection timed out. Retry in 30s.' },
                }
              },
              'trash': {
                type: 'dir',
                children: {
                  'junk.txt': { type: 'file', content: 'Nothing useful here.' },
                }
              }
            }
          },
          'readme.md': { type: 'file', content: 'The archive holds the key. Navigate wisely.' },
        }
      }
    },
    startDir: '/',
    validate: (_fs, history) => {
      const hasGrep = history.some(cmd => cmd.includes('grep') && cmd.includes('PHOENIX'));
      const hasCat = history.some(cmd => cmd.includes('cat') && cmd.includes('classified'));
      return hasGrep || hasCat;
    }
  },
  {
    id: 3,
    title: "Permissions",
    subtitle: "Level 03 — QE Focused",
    briefing: "You've located 'script.sh' — a critical deployment script. But it won't execute. The file permissions are locked down. Your task: inspect the permissions, make it executable, and run it to reveal the flag.",
    objective: "Make 'script.sh' executable and run it.",
    toolbelt: ["ls -l", "chmod", "./script.sh", "cat"],
    hints: [
      "Use 'ls -l' to see file permissions.",
      "The script needs execute permission. Use 'chmod +x script.sh'.",
      "After changing permissions, run it with './script.sh'.",
      "chmod 755 also works to make a file executable."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'script.sh': { type: 'file', content: '#!/bin/bash\necho "FLAG{permissions_mastered_303}"', permissions: '-rw-r--r--' },
          'README.md': { type: 'file', content: 'The script holds the answer. But can you run it?' },
          'config.yaml': { type: 'file', content: 'deploy:\n  target: production\n  verify: true' },
        }
      }
    },
    startDir: '/',
    validate: (fs, history) => {
      const madeExecutable = history.some(cmd => cmd.includes('chmod') && cmd.includes('script'));
      const ranScript = history.some(cmd => cmd.includes('./script.sh'));
      return madeExecutable && ranScript;
    }
  },
  {
    id: 4,
    title: "Bare Metal Simulation",
    subtitle: "Level 04 — Log Analysis",
    briefing: "A massive syslog file has been dumped from a bare metal server. Somewhere in the noise is a unique error code that appears exactly once. Use sorting and filtering to isolate it. The clock is ticking.",
    objective: "Find the unique error code that appears only once in 'syslog'.",
    toolbelt: ["cat", "sort", "uniq -u", "tail", "grep"],
    hints: [
      "Use 'cat syslog' to view the log file.",
      "Use 'sort syslog' to sort the lines alphabetically.",
      "Pipe commands: try 'sort syslog | uniq -u' to find unique lines.",
      "The unique error code is the one that appears exactly once."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'syslog': {
            type: 'file',
            content: [
              'ERR-4401: disk I/O timeout',
              'ERR-2200: memory allocation failed',
              'ERR-4401: disk I/O timeout',
              'ERR-2200: memory allocation failed',
              'ERR-7789: kernel panic - not syncing',
              'ERR-4401: disk I/O timeout',
              'ERR-2200: memory allocation failed',
              'ERR-3300: network interface down',
              'ERR-3300: network interface down',
              'ERR-4401: disk I/O timeout',
              'ERR-9901: CRITICAL - unauthorized access detected',
              'ERR-3300: network interface down',
              'ERR-7789: kernel panic - not syncing',
              'ERR-2200: memory allocation failed',
              'ERR-3300: network interface down',
            ].join('\n')
          },
          'hint.txt': { type: 'file', content: 'The unique error stands alone. Sort and filter to find it.' },
        }
      }
    },
    startDir: '/',
    validate: (_fs, history) => {
      const usedSort = history.some(cmd => cmd.includes('sort') && cmd.includes('uniq'));
      const foundCode = history.some(cmd => cmd.includes('uniq'));
      return usedSort || foundCode;
    }
  },
];
