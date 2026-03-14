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
}

export const levels: Level[] = [
  // ── STAGE 1: BASICS ──────────────────────────────────────
  {
    id: 1,
    title: "The Hook",
    subtitle: "Level 01 — Reconnaissance",
    briefing: "Welcome, recruit. You've been dropped into an unknown system. Intelligence reports a hidden file containing a secret flag somewhere in the current directory. Your mission: find it and read its contents.",
    objective: "Find and read the hidden 'secret_id' file. Submit the flag you find inside.",
    answer: "FLAG{linux_recruit_001}",
    toolbelt: ["ls", "cat"],
    hints: [
      "Try using 'ls' to list files in the current directory.",
      "Some files might be hidden. Try 'ls -a' to see all files.",
      "Use 'cat' followed by a filename to read its contents.",
      "The secret_id file is hidden (starts with a dot): .secret_id"
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
  },
  {
    id: 2,
    title: "The Maze",
    subtitle: "Level 02 — Navigation",
    briefing: "Our scouts have identified a nested directory structure. Somewhere deep inside lies a classified file. Navigate the maze and find the codename hidden within.",
    objective: "Navigate to 'deep/archive' and find the codename inside 'classified.dat'. Submit the codename.",
    answer: "PHOENIX",
    toolbelt: ["cd", "ls", "cat", "pwd"],
    hints: [
      "Use 'cd deep' to enter the deep directory.",
      "Use 'pwd' to check your current location.",
      "Use 'ls' in each directory to see what's inside.",
      "The classified file is in deep/archive/. Use 'cat classified.dat' to read it."
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
                  'classified.dat': { type: 'file', content: 'ACCESS GRANTED: Codename PHOENIX confirmed.' },
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
  },
  {
    id: 3,
    title: "Pattern Hunter",
    subtitle: "Level 03 — Search",
    briefing: "An intelligence report has been scattered across multiple files. One of them contains a secret access code. Use grep to search through the files without reading each one manually.",
    objective: "Use grep to find which file contains 'ACCESS_CODE'. Submit the code value (e.g., ACCESS_CODE_XXXX).",
    answer: "ACCESS_CODE_7742",
    toolbelt: ["grep", "ls", "cat"],
    hints: [
      "Use 'ls' to see available files.",
      "Use 'grep ACCESS_CODE *' or 'grep -r ACCESS_CODE .' to search all files.",
      "grep will show you the filename and matching line.",
      "The code format is ACCESS_CODE_ followed by numbers."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'report_01.txt': { type: 'file', content: 'Status: nominal. All systems online.' },
          'report_02.txt': { type: 'file', content: 'Warning: perimeter breach detected at 03:45.' },
          'report_03.txt': { type: 'file', content: 'Embedded credential: ACCESS_CODE_7742. Handle with care.' },
          'report_04.txt': { type: 'file', content: 'Decoy data. Ignore this file.' },
          'report_05.txt': { type: 'file', content: 'End of day summary: no incidents reported.' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 4,
    title: "Permissions",
    subtitle: "Level 04 — Access Control",
    briefing: "You've located 'script.sh' — a critical deployment script. But it won't execute. The file permissions are locked down. Your task: make it executable and run it to reveal the flag.",
    objective: "Make 'script.sh' executable and run it. Submit the flag it outputs.",
    answer: "FLAG{permissions_mastered_303}",
    toolbelt: ["ls", "chmod", "cat"],
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
  },

  // ── STAGE 2: TEXT PROCESSING ──────────────────────────────
  {
    id: 5,
    title: "Log Analysis",
    subtitle: "Level 05 — Sorting & Filtering",
    briefing: "A syslog dump from a bare metal server is full of noise. Somewhere in it is a unique error code that appears exactly once. Use sorting and filtering to isolate it.",
    objective: "Find the error code that appears only once in 'syslog'. Submit it (e.g., ERR-XXXX).",
    answer: "ERR-9901",
    toolbelt: ["cat", "sort", "uniq"],
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
  },
  {
    id: 6,
    title: "Head & Tail",
    subtitle: "Level 06 — File Inspection",
    briefing: "A massive data file has a secret embedded on line 3. The file is too large to read entirely. Use head or tail to extract just the lines you need.",
    objective: "Find the secret on line 3 of 'data.log'. Submit the flag.",
    answer: "FLAG{head_tail_606}",
    toolbelt: ["head", "tail", "cat"],
    hints: [
      "Use 'head -n 3 data.log' to see the first 3 lines.",
      "Use 'tail -n +3 data.log | head -n 1' to get exactly line 3.",
      "Or just 'head -n 3 data.log' and read the last line shown.",
      "The flag is on the third line of the file."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'data.log': {
            type: 'file',
            content: [
              '=== SYSTEM LOG START ===',
              'Timestamp: 2024-01-15T09:00:00Z',
              'FLAG{head_tail_606}',
              'Connection established to 192.168.1.1',
              'User authentication successful',
              'Loading kernel modules...',
              'Starting network services...',
              'Mounting filesystems...',
              'System ready.',
              'Waiting for input...',
              '... 50000 more lines ...',
              'End of log.',
            ].join('\n')
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 7,
    title: "Word Count",
    subtitle: "Level 07 — Data Metrics",
    briefing: "Command has intercepted a transmission file. We need to know exactly how many lines it contains. Use wc to count and submit the line count.",
    objective: "Count the number of lines in 'transmission.txt'. Submit the number.",
    answer: "8",
    toolbelt: ["wc", "cat"],
    hints: [
      "Use 'wc transmission.txt' to see line, word, and byte counts.",
      "Use 'wc -l transmission.txt' for just the line count.",
      "The first number shown by 'wc -l' is the line count.",
      "Count carefully — empty lines count too!"
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'transmission.txt': {
            type: 'file',
            content: 'Alpha team in position\nBravo moving to checkpoint\nCharlie requesting backup\nDelta perimeter secured\nEcho signal lost\nFoxtrot standing by\nGolf target acquired\nHotel extraction ready'
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 8,
    title: "The Finder",
    subtitle: "Level 08 — Deep Search",
    briefing: "A critical config file named 'credentials.conf' is lost somewhere in a deep directory tree. Use find to locate it, then read its contents.",
    objective: "Locate 'credentials.conf' in the directory tree and read the password inside. Submit the password.",
    answer: "S3cur3_P@ss!",
    toolbelt: ["find", "cat", "cd", "ls"],
    hints: [
      "Use 'find . -name credentials.conf' to search recursively.",
      "find will show you the full path to the file.",
      "Use 'cat' with the path find gives you to read the file.",
      "The file is buried several directories deep."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'etc': {
            type: 'dir',
            children: {
              'network': {
                type: 'dir',
                children: {
                  'interfaces': { type: 'file', content: 'auto eth0\niface eth0 inet dhcp' },
                }
              },
              'ssh': {
                type: 'dir',
                children: {
                  'sshd_config': { type: 'file', content: 'Port 22\nPermitRootLogin no' },
                }
              },
            }
          },
          'var': {
            type: 'dir',
            children: {
              'backup': {
                type: 'dir',
                children: {
                  'old': {
                    type: 'dir',
                    children: {
                      'credentials.conf': { type: 'file', content: 'user=admin\npassword=S3cur3_P@ss!\nhost=db.internal' },
                    }
                  }
                }
              }
            }
          },
          'tmp': {
            type: 'dir',
            children: {
              'scratch.txt': { type: 'file', content: 'Temporary data' },
            }
          },
        }
      }
    },
    startDir: '/',
  },

  // ── STAGE 3: FILE MANIPULATION ────────────────────────────
  {
    id: 9,
    title: "The Mover",
    subtitle: "Level 09 — File Operations",
    briefing: "Intel has been dropped in the wrong location. The file 'intel.doc' in /drop needs to be moved to /secure. Move it and verify the operation by reading it in the new location.",
    objective: "Move 'intel.doc' from /drop to /secure. Submit the flag inside the file.",
    answer: "FLAG{moved_secure_909}",
    toolbelt: ["mv", "ls", "cat", "cd"],
    hints: [
      "Use 'ls drop/' to see files in the drop directory.",
      "Use 'mv drop/intel.doc secure/' to move the file.",
      "Use 'ls secure/' to verify the file was moved.",
      "Read it with 'cat secure/intel.doc' to get the flag."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'drop': {
            type: 'dir',
            children: {
              'intel.doc': { type: 'file', content: 'TOP SECRET: FLAG{moved_secure_909}' },
              'noise.txt': { type: 'file', content: 'Irrelevant data.' },
            }
          },
          'secure': {
            type: 'dir',
            children: {}
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 10,
    title: "Copy & Destroy",
    subtitle: "Level 10 — Backup Protocol",
    briefing: "Before deleting the compromised file 'malware.bin', create a backup copy named 'evidence.bin'. Then remove the original. The backup contains the hash you need.",
    objective: "Copy 'malware.bin' to 'evidence.bin', then remove the original. Submit the hash inside the file.",
    answer: "HASH_4f8a2c",
    toolbelt: ["cp", "rm", "ls", "cat"],
    hints: [
      "Use 'cp malware.bin evidence.bin' to create the backup.",
      "Use 'rm malware.bin' to remove the original.",
      "Verify with 'ls' that only evidence.bin remains.",
      "Read the hash with 'cat evidence.bin'."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'malware.bin': { type: 'file', content: 'Binary signature: HASH_4f8a2c\nPayload: encrypted' },
          'readme.txt': { type: 'file', content: 'Backup the evidence before destroying the threat.' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 11,
    title: "Architect",
    subtitle: "Level 11 — Creation",
    briefing: "You need to set up a project directory structure. Create a directory called 'project' and inside it create a file called 'init.txt'. Then write 'READY' into it using echo.",
    objective: "Create 'project/init.txt' containing 'READY'. Submit the word you wrote.",
    answer: "READY",
    toolbelt: ["mkdir", "touch", "echo", "cat", "ls"],
    hints: [
      "Use 'mkdir project' to create the directory.",
      "Use 'cd project' to enter it.",
      "Use 'echo READY > init.txt' to create the file with content.",
      "Verify with 'cat init.txt'."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'instructions.txt': { type: 'file', content: 'Create the project structure as described in the briefing.' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 12,
    title: "The Appender",
    subtitle: "Level 12 — Redirection",
    briefing: "A log file needs to be updated. Append the text 'MISSION_COMPLETE' to 'status.log' using echo and redirection. Then read the last line to confirm.",
    objective: "Append 'MISSION_COMPLETE' to 'status.log'. Submit what you appended.",
    answer: "MISSION_COMPLETE",
    toolbelt: ["echo", "cat", "tail"],
    hints: [
      "Use 'echo MISSION_COMPLETE >> status.log' to append (>> not >).",
      "Use 'cat status.log' to see the full file.",
      "Use 'tail -n 1 status.log' to see just the last line.",
      "The >> operator appends; > would overwrite the file."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'status.log': { type: 'file', content: 'Mission started\nCheckpoint alpha reached\nCheckpoint bravo reached' },
        }
      }
    },
    startDir: '/',
  },

  // ── STAGE 4: ADVANCED TEXT PROCESSING ─────────────────────
  {
    id: 13,
    title: "Column Extract",
    subtitle: "Level 13 — Data Parsing",
    briefing: "A CSV file contains user data. Extract the third column (email addresses) and find the one that belongs to the admin user.",
    objective: "Find the admin's email from 'users.csv'. Submit the email address.",
    answer: "admin@secure.io",
    toolbelt: ["cat", "cut", "grep"],
    hints: [
      "Use 'cat users.csv' to see the file structure.",
      "Use 'cut -d, -f3 users.csv' to extract the third column.",
      "Or use 'grep admin users.csv' to find the admin row.",
      "The delimiter is a comma (,)."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'users.csv': {
            type: 'file',
            content: 'id,username,email,role\n1,john,john@mail.com,user\n2,jane,jane@corp.net,user\n3,admin,admin@secure.io,admin\n4,guest,guest@temp.org,guest'
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 14,
    title: "Translator",
    subtitle: "Level 14 — Text Transform",
    briefing: "An encoded message uses uppercase letters. Convert the message in 'encoded.txt' to lowercase to reveal the hidden word. The answer is the decoded word on line 2.",
    objective: "Decode the message by converting to lowercase. Submit the decoded word from line 2.",
    answer: "infiltrate",
    toolbelt: ["cat", "tr", "head"],
    hints: [
      "Use 'cat encoded.txt' to see the encoded message.",
      "Use 'cat encoded.txt | tr A-Z a-z' to convert to lowercase.",
      "Focus on line 2 of the output.",
      "You can pipe: 'cat encoded.txt | tr A-Z a-z | head -n 2 | tail -n 1'"
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'encoded.txt': {
            type: 'file',
            content: 'OPERATION STARTED\nINFILTRATE\nTARGET LOCATED\nEXTRACT AT DAWN'
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 15,
    title: "Spot the Diff",
    subtitle: "Level 15 — Comparison",
    briefing: "Two config files should be identical, but someone tampered with one. Use diff to find what was changed. The altered line contains a secret port number.",
    objective: "Find the difference between 'config_v1.txt' and 'config_v2.txt'. Submit the secret port number.",
    answer: "31337",
    toolbelt: ["diff", "cat"],
    hints: [
      "Use 'diff config_v1.txt config_v2.txt' to compare the files.",
      "diff shows lines that are different between the two files.",
      "Look for a port number that was changed.",
      "The < and > symbols show which file each line belongs to."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'config_v1.txt': {
            type: 'file',
            content: 'host=192.168.1.1\nport=8080\nprotocol=https\ntimeout=30\nretries=3'
          },
          'config_v2.txt': {
            type: 'file',
            content: 'host=192.168.1.1\nport=31337\nprotocol=https\ntimeout=30\nretries=3'
          },
        }
      }
    },
    startDir: '/',
  },

  // ── STAGE 5: PIPE CHAINS & COMBOS ────────────────────────
  {
    id: 16,
    title: "Pipe Master",
    subtitle: "Level 16 — Command Chains",
    briefing: "A massive access log contains hundreds of IP addresses. Find the IP that accessed the system exactly once by chaining sort, uniq, and grep.",
    objective: "Find the unique IP in 'access.log' (appears only once). Submit the IP address.",
    answer: "10.0.0.42",
    toolbelt: ["cat", "sort", "uniq", "grep"],
    hints: [
      "Use 'cat access.log' to see the log entries.",
      "Use 'sort access.log | uniq -u' to find unique lines.",
      "Each line is an IP address. The unique one appears only once.",
      "You can also use 'sort access.log | uniq -c | sort' to see counts."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'access.log': {
            type: 'file',
            content: [
              '192.168.1.100',
              '10.0.0.5',
              '192.168.1.100',
              '172.16.0.1',
              '10.0.0.5',
              '192.168.1.100',
              '10.0.0.42',
              '172.16.0.1',
              '10.0.0.5',
              '172.16.0.1',
              '192.168.1.100',
              '10.0.0.5',
            ].join('\n')
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 17,
    title: "Deep Grep",
    subtitle: "Level 17 — Recursive Search",
    briefing: "A password has been carelessly left in a config file somewhere in a deeply nested server structure. Use recursive grep to find it without navigating manually.",
    objective: "Find the line containing 'PASSWORD' in the server tree. Submit the password value.",
    answer: "Kj8#mP2x!",
    toolbelt: ["grep", "cat", "find"],
    hints: [
      "Use 'grep -r PASSWORD .' to search all files recursively.",
      "grep -r searches through all subdirectories automatically.",
      "The password is the value after 'PASSWORD='.",
      "You can also use 'find . -name *.conf' to locate config files first."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'srv': {
            type: 'dir',
            children: {
              'web': {
                type: 'dir',
                children: {
                  'app': {
                    type: 'dir',
                    children: {
                      'config': {
                        type: 'dir',
                        children: {
                          'db.conf': { type: 'file', content: 'DB_HOST=localhost\nDB_PORT=5432\nDB_PASSWORD=Kj8#mP2x!\nDB_NAME=production' },
                          'app.conf': { type: 'file', content: 'APP_PORT=3000\nAPP_ENV=production' },
                        }
                      },
                      'index.js': { type: 'file', content: 'const express = require("express");' },
                    }
                  },
                  'static': {
                    type: 'dir',
                    children: {
                      'style.css': { type: 'file', content: 'body { margin: 0; }' },
                    }
                  }
                }
              },
              'logs': {
                type: 'dir',
                children: {
                  'access.log': { type: 'file', content: 'GET / 200\nGET /api 200' },
                }
              }
            }
          }
        }
      }
    },
    startDir: '/',
  },
  {
    id: 18,
    title: "Locksmith",
    subtitle: "Level 18 — Unlock & Execute",
    briefing: "Three scripts are locked in /vault. Only one contains the real flag. Find it using grep, make it executable, and run it. The other scripts are decoys.",
    objective: "Find the real script, make it executable, and run it. Submit the flag.",
    answer: "FLAG{vault_cracked_18}",
    toolbelt: ["ls", "grep", "chmod", "cat"],
    hints: [
      "Use 'ls vault/' to see the scripts.",
      "Use 'grep -r FLAG vault/' to find which script has the flag.",
      "Use 'chmod +x vault/<script>' to make it executable.",
      "Run it with './vault/<script>' or cat it."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'vault': {
            type: 'dir',
            children: {
              'alpha.sh': { type: 'file', content: '#!/bin/bash\necho "DECOY: Try again."', permissions: '-rw-r--r--' },
              'bravo.sh': { type: 'file', content: '#!/bin/bash\necho "FLAG{vault_cracked_18}"', permissions: '-rw-r--r--' },
              'charlie.sh': { type: 'file', content: '#!/bin/bash\necho "DECOY: Not this one."', permissions: '-rw-r--r--' },
            }
          },
          'readme.txt': { type: 'file', content: 'Only one script in the vault is genuine.' },
        }
      }
    },
    startDir: '/',
  },

  // ── STAGE 6: COMPLEX SCENARIOS ────────────────────────────
  {
    id: 19,
    title: "Forensics",
    subtitle: "Level 19 — Investigation",
    briefing: "A breach occurred. The attacker left traces in multiple log files. Piece together the attack: find the attacker's IP, the file they accessed, and the timestamp. The answer is the IP address.",
    objective: "Analyze logs in /var/log to find the attacker's IP (appears in auth.log with 'BREACH'). Submit the IP.",
    answer: "203.0.113.66",
    toolbelt: ["grep", "cat", "find", "sort", "cd", "ls"],
    hints: [
      "Start by exploring /var/log with 'ls'.",
      "Use 'grep -r BREACH .' to find breach-related entries.",
      "Check auth.log for authentication failures.",
      "The attacker's IP is in the BREACH log entry."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'var': {
            type: 'dir',
            children: {
              'log': {
                type: 'dir',
                children: {
                  'auth.log': {
                    type: 'file',
                    content: [
                      'Jan 15 09:00:01 sshd: Accepted publickey for user from 10.0.0.1',
                      'Jan 15 09:15:22 sshd: Failed password for root from 203.0.113.66',
                      'Jan 15 09:15:23 sshd: Failed password for root from 203.0.113.66',
                      'Jan 15 09:15:25 sshd: BREACH DETECTED from 203.0.113.66 - unauthorized root access',
                      'Jan 15 09:16:00 sshd: Connection closed by 203.0.113.66',
                    ].join('\n')
                  },
                  'syslog': {
                    type: 'file',
                    content: 'Jan 15 09:00:00 kernel: System boot\nJan 15 09:15:30 kernel: Suspicious process spawned PID 4421\nJan 15 12:00:00 cron: Daily cleanup'
                  },
                  'access.log': {
                    type: 'file',
                    content: 'GET /admin 403 203.0.113.66\nGET / 200 10.0.0.1\nPOST /login 401 203.0.113.66\nGET /api/data 200 10.0.0.1'
                  },
                }
              }
            }
          },
          'home': {
            type: 'dir',
            children: {
              'user': {
                type: 'dir',
                children: {
                  '.bash_history': { type: 'file', content: 'ls\ncd /var/log\ncat auth.log\nwhoami' },
                }
              }
            }
          }
        }
      }
    },
    startDir: '/',
  },
  {
    id: 20,
    title: "Final Boss",
    subtitle: "Level 20 — The Ultimate Challenge",
    briefing: "This is it, recruit. A rogue agent has hidden a nuclear launch code across the system. You'll need every skill you've learned: navigate directories, search files, manipulate text, manage permissions, and chain commands. The final code is split into 3 parts hidden in different files. Concatenate them to form the final flag.",
    objective: "Find all 3 parts of the code scattered in the system. Concatenate them (PART1+PART2+PART3). Submit the full code.",
    answer: "ALPHA-OMEGA-ZERO",
    toolbelt: ["find", "grep", "cat", "cd", "ls", "chmod", "sort"],
    hints: [
      "Use 'find . -name part*' or 'grep -r PART .' to locate the code fragments.",
      "There are 3 parts labeled PART1, PART2, and PART3.",
      "One part might require special permissions to read.",
      "Concatenate the values: PART1 + PART2 + PART3 separated by dashes."
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'mission': {
            type: 'dir',
            children: {
              'briefing.txt': { type: 'file', content: 'The code is split into 3 parts. Find them all.' },
              'part1.txt': { type: 'file', content: 'PART1=ALPHA' },
            }
          },
          'classified': {
            type: 'dir',
            children: {
              'encrypted': {
                type: 'dir',
                children: {
                  'part2.enc': { type: 'file', content: 'PART2=OMEGA' },
                  'noise_1.dat': { type: 'file', content: 'Random noise data 0x4F2A...' },
                }
              },
              'decoys': {
                type: 'dir',
                children: {
                  'fake_code.txt': { type: 'file', content: 'FAKE_CODE=NOTTHIS' },
                  'trap.sh': { type: 'file', content: '#!/bin/bash\necho "Nice try, but this is a trap!"' },
                }
              }
            }
          },
          'system': {
            type: 'dir',
            children: {
              'locked': {
                type: 'dir',
                children: {
                  'part3_final.sh': { type: 'file', content: '#!/bin/bash\necho "PART3=ZERO"', permissions: '-rw-------' },
                }
              },
              'config': {
                type: 'dir',
                children: {
                  'settings.ini': { type: 'file', content: 'mode=lockdown\nalert_level=maximum' },
                }
              }
            }
          },
          'readme.txt': { type: 'file', content: 'The final challenge awaits. Use everything you have learned.' },
        }
      }
    },
    startDir: '/',
  },
];
