export interface FSNode {
  type: 'file' | 'dir';
  content?: string;
  execOutput?: string;
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
  // ════════════════════════════════════════════════════════════
  // STAGE 1: FIRST STEPS — single simple commands
  // ════════════════════════════════════════════════════════════
  {
    id: 1,
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
    title: "Hidden Audit",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A security auditor left hidden config files scattered across the server. You need to find them all and figure out which one contains the audit password. Explore the right flags for 'ls' to reveal what's hidden and compare file details.",
    objective: "Find the hidden audit config file and submit the audit password inside it.",
    answer: "AUDIT_P4SS_2024",
    toolbelt: ["ls -la", "cat", "ls -lh"],
    hints: [
      "Hidden files start with a dot. Use 'ls -a' or 'ls -la' to see them…",
      "The '-l' flag shows sizes. Look for the biggest hidden file.",
      "Try 'cat .audit_config' after identifying it.",
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
    title: "Numbered Evidence",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A forensic analyst needs to reference specific line numbers from an intercepted communication. There's a way to display file contents with line numbers — check the man pages for 'cat' or 'grep' to find the right flag.",
    objective: "Display 'intercept.log' with line numbers. Find the line with GPS coordinates and submit the line NUMBER.",
    answer: "6",
    toolbelt: ["cat -n", "grep -n"],
    hints: [
      "'cat -n' adds line numbers to every line of output…",
      "Look for a line containing GPS or coordinate-like numbers.",
      "You can also try 'grep -n GPS intercept.log' for a shortcut.",
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
    title: "Reverse Lookup",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A blocklist contains IPs that should NOT access the system. But you need to find which IPs in the access log are NOT on the blocklist. Check the man page for 'grep' — there are flags that can invert matching and read patterns from a file.",
    objective: "Find the IP in 'access.log' that is NOT blocked. Submit that IP address.",
    answer: "10.20.30.40",
    toolbelt: ["grep -v", "grep -f", "grep -i", "cat", "sort"],
    hints: [
      "'grep -v' shows lines that do NOT match the pattern…",
      "First check what IPs are blocked with 'cat blocklist.txt'.",
      "Then use grep -v with each blocked IP, or look into the '-f' flag — 'grep -vf blocklist.txt access.log' reads all patterns from a file at once!",
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
    title: "Top Scorers",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A leaderboard file has scores in random order. Your manager wants to know who has the highest score. The file mixes text and numbers — check the man page for 'sort' to find flags that handle numeric sorting and ordering direction.",
    objective: "Find the player with the highest score in 'scores.txt'. Submit their name.",
    answer: "Charlie",
    toolbelt: ["sort -rn", "head -n", "cat", "cut"],
    hints: [
      "'sort -n' sorts numerically, '-r' reverses (highest first)…",
      "Try 'sort -rn scores.txt | head -n 1' to see the top scorer.",
      "The format is 'score:name' — use cut or just read the output.",
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
    title: "Pipeline Master",
    subtitle: "Stage 5B — Flag Mastery",
    briefing: "A messy server log has duplicate entries with inconsistent spacing. Chain multiple flagged commands: use 'sort -b' to ignore leading blanks, pipe to 'uniq -c' to count occurrences, then pipe to 'sort -rn' to find the most frequent error. Submit the error code that appears most often.",
    objective: "Run: sort -b errors.dat | uniq -c | sort -rn | head -n 1. Submit the error code (e.g., E-XXX) from the top result.",
    answer: "E-502",
    toolbelt: ["sort -b", "sort -rn", "uniq -c", "head -n", "cat"],
    hints: [
      "Chain it: sort -b errors.dat | uniq -c | sort -rn",
      "The -b flag handles messy whitespace, -c counts duplicates.",
      "The highest count line has the most frequent error code.",
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
];
