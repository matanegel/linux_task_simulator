export interface FSNode {
  type: 'file' | 'dir';
  content?: string;
  execOutput?: string;
  permissions?: string;
  children?: Record<string, FSNode>;
}

export interface Level {
  id: number;
  stage: number;
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
  // ════════════════════════════════════════════════════════════
  // STAGE 1: FIRST STEPS — single simple commands
  // ════════════════════════════════════════════════════════════
  {
    id: 1,
    stage: 1,
    title: "First Contact",
    subtitle: "Stage 1 — Orientation",
    briefing: "You've just SSH'd into a remote server for the first time. Your manager said 'look around and tell me what files are on the box.' Simple enough — you just need to list the directory contents.",
    objective: "List files in the current directory. One file has a suspicious name ending in '.key'. Submit that filename (including extension).",
    answer: "server.key",
    toolbelt: ["ls"],
    hints: [
      "The command to list files starts with 'l'…",
      "Try typing 'ls' and pressing Enter.",
      "Look for a filename that ends with '.key'.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'index.html': { type: 'file', content: '<html><body>Hello</body></html>' },
          'style.css': { type: 'file', content: 'body { margin: 0; }' },
          'server.key': { type: 'file', content: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...' },
          'readme.md': { type: 'file', content: '# My Website\nA simple static site.' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 2,
    stage: 1,
    title: "Read the Manual",
    subtitle: "Stage 1 — Reading Files",
    briefing: "A developer left a note for you in a file called 'handoff.txt' before going on vacation. You need to read it to find out which database port the app connects to.",
    objective: "Read 'handoff.txt' and submit the database port number mentioned inside.",
    answer: "5432",
    toolbelt: ["cat", "ls"],
    hints: [
      "You need a command that displays file contents…",
      "Try 'cat handoff.txt' to read the file.",
      "Look for a number after 'port' in the output.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'handoff.txt': { type: 'file', content: 'Hey!\nThe app connects to PostgreSQL on port 5432.\nCredentials are in the vault — ask DevOps.\nGood luck!' },
          'app.js': { type: 'file', content: 'const express = require("express");\napp.listen(3000);' },
          'package.json': { type: 'file', content: '{"name":"myapp","version":"1.0.0"}' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 3,
    stage: 1,
    title: "Where Am I?",
    subtitle: "Stage 1 — Navigation",
    briefing: "You're debugging a deployment issue and need to navigate to the config directory buried inside the project. The deployment script references a file at '/app/config/deploy.yml'. Go there and find the target server hostname.",
    objective: "Navigate to '/app/config/' and read 'deploy.yml'. Submit the hostname value.",
    answer: "prod-web-03.internal",
    toolbelt: ["cd", "ls", "cat", "pwd"],
    hints: [
      "Use 'cd' followed by a path to change directories…",
      "Try 'cd app' then 'cd config' — or 'cd app/config' in one step.",
      "Once there, 'cat deploy.yml' will show the config.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'app': {
            type: 'dir',
            children: {
              'config': {
                type: 'dir',
                children: {
                  'deploy.yml': { type: 'file', content: 'target:\n  hostname: prod-web-03.internal\n  port: 22\n  user: deploy\n  branch: main' },
                  'database.yml': { type: 'file', content: 'adapter: postgresql\nhost: db.internal\nport: 5432' },
                }
              },
              'src': {
                type: 'dir',
                children: {
                  'main.py': { type: 'file', content: 'import flask\napp = flask.Flask(__name__)' },
                }
              },
            }
          },
          'README.md': { type: 'file', content: 'Project X — deployment configs are in /app/config/' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 4,
    stage: 1,
    title: "Hidden in Plain Sight",
    subtitle: "Stage 1 — Hidden Files",
    briefing: "Your colleague says 'I left the API key in a dotfile in your home directory.' Dotfiles are hidden by default — a regular listing won't show them. Find the hidden file and retrieve the API key.",
    objective: "Find the hidden file and submit the API key inside it.",
    answer: "sk_live_4eC39HqLyjWDarjtT1zdp7dc",
    toolbelt: ["ls -a", "cat"],
    hints: [
      "Hidden files start with a dot (.) and don't show with plain 'ls'…",
      "Try 'ls -a' — the '-a' flag shows ALL files including hidden ones.",
      "Once you spot the dotfile, 'cat' it to read the key.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'documents': { type: 'dir', children: { 'resume.pdf': { type: 'file', content: 'Resume content...' } } },
          'notes.txt': { type: 'file', content: 'Remember to set up API keys.' },
          '.env': { type: 'file', content: 'STRIPE_API_KEY=sk_live_4eC39HqLyjWDarjtT1zdp7dc\nNODE_ENV=production' },
          '.bashrc': { type: 'file', content: 'export PATH=$PATH:/usr/local/bin' },
        }
      }
    },
    startDir: '/',
  },

  // ════════════════════════════════════════════════════════════
  // STAGE 2: SEARCHING & FILTERING — grep, find, permissions
  // ════════════════════════════════════════════════════════════
  {
    id: 5,
    stage: 1,
    title: "Needle in a Haystack",
    subtitle: "Stage 2 — Text Search",
    briefing: "The security team reported that someone hard-coded a password in one of the project files. There are dozens of files — reading each one would take forever. Use grep to search for the keyword 'password' across all files.",
    objective: "Find the hard-coded password using grep. Submit the password value (after the = sign).",
    answer: "hunter42",
    toolbelt: ["grep", "ls", "cat"],
    hints: [
      "grep lets you search for text patterns inside files…",
      "Try 'grep password *' to search all files in the current directory.",
      "The password is the value after 'password=' on the matching line.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'auth.py': { type: 'file', content: 'def login(user, pw):\n    return check_credentials(user, pw)' },
          'config.py': { type: 'file', content: '# DO NOT COMMIT THIS\ndb_password=hunter42\ndb_host=localhost' },
          'routes.py': { type: 'file', content: 'from flask import Blueprint\napi = Blueprint("api", __name__)' },
          'models.py': { type: 'file', content: 'class User:\n    def __init__(self, name):\n        self.name = name' },
          'tests.py': { type: 'file', content: 'def test_login():\n    assert login("admin", "test") == True' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 6,
    stage: 1,
    title: "Deep Recon",
    subtitle: "Stage 2 — Recursive Search",
    briefing: "A large codebase has a TODO comment somewhere that says 'FIXME: security vulnerability'. You know it's in a deeply nested folder but not where. Combine find, ls, and grep to track it down. Submit the filename containing the vulnerability.",
    objective: "Search recursively for 'FIXME' and submit the name of the file that contains it (just the filename, not the path).",
    answer: "validation.js",
    toolbelt: ["grep -r", "find", "ls", "cd", "cat"],
    hints: [
      "grep has a '-r' flag for recursive searching…",
      "Try 'grep -r FIXME .' to search everything from the current directory.",
      "The output shows the file path before the matching text.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'src': {
            type: 'dir',
            children: {
              'controllers': {
                type: 'dir',
                children: {
                  'user.js': { type: 'file', content: 'exports.getUser = (req, res) => {\n  res.json(req.user);\n};' },
                }
              },
              'middleware': {
                type: 'dir',
                children: {
                  'auth.js': { type: 'file', content: 'module.exports = (req, res, next) => {\n  if (req.headers.token) next();\n};' },
                  'validation.js': { type: 'file', content: '// FIXME: security vulnerability — no input sanitization!\nmodule.exports = (req, res, next) => {\n  next();\n};' },
                }
              },
              'routes': {
                type: 'dir',
                children: {
                  'index.js': { type: 'file', content: 'const router = require("express").Router();\nrouter.get("/", (req, res) => res.send("OK"));' },
                }
              },
            }
          },
          'package.json': { type: 'file', content: '{"name":"api-server","version":"2.1.0"}' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 7,
    stage: 1,
    title: "Permission Denied",
    subtitle: "Stage 2 — Access Control",
    briefing: "The DevOps team left a deploy script on the server, but it won't run — the execute permission is missing. Check the permissions, fix them, then run the script to get the deploy token.",
    objective: "Make 'deploy.sh' executable and run it. Submit the token it prints.",
    answer: "TOKEN_8f3a9c_DEPLOY",
    toolbelt: ["ls -l", "chmod", "cat"],
    hints: [
      "Use 'ls -l' to see file permissions — look for 'x' in the permission string…",
      "If there's no 'x', the file can't be executed. Use 'chmod +x deploy.sh'.",
      "After fixing permissions, run it with './deploy.sh'.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'deploy.sh': { type: 'file', content: '#!/bin/bash\n# Deploy automation script\nSOURCE="/opt/builds/latest"\nTARGET="/var/www/prod"\necho "Deploying $SOURCE -> $TARGET..."\necho "Validating checksums..."\necho "$(generate_token --scope deploy)"', execOutput: 'Deploying /opt/builds/latest -> /var/www/prod...\nValidating checksums...\nTOKEN_8f3a9c_DEPLOY', permissions: '-rw-r--r--' },
          'rollback.sh': { type: 'file', content: '#!/bin/bash\necho "Rolling back..."', permissions: '-rw-r--r--' },
          'README.md': { type: 'file', content: 'Run deploy.sh to get the deployment token.' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 8,
    stage: 1,
    title: "Lost Config",
    subtitle: "Stage 2 — Finding Files",
    briefing: "During a server migration, a critical file called 'nginx.conf' got moved somewhere unknown in the directory tree. Use the find command to locate it, then read it to find the listen port.",
    objective: "Locate 'nginx.conf' using find, then read it. Submit the port number after 'listen'.",
    answer: "8443",
    toolbelt: ["find", "cat", "cd", "ls"],
    hints: [
      "The 'find' command searches for files by name in a directory tree…",
      "Try 'find . -name nginx.conf' to locate the file.",
      "Once found, use 'cat' with the path to read its contents.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'etc': {
            type: 'dir',
            children: {
              'apache': { type: 'dir', children: { 'httpd.conf': { type: 'file', content: 'Listen 80\nServerRoot "/etc/apache"' } } },
            }
          },
          'opt': {
            type: 'dir',
            children: {
              'services': {
                type: 'dir',
                children: {
                  'proxy': {
                    type: 'dir',
                    children: {
                      'nginx.conf': { type: 'file', content: 'server {\n    listen 8443;\n    server_name api.example.com;\n    location / {\n        proxy_pass http://localhost:3000;\n    }\n}' },
                    }
                  }
                }
              }
            }
          },
          'tmp': { type: 'dir', children: { 'scratch.txt': { type: 'file', content: 'temp data' } } },
        }
      }
    },
    startDir: '/',
  },

  // ════════════════════════════════════════════════════════════
  // STAGE 3: FILE OPERATIONS — mkdir, touch, mv, cp, rm, echo
  // ════════════════════════════════════════════════════════════
  {
    id: 9,
    stage: 1,
    title: "Build the Scaffold",
    subtitle: "Stage 3 — Creating Structure",
    briefing: "You're setting up a new microservice. Create a directory called 'api', then create a file called 'server.js' inside it using touch. Finally, use echo to write 'PORT=4000' into a config file. Verify your work by reading the config.",
    objective: "Create 'api/config.env' containing 'PORT=4000'. Submit the port number.",
    answer: "4000",
    toolbelt: ["mkdir", "touch", "echo", "cat", "ls", "cd"],
    hints: [
      "Use 'mkdir api' to create the directory…",
      "Use 'echo PORT=4000 > api/config.env' to create a file with content.",
      "Verify with 'cat api/config.env'.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'README.md': { type: 'file', content: 'Set up the api/ directory structure as described.' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 10,
    stage: 1,
    title: "Evidence Locker",
    subtitle: "Stage 3 — Copy & Remove",
    briefing: "Incident response protocol: before deleting a suspicious file, always make a backup copy first. Copy 'malware.bin' to 'evidence/malware_backup.bin', then delete the original. Read the backup to find the threat signature.",
    objective: "Copy the file to evidence/, remove the original, then read the backup. Submit the signature hash.",
    answer: "SIG_7f2e8a",
    toolbelt: ["cp", "rm", "ls", "cat", "cd"],
    hints: [
      "Use 'cp' to copy a file: 'cp source destination'…",
      "Copy into the evidence directory: 'cp malware.bin evidence/malware_backup.bin'.",
      "Then 'rm malware.bin' and 'cat evidence/malware_backup.bin'.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'malware.bin': { type: 'file', content: 'Threat Signature: SIG_7f2e8a\nPayload: encrypted_data_stream' },
          'evidence': { type: 'dir', children: {} },
          'README.md': { type: 'file', content: 'Backup first, then destroy. Standard procedure.' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 11,
    stage: 1,
    title: "Clean Sweep",
    subtitle: "Stage 3 — Moving & Organizing",
    briefing: "The intern dumped everything into one folder. You need to move 'report.pdf' into the 'docs/' directory and 'app.log' into the 'logs/' directory. After organizing, read report.pdf to find the project codename.",
    objective: "Move files to their correct directories. Read 'docs/report.pdf' and submit the project codename.",
    answer: "NEXUS",
    toolbelt: ["mv", "ls", "cat", "cd", "mkdir"],
    hints: [
      "Use 'mv filename directory/' to move a file…",
      "Try 'mv report.pdf docs/' then 'mv app.log logs/'.",
      "Read the moved file with 'cat docs/report.pdf'.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'report.pdf': { type: 'file', content: 'Quarterly Report\nProject Codename: NEXUS\nStatus: On Track\nBudget: Approved' },
          'app.log': { type: 'file', content: '2024-03-01 INFO: Application started\n2024-03-01 WARN: High memory usage' },
          'todo.txt': { type: 'file', content: 'Organize files into proper directories' },
          'docs': { type: 'dir', children: {} },
          'logs': { type: 'dir', children: {} },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 12,
    stage: 1,
    title: "Append the Log",
    subtitle: "Stage 3 — Redirection",
    briefing: "The monitoring system needs a status update appended to the daily log. Use echo with >> to append 'ALL_CLEAR' to 'status.log' without overwriting existing entries. Then verify the last line.",
    objective: "Append 'ALL_CLEAR' to 'status.log' and submit what you appended.",
    answer: "ALL_CLEAR",
    toolbelt: ["echo", "cat", "tail", "ls"],
    hints: [
      "The >> operator appends to a file (> would overwrite it)…",
      "Try 'echo ALL_CLEAR >> status.log'.",
      "Verify with 'tail -n 1 status.log' to see the last line.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'status.log': { type: 'file', content: 'System boot OK\nNetwork interfaces UP\nFirewall rules LOADED\nServices RUNNING' },
        }
      }
    },
    startDir: '/',
  },

  // ════════════════════════════════════════════════════════════
  // STAGE 4: TEXT PROCESSING — sort, uniq, head, tail, wc, cut, tr, diff
  // ════════════════════════════════════════════════════════════
  {
    id: 13,
    stage: 1,
    title: "Server Triage",
    subtitle: "Stage 4 — Sorting & Counting",
    briefing: "The syslog is flooded with errors after a bad deploy. You need to sort the log and count how many lines it has so the team knows the scale of the problem. Use wc and sort together.",
    objective: "Count the number of lines in 'errors.log'. Submit the count.",
    answer: "9",
    toolbelt: ["wc", "sort", "cat", "ls"],
    hints: [
      "'wc' counts lines, words, and bytes. Use '-l' for just lines…",
      "Try 'wc -l errors.log'.",
      "The first number in the output is the line count.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'errors.log': {
            type: 'file',
            content: 'WARN: disk usage at 85%\nERROR: connection timeout to db-01\nERROR: null pointer in UserService\nWARN: slow query detected (3.2s)\nERROR: connection timeout to db-01\nINFO: retry succeeded\nERROR: out of memory on worker-3\nWARN: disk usage at 85%\nERROR: connection timeout to db-01'
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 14,
    stage: 1,
    title: "Unique Error",
    subtitle: "Stage 4 — Deduplication",
    briefing: "The same error messages repeat many times in the log. Your team wants to know which error appeared only ONCE — it's likely the root cause. Sort the log and filter for unique-only entries.",
    objective: "Find the error that appears exactly once in 'syslog'. Submit the error code (e.g., ERR-XXXX).",
    answer: "ERR-5501",
    toolbelt: ["sort", "uniq", "cat", "grep"],
    hints: [
      "'uniq' removes adjacent duplicates — but the file must be sorted first…",
      "Try 'sort syslog | uniq -u' to find lines that appear only once.",
      "The '-u' flag shows only truly unique lines.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'syslog': {
            type: 'file',
            content: [
              'ERR-4401: disk timeout',
              'ERR-2200: memory fault',
              'ERR-4401: disk timeout',
              'ERR-2200: memory fault',
              'ERR-3300: network down',
              'ERR-4401: disk timeout',
              'ERR-5501: kernel deadlock detected',
              'ERR-3300: network down',
              'ERR-2200: memory fault',
              'ERR-3300: network down',
            ].join('\n')
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 15,
    stage: 1,
    title: "Top of the File",
    subtitle: "Stage 4 — Partial Reading",
    briefing: "A 10,000-line log file has a license key on line 4. You don't want to scroll through the whole thing. Use head to grab just the first few lines and extract the key.",
    objective: "Read line 4 of 'license.dat' and submit the license key.",
    answer: "LIC-992-XKV-447",
    toolbelt: ["head", "tail", "cat", "ls"],
    hints: [
      "'head' shows the first N lines of a file…",
      "Try 'head -n 4 license.dat' to see lines 1-4.",
      "The key is on the 4th line.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'license.dat': {
            type: 'file',
            content: '=== LICENSE FILE ===\nIssued: 2024-01-01\nExpiry: 2025-12-31\nKey: LIC-992-XKV-447\nType: Enterprise\nSeats: Unlimited\n... thousands more lines ...\nEOF'
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 16,
    stage: 1,
    title: "CSV Surgeon",
    subtitle: "Stage 4 — Column Extraction",
    briefing: "A CSV export from the HR system has employee data. Your manager needs just the email addresses (column 3). Use cut to extract that column, then find the row for the user 'admin'.",
    objective: "Extract the admin's email from 'employees.csv'. Submit the email address.",
    answer: "admin@corp.internal",
    toolbelt: ["cut", "cat", "grep", "ls"],
    hints: [
      "'cut' extracts columns. Use '-d' for delimiter and '-f' for field number…",
      "Try 'cut -d, -f3 employees.csv' to get the 3rd column.",
      "Or use 'grep admin employees.csv' to find the admin row directly.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'employees.csv': {
            type: 'file',
            content: 'id,name,email,department\n101,Alice,alice@corp.internal,Engineering\n102,Bob,bob@corp.internal,Sales\n103,admin,admin@corp.internal,IT\n104,Carol,carol@corp.internal,Marketing'
          },
        }
      }
    },
    startDir: '/',
  },

  // ════════════════════════════════════════════════════════════
  // STAGE 5: COMBINING COMMANDS — pipes, chaining, multi-step
  // ════════════════════════════════════════════════════════════
  {
    id: 17,
    stage: 1,
    title: "Config Drift",
    subtitle: "Stage 5 — Comparing Files",
    briefing: "Two servers should have identical configs, but one is misbehaving. Use diff to compare 'prod.conf' and 'staging.conf' to find what's different. The changed value is the root cause.",
    objective: "Find the difference between the two configs. Submit the changed value from staging.conf.",
    answer: "0.0.0.0",
    toolbelt: ["diff", "cat", "ls", "grep"],
    hints: [
      "'diff' compares two files line by line…",
      "Try 'diff prod.conf staging.conf' to see differences.",
      "Lines with '<' are from the first file, '>' from the second.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'prod.conf': { type: 'file', content: 'bind_address=127.0.0.1\nport=8080\nworkers=4\nlog_level=warn\ntimeout=30' },
          'staging.conf': { type: 'file', content: 'bind_address=0.0.0.0\nport=8080\nworkers=4\nlog_level=warn\ntimeout=30' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 18,
    stage: 1,
    title: "Pipe Operator",
    subtitle: "Stage 5 — Command Chains",
    briefing: "An access log records every IP that hit the server. Most IPs are repeat visitors, but one accessed the system exactly once — a potential attacker doing recon. Chain sort and uniq to isolate it.",
    objective: "Find the IP that appears only once in 'access.log'. Submit the IP address.",
    answer: "203.0.113.42",
    toolbelt: ["cat", "sort", "uniq", "grep", "wc"],
    hints: [
      "Pipes (|) send output of one command as input to the next…",
      "Try 'sort access.log | uniq -u' to find the one-time visitor.",
      "The '-u' flag shows only lines that appear exactly once.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'access.log': {
            type: 'file',
            content: [
              '192.168.1.10',
              '10.0.0.5',
              '192.168.1.10',
              '172.16.0.1',
              '10.0.0.5',
              '203.0.113.42',
              '172.16.0.1',
              '192.168.1.10',
              '10.0.0.5',
              '172.16.0.1',
            ].join('\n')
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 19,
    stage: 1,
    title: "Case Cracker",
    subtitle: "Stage 5 — Text Transformation",
    briefing: "An intercepted message is encoded in uppercase. Intelligence says converting it to lowercase will reveal a hidden keyword on line 3. Use tr with pipes to decode it, then extract line 3 using head and tail.",
    objective: "Convert 'encoded.msg' to lowercase and submit the word on line 3.",
    answer: "exfiltrate",
    toolbelt: ["cat", "tr", "head", "tail", "grep"],
    hints: [
      "'tr' translates characters — 'tr A-Z a-z' converts upper to lower…",
      "Try 'cat encoded.msg | tr A-Z a-z' to decode.",
      "Pipe further: '... | head -n 3 | tail -n 1' to get line 3.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'encoded.msg': {
            type: 'file',
            content: 'BEGIN TRANSMISSION\nSTANDBY FOR ORDERS\nEXFILTRATE\nRENDEZVOUS AT DAWN\nEND TRANSMISSION'
          },
        }
      }
    },
    startDir: '/',
  },

  // ════════════════════════════════════════════════════════════
  // STAGE 5B: FLAG MASTERY — using flags creatively
  // ════════════════════════════════════════════════════════════
  {
    id: 20,
    stage: 1,
    title: "Hidden Audit",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A security auditor left hidden config files scattered across the server. You need to find them all and figure out which one contains the audit password. Explore the right flags for 'ls' to reveal what's hidden and compare file details.",
    objective: "Find the hidden audit config file and submit the audit password inside it.",
    answer: "AUDIT_P4SS_2024",
    toolbelt: ["ls", "cat"],
    hints: [
      "Hidden files start with a dot. Read the man page for 'ls' — look for a flag that shows all files…",
      "There's also a flag that shows detailed info like file sizes. Combine them to compare hidden files.",
      "Found the right flags? Now look for the biggest hidden file and 'cat' it.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'readme.txt': { type: 'file', content: 'Welcome to the server.' },
          '.bashrc': { type: 'file', content: 'export PS1="$ "' },
          '.profile': { type: 'file', content: 'PATH=/usr/bin' },
          '.audit_config': { type: 'file', content: '# Audit Configuration File\n# Generated by security team\n# Do not modify without authorization\n\n[credentials]\naudit_password=AUDIT_P4SS_2024\naudit_user=inspector\n\n[scope]\ntargets=all_servers\ndepth=full\nreport_format=json\nencryption=AES-256\nretention_days=90' },
          '.gitignore': { type: 'file', content: 'node_modules/' },
          'public': { type: 'dir', children: { 'index.html': { type: 'file', content: '<html></html>' } } },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 21,
    stage: 1,
    title: "Numbered Evidence",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A forensic analyst needs to reference specific line numbers from an intercepted communication. There's a way to display file contents with line numbers — check the man pages for 'cat' or 'grep' to find the right flag.",
    objective: "Display 'intercept.log' with line numbers. Find the line with GPS coordinates and submit the line NUMBER.",
    answer: "6",
    toolbelt: ["cat", "grep"],
    hints: [
      "Check the man page for 'cat' — there's a flag that adds line numbers to output…",
      "You can also check 'grep' — it has a similar flag for showing line numbers of matches.",
      "Once you see the numbered output, find the line with GPS coordinates.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'intercept.log': {
            type: 'file',
            content: 'TRANSMISSION START\nAgent codename: RAVEN\nStatus: active\nMission: extraction\nWindow: 0300-0500 UTC\nGPS: 37.7749,-122.4194\nExfil method: helicopter\nTRANSMISSION END'
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 22,
    stage: 1,
    title: "Reverse Lookup",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A blocklist contains IPs that should NOT access the system. But you need to find which IPs in the access log are NOT on the blocklist. Check the man page for 'grep' — there are flags that can invert matching and read patterns from a file.",
    objective: "Find the IP in 'access.log' that is NOT blocked. Submit that IP address.",
    answer: "10.20.30.40",
    toolbelt: ["grep", "cat", "sort"],
    hints: [
      "Check the man page for 'grep' — there's a flag that inverts the match (shows lines that DON'T match)…",
      "First see what's in 'blocklist.txt', then figure out how to exclude those patterns.",
      "There's also a flag that reads patterns from a file — check '-f' in the grep man page. Try 'grep -vf blocklist.txt access.log'!",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'blocklist.txt': { type: 'file', content: '192.168.1.1\n172.16.0.5\n10.0.0.99' },
          'access.log': {
            type: 'file',
            content: '192.168.1.1\n10.20.30.40\n172.16.0.5\n192.168.1.1\n10.0.0.99\n172.16.0.5'
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 23,
    stage: 1,
    title: "Top Scorers",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A leaderboard file has scores in random order. Your manager wants to know who has the highest score. The file mixes text and numbers — check the man page for 'sort' to find flags that handle numeric sorting and ordering direction.",
    objective: "Find the player with the highest score in 'scores.txt'. Submit their name.",
    answer: "Charlie",
    toolbelt: ["sort", "head", "cat", "cut"],
    hints: [
      "Check the man page for 'sort' — there are flags for numeric sorting and reversing order…",
      "Once sorted, you only need the first result. Check 'head' for a flag to limit output lines.",
      "The format is 'score:name' — read the name from the top result.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'scores.txt': {
            type: 'file',
            content: '150:Alice\n420:Charlie\n89:Dave\n310:Bob\n275:Eve\n95:Frank\n388:Grace'
          },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 24,
    stage: 1,
    title: "Pipeline Master",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A messy server log has duplicate entries with inconsistent spacing. You need to find which error appears most often. Check the man pages for 'sort' and 'uniq' — there are flags to handle whitespace issues and count duplicates. Chain them together with pipes.",
    objective: "Find the most frequently occurring error code in 'errors.dat'. Submit the error code (e.g., E-XXX).",
    answer: "E-502",
    toolbelt: ["sort", "uniq", "head", "cat"],
    hints: [
      "The file has inconsistent whitespace. Check 'sort' man page for a flag that ignores leading blanks…",
      "Check 'uniq' man page — there's a flag that counts how many times each line appears.",
      "Chain them: sort (with blank-handling) | uniq (with counting) | sort (numerically, reversed) | head",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'errors.dat': {
            type: 'file',
            content: '  E-502: bad gateway\nE-404: not found\n   E-502: bad gateway\nE-500: internal error\n  E-404: not found\n E-502: bad gateway\nE-500: internal error\n    E-502: bad gateway\nE-404: not found\n E-502: bad gateway'
          },
        }
      }
    },
    startDir: '/',
  },

  // ════════════════════════════════════════════════════════════
  // STAGE 6: REAL-WORLD MISSIONS — everything combined
  // ════════════════════════════════════════════════════════════
  {
    id: 25,
    stage: 1,
    title: "Incident Response",
    subtitle: "Stage 6 — The Final Mission",
    briefing: "A breach has been detected. The attacker left traces across multiple directories. Your mission: navigate the filesystem, search logs for the breach indicator, find the attacker's IP, locate the stolen data file, make a locked recovery script executable, and run it to get the final clearance code. This is everything you've learned — ls, cd, cat, grep, find, chmod, pipes — all in one mission.",
    objective: "Find and run the recovery script in /system/recovery/ (it needs +x). Submit the clearance code it outputs.",
    answer: "CLEARANCE_OMEGA_7",
    toolbelt: ["ls", "cd", "cat", "grep", "find", "chmod", "pwd"],
    hints: [
      "Start by exploring with 'ls' and 'cd' to understand the directory structure…",
      "Use 'find . -name recovery*' to locate the recovery script.",
      "The script needs execute permissions — check with 'ls -l' and fix with 'chmod +x'.",
      "Run the script with './' prefix after making it executable.",
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
                    content: 'Mar 14 09:00:01 sshd: Accepted key for deploy from 10.0.0.1\nMar 14 09:15:22 sshd: Failed password for root from 198.51.100.77\nMar 14 09:15:23 sshd: BREACH from 198.51.100.77 — root access gained\nMar 14 09:16:00 sshd: Connection closed 198.51.100.77'
                  },
                  'access.log': {
                    type: 'file',
                    content: 'GET /admin 403 198.51.100.77\nGET / 200 10.0.0.1\nPOST /upload 201 198.51.100.77\nGET /api 200 10.0.0.1'
                  },
                }
              }
            }
          },
          'home': {
            type: 'dir',
            children: {
              'deploy': {
                type: 'dir',
                children: {
                  '.bash_history': { type: 'file', content: 'ls\ncd /var/log\ngrep BREACH auth.log\nwhoami' },
                  'notes.txt': { type: 'file', content: 'The recovery script is somewhere in /system. It needs to be unlocked first.' },
                }
              }
            }
          },
          'system': {
            type: 'dir',
            children: {
              'recovery': {
                type: 'dir',
                children: {
                  'recover.sh': { type: 'file', content: '#!/bin/bash\n# Emergency recovery protocol\necho "Initiating recovery sequence..."\necho "Verifying credentials..."\necho "$(decrypt_clearance --level omega)"', execOutput: 'Initiating recovery sequence...\nVerifying credentials...\nCLEARANCE_OMEGA_7', permissions: '-rw-------' },
                  'readme.txt': { type: 'file', content: 'This script outputs the final clearance code. Make it executable first.' },
                }
              },
              'config': {
                type: 'dir',
                children: {
                  'firewall.rules': { type: 'file', content: 'BLOCK 198.51.100.0/24\nALLOW 10.0.0.0/8' },
                }
              }
            }
          },
        }
      }
    },
    startDir: '/',
  },

  // ════════════════════════════════════════════════════════════
  // STAGE 2: ADVANCED — awk, sed, xargs, tee, tac, paste, etc.
  // ════════════════════════════════════════════════════════════
  {
    id: 26,
    stage: 2,
    title: "Field Extraction",
    subtitle: "Stage 2 — Text Processing",
    briefing: "A CSV employee database needs auditing. Your manager wants a quick list of names extracted from the data. The 'awk' command is perfect for extracting specific fields from structured text.",
    objective: "Extract the name in the 3rd row of employees.csv (the one with id 3). Submit just the name.",
    answer: "Charlie",
    toolbelt: ["awk", "cat"],
    hints: [
      "Try 'cat employees.csv' first to see the data structure.",
      "awk can split lines by a delimiter: awk -F',' '{print $2}' file",
      "The 3rd data row (id=3) has the name 'Charlie'.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'employees.csv': { type: 'file', content: 'id,name,department,salary\n1,Alice,Engineering,95000\n2,Bob,Marketing,72000\n3,Charlie,Engineering,88000\n4,Diana,Sales,67000\n5,Eve,Engineering,102000' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 27,
    stage: 2,
    title: "Search & Replace",
    subtitle: "Stage 2 — Stream Editing",
    briefing: "A configuration file has the wrong database host — it says 'localhost' but needs to be changed to 'db.prod.internal'. The 'sed' command can perform text substitutions without opening an editor.",
    objective: "Use sed to replace 'localhost' with 'db.prod.internal' in config.ini. What is the full DB_HOST line after replacement? Submit the entire line.",
    answer: "DB_HOST=db.prod.internal",
    toolbelt: ["sed", "cat"],
    hints: [
      "Try 'cat config.ini' to see the current configuration.",
      "sed 's/old/new/' file — replaces first occurrence of 'old' with 'new' on each line.",
      "sed 's/localhost/db.prod.internal/' config.ini",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'config.ini': { type: 'file', content: 'DB_HOST=localhost\nDB_PORT=5432\nDB_NAME=production\nDB_USER=admin\nCACHE_HOST=localhost\nCACHE_PORT=6379' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 28,
    stage: 2,
    title: "Conditional Filtering",
    subtitle: "Stage 2 — awk Patterns",
    briefing: "The server logs show various response codes. Management wants to know how many requests returned a 500 error. Use awk to filter rows by a condition and count them.",
    objective: "Count the number of lines in access.log where the status code (3rd field) is 500. Submit the count.",
    answer: "3",
    toolbelt: ["awk", "cat", "wc"],
    hints: [
      "Check the log format with 'cat access.log'.",
      "awk can filter: awk '$3 == 500' file — prints lines where field 3 equals 500.",
      "Pipe to wc -l to count, or use awk's END block.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'access.log': { type: 'file', content: '/api/users GET 200 12ms\n/api/orders POST 500 340ms\n/api/health GET 200 2ms\n/api/products GET 200 45ms\n/api/checkout POST 500 890ms\n/api/users GET 301 5ms\n/api/admin GET 403 3ms\n/api/orders GET 200 23ms\n/api/webhook POST 500 120ms\n/api/search GET 200 67ms' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 29,
    stage: 2,
    title: "Line Surgery",
    subtitle: "Stage 2 — sed Advanced",
    briefing: "A deployment script has a debug line that must be removed before production. The line contains 'DEBUG=true'. Use sed to delete specific lines matching a pattern.",
    objective: "How many lines remain in deploy.sh after removing all lines containing 'DEBUG'? Submit the count.",
    answer: "5",
    toolbelt: ["sed", "cat", "wc"],
    hints: [
      "Read deploy.sh first with 'cat deploy.sh'.",
      "sed can delete lines: sed '/pattern/d' file — removes lines matching the pattern.",
      "Pipe the result to 'wc -l' to count remaining lines.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'deploy.sh': { type: 'file', content: '#!/bin/bash\nDEBUG=true\necho "Starting deployment"\nDEBUG=true && echo "Debug mode"\nrsync -avz ./dist/ server:/var/www/\necho "Restarting services"\nsystemctl restart nginx\necho "Done"' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 30,
    stage: 2,
    title: "Reverse Engineering",
    subtitle: "Stage 2 — Reverse & Flip",
    briefing: "An encoded message was stored with its lines reversed. The 'tac' command prints a file in reverse line order (opposite of cat). Decode the message by reading it in the correct order.",
    objective: "Use tac to reverse the file. What is the first word of the FIRST line after reversing? Submit that word.",
    answer: "The",
    toolbelt: ["tac", "cat"],
    hints: [
      "Try 'cat message.txt' to see the reversed content.",
      "'tac message.txt' will print lines in reverse order.",
      "The last line of the file becomes the first line after tac.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'message.txt': { type: 'file', content: 'immediately.\nand report to HQ\nRead this message\nsecurity clearance.\nhas top-level\nThe bearer of this document' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 31,
    stage: 2,
    title: "Data Merge",
    subtitle: "Stage 2 — Joining Files",
    briefing: "Two files contain related data that needs to be merged side by side. The 'paste' command joins corresponding lines from multiple files with a delimiter between them.",
    objective: "Paste names.txt and scores.txt together. What is the score next to 'Charlie'? Submit just the number.",
    answer: "92",
    toolbelt: ["paste", "cat"],
    hints: [
      "Check both files: 'cat names.txt' and 'cat scores.txt'.",
      "'paste names.txt scores.txt' joins them line by line with a tab.",
      "Find Charlie's line and read his score.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'names.txt': { type: 'file', content: 'Alice\nBob\nCharlie\nDiana\nEve' },
          'scores.txt': { type: 'file', content: '87\n73\n92\n95\n88' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 32,
    stage: 2,
    title: "Split Stream",
    subtitle: "Stage 2 — Tee Pipe",
    briefing: "You need to filter error messages from a log AND save them to a file at the same time. The 'tee' command reads from stdin, writes to a file, AND passes the data through to stdout — letting you both save and continue processing.",
    objective: "Grep for 'ERROR' in system.log and tee the output to errors.txt. How many ERROR lines are there? Submit the count.",
    answer: "4",
    toolbelt: ["grep", "tee", "wc", "cat"],
    hints: [
      "First check: 'cat system.log' to see the entries.",
      "grep ERROR system.log | tee errors.txt — saves matches to file AND shows them.",
      "Pipe the whole thing to 'wc -l' or count the output lines.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'system.log': { type: 'file', content: 'INFO: Service started\nERROR: Connection timeout on port 5432\nINFO: Request processed\nWARN: High memory usage\nERROR: Disk space low on /dev/sda1\nINFO: Backup completed\nERROR: Authentication failed for user root\nINFO: Cron job executed\nERROR: SSL certificate expired\nINFO: Service healthy' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 33,
    stage: 2,
    title: "Salary Report",
    subtitle: "Stage 2 — awk Math",
    briefing: "Finance needs the total salary expenditure calculated from the employee database. awk can perform arithmetic on fields — summing, averaging, and computing values across all rows.",
    objective: "Calculate the total of all salaries (4th field) in payroll.csv. Skip the header. Submit the total.",
    answer: "424000",
    toolbelt: ["awk", "cat"],
    hints: [
      "Check the file: 'cat payroll.csv'.",
      "awk -F',' 'NR>1 {sum+=$4} END {print sum}' — NR>1 skips header, $4 is salary.",
      "The sum of 95000+72000+88000+67000+102000 = 424000.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'payroll.csv': { type: 'file', content: 'id,name,department,salary\n1,Alice,Engineering,95000\n2,Bob,Marketing,72000\n3,Charlie,Engineering,88000\n4,Diana,Sales,67000\n5,Eve,Engineering,102000' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 34,
    stage: 2,
    title: "Path Decoder",
    subtitle: "Stage 2 — Path Manipulation",
    briefing: "A build script references full file paths but you need just the filenames and directory names separately. The 'basename' command extracts the filename, and 'dirname' extracts the directory path.",
    objective: "What does 'basename /opt/apps/server/main.go' return? Submit the result.",
    answer: "main.go",
    toolbelt: ["basename", "dirname", "cat"],
    hints: [
      "basename strips directory components: basename /a/b/c.txt → c.txt",
      "dirname gives the directory: dirname /a/b/c.txt → /a/b",
      "Try running the commands to verify.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'paths.txt': { type: 'file', content: '/opt/apps/server/main.go\n/var/log/nginx/access.log\n/etc/nginx/nginx.conf\n/home/deploy/.ssh/authorized_keys' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 35,
    stage: 2,
    title: "Batch Operations",
    subtitle: "Stage 2 — xargs Power",
    briefing: "You have a list of filenames that need to be processed. The 'xargs' command reads items from stdin and passes them as arguments to another command — perfect for batch operations.",
    objective: "Use 'cat filelist.txt | xargs echo' to see all filenames on one line. How many filenames are in the list? Submit the count.",
    answer: "5",
    toolbelt: ["xargs", "cat", "wc"],
    hints: [
      "Check the file: 'cat filelist.txt' to see the list.",
      "'cat filelist.txt | xargs echo' joins all lines into one.",
      "Count with 'cat filelist.txt | wc -l'.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'filelist.txt': { type: 'file', content: 'report_q1.pdf\nreport_q2.pdf\nreport_q3.pdf\nreport_q4.pdf\nsummary.pdf' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 36,
    stage: 2,
    title: "Config Overhaul",
    subtitle: "Stage 2 — sed Global Replace",
    briefing: "The staging config has multiple references to the old domain 'staging.example.com' that must ALL be changed to 'prod.example.com'. Use sed's global flag to replace every occurrence, not just the first on each line.",
    objective: "How many times does 'staging.example.com' appear in nginx.conf? Submit the count.",
    answer: "4",
    toolbelt: ["sed", "grep", "cat"],
    hints: [
      "Check the file: 'cat nginx.conf'.",
      "Use 'grep -c' to count matching lines, or grep and count occurrences.",
      "grep 'staging.example.com' nginx.conf | wc -l — but beware, some lines might have it twice. Use grep -o to find all occurrences.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'nginx.conf': { type: 'file', content: 'server {\n  server_name staging.example.com;\n  proxy_pass http://staging.example.com:8080;\n  error_log /var/log/staging.example.com.error.log;\n  access_log /var/log/staging.example.com.access.log;\n}' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 37,
    stage: 2,
    title: "Pipeline Master",
    subtitle: "Stage 2 — Complex Pipes",
    briefing: "A sales report needs processing: extract the revenue column, sort it numerically, and find the highest value. This requires chaining multiple commands with pipes to build a data pipeline.",
    objective: "Find the highest revenue value in sales.csv (3rd field, skip header). Submit the number.",
    answer: "98000",
    toolbelt: ["awk", "sort", "tail", "cat"],
    hints: [
      "Check the data: 'cat sales.csv'.",
      "Extract field 3: awk -F',' 'NR>1 {print $3}' sales.csv",
      "Pipe to 'sort -n | tail -n 1' to get the maximum.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'sales.csv': { type: 'file', content: 'region,product,revenue\nnorth,widgets,45000\nsouth,gadgets,72000\neast,widgets,98000\nwest,gadgets,31000\nnorth,gadgets,56000\nsouth,widgets,83000' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 38,
    stage: 2,
    title: "Process Hunter",
    subtitle: "Stage 2 — System Admin",
    briefing: "The server is running slow. Use 'ps' to list running processes and identify the one consuming the most CPU. In production you'd use 'kill' to stop rogue processes.",
    objective: "Which process is using the most CPU according to ps? Submit the process name (COMMAND column).",
    answer: "crypto-miner",
    toolbelt: ["ps", "grep", "sort", "awk"],
    hints: [
      "Run 'ps' to see all running processes.",
      "Look at the CPU% column to find the highest usage.",
      "The suspicious process has an unusually high CPU percentage.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          '.processes': { type: 'file', content: 'PID  USER      CPU%  MEM%  COMMAND\n1    root      0.0   0.1   init\n245  www-data  2.3   1.5   nginx\n312  postgres  1.8   4.2   postgres\n489  root      0.1   0.3   sshd\n667  nobody    94.7  12.3  crypto-miner\n734  www-data  0.5   0.8   php-fpm\n891  root      0.2   0.1   cron' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 39,
    stage: 2,
    title: "Log Rotation",
    subtitle: "Stage 2 — awk + sed Combo",
    briefing: "The application log contains timestamps and you need to extract only entries from a specific hour. Combine awk pattern matching with other tools to filter time-based data.",
    objective: "How many log entries are from hour '14' (2 PM)? Lines start with a timestamp like [14:xx:xx]. Submit the count.",
    answer: "3",
    toolbelt: ["awk", "grep", "wc", "cat"],
    hints: [
      "Check the log: 'cat app.log'.",
      "grep '\\[14:' app.log — finds lines starting with hour 14.",
      "Pipe to wc -l to count.",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'app.log': { type: 'file', content: '[12:05:33] INFO User login: admin\n[12:15:01] INFO Page view: /dashboard\n[13:22:45] WARN Slow query: 2.3s\n[14:01:12] ERROR Database connection lost\n[14:03:55] INFO Database reconnected\n[14:45:30] WARN High memory: 89%\n[15:00:01] INFO Cron: cleanup task\n[15:12:44] INFO User logout: admin\n[16:30:00] INFO Backup started' },
        }
      }
    },
    startDir: '/',
  },
  {
    id: 40,
    stage: 2,
    title: "The Grand Pipeline",
    subtitle: "Stage 2 — Final Challenge",
    briefing: "A server inventory file contains data about machines across multiple datacenters. Your mission: find the datacenter with the most servers marked as 'active'. This requires combining multiple advanced commands into one powerful pipeline.",
    objective: "Which datacenter (2nd field) has the most 'active' servers? Submit the datacenter name.",
    answer: "us-east",
    toolbelt: ["awk", "grep", "sort", "uniq", "head", "cat"],
    hints: [
      "Check the data: 'cat inventory.csv'.",
      "First filter active servers: awk -F',' '$4==\"active\"' inventory.csv",
      "Then extract datacenter field, sort, count with uniq -c, sort numerically to find the most.",
      "awk -F',' '$4==\"active\" {print $2}' inventory.csv | sort | uniq -c | sort -n | tail -n 1",
    ],
    filesystem: {
      '/': {
        type: 'dir',
        children: {
          'inventory.csv': { type: 'file', content: 'hostname,datacenter,type,status\nweb-01,us-east,web,active\nweb-02,us-west,web,active\ndb-01,us-east,database,active\nweb-03,eu-west,web,inactive\ndb-02,us-east,database,active\ncache-01,us-west,cache,active\nweb-04,eu-west,web,active\ndb-03,us-east,database,inactive\nweb-05,us-east,web,active\ncache-02,eu-west,cache,active\nweb-06,us-west,web,inactive\ndb-04,us-east,database,active' },
        }
      }
    },
    startDir: '/',
  },
];
